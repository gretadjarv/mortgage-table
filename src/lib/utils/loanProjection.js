export function calculateLoanProjection(loans, updates = [], oneTimePayments = [], startDate = new Date(), years = 50) {
  const months = years * 12;
  const start = new Date(startDate);
  start.setDate(1);

  const updateMap = new Map();
  for (const update of updates) {
    if (!updateMap.has(update.loan_id)) updateMap.set(update.loan_id, []);
    updateMap.get(update.loan_id).push(update);
  }
  for (const list of updateMap.values()) list.sort((a, b) => a.update_date.localeCompare(b.update_date));

  const paymentMap = new Map();
  for (const payment of oneTimePayments) {
    if (!paymentMap.has(payment.loan_id)) paymentMap.set(payment.loan_id, []);
    paymentMap.get(payment.loan_id).push(payment);
  }

  const balances = loans.map((l) => Number(l.start_sum) || 0);
  const baseAmortization = loans.map((l) => Number(l.amortization) || 0);
  const baseRate = loans.map((l) => Number(l.interest_rate) || 0);
  const data = [];

  for (let month = 0; month < months; month++) {
    const date = new Date(start);
    date.setMonth(start.getMonth() + month);
    const monthKey = date.toISOString().slice(0, 7);

    let total = 0;
    let totalInterest = 0;
    let totalAmortization = 0;
    const payments = [];

    loans.forEach((loan, i) => {
      if (balances[i] <= 0) {
        payments.push(0);
        return;
      }

      let amortization = baseAmortization[i];
      let rate = baseRate[i];
      const loanUpdates = updateMap.get(loan.id) ?? [];

      for (const update of loanUpdates) {
        if (update.update_date.slice(0, 7) <= monthKey) {
          if (update.updated_amortization !== null && update.updated_amortization !== undefined) {
            amortization = Number(update.updated_amortization);
          }
          if (update.updated_interest_rate !== null && update.updated_interest_rate !== undefined) {
            rate = Number(update.updated_interest_rate);
          }
        }
      }

      // One-time payments dated in this month are applied before that month's interest.
      const extras = (paymentMap.get(loan.id) ?? [])
        .filter((p) => p.payment_date.slice(0, 7) === monthKey)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      if (extras > 0) balances[i] = Math.max(0, balances[i] - extras);

      const interest = balances[i] * (rate / 100 / 12);
      const principal = Math.min(Math.max(amortization, 0), balances[i]);
      const totalForLoan = interest + principal;

      balances[i] = Math.max(0, balances[i] - principal);
      payments.push(totalForLoan);
      total += totalForLoan;
      totalInterest += interest;
      totalAmortization += principal;
    });

    data.push({
      monthYear: date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' }),
      monthKey,
      payments,
      total,
      totalInterest,
      totalAmortization,
      remainingBalances: [...balances]
    });

    if (balances.every((b) => b <= 0.005)) break;
  }

  return data;
}
