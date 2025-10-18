## 0) GLOBAL

**GOAL**

* フロントのみで見た目と体験を確定（データはモック）。
* ヘッダーで**タブ切替**、**期間切替（日/週/月/カスタム）**、**比較（前期間/YoY）**、各ウィジェット単位の**CSV出力**。
* 4タブ（売上／集客・CV／コンテンツ／視聴者）の**KPIカード／グラフ／テーブル**を同期更新。

**NON-GOALS（今回やらない）**

* 本番DB・本番ETL・認可実装（RBAC は見た目のみ）
* 本番リアルタイム基盤（5分アクティブはスタブで疑似）

**TECH STACK**

* App: Next.js (app router) / TypeScript / Tailwind / shadcn/ui / Recharts
* State: Zustand or React Query
* CSV: `papaparse` or custom util
* Mock API: Next.js route handlers + in-memory fixtures

**DIR STRUCTURE (proposed)**

```
apps/web/
  app/
    (dashboard)/
      layout.tsx
      page.tsx                # 売上タブをデフォルト
      acquisition/page.tsx
      content/page.tsx
      audience/page.tsx
    api/
      revenue/*.ts            # summary, breakdown, transactions
      acquisition/*.ts        # funnel, sources, platform-arpu, mix
      content/*.ts            # performance, top5, watch-time-trend
      audience/*.ts           # followers, retention, realtime
    components/
      header/DateRangePicker.tsx
      header/GlobalHeader.tsx
      kpi/KpiCard.tsx
      charts/{BarChartX,LineChartX,PieChartX}.tsx
      tables/{DataTable,TransactionsTable,...}.tsx
      common/DownloadCsv.tsx
    lib/
      csv.ts
      types.ts
      mock-data/*.ts
      utils/{date,format,calc}.ts
  package.json
```

---

## 1) AGENT ROLES

### Agent: `ui-wireframer`

**Goal:** ワイヤーフレーム品質の UI を実装（ダミーデータ/CSV出力/期間同期まで）
**Focus:** ページ構造・ヘッダー・カード/チャート/テーブルの配置と振る舞い
**Deliverables:** 4タブの画面、共通ヘッダー、CSV出力、アクセシビリティ

### Agent: `api-mocker`

**Goal:** 仕様通りのモックAPIと型・ダミーデータ生成
**Focus:** エンドポイント/パラメータ/レスポンス・フィクスチャ・算出式の整合
**Deliverables:** `/api/*` ルート、型（TS）、ダミーデータ生成関数

### Agent: `metrics-guardian`

**Goal:** 指標定義（数式）をコードに反映、Δ比較や集約の正しさをチェック
**Focus:** ARPPU/Churn/Retention/ファネルの分母統一、日/週/月の集約
**Deliverables:** `lib/calc.ts` に指標計算関数、ユニットテスト

### Agent: `exporter`

**Goal:** ウィジェット単位とタブ一括の CSV 出力を実装
**Deliverables:** `lib/csv.ts`, `components/common/DownloadCsv.tsx` と呼び出し例

### Agent: `a11y-qa`

**Goal:** WCAG 2.1 AA 目線の a11y とキーボード操作
**Deliverables:** `aria-label`／タブ移動／数値テーブルの代替表示トグル

---

## 2) HIGH-LEVEL PROMPT (Codex CLI に渡すメイン指示)

```
You are a team of agents (ui-wireframer, api-mocker, metrics-guardian, exporter, a11y-qa).
Build a Next.js (app router) + TS + Tailwind + shadcn/ui + Recharts dashboard mock.

Requirements:
- Header with tabs: Revenue | Acquisition & Conversion | Content | Audience.
- Global date range picker: today / yesterday / last7 / last30 / thisMonth / prevMonth / custom, with compare: previous period, YoY.
- Global filters (stub): platform, country, device, userType. Persist via URL/searchParams.
- Each tab has:
  - KPI cards (3–4).
  - Charts (2–4) and one major DataTable.
  - Per-widget "…" menu: download CSV (current filters/range), toggle table view, show definition tooltip.
- CSV exports for each dataset AND one-click tab export (bundled multiple CSVs).
- Implement formulas: ARPPU, churn, retention, funnel CVRs, SNS ARPU, etc. (see Section 5).
- Mock API endpoints with type-safe TS models and deterministic fake data across date ranges.
- Real-time active users (Audience) is a stub: poll endpoint every 60s returning random-ish value.
- Accessibility: keyboard navigation, aria labels, optional "show numeric table" toggle for each chart.
- Dark/Light themes.

Acceptance:
- Changing date range synchronizes all widgets in the current tab.
- Pie segment/filter toggles synchronize table and trend.
- Funnel stage click drills into breakdown table.
- CSV rows equal on-screen aggregates under same filters.
- Lint/build/test pass.

Deliver exactly the repo structure under apps/web as described. Provide runnable code.
```

---

## 3) TASKS (Executable Step List)

