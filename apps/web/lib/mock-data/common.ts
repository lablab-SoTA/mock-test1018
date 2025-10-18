import { formatForLabel, createBuckets } from "@/lib/utils/date";
import { createSeededRandom, pickOne, randomBetween, randomInt } from "@/lib/utils/random";
import type {
  CompareMode,
  DashboardFilters,
  DateRange,
  GroupByGranularity,
} from "@/lib/types";

export const PLATFORMS = ["YouTube", "Twitch", "Instagram", "TikTok", "X"];
export const COUNTRIES = ["JP", "US", "KR", "TW", "TH", "ID", "VN", "GB"];
export const DEVICES = ["mobile", "desktop", "tablet", "tv"];
export const USER_TYPES = ["new", "returning", "subscriber"];
export const SOURCES = ["Search", "Social", "Direct", "Referral", "Affiliate", "Email", "Paid Ads"];
export const CONTENT_STATUSES = ["draft", "scheduled", "published"] as const;
export const CONTENT_GENRES = ["Gaming", "Education", "Lifestyle", "Music", "Sports", "Tech", "Comedy"];

export type MockContext = {
  seed: string;
  random: () => number;
  range: DateRange;
  groupBy: GroupByGranularity;
  compare: CompareMode;
  filters: DashboardFilters;
  buckets: { start: string; end: string; label: string }[];
};

type MockContextParams = {
  domain: string;
  range: DateRange;
  groupBy: GroupByGranularity;
  filters: DashboardFilters;
  compare: CompareMode;
};

export function createMockContext({ domain, range, groupBy, filters, compare }: MockContextParams): MockContext {
  const seedBase = `${domain}-${range.start}-${range.end}-${groupBy}-${compare}-${hashFilters(filters)}`;
  const random = createSeededRandom(seedBase);
  const buckets = createBuckets(range, groupBy);

  return {
    seed: seedBase,
    random,
    range,
    groupBy,
    compare,
    filters,
    buckets,
  };
}

export function hashFilters(filters: DashboardFilters) {
  const entries = Object.entries(filters)
    .flatMap(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return [];
      if (Array.isArray(value)) {
        return value.sort().map((item) => `${key}:${item}`);
      }
      return [`${key}:${value}`];
    })
    .join("|");

  return entries || "none";
}

export function allocateByWeights(total: number, weights: number[], random: () => number) {
  const weightSum = weights.reduce((acc, value) => acc + value, 0) || 1;
  const baseValues = weights.map((weight) => (total * weight) / weightSum);
  const allocations = baseValues.map((value) => value * randomBetween(0.85, 1.15, random));
  const scale = total / allocations.reduce((acc, value) => acc + value, 0);
  return allocations.map((value) => Math.max(0, value * scale));
}

export function bucketize(total: number, bucketCount: number, random: () => number) {
  const weights = Array.from({ length: bucketCount }).map((_, index) => 0.5 + Math.sin(index));
  return allocateByWeights(total, weights, random);
}

export function generateId(prefix: string, index: number, random: () => number) {
  const randomPart = Math.floor(random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${index}-${randomPart}`;
}

export function pickPlatform(random: () => number, filters: DashboardFilters) {
  const pool = filters.platform.length ? filters.platform : PLATFORMS;
  return pickOne(pool, random);
}

export function pickCountry(random: () => number, filters: DashboardFilters) {
  const pool = filters.country.length ? filters.country : COUNTRIES;
  return pickOne(pool, random);
}

export function pickDevice(random: () => number, filters: DashboardFilters) {
  const pool = filters.device.length ? filters.device : DEVICES;
  return pickOne(pool, random);
}

export function pickUserType(random: () => number, filters: DashboardFilters) {
  const pool = filters.userType.length ? filters.userType : USER_TYPES;
  return pickOne(pool, random);
}

export function randomTimeWithinBucket(bucketStart: string, bucketEnd: string, random: () => number) {
  const start = new Date(bucketStart).getTime();
  const end = new Date(bucketEnd).getTime();
  const timestamp = start + (end - start) * random();
  return new Date(timestamp).toISOString();
}

export function toCsvDateLabel(dateIso: string, timezone?: string) {
  return formatForLabel(dateIso, timezone);
}

export { pickOne, randomBetween, randomInt };
