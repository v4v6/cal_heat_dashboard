import path from 'node:path';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

function rowValuesToArray(row, maxColumns) {
  const out = [];
  for (let c = 1; c <= maxColumns; c++) {
    const cell = row.getCell(c);
    let v = cell?.value ?? null;

    // ExcelJS may return objects for rich text, hyperlinks, etc.
    if (v && typeof v === 'object') {
      if (v.text) v = v.text;
      else if (v.richText) v = v.richText.map(x => x.text).join('');
      else if (v.result != null) v = v.result; // formula result
      else if (v.hyperlink && v.text) v = v.text;
      else v = String(v);
    }

    out.push(v);
  }
  return out;
}

async function main() {
  const input = process.argv[2];
  const outDir = process.argv[3] || 'data_processed';
  if (!input) {
    console.error('Usage: node scripts/convert_xlsx_to_csv.mjs <input.xlsx> [outDir]');
    process.exit(2);
  }

  await fs.mkdir(outDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(input);

  for (const ws of wb.worksheets) {
    // Determine usable bounds
    const maxCols = ws.columnCount;
    const headerRow = ws.getRow(1);
    const header = rowValuesToArray(headerRow, maxCols).map(x => (x == null ? '' : String(x)).trim());

    const records = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const vals = rowValuesToArray(row, maxCols);

      // Skip completely empty rows
      if (vals.every(v => v == null || String(v).trim() === '')) continue;

      const obj = {};
      for (let i = 0; i < maxCols; i++) {
        const key = header[i] || `col_${i+1}`;
        obj[key] = vals[i];
      }
      records.push(obj);
    }

    const csv = Papa.unparse(records);
    const safeName = ws.name.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
    const outPath = path.join(outDir, `${safeName}.csv`);
    await fs.writeFile(outPath, csv, 'utf8');
    console.log(`Wrote ${outPath} (${records.length} rows)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
