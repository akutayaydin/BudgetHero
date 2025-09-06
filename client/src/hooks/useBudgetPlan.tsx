// src/hooks/useBudgetPlan.tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertBudgetPlan, BudgetPlan } from "@shared/schema";

/**
 * GET a budget plan by month
 */
export function useBudgetPlan(month: string) {
  return useQuery({
    queryKey: ["/api/budget/plan", month],
    queryFn: async () => {
      const url = `/api/budget/plan?month=${encodeURIComponent(month)}`;
      console.log("📤 GET budget plan for month:", month);
      const res = await fetch(url, { credentials: "include" });

      console.log("📥 GET /api/budget/plan status:", res.status);

      if (res.status === 404) {
        console.warn("ℹ️ No plan found for month -> returning null");
        return null;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.error("❌ GET /api/budget/plan failed:", txt);
        throw new Error(txt || `GET ${url} failed with ${res.status}`);
      }

      const data = (await res.json()) as BudgetPlan;
      console.log("✅ GET /api/budget/plan data:", data);
      return data;
    },
  });
}

/**
 * POST create a budget plan
 * IMPORTANT: InsertBudgetPlan should include `month` so we can invalidate correctly
 */
export function useCreateBudgetPlan() {
  return useMutation({
    mutationFn: async (plan: InsertBudgetPlan) => {
      console.log("📤 Submitting new budget plan:", plan);
      const { data } = await apiRequest("/api/budget/plan", "POST", plan);
      console.log("✅ Created budget plan:", data);
      return data as BudgetPlan;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific month that was created
      console.log("♻️ Invalidating cache for month:", variables.month);
      queryClient.invalidateQueries({
        queryKey: ["/api/budget/plan", variables.month],
      });
    },
    onError: (err) => {
      console.error("❌ useCreateBudgetPlan error:", err);
    },
  });
}

/**
 * PATCH update a budget plan
 * Require both id and month for precise invalidation
 */
export function useUpdateBudgetPlan() {
  return useMutation({
    mutationFn: async (plan: Partial<InsertBudgetPlan> & { id: string; month: string }) => {
      const { id, month, ...data } = plan;
      console.log("✏️ Updating budget plan:", { id, month, data });
      const { data: updated } = await apiRequest(`/api/budget/plan/${id}`, "PATCH", data);
      console.log("✅ Updated budget plan:", updated);
      return updated as BudgetPlan;
    },
    onSuccess: (_data, variables) => {
      console.log("♻️ Invalidating cache for month:", variables.month);
      queryClient.invalidateQueries({
        queryKey: ["/api/budget/plan", variables.month],
      });
    },
    onError: (err) => {
      console.error("❌ useUpdateBudgetPlan error:", err);
    },
  });
}
