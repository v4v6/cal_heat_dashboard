# California Heat Hospitalizations Dashboard

This repo is a starter project for building a dashboard from CDPH/HHS heat-related hospitalization and death records.

## Data

- Raw input: Excel workbook (`.xlsx`)
- Processed outputs: CSVs in `data_processed/`

### Convert Excel → CSV

```bash
npm install
node scripts/convert_xlsx_to_csv.mjs path/to/input.xlsx data_processed
```

This produces:
- `data_processed/heat_related_cases.csv`
- `data_processed/heat_deaths.csv`

## Next

- Add a dashboard app (Streamlit or a JS-based dashboard)
- Add plots: time trends, condition breakdowns, and deaths vs total diagnoses

## GitHub Pages (recommended)

This repo includes a static dashboard that can be hosted on GitHub Pages (no server required).

- Entry point: `docs/index.html`
- Data bundled as CSV in: `docs/data/`

### Enable Pages

In GitHub:
- Repo → **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: `main`
- Folder: `/docs`

After enabling, your dashboard will be available at:
`https://v4v6.github.io/cal_heat_dashboard/`
