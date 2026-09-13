<script>
  import { onMount } from 'svelte';
  import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
  import { browser } from '$app/environment';
  export let labels = [];
  export let values = [];
  let canvas;
  let chart;
  onMount(() => {
    if (!browser) return;
    ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);
    chart = new ChartJS(canvas, { type:'line', data:{ labels, datasets:[{ data:values, borderWidth:2, pointRadius:0, fill:true, tension:.25 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>new Intl.NumberFormat('sv-SE').format(ctx.parsed.y)+' kr'}}}, scales:{y:{ticks:{callback:(v)=>new Intl.NumberFormat('sv-SE',{notation:'compact'}).format(v)+' kr'}, grid:{color:'#eef0f2'}},x:{grid:{display:false}}} } });
    return () => chart?.destroy();
  });
  $: if (chart) { chart.data.labels = labels; chart.data.datasets[0].data = values; chart.update(); }
</script>
<div class="chart"><canvas bind:this={canvas}></canvas></div>
<style>.chart{height:320px;margin-top:18px}</style>
