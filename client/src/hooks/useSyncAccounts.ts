import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { accountsOverviewQueryKey } from "./useAccountsOverview";
import { lastSyncedQueryKey } from "./useLastSynced";

/**
 * Triggers an accounts sync and invalidates related queries on success.
 */
export function useSyncAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    //mutationFn: () => apiRequest("/api/accounts/sync", "POST"),
    mutationFn: () => apiRequest("/api/accounts/sync-all", "POST"),
    onSuccess: () => {
      // Refetch account lists, transactions, grouped data, and last-sync timestamp after a successful sync.
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: accountsOverviewQueryKey });
      queryClient.invalidateQueries({ queryKey: lastSyncedQueryKey });
    },
  });
}
