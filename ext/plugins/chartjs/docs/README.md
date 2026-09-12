# Chart.js Plugin

First-party Chart.js 4.x browser assets for responsive, canvas-based
charts and data visualizations.

## What It Provides

Registers the Chart.js UMD build as a default asset.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `chart.umd.min.js` | JavaScript | `plugins/chartjs` | Yes |

## Usage

Chart.js is included automatically. Create a `<canvas>` element and
instantiate a chart:

```html
<canvas id="myChart" width="400" height="200"></canvas>

<script>
const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [{
            label: 'Revenue',
            data: [120, 190, 170, 210],
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
    },
    options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Monthly Revenue' } }
    }
});
</script>
```

Supported chart types: `line`, `bar`, `radar`, `doughnut`, `pie`,
`polarArea`, `scatter`, `bubble`.

## Dependencies

- `jquery`
- `bootstrap`
