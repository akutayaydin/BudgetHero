import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error(`Auth check failed: ${response.status}`);
      }
      return response.json();
    },
  });

  console.log("Auth state:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}