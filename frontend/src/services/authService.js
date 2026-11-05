// MOCK auth service. In Phase 2 we replace the bodies of these functions
// with real calls to the backend. The function names and return shapes stay the same.

const STORAGE_KEY = "codesync-session";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function register({ name, email, password, role }) {
  await delay(600); // pretend the network is slow
  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }
  const user = { id: crypto.randomUUID(), name, email, role };
  return { user, token: "mock-token" };
}

export async function login({ email, password }) {
  await delay(600);
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  // Mock: any login works. The name comes from the email.
  const user = {
    id: "mock-user-1",
    name: email.split("@")[0],
    email,
    role: "student",
  };
  return { user, token: "mock-token" };
}

// Session helpers: keep the logged-in user after a page refresh
export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked: user stays logged in only until refresh
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}