// Base URL of our backend. Vite exposes env variables via import.meta.env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Asks the backend if it is alive
export async function getHealth() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }

  return response.json();
}