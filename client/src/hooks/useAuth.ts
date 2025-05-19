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
  
  // Login helper function
  const login = (returnPath?: string) => {
    const returnTo = returnPath || window.location.pathname;
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return {
    user,
    isLoading, 
    error,
    refreshAuth,
    login,
    isAuthenticated: !!user,
  };
}
