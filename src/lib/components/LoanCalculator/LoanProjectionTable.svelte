<script>
  export let loanData = [];
  export let year;
  export let monthName;

  const money = (value) => `${Math.round(Number(value) || 0).toLocaleString('sv-SE')} kr`;
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Month</th>
        {#each loanData[0]?.payments || [] as _, index}
          <th>Loan {index + 1} cost</th>
        {/each}
        <th>Total cost</th>
        <th>Interest</th>
        <th>Amortization</th>
        <th>One-time</th>
        <th>Total balance</th>
      </tr>
    </thead>
    <tbody>
      {#each loanData as row}
        <tr class:currentMonth={row.current} class:previousYear={row.historical}>
          <td>{row.monthYear}</td>
          {#each row.payments as payment}<td>{money(payment)}</td>{/each}
          <td><strong>{money(row.total)}</strong></td>
          <td>{money(row.totalInterest)}</td>
          <td>{money(row.totalAmortization)}</td>
          <td>{money(row.totalOneTimePayments)}</td>
          <td><strong>{money(row.totalRemainingBalance)}</strong></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  .table-wrap { overflow-x: auto; margin: 20px 0; }
  table { width: 100%; min-width: 1050px; border-collapse: collapse; background: #fff; }
  th, td { border: 1px solid var(--color-border); padding: 9px; text-align: right; font-size: 14px; white-space: nowrap; }
  th:first-child, td:first-child { text-align: left; position: sticky; left: 0; background: inherit; z-index: 1; }
  th { background: var(--color-secondary); color: #000; }
  tr:nth-child(even) { background: var(--color-bg-0); }
  tr.previousYear td { opacity: .9; }
  tr.currentMonth { background: rgb(203, 231, 225) !important; font-weight: 700; }
</style>
