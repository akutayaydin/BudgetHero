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
    mutationFn: () => apiRequest("/api/accounts/sync", "POST"),
    onSuccess: () => {
      // Refetch account groups and last-sync timestamp after a successful sync.
      queryClient.invalidateQueries({ queryKey: accountsOverviewQueryKey });
      queryClient.invalidateQueries({ queryKey: lastSyncedQueryKey });
    },
  });
}
