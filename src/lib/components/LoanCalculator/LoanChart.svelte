<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let loanData = [];

  let chart;

  onMount(() => {
    const ctx = document.getElementById('loanChart').getContext('2d');

    const totalCostData = loanData.map((data) => parseFloat(data.total));
    const totalInterestData = loanData.map((data) => parseFloat(data.totalInterest));
    const totalAmortizationData = loanData.map((data) => parseFloat(data.totalAmortization));

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: loanData.map((data) => data.monthYear),
        datasets: [
          {
            label: 'Total Cost',
            data: totalCostData,
            borderColor: '#a77d5a',
            backgroundColor: 'rgba(167, 125, 90, 0.1)',
            fill: true,
          },
          {
            label: 'Total Interest',
            data: totalInterestData,
            borderColor: '#ff3e00',
            backgroundColor: 'rgba(255, 62, 0, 0)',
            fill: true,
          },
          {
            label: 'Total Amortization',
            data: totalAmortizationData,
            borderColor: '#7b9a5d',
            backgroundColor: 'rgba(123, 154, 93, 0)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#4a4a4a',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'SEK',
                  }).format(context.parsed.y);
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month and Year',
              color: '#4a4a4a',
            },
            ticks: {
              maxRotation: 90,
              minRotation: 45,
              color: '#4a4a4a',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount (SEK)',
              color: '#4a4a4a',
            },
            ticks: {
              color: '#4a4a4a',
            },
          },
        },
      },
    });
  });
</script>

<canvas id="loanChart"></canvas>

<style>
  canvas {
    max-width: 100%;
    height: 400px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
