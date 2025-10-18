"use client";

import { useDashboardUrlSync } from "@/lib/hooks/use-dashboard-url-sync";

export function DashboardStateHydrator() {
  useDashboardUrlSync();
  return null;
}
