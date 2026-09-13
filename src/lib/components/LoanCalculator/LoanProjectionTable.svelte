<script>
  export let loanData = [];
</script>

{#if loanData.length}
<table>
  <thead>
    <tr>
      <th>Month</th>
      {#each loanData[0].payments as _, index}
        <th>Loan {index + 1} payment</th>
      {/each}
      <th>Total payment</th>
      <th>Interest</th>
      <th>Amortization</th>
    </tr>
  </thead>
  <tbody>
    {#each loanData as row}
      <tr class:currentMonth={row.monthKey === new Date().toISOString().slice(0, 7)}
          class:previousMonth={row.monthKey < new Date().toISOString().slice(0, 7)}>
        <td>{row.monthYear}</td>
        {#each row.payments as payment}
          <td>{Math.round(payment).toLocaleString('sv-SE')} kr</td>
        {/each}
        <td>{Math.round(row.total).toLocaleString('sv-SE')} kr</td>
        <td>{Math.round(row.totalInterest).toLocaleString('sv-SE')} kr</td>
        <td>{Math.round(row.totalAmortization).toLocaleString('sv-SE')} kr</td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}

<style>
  table{width:100%;border-collapse:collapse;margin:20px 0;background:#fff}
  th,td{border:1px solid var(--color-border);padding:10px;text-align:right;font-size:14px}
  th{background:var(--color-secondary);color:#000}
  .currentMonth{background:rgb(203,231,225)!important;font-weight:bold}
  .previousMonth{background:#f3f3f3}
  td:first-child,th:first-child{text-align:left}
</style>
