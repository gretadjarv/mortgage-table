const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function isoDate(date) { return date.toISOString().slice(0, 10); }
function addMonths(date, months) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
function monthStart(value) {
  const date = value instanceof Date ? new Date(value) : parseDate(value);
  date.setUTCDate(1);
  return date;
}
function monthKey(value) { return isoDate(monthStart(value)).slice(0, 7); }
function money(value) { return Number(value || 0).toFixed(2); }

function latestUpdate(updates, loanId, dateStr) {
  return updates
    .filter((item) => item.loan_id === loanId && String(item.update_date).slice(0, 10) <= dateStr)
    .sort((a, b) => String(a.update_date).localeCompare(String(b.update_date))).at(-1) || null;
}

function latestBalanceAdjustment(adjustments, loanId, dateStr) {
  return adjustments
    .filter((item) => item.loan_id === loanId && String(item.adjustment_date).slice(0, 10) <= dateStr)
    .sort((a, b) => String(a.adjustment_date).localeCompare(String(b.adjustment_date))).at(-1) || null;
}

/**
 * Projects loans month-by-month.
 *
 * By default, amortization uses a simple snowball: when a loan reaches zero,
 * its scheduled monthly amortization is added to the next active loan.
 *
 * A manual loan update on a month is an explicit override. This means the user
 * can always stop/reduce/increase the automatic rollover by adding an update
 * for the receiving loan on that date. The row exposes both scheduled and
 * effective amortization so the behavior stays visible.
 */
