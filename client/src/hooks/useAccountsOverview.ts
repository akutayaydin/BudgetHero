import { useQuery } from "@tanstack/react-query";
import { AccountsOverviewResponse } from "@/types/accounts";

// Query key for grouped account data.
export const accountsOverviewQueryKey = ["accounts", "overview"] as const;

/**
 * Fetches grouped account overview data.
 */
export function useAccountsOverview() {
  return useQuery<AccountsOverviewResponse>({
    queryKey: accountsOverviewQueryKey,
  });
}
