<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let loanData = [];

  let chart;

  onMount(() => {
    const ctx = document.getElementById('loanSumsChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: loanData.map((data) => data.monthYear),
        datasets: loanData[0].remainingBalances
          .map((_, index) => ({
            label: `Loan ${index + 1} Remaining Balance`,
            data: loanData.map((data) => data.remainingBalances[index]),
            borderColor: `hsl(${index * 30}, 40%, 40%)`,
            backgroundColor: `hsl(${index * 30}, 40%, 90%)`,
            fill: false,
          }))
          .concat([
            {
              label: 'Total Remaining Balance',
              data: loanData.map((data) =>
                data.remainingBalances.reduce((sum, balance) => sum + balance, 0),
              ),
              borderColor: '#7b9a5d',
              backgroundColor: 'rgba(123, 154, 93, 0.2)',
              fill: true,
            },
          ]),
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
              text: 'Remaining Balance (SEK)',
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

<canvas id="loanSumsChart"></canvas>

<style>
  canvas {
    max-width: 100%;
    height: 400px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
