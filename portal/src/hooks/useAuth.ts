// portal/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { authService, UserInfo } from "../services/auth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    authService.init().then((authenticated) => {
      setState({
        isLoading: false,
        isAuthenticated: authenticated,
        user: authService.getUserInfo(),
      });
    });
  }, []);

  const login = useCallback(() => {
    authService.login();
  }, []);

  const logout = useCallback(() => {
    authService.logout();
  }, []);

  const hasRole = useCallback((role: string) => {
    return authService.hasRole(role);
  }, []);

  return {
    ...state,
    login,
    logout,
    hasRole,
  };
}