1. **Project Init**

   * Next.js (app router), TS, Tailwind, shadcn/ui セットアップ
   * ESLint/Prettier/Vitest 準備

2. **Type & Mock Model**

   * `lib/types.ts` にスキーマ型（transactions, subscriptions, events, contents, followers, users）
   * `lib/mock-data/*` にダミー生成（seed + range 依存）

3. **Calc Utils**

   * `lib/calc.ts`：ARPPU／Churn／Retention／Funnel／Aggregations（日/週/月）

4. **API Routes**

   * `/api/revenue/{summary, breakdown, transactions}`
   * `/api/acquisition/{funnel, sources, platform-arpu, mix}`
   * `/api/content/{performance, top5, watch-time-trend}`
   * `/api/audience/{followers, retention, realtime}`
   * 共通メタ（range/filters/generated_at）

5. **Global Header**

   * タブ切替, DateRangePicker（比較含む）, フィルタチップ, 一括エクスポート

6. **Revenue Tab**

   * KPI: total revenue, ARPPU, paying users, sub churn
   * Bar: revenue trend（groupBy range）
   * Pie: composition（single/subscription/tip）
   * Table: transactions
   * Drill: bar/pie → filter sync

7. **Acquisition Tab**

   * KPI: stage CVRs, external share, SNS ARPU, avg time to first purchase
   * Funnel, Sources table, Platform ARPU bar, Traffic mix line
   * Drill: funnel stage → sources table focus

8. **Content Tab**

   * KPI: top content revenue, avg watch time, avg post CVR, engagement rate
   * Table: title/views/sales/CVR/revenue/avgView/likes/comments/reposts/status
   * Bar: top5 by revenue
   * Line: avg watch time trend
   * Row click → side panel（詳細）

9. **Audience Tab**

   * KPI: active(5m), 7d/30d retention, sub retention, 7d active rate
   * Line: followers trend
   * Bar: retention trend
   * Poll: realtime active 60s

10. **CSV Exporter**

    * `lib/csv.ts` + UI 組込（各ウィジェット右上メニュー）

11. **A11y & QA**

    * `aria-*`, キーボード操作、数値テーブルトグル
    * ダーク/ライト確認

12. **Docs**

    * `README.md`（起動/ビルド/テスト）
    * `METRICS.md`（式と分母の定義）
    * `API.md`（エンドポイントとサンプルレスポンス）
    * `CSV_SCHEMAS.md`（エクスポート列）

---

## 4) API CONTRACT (Mock)

共通クエリ: `?start=ISO&end=ISO&tz=Asia/Tokyo&groupBy=day|week|month&compare=prev|yoy&filters=...`

**Response meta (全API共通):**

```ts
type ResponseMeta = {
  range: { start: string; end: string; tz: string; groupBy: 'day'|'week'|'month' };
  filters: Record<string, string | string[]>;
  generated_at: string; // ISO
};
```

### Revenue

* `GET /api/revenue/summary` → `{ meta, data: { gross:number, net:number, orders:number, paying_users:number, arppu:number, churn_rate:number, deltas?:{vsPrev?:number, yoy?:number} } }`
* `GET /api/revenue/breakdown` → `{ meta, data: Array<{ label:'single'|'subscription'|'tip', revenue:number, share:number }> }`
* `GET /api/revenue/transactions` → `{ meta, rows: TransactionRow[] }`

### Acquisition

* `GET /api/acquisition/funnel` → stages: visit → free_view → first_purchase（各 count/cvr）
* `GET /api/acquisition/sources` → `[{source, visits, free_views, first_purchases, cvr, arpu, revenue}]`
* `GET /api/acquisition/platform-arpu` → `[{platform, arpu, revenue}]`
* `GET /api/acquisition/mix` → 外部/内部/ダイレクト推移

### Content

* `GET /api/content/performance` → 表データ（pagination/ sort）
* `GET /api/content/top5`
* `GET /api/content/watch-time-trend`

### Audience

* `GET /api/audience/followers`
* `GET /api/audience/retention`
* `GET /api/audience/realtime`（ポーリング値）

---

## 5) METRICS (実装ルール)

* **総売上(Gross)** = Σ決済
* **純売上(Net)** = Σ(決済 − 返金 − 手数料) ※切替可
* **ARPPU** = 売上 / 有料ユーザー数（期間内購入1回以上のユニーク）
* **売上構成** = 単品/サブスク/Tip 比率
* **サブスク解約率** = 期間内解約数 / 期首有効会員数
* **継続率** = 1 − 解約率
* **ファネル段CVR** = 次段到達 / 現段到達
* **全体CVR** = 初回購入者 / 訪問
* **外部流入比率** = 外部リファラ訪問 / 全訪問
* **SNS別ARPU** = 売上（該当プラットフォーム起因）/ ユニーク訪問
* **フォロワー課金率** = 期間内購入フォロワー / 期首フォロワー
* **初回課金まで平均時間** = avg(first_purchase_at − first_visit_at)
* **投稿CVR（視聴→購入）** = 購入者（コンテンツ起因）/ 視聴ユーザー
* **エンゲージメント率** = (いいね+コメント+リポスト)/視聴
* **アクティブ(5m)** = 直近300秒にイベントのあるユニーク

