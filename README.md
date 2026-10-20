# Poverty and Heart Disease Mortality Among California Women 35+

An interactive academic research dashboard examining the county-level relationship between poverty and heart disease mortality among women ages 35 and older across California's 58 counties.

## Technology

- React + TypeScript + Vite
- Tailwind CSS
- MapLibre GL JS
- Recharts

## Reproducible data processing

The dashboard uses two raw source files in `data/`:

- ACS 2020–2024 5-Year Table B17001
- CDC/NVSS Heart Disease Mortality Data Among U.S. Adults (35+), 2022–2024

Run:

```bash
npm run data:process
```

The processing script:

1. validates the ACS poverty-status, female, and 35+ age-group row labels;
2. sums female age groups 35–44, 45–54, 55–64, 65–74, and 75+ below and at/above poverty;
3. filters CDC records to California counties, female sex, overall race/ethnicity, and age-adjusted spatially smoothed heart disease mortality;
4. rejects missing numeric values, duplicates, and unmatched counties;
5. verifies exactly 58 unique county records; and
6. writes `data/processed/california_county_poverty_heart_mortality.csv`.

The production build regenerates this processed dataset and derives the client data artifact from the validated merged rows.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Vite is configured with the GitHub Pages base path `/cardiovascularheartdisease/`. A GitHub Actions workflow builds `dist/` and deploys it to Pages on pushes to `main`.
