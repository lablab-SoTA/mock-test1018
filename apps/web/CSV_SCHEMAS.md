# CSV Schemas

CSV files are generated on demand through widget menus or via the tab-level "Export CSV" control. Each dataset reflects the current filters, date range, and compare mode.

## Revenue

### revenue_summary.csv
| Column | Description |
| ------ | ----------- |
| gross | Gross revenue |
| net | Net revenue |
| orders | Paid order count |
| paying_users | Unique paying users |
| arppu | Average revenue per paying user |
| churn_rate | Subscription churn rate |

### revenue_breakdown.csv
| Column | Description |
| ------ | ----------- |
| product_type | Product label (single/subscription/tip) |
| revenue | Revenue for the product type |
| share | Share of total revenue |

### transactions.csv
Mirrors `TransactionRow` fields (`transaction_id`, `paid_at_utc`, `user_id_hash`, `product_type`, `amount`, `tax`, `discount`, `status`, `source`, `platform`, `device`, `country`).

## Acquisition

- `funnel.csv`: `stage`, `volume`, `conversion_rate`
- `sources.csv`: `source`, `visits`, `free_views`, `first_purchases`, `conversion_rate`, `arpu`, `revenue`
- `platform_arpu.csv`: `platform`, `arpu`, `revenue`
- `traffic_mix.csv`: `date`, `external`, `internal`, `direct`

## Content

- `content_performance.csv`: content id, title, views, unique viewers, sales, revenue, conversion rate, avg watch time, likes, comments, reposts, status
- `content_top5.csv`: content id, title, views, revenue
- `watch_time_trend.csv`: `date`, `avg_watch_time_sec`

## Audience

- `followers_trend.csv`: `date`, `followers_total`, `followers_new`, `followers_churned`
- `retention.csv`: `cohort_start`, `retention_rate`, `churn_rate`
- `realtime.csv`: `active_users`, `polled_at`

Bundled exports (`*_tab.zip`) contain the same CSVs named per the sections above.
