import { useQuery } from "@tanstack/react-query";
import { AccountsOverviewResponse } from "@/types/accounts";
import { useAuth } from "@/hooks/useAuth";

// Query key for grouped account data.
export const accountsOverviewQueryKey = ["/api/accounts/overview"] as const;

/**
 * Fetches grouped account overview data.
 */
export function useAccountsOverview() {
  const { user } = useAuth();
  
  return useQuery<AccountsOverviewResponse>({
    queryKey: accountsOverviewQueryKey,
    enabled: !!user, // Only run query when user is authenticated
  });
}
