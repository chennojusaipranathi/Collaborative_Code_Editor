import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/authContext";
import ProtectedRoute from "./ProtectedRoute";

// Shows where the visitor was trying to go, which the login page uses to send them back
function LoginScreen() {
  const location = useLocation();
  return <p>Login screen. Wanted: {location.state?.from}</p>;
}

function renderAt(isAuthenticated) {
  return render(
    <AuthContext.Provider value={{ isAuthenticated }}>
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <p>Secret content</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ProtectedRoute", () => {
  it("shows the page to a logged-in user", () => {
    renderAt(true);
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("sends a logged-out visitor to the login page", () => {
    renderAt(false);
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.getByText(/Login screen/)).toBeInTheDocument();
  });

  it("remembers where the visitor wanted to go", () => {
    renderAt(false);
    expect(screen.getByText("Login screen. Wanted: /secret")).toBeInTheDocument();
  });
});