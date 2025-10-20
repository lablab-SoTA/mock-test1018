# Metric Definitions

All metrics are computed on the mock API layer (`lib/calc.ts`, `lib/utils/revenue.ts`, etc.) using deterministic seeded data. Formulas mirror the business definitions supplied in the specification.

## Revenue

| Metric | Definition |
| ------ | ---------- |
| Gross revenue | Sum of paid transaction amounts. |
| Net revenue | `amount - (amount * fee_rate) - tax - discount` for paid transactions, minus refunded amounts. |
| Orders | Count of paid transactions. |
| Paying users | Unique users with ≥1 paid transaction in the range. |
| ARPPU | `gross ÷ paying_users`. Rounded to 2 decimals. |
| Payment rate | `paying_users ÷ active_audience` (derived baseline per range). |
| Subscription churn | `cancellations ÷ subscribers_at_start`. Deterministic baseline per query. |
| Retention | `1 - churn_rate`. |

## Acquisition & Conversion

| Metric | Definition |
| ------ | ---------- |
| Visit → Free view CVR | `free_views ÷ visits`. |
| Free view → Purchase CVR | `first_purchases ÷ free_views`. |
| External share | `external_visits ÷ total_visits`. Computed from sources API response. |
| Avg time to first purchase | Deterministic value per range, reported in hours. |
| ARPU (platform) | `revenue ÷ visits (per platform)`. |

## Content

| Metric | Definition |
| ------ | ---------- |
| Average watch time | Mean of `avg_watch_time_sec` across content items. |
| Average CVR | Mean of content conversion rate `sales ÷ unique_viewers`. |
| Engagement rate | `(likes + comments + reposts) ÷ views` averaged per content item. |
| Top content revenue | Revenue of the highest earning content row. |

## Audience

| Metric | Definition |
| ------ | ---------- |
| Active (5m) | Randomized baseline of active users in a 5-minute window. Updated every poll. |
| Retention (7d/30d/90d) | Static cohorts generated per query: `retained ÷ cohort_size`. |
| Churn | `1 - retention`. |

### Aggregation

- `groupBy` (day/week/month) buckets are generated via `createBuckets(range, groupBy)` ensuring tables/charts align.
- Dataset comparisons (`compare=prev` or `compare=yoy`) are computed by re-running generation on shifted ranges and returning delta percentages.

For more detailed implementation see `lib/calc.ts` and the mock data generators under `lib/mock-data/*`.
