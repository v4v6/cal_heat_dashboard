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
