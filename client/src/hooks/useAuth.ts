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
    // Store returnTo in session storage or pass it as a query param to the backend
    // if your /api/auth/google endpoint can handle it.
    // For simplicity, we'll assume the backend handles 'returnTo' from session if set by a prior middleware.
    sessionStorage.setItem('loginReturnTo', returnTo); 
    window.location.href = `/api/auth/google`; // Redirect to Google OAuth
  };

  // Logout helper function
  const logout = () => {
    window.location.href = '/api/logout';
  };

  // User data and authentication state from useQuery
  // The backend /api/auth/user now returns { user: User, isAuthenticated: boolean }
  const currentUser = user?.user || null;
  const isAuthenticated = !!(user && user.isAuthenticated && user.user);

  // For debugging
  if (user) {
    console.log("Auth data received from /api/auth/user:", user);
    console.log("Current user object:", currentUser);
    console.log("IsAuthenticated status:", isAuthenticated);
  }
  
  return {
    user: currentUser, // This should be the user object from your database
    isLoading, 
    error,
    refreshAuth,
    login,
    logout, // Added logout
    isAuthenticated,
  };
}
