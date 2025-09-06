import { useQuery } from "@tanstack/react-query";
import { LastSyncedResponse } from "@/types/accounts";

// Query key for the accounts last-synced timestamp.
//export const lastSyncedQueryKey = ["accounts", "lastSynced"] as const;
export const lastSyncedQueryKey = ["/api/accounts/last-synced"] as const;

/**
 * Retrieves the timestamp of the last successful accounts sync.
 */
export function useLastSynced() {
  return useQuery<LastSyncedResponse>({
    queryKey: lastSyncedQueryKey,
  });
}
