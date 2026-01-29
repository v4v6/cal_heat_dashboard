import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import Papa from 'papaparse';

const app = express();
const PORT = process.env.PORT || 3000;

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, 'app', 'public');
const dataDir = path.join(repoRoot, 'data_processed');

function loadCsv(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn('CSV parse warnings:', parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

app.get('/api/data', (_req, res) => {
  const casesPath = path.join(dataDir, 'heat_related_cases.csv');
  const deathsPath = path.join(dataDir, 'heat_deaths.csv');
  if (!fs.existsSync(casesPath) || !fs.existsSync(deathsPath)) {
    return res.status(404).json({
      error: 'Processed CSVs not found. Run: node scripts/convert_xlsx_to_csv.mjs <input.xlsx> data_processed'
    });
  }

  const cases = loadCsv(casesPath);
  const deaths = loadCsv(deathsPath);
  res.json({ cases, deaths });
});

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
