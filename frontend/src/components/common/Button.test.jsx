import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Button from "./Button";

describe("Button", () => {
  it("is a real button that reports clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    await userEvent.setup().click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("becomes a link when given a destination", () => {
    render(
      <MemoryRouter>
        <Button to="/dashboard">Go</Button>
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/dashboard");
  });
});