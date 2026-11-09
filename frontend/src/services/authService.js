// REAL auth service. Same function names as the old mock, so the pages don't change.
import { request } from "./api";

const STORAGE_KEY = "codesync-session";

export function register({ name, email, password, role }) {
  return request("/api/auth/register", { method: "POST", body: { name, email, password, role } });
}

export function login({ email, password }) {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}

// Asks the server who this token belongs to (also proves the token is still valid)
export function getMe(token) {
  return request("/api/auth/me", { token });
}

export function saveSession(session) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked: user stays logged in only until refresh
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}