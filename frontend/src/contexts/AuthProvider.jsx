import { useState } from "react";
import { AuthContext } from "./authContext";
import * as authService from "../services/authService";

export default function AuthProvider({ children }) {
  // Read any saved session once, when the app starts
  const [session, setSession] = useState(() => authService.loadSession());

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