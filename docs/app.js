function setStatus(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
}

function fmt(n) {
  const x = Number(n) || 0;
  return x.toLocaleString();
}

function uniq(arr) {
  return [...new Set(arr)].filter(v => v != null && v !== '');
}

function sum(arr) {
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);
}

function groupSum(rows, keyFn, valFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    const v = Number(valFn(r)) || 0;
    m.set(k, (m.get(k) || 0) + v);
  }
  return m;
}

function mapToSortedXY(m) {
  const entries = [...m.entries()].sort((a, b) => (a[0] > b[0] ? 1 : -1));
  return { x: entries.map(e => e[0]), y: entries.map(e => e[1]) };
}

async function loadCsv(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn('CSV parse warnings:', parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

function plotDefaults() {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: 'rgba(232,238,252,0.92)' },
    xaxis: { gridcolor: 'rgba(232,238,252,0.12)', zerolinecolor: 'rgba(232,238,252,0.12)' },
    yaxis: { gridcolor: 'rgba(232,238,252,0.12)', zerolinecolor: 'rgba(232,238,252,0.12)' },
    legend: { bgcolor: 'rgba(0,0,0,0)' },
  };
}

function renderCasesTrend(cases, icd) {
  const filtered = icd === 'ALL' ? cases : cases.filter(r => r.ICD_Version === icd);
  const byYear = groupSum(filtered, r => r.Year, r => r.TotalDiag);
  const { x, y } = mapToSortedXY(byYear);

  Plotly.newPlot('cases_trend', [
    {
      x, y,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Diagnoses',
      line: { color: '#7aa2ff', width: 3 },
      marker: { size: 7 }
    }
  ], {
    ...plotDefaults(),
    title: `Heat-related diagnoses by year (${icd === 'ALL' ? 'All ICD versions' : icd})`,
    xaxis: { ...plotDefaults().xaxis, title: 'Year' },
    yaxis: { ...plotDefaults().yaxis, title: 'Total diagnoses' },
    margin: { t: 60, l: 60, r: 18, b: 48 },
  }, { responsive: true });
}

function renderDeathsTrend(deaths) {
  const years = deaths.map(r => r.Year);
  const yearsMin = Math.min(...years);
  const yearsMax = Math.max(...years);

  Plotly.newPlot('deaths_trend', [
    {
      x: deaths.map(r => r.Year),
      y: deaths.map(r => r.TotalHeatDiag),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Total heat diagnoses',
      line: { color: '#9ee6a0', width: 3 },
      marker: { size: 7 },
    },
    {
      x: deaths.map(r => r.Year),
      y: deaths.map(r => r.Deaths),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Deaths',
      yaxis: 'y2',
      line: { color: '#ff7ab3', width: 3 },
      marker: { size: 7 },
    }
  ], {
    ...plotDefaults(),
    title: 'Deaths vs total heat diagnoses by year',
    xaxis: { ...plotDefaults().xaxis, title: 'Year', range: [yearsMin - 0.5, yearsMax + 0.5] },
    yaxis: { ...plotDefaults().yaxis, title: 'Total heat diagnoses' },
    yaxis2: {
      title: 'Deaths',
      overlaying: 'y',
      side: 'right',
      gridcolor: 'rgba(0,0,0,0)',
      zerolinecolor: 'rgba(232,238,252,0.12)',
      tickfont: { color: 'rgba(232,238,252,0.92)' },
      titlefont: { color: 'rgba(232,238,252,0.92)' },
    },
    margin: { t: 60, l: 60, r: 60, b: 48 },
  }, { responsive: true });
}

function renderTopConditions(cases, icd, topN) {
  const filtered = icd === 'ALL' ? cases : cases.filter(r => r.ICD_Version === icd);
  const byCond = groupSum(filtered, r => r.BaseCondition, r => r.TotalDiag);
  const entries = [...byCond.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
  const x = entries.map(e => e[1]).reverse();
  const y = entries.map(e => e[0]).reverse();

  Plotly.newPlot('top_conditions', [
    {
      x, y,
      type: 'bar',
      orientation: 'h',
      marker: { color: '#7aa2ff' },
      hovertemplate: '%{y}<br>%{x:,} diagnoses<extra></extra>'
    }
  ], {
    ...plotDefaults(),
    title: `Top ${topN} conditions (${icd === 'ALL' ? 'All ICD versions' : icd})`,
    xaxis: { ...plotDefaults().xaxis, title: 'Total diagnoses' },
    margin: { t: 60, l: 280, r: 18, b: 48 },
  }, { responsive: true });
}

async function main() {
  setStatus('Loading CSV…');
  const [cases, deaths] = await Promise.all([
    loadCsv('./data/heat_related_cases.csv'),
    loadCsv('./data/heat_deaths.csv'),
  ]);

  // Controls
  const icdSelect = document.getElementById('icd');
  const icds = ['ALL', ...uniq(cases.map(r => r.ICD_Version)).sort()];
  for (const v of icds) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    icdSelect.appendChild(opt);
  }
  icdSelect.value = 'ALL';

  const topNSelect = document.getElementById('topN');

  // KPIs
  const yearsAll = uniq(cases.map(r => r.Year).concat(deaths.map(r => r.Year)));
  const yearsMin = Math.min(...yearsAll);
  const yearsMax = Math.max(...yearsAll);
  document.getElementById('kpi_years').textContent = `${yearsMin}–${yearsMax}`;
  document.getElementById('kpi_cases').textContent = fmt(sum(cases.map(r => r.TotalDiag)));
  document.getElementById('kpi_deaths').textContent = fmt(sum(deaths.map(r => r.Deaths)));

  function rerender() {
    const icd = icdSelect.value;
    const topN = Number(topNSelect.value) || 10;
    renderCasesTrend(cases, icd);
    renderDeathsTrend(deaths);
    renderTopConditions(cases, icd, topN);
    setStatus('Ready');
  }

  icdSelect.addEventListener('change', rerender);
  topNSelect.addEventListener('change', rerender);

  rerender();
}

main().catch(err => {
  console.error(err);
  setStatus('Error');
  alert(err.message);
});
