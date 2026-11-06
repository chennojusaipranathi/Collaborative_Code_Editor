const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// One helper for every backend call. Later services reuse it.
export async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when the server cannot be reached at all
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Expired or invalid token on a protected request: clear it and go to login
    if (response.status === 401 && token) {
      localStorage.removeItem("codesync-session");
      window.location.assign("/login");
    }
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getHealth() {
  return request("/api/health");
}