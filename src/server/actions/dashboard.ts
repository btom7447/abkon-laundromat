"use server";

import { requireSession, branchScopeFor } from "@/lib/rbac";
import { loadPeriodMetrics, type Period, type PeriodMetrics } from "@/server/queries/dashboard";

export async function getPeriodMetrics(period: Period): Promise<PeriodMetrics> {
  const user = await requireSession();
  const branchId = branchScopeFor(user, null);
  return loadPeriodMetrics({ branchId, period });
}
