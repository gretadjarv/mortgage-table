<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  export let loanData = [];
  let canvas;
  let chart;
  onMount(() => {
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: loanData.map((d) => d.monthYear),
        datasets: [
          { label: 'Total monthly cost', data: loanData.map((d) => Number(d.total)), borderColor: '#a77d5a', backgroundColor: 'rgba(167,125,90,.1)', fill: true },
          { label: 'Interest', data: loanData.map((d) => Number(d.totalInterest)), borderColor: '#ff3e00', fill: false },
          { label: 'Amortization', data: loanData.map((d) => Number(d.totalAmortization)), borderColor: '#7b9a5d', fill: false }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
    return () => chart?.destroy();
  });
</script>
<canvas bind:this={canvas}></canvas>
<style>canvas { max-width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; }</style>
