import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import * as authService from "../services/authService";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.loadSession());

  // On startup, confirm the saved token is still valid
  useEffect(() => {
    const saved = authService.loadSession();
    if (!saved) return;

    authService.getMe(saved.token).catch((err) => {
      // Only log out when the server says the token is bad.
      // If the server is just offline, keep the session.
      if (err.status === 401) {
        authService.clearSession();
        setSession(null);
      }
    });
  }, []);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    authService.saveSession(result);
    setSession(result);
    return result.user;
  };

  const register = async (data) => {
    const result = await authService.register(data);
    authService.saveSession(result);
    setSession(result);
    return result.user;
  };

  const logout = () => {
    authService.clearSession();
    setSession(null);
  };

  const value = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}