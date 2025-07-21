import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const login = async () => {
    // Check if we're in development and Google OAuth is not configured
    try {
      const response = await fetch('/api/auth/google');
      if (response.status === 500) {
        // If Google OAuth is not configured, try dev login
        const devResponse = await fetch('/api/auth/dev-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (devResponse.ok) {
          window.location.reload();
          return;
        }
      }
    } catch (error) {
      console.log('Checking auth configuration...');
    }
    
    // Default to Google OAuth
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
}
