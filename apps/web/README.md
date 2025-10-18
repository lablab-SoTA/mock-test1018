# Creator Analytics Dashboard (Mock)

Front-end only prototype of a multi-tab analytics dashboard for creator monetization teams. The app is built with Next.js 15 (App Router), React Query, Zustand, Tailwind CSS 4, shadcn/ui, and Recharts. All data comes from deterministic mock API routes so the UI behaves like a production environment without real backends.

## Requirements

- Node.js 20+
- pnpm 8 (a local copy is bootstrapped under `.pnpm-home`)

## Scripts

```bash
pnpm install       # install dependencies
pnpm dev           # start the dev server at http://localhost:3000
pnpm build         # production build
pnpm start         # run the production build
pnpm lint          # eslint flat config
pnpm test          # vitest unit tests (metrics)
pnpm typecheck     # TypeScript project check
```

## Features

- Global header with tab navigation, date/compare picker, filter chips, and one-click CSV bundle export per tab.
- Mock API routes under `app/api/*` implementing revenue, acquisition, content, and audience datasets with deterministic seeded data.
- KPI cards, charts, and tables for each tab, synchronized by shared Zustand state + URL parameters.
- Widget-level menus that support CSV download, chart/table toggle, and metric definition access.
- React Query powered data fetching with automatic refresh for real-time audience metrics.
- Accessibility improvements: descriptive aria labels, keyboard reachable controls, and tabular toggles for chart content.
- Dark/light theme ready via `next-themes`.

## Project Structure

```
app/(dashboard)         # dashboard routes & layout
app/api/*               # mock API route handlers
components/             # UI building blocks (header, charts, tables, widgets)
lib/                    # calculations, CSV utils, mock data generators, hooks
public/                 # static assets
```

Additional documentation:

- [`API.md`](./API.md) – mock endpoint contract and sample payloads
- [`METRICS.md`](./METRICS.md) – metric definitions and calculations
- [`CSV_SCHEMAS.md`](./CSV_SCHEMAS.md) – exported CSV column references

## Development Notes

- Chart widgets expose a “Toggle table view” control for screen-reader friendly representations.
- The mock data layer is deterministic per query (range + filters) to keep CSV exports aligned with on-screen values.
- Real-time audience data polls every 60s and adds gentle variance around the seeded baseline.

## License

This mock dashboard is provided for internal prototyping only. No production guarantees.
