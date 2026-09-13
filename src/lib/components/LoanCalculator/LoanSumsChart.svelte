<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  export let loanData = [];
  let canvas;
  let chart;
  onMount(() => {
    const count = loanData[0]?.remainingBalances?.length || 0;
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: loanData.map((d) => d.monthYear),
        datasets: Array.from({ length: count }, (_, index) => ({ label: `Loan ${index + 1} balance`, data: loanData.map((d) => d.remainingBalances[index]), borderColor: `hsl(${index * 40},40%,40%)`, fill: false })).concat([{ label: 'Total balance', data: loanData.map((d) => d.totalRemainingBalance), borderColor: '#7b9a5d', fill: false }])
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
    return () => chart?.destroy();
  });
</script>
<canvas bind:this={canvas}></canvas>
<style>canvas { max-width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; }</style>
