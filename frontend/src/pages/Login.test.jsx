import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import ThemeProvider from "../contexts/ThemeProvider";
import Login from "./Login";

function renderLogin(login) {
  return render(
    <ThemeProvider>
      <AuthContext.Provider value={{ login, isAuthenticated: false }}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<p>Dashboard page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

const fill = async (user, email, password) => {
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
};

describe("Login page", () => {
  it("explains what is wrong and does not call the server when the form is empty", async () => {
    const login = vi.fn();
    const user = userEvent.setup();
    renderLogin(login);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and goes to the dashboard", async () => {
    const login = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderLogin(login);

    await fill(user, "asha@college.edu", "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith({ email: "asha@college.edu", password: "secret123" });
    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("shows the server's message and stays on the page when login fails", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();
    renderLogin(login);

    await fill(user, "asha@college.edu", "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
  });
});