> 日/週/月の集約は `groupBy` で制御。比較は Δ% を meta と同一計算で返すこと。

---

## 6) CSV SCHEMAS (抜粋)

**transactions.csv**

```
exported_at_utc,range_start,range_end,tz,transaction_id,user_id_hash,content_id,product_type,amount,currency,tax,discount,status,paid_at_utc,source,platform,device,country
```

**revenue_summary.csv**

```
date,gross_revenue,net_revenue,orders,paying_users,arppu
```

**sources_performance.csv**

```
source,visits,free_views,first_purchases,cvr_visit_to_purchase,arpu,revenue
```

**content_performance.csv**

```
content_id,title,views,unique_viewers,sales,revenue,cvr_view_to_purchase,avg_watch_time_sec,likes,comments,reposts,status
```

**followers_trend.csv**

```
date,followers_total,followers_new,followers_churned
```

---

## 7) UI COMPONENT CHECKLIST

* `GlobalHeader`

  * Tabs: Revenue / Acquisition / Content / Audience
  * DateRangePicker（比較/プリセット/カスタム）
  * Filter chips（platform/country/device/userType）
  * Export All (tab datasets)

* `KpiCard`

  * `label/value/delta/helpText`
  * Δホバーで定義ツールチップ

* `Charts`

  * Bar/Line/Pie（`aria-label`、数値テーブルトグル、brush/zoom）
  * クリックでドリルダウン or フィルタ連携

* `DataTable`

  * ソート/検索/ページネーション/CSV

---

## 8) ACCEPTANCE CRITERIA

1. 期間を切り替えると**同タブの全ウィジェットが同期**して再レンダ
2. 円グラフで「サブスク」を選ぶと、テーブル/トレンドが**サブスクのみ**に切替
3. ファネル段クリックで**流入元表へフォーカス**（該当段のフィルタ適用）
4. コンテンツ表の行クリックで**右スライド詳細**が開き、同期間の指標一致
5. 視聴者タブのアクティブ(5m)が**60秒間隔で更新**
6. 各ウィジェット[…]から**現在のフィルタ条件付き**のCSVがダウンロード可能
7. `pnpm dev` → すべてのページ/タブがエラーなく表示、`pnpm build` 成功

---

## 9) CODEx CLI RUNBOOK（最低限の操作手順）

**スキャフォールド**

```
codex /new "Create Next.js (app router) + TS + Tailwind + shadcn/ui + Recharts app under apps/web with structure above. Configure pnpm."
```

**UI 実装**

```
codex /task ui-wireframer "Build GlobalHeader (tabs/date-range/filters/export). Implement Revenue tab with KPI/Bar/Pie/Table, including drill interactions."
```

**API モック**

```
codex /task api-mocker "Create /api/* routes returning typed mock data honoring start/end/groupBy/filters. Add deterministic faker with seed."
```

**指標ロジック**

```
codex /task metrics-guardian "Implement lib/calc.ts with formulas and unit tests. Wire to API responses and KPI deltas."
```

**CSV 出力**

```
codex /task exporter "Implement lib/csv.ts and widget-level DownloadCsv menu. Add tab-level multi-dataset export."
```

**A11y/QA**

```
codex /task a11y-qa "Add aria labels, keyboard focus order, and table toggle for charts. Verify dark/light themes."
```

**実行**

```
pnpm i
pnpm dev    # http://localhost:3000
pnpm build  # build check
pnpm test   # metrics utils tests
```

---

## 10) OPEN QUESTIONS（暫定/要確認）

* **DM(tip)** の正式名称と会計処理（売上区分/手数料扱い）
* フォロワー課金率の**分母**（期首固定で良いか、平均保有か）
* コンテンツ起因購入の**アトリビューション窓**（暫定24h）
* タイムゾーン表示：UIはアカウントTZ、CSVはUTC併記で確定？

---

## 11) QUALITY BARS

* Lighthouse (desktop) Performance ≥ 90（モック時）
* 主要チャートは**1,000行**程度のスタブでもサクサク（P90 < 500ms）
* すべての数値は**CSVと画面の合計が一致**
* a11y: キーボードだけで主要操作が完了

---

## 12) APPENDIX: TYPE HINTS（抜粋）

```ts
export type ProductType = 'single' | 'subscription' | 'tip';

export type TransactionRow = {
  transaction_id: string;
  user_id_hash: string;
  content_id?: string;
  product_type: ProductType;
  amount: number;
  currency: string;
  tax: number;
  discount: number;
  status: 'paid'|'refunded';
  paid_at_utc: string;
  source?: string;
  platform?: string;
  device?: string;
  country?: string;
};

export type RevenueSummary = {
  gross: number; net: number; orders: number; paying_users: number; arppu: number; churn_rate: number;
  deltas?: { vsPrev?: number; yoy?: number };
};
```