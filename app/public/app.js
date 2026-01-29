async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function uniq(arr) {
  return [...new Set(arr)].filter(x => x != null && x !== '');
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
  const entries = [...m.entries()].sort((a,b) => (a[0] > b[0] ? 1 : -1));
  return { x: entries.map(e => e[0]), y: entries.map(e => e[1]) };
}

function setSummary({ yearsMin, yearsMax, totalCases, totalDeaths }) {
  const el = document.getElementById('summary');
  el.innerHTML = `Years: <strong>${yearsMin}–${yearsMax}</strong><br/>` +
    `Total diagnoses (cases): <strong>${totalCases.toLocaleString()}</strong><br/>` +
    `Deaths: <strong>${totalDeaths.toLocaleString()}</strong>`;
}

function renderCasesTrend(cases, icd) {
  const filtered = icd === 'ALL' ? cases : cases.filter(r => r.ICD_Version === icd);
  const byYear = groupSum(filtered, r => r.Year, r => r.TotalDiag);
  const { x, y } = mapToSortedXY(byYear);

  Plotly.newPlot('cases_trend', [
    { x, y, type: 'scatter', mode: 'lines+markers', name: 'Total diagnoses' }
  ], {
    title: `Heat-related diagnoses by year (${icd === 'ALL' ? 'All ICD versions' : icd})`,
    xaxis: { title: 'Year' },
    yaxis: { title: 'Total diagnoses' },
    margin: { t: 60, l: 60, r: 20, b: 50 }
  }, { responsive: true });
}

function renderTopConditions(cases, icd, topN) {
  const filtered = icd === 'ALL' ? cases : cases.filter(r => r.ICD_Version === icd);
  const byCond = groupSum(filtered, r => r.BaseCondition, r => r.TotalDiag);
  const entries = [...byCond.entries()].sort((a,b) => b[1]-a[1]).slice(0, topN);
  const x = entries.map(e => e[1]).reverse();
  const y = entries.map(e => e[0]).reverse();

  Plotly.newPlot('top_conditions', [
    { x, y, type: 'bar', orientation: 'h', name: 'Total diagnoses' }
  ], {
    title: `Top ${topN} conditions (${icd === 'ALL' ? 'All ICD versions' : icd})`,
    xaxis: { title: 'Total diagnoses' },
    margin: { t: 60, l: 260, r: 20, b: 50 }
  }, { responsive: true });
}

function renderDeathsTrend(deaths) {
  const years = deaths.map(r => r.Year);
  const yearsMin = Math.min(...years);
  const yearsMax = Math.max(...years);

  Plotly.newPlot('deaths_trend', [
    { x: deaths.map(r => r.Year), y: deaths.map(r => r.TotalHeatDiag), type: 'scatter', mode: 'lines+markers', name: 'Total heat diagnoses' },
    { x: deaths.map(r => r.Year), y: deaths.map(r => r.Deaths), type: 'scatter', mode: 'lines+markers', name: 'Deaths', yaxis: 'y2' }
  ], {
    title: 'Deaths vs total heat diagnoses by year',
    xaxis: { title: 'Year', range: [yearsMin - 0.5, yearsMax + 0.5] },
    yaxis: { title: 'Total heat diagnoses' },
    yaxis2: { title: 'Deaths', overlaying: 'y', side: 'right' },
    margin: { t: 60, l: 60, r: 60, b: 50 }
  }, { responsive: true });
}

async function main() {
  const { cases, deaths } = await fetchJSON('/api/data');

  const icdSelect = document.getElementById('icd');
  const icds = ['ALL', ...uniq(cases.map(r => r.ICD_Version)).sort()];
  for (const v of icds) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    icdSelect.appendChild(opt);
  }
  icdSelect.value = 'ALL';

  const yearsAll = uniq(cases.map(r => r.Year).concat(deaths.map(r => r.Year)));
  const yearsMin = Math.min(...yearsAll);
  const yearsMax = Math.max(...yearsAll);

  setSummary({
    yearsMin,
    yearsMax,
    totalCases: sum(cases.map(r => r.TotalDiag)),
    totalDeaths: sum(deaths.map(r => r.Deaths)),
  });

  const topNSelect = document.getElementById('topN');

  function rerender() {
    const icd = icdSelect.value;
    const topN = Number(topNSelect.value) || 10;
    renderCasesTrend(cases, icd);
    renderTopConditions(cases, icd, topN);
    renderDeathsTrend(deaths);
  }

  icdSelect.addEventListener('change', rerender);
  topNSelect.addEventListener('change', rerender);

  rerender();
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});