export function projectLoans({
  loans = [],
  updates = [],
  oneTimePayments = [],
  balanceAdjustments = [],
  startDate,
  years = 50,
  untilDate = null,
  snowball = true
}) {
  if (!loans.length) return [];

  const loanStartDates = loans.map((loan) => parseDate(loan.start_date)).filter(Boolean);
  const earliest = startDate
    ? monthStart(startDate)
    : monthStart(new Date(Math.min(...loanStartDates.map((d) => d.getTime()))));
  const todayMonth = monthStart(untilDate || new Date());
  const endByYears = addMonths(earliest, years * 12 - 1);

  const states = loans.map((loan) => ({
    loan,
    balance: Number(loan.start_sum) || 0,
    amortization: Number(loan.amortization) || 0,
    rate: Number(loan.interest_rate) || 0,
    lastAdjustmentDate: null,
    paidOff: false,
    rolloverReleased: false
  }));

  const rows = [];
  const maxMonths = years * 12;
  let rolloverPool = 0;

  for (let month = 0; month < maxMonths; month += 1) {
    const monthDate = addMonths(earliest, month);
    const dateStr = isoDate(monthDate);
    const monthKeyValue = monthKey(monthDate);

    if (monthDate > endByYears) break;

    let totalPayment = 0;
    let totalInterest = 0;
    let totalAmortization = 0;
    let totalOneTimePayments = 0;
    const payments = [];
    const balancesBeforePayment = [];
    const balancesAfterPayment = [];
    const rates = [];
    const amortizations = [];
    const scheduledAmortizations = [];
    const rolloverAmounts = [];
    const balanceAdjustmentsApplied = [];
    const amortizationOverrides = [];

    for (let index = 0; index < states.length; index += 1) {
      const state = states[index];
      const loanId = state.loan.id;
      const update = latestUpdate(updates, loanId, dateStr);
      const hasManualUpdate = !!update && String(update.update_date).slice(0, 7) === monthKeyValue;

      if (update) {
        state.amortization = Number(update.updated_amortization) || 0;
        state.rate = Number(update.updated_interest_rate) || 0;
      }

      const adjustment = latestBalanceAdjustment(balanceAdjustments, loanId, dateStr);
      if (adjustment && adjustment.adjustment_date !== state.lastAdjustmentDate) {
        state.balance = Math.max(0, Number(adjustment.balance) || 0);
        state.lastAdjustmentDate = adjustment.adjustment_date;
        state.paidOff = state.balance <= 0;
        balanceAdjustmentsApplied.push({ loanId, adjustment });
      }

      const loanStart = String(state.loan.start_date).slice(0, 10);
      if (dateStr < loanStart) {
        payments.push('0.00');
        balancesBeforePayment.push(state.balance);
        balancesAfterPayment.push(state.balance);
        rates.push(state.rate);
        amortizations.push(0);
        scheduledAmortizations.push(0);
        rolloverAmounts.push(0);
        amortizationOverrides.push(false);
        continue;
      }

      // Extra payments are applied before the month's interest calculation.
      const oneTimes = oneTimePayments.filter(
        (payment) => payment.loan_id === loanId && String(payment.payment_date).slice(0, 7) === monthKeyValue
      );
      const oneTimePayment = oneTimes.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
      if (oneTimePayment > 0) {
        state.balance = Math.max(0, state.balance - oneTimePayment);
        totalOneTimePayments += oneTimePayment;
      }

      const balanceBefore = state.balance;
      balancesBeforePayment.push(balanceBefore);
      rates.push(state.rate);

      if (balanceBefore <= 0) {
        payments.push('0.00');
        balancesAfterPayment.push(0);
        amortizations.push(0);
        scheduledAmortizations.push(0);
        rolloverAmounts.push(0);
        amortizationOverrides.push(hasManualUpdate);
        state.paidOff = true;

        // Release this loan's normal monthly amortization once, so it can be
        // redirected to the next active loan from the following month onward.
        if (snowball && !state.rolloverReleased && state.amortization > 0) {
          rolloverPool += state.amortization;
          state.rolloverReleased = true;
        }
        continue;
      }

      const scheduled = state.amortization;
      let rollover = 0;
      let effectiveAmortization = scheduled;

      // Automatic rollover is applied to the first active loan after a paid-off
      // loan. A manual update on this receiving loan overrides the rollover.
      if (snowball && rolloverPool > 0 && !hasManualUpdate) {
        rollover = rolloverPool;
        effectiveAmortization += rollover;
        rolloverPool = 0;
      }

      const interest = balanceBefore * (state.rate / 100) / 12;
      const principal = Math.min(effectiveAmortization, balanceBefore);
      const payment = interest + principal;

      totalInterest += interest;
      totalAmortization += principal;
      totalPayment += payment;
      payments.push(money(payment));
      amortizations.push(principal);
      scheduledAmortizations.push(scheduled);
      rolloverAmounts.push(rollover);
      amortizationOverrides.push(hasManualUpdate);

      state.balance = Math.max(0, balanceBefore - principal);
      balancesAfterPayment.push(state.balance);

      if (state.balance <= 0) {
        state.paidOff = true;
        if (snowball && !state.rolloverReleased && scheduled > 0) {
          rolloverPool += scheduled;
          state.rolloverReleased = true;
        }
      }
    }

    rows.push({
      date: dateStr,
      monthYear: `${MONTH_NAMES[monthDate.getUTCMonth()]} ${monthDate.getUTCFullYear()}`,
      payments,
      total: money(totalPayment),
      totalInterest: money(totalInterest),
      totalAmortization: money(totalAmortization),
      totalOneTimePayments: money(totalOneTimePayments),
      balancesBeforePayment,
      remainingBalances: balancesAfterPayment,
      rates,
      amortizations,
      scheduledAmortizations,
      rolloverAmounts,
      amortizationOverrides,
      balanceAdjustmentsApplied,
      totalRemainingBalance: balancesAfterPayment.reduce((sum, balance) => sum + balance, 0),
      historical: monthDate < todayMonth,
      current: monthKeyValue === monthKey(todayMonth),
      snowballActive: snowball && rolloverPool > 0
    });

    if (states.every((state) => state.balance <= 0)) break;
  }

  return rows;
}
