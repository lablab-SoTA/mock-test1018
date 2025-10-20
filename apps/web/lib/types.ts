export type GroupByGranularity = "day" | "week" | "month";

export type CompareMode = "none" | "previous" | "yoy";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "prevMonth"
  | "custom";

export type ProductType = "single" | "subscription" | "tip";

export type TransactionStatus = "paid" | "refunded";

export type TransactionRow = {
  transaction_id: string;
  user_id_hash: string;
  content_id?: string;
  product_type: ProductType;
  amount: number;
  currency: string;
  tax: number;
  discount: number;
  status: TransactionStatus;
  paid_at_utc: string;
  source?: string;
  platform?: string;
  device?: string;
  country?: string;
};

export type RevenueSummary = {
  gross: number;
  net: number;
  orders: number;
  paying_users: number;
  arppu: number;
  churn_rate: number;
  retention_rate: number;
  payment_rate: number;
  deltas?: {
    vsPrev?: number;
    yoy?: number;
  };
};

export type RevenueBreakdownItem = {
  label: ProductType;
  revenue: number;
  share: number;
};

export type FunnelStage = {
  id: "visit" | "free_view" | "first_purchase";
  label: string;
  volume: number;
  conversion_rate: number;
};

export type SourcePerformance = {
  source: string;
  visits: number;
  free_views: number;
  first_purchases: number;
  conversion_rate: number;
  arpu: number;
  revenue: number;
};

export type PlatformArpu = {
  platform: string;
  arpu: number;
  revenue: number;
};

export type TrafficMixPoint = {
  date: string;
  external: number;
  internal: number;
  direct: number;
};

export type ContentPerformanceRow = {
  content_id: string;
  title: string;
  views: number;
  unique_viewers: number;
  sales: number;
  revenue: number;
  conversion_rate: number;
  avg_watch_time_sec: number;
  likes: number;
  comments: number;
  reposts: number;
  status: "draft" | "scheduled" | "published";
  platform: string;
  creator_segment: string;
};

export type WatchTimeTrendPoint = {
  date: string;
  avg_watch_time_sec: number;
};

export type ContentTopItem = {
  content_id: string;
  title: string;
  revenue: number;
  views: number;
};

export type FollowersTrendPoint = {
  date: string;
  followers_total: number;
  followers_new: number;
  followers_churned: number;
};

export type RetentionPoint = {
  cohort_start: string;
  retention_rate: number;
  churn_rate: number;
};

export type RealtimeActive = {
  active_users: number;
  polled_at: string;
};

export type ResponseMeta = {
  range: {
    start: string;
    end: string;
    tz: string;
    groupBy: GroupByGranularity;
  };
  filters: Record<string, string | string[]>;
  generated_at: string;
  compare?: CompareMode;
  preset?: DateRangePreset;
};

export type RevenueSummaryResponse = {
  meta: ResponseMeta;
  data: RevenueSummary;
};

export type RevenueBreakdownResponse = {
  meta: ResponseMeta;
  data: RevenueBreakdownItem[];
};

export type RevenueTransactionsResponse = {
  meta: ResponseMeta;
  rows: TransactionRow[];
};

export type TopPayerRow = {
  user_id_hash: string;
  total_revenue: number;
  orders: number;
  avg_order_value: number;
  last_purchase_utc: string;
};

export type RevenueTopPayersResponse = {
  meta: ResponseMeta;
  data: TopPayerRow[];
};

export type AcquisitionFunnelResponse = {
  meta: ResponseMeta;
  data: FunnelStage[];
};

export type AcquisitionSourcesResponse = {
  meta: ResponseMeta;
  data: SourcePerformance[];
};

export type AcquisitionPlatformArpuResponse = {
  meta: ResponseMeta;
  data: PlatformArpu[];
};

export type AcquisitionMixResponse = {
  meta: ResponseMeta;
  data: TrafficMixPoint[];
};

export type ContentPerformanceResponse = {
  meta: ResponseMeta;
  data: ContentPerformanceRow[];
};

export type ContentTopResponse = {
  meta: ResponseMeta;
  data: ContentTopItem[];
};

export type ContentWatchTimeResponse = {
  meta: ResponseMeta;
  data: WatchTimeTrendPoint[];
};

export type AudienceFollowersResponse = {
  meta: ResponseMeta;
  data: FollowersTrendPoint[];
};

export type AudienceRetentionResponse = {
  meta: ResponseMeta;
  data: RetentionPoint[];
};

export type AudienceRealtimeResponse = {
  meta: ResponseMeta;
  data: RealtimeActive;
};

export type DashboardFilters = {
  platform: string[];
  country: string[];
  device: string[];
  userType: string[];
  product: ProductType[];
};

export type DateRange = {
  start: string;
  end: string;
};

export type Locale = "en" | "ja";

export type DashboardContextState = {
  range: DateRange;
  preset: DateRangePreset;
  compare: CompareMode;
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  locale: Locale;
};
