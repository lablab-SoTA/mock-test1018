import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import type {
  CompareMode,
  DateRange,
  DateRangePreset,
  GroupByGranularity,
} from "@/lib/types";

export const DEFAULT_TIMEZONE = "Asia/Tokyo";

const DAY_FORMAT = "yyyy-MM-dd";

type RangeInput = {
  start: string;
  end: string;
  timezone?: string;
};

export function ensureValidRange({
  start,
  end,
  timezone = DEFAULT_TIMEZONE,
}: RangeInput): DateRange {
  const startDate = ensureDate(start, timezone);
  const endDate = ensureDate(end, timezone);

  const safeStart = isAfter(startDate, endDate) ? endDate : startDate;
  const safeEnd = isBefore(endDate, safeStart) ? safeStart : endDate;

  return {
    start: toIso(safeStart),
    end: toIso(safeEnd),
  };
}

export function ensureDate(value: string, timezone = DEFAULT_TIMEZONE) {
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return fromZonedTime(parsed, timezone);
}

export function toIso(date: Date) {
  return date.toISOString();
}

export function formatForLabel(date: string | Date, timezone = DEFAULT_TIMEZONE) {
  const source = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(source, timezone);
  return format(zoned, DAY_FORMAT);
}

export function getPresetRange(
  preset: DateRangePreset,
  timezone = DEFAULT_TIMEZONE,
): { range: DateRange; comparePreset: CompareMode } {
  const now = toZonedTime(new Date(), timezone);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  let start = todayStart;
  let end = todayEnd;

  switch (preset) {
    case "today":
      break;
    case "yesterday":
      start = startOfDay(addDays(todayStart, -1));
      end = endOfDay(addDays(todayStart, -1));
      break;
    case "last7":
      start = startOfDay(addDays(todayStart, -6));
      break;
    case "last30":
      start = startOfDay(addDays(todayStart, -29));
      break;
    case "thisMonth":
      start = startOfMonth(todayStart);
      end = endOfDay(now);
      break;
    case "prevMonth":
      start = startOfMonth(addMonths(todayStart, -1));
      end = endOfMonth(addMonths(todayStart, -1));
      break;
    case "custom":
    default:
      break;
  }

  const range: DateRange = { start: toIso(fromZonedTime(start, timezone)), end: toIso(fromZonedTime(end, timezone)) };
  return { range, comparePreset: "previous" };
}

export function inferGroupBy(range: DateRange): GroupByGranularity {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  const days = Math.max(1, differenceInCalendarDays(end, start));

  if (days <= 14) return "day";
  if (days <= 90) return "week";
  return "month";
}

export function shiftRange(range: DateRange, mode: CompareMode, groupBy: GroupByGranularity): DateRange {
  if (mode === "none") {
    return range;
  }

  const start = parseISO(range.start);
  const end = parseISO(range.end);

  switch (mode) {
    case "previous": {
      const diff = differenceInCalendarDays(end, start) + 1;
      const newStart = addDays(start, -diff);
      const newEnd = addDays(end, -diff);
      return { start: toIso(newStart), end: toIso(endOfDay(newEnd)) };
    }
    case "yoy": {
      if (groupBy === "month") {
        return { start: toIso(addMonths(start, -12)), end: toIso(endOfDay(addMonths(end, -12))) };
      }
      if (groupBy === "week") {
        return { start: toIso(addWeeks(start, -52)), end: toIso(endOfDay(addWeeks(end, -52))) };
      }
      return { start: toIso(addDays(start, -365)), end: toIso(endOfDay(addDays(end, -365))) };
    }
    default:
      return range;
  }
}

export function createBuckets(range: DateRange, groupBy: GroupByGranularity, timezone = DEFAULT_TIMEZONE) {
  const buckets: { start: string; end: string; label: string }[] = [];
  const start = toZonedTime(parseISO(range.start), timezone);
  const end = toZonedTime(parseISO(range.end), timezone);

  let cursor = startOfBucket(start, groupBy);

  while (!isAfter(cursor, end)) {
    const bucketStart = fromZonedTime(cursor, timezone);
    const bucketEnd = bucketEndDate(cursor, groupBy, timezone);
    buckets.push({
      start: toIso(bucketStart),
      end: toIso(bucketEnd),
      label: formatForLabel(cursor, timezone),
    });

    cursor = incrementBucket(cursor, groupBy);
  }

  return buckets;
}

function startOfBucket(date: Date, groupBy: GroupByGranularity) {
  if (groupBy === "week") return startOfWeek(date, { weekStartsOn: 1 });
  if (groupBy === "month") return startOfMonth(date);
  return startOfDay(date);
}

function bucketEndDate(date: Date, groupBy: GroupByGranularity, timezone: string) {
  switch (groupBy) {
    case "week":
      return fromZonedTime(endOfWeek(date, { weekStartsOn: 1 }), timezone);
    case "month":
      return fromZonedTime(endOfMonth(date), timezone);
    default:
      return fromZonedTime(endOfDay(date), timezone);
  }
}

function incrementBucket(date: Date, groupBy: GroupByGranularity) {
  if (groupBy === "week") return addWeeks(date, 1);
  if (groupBy === "month") return addMonths(date, 1);
  return addDays(date, 1);
}
