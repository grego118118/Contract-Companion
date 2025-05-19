import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 2,
    staleTime: 15000, // 15 seconds
  });

  // Force re-fetch auth status
  const refreshAuth = () => {
    return refetch();
  };

  return {
    user,
    isLoading,
    error,
    refreshAuth,
    isAuthenticated: !!user,
  };
}
