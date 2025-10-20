# Mock API Contract

All routes live under `app/api/*` and respond with JSON. Query parameters (`start`, `end`, `tz`, `groupBy`, `compare`, `filters`) are shared across endpoints (see [`lib/api/params.ts`](lib/api/params.ts)). Responses include `meta` describing the applied range.

## Revenue

- `GET /api/revenue/summary`
  - Returns overall revenue KPIs (`payment_rate` now included) with optional `deltas` when compare mode enabled.
- `GET /api/revenue/breakdown`
  - Product type breakdown (`single`, `subscription`, `tip`).
- `GET /api/revenue/transactions`
  - Array of transaction rows (used for tables/CSV).
- `GET /api/revenue/top-payers`
  - Top 10 paying users with order counts, AOV, and last purchase timestamp.

## Acquisition & Conversion

- `GET /api/acquisition/funnel`
  - Visit → Free view → First purchase volumes and stage CVRs. Includes `meta.metrics` for external share & average time to first purchase.
- `GET /api/acquisition/sources`
  - Per-source visit/view/purchase metrics + ARPU.
- `GET /api/acquisition/platform-arpu`
  - Platform-level ARPU and revenue splits.
- `GET /api/acquisition/mix`
  - External/internal/direct traffic trend data.

## Content

- `GET /api/content/performance`
  - Content table data (supports `page` & `limit` query parameters).
- `GET /api/content/top5`
  - Top 5 content rows by revenue.
- `GET /api/content/watch-time-trend`
  - Average watch time trend per bucket.

## Audience

- `GET /api/audience/followers`
  - Followers cumulative/new/churned trend.
- `GET /api/audience/retention`
  - Cohort retention/churn rates (7d/30d/90d).
- `GET /api/audience/realtime`
  - Active users in the last five minutes. Poll every 60 seconds for updated value.

## Sample Payload

See mock data generator output in `lib/mock-data/*.ts` for the deterministic structure of each response. The mock APIs are deterministic with respect to range, groupBy, compare, and filters so that on-screen values match CSV exports.
