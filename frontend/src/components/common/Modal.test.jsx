import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("shows its title and content", () => {
    render(
      <Modal title="Share this room" onClose={() => {}}>
        <p>Body text</p>
      </Modal>
    );
    expect(screen.getByText("Share this room")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("closes with the Escape key", async () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>x</Modal>);

    await userEvent.setup().keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the close button and when the dark background is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Modal title="T" onClose={onClose}>x</Modal>);

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(container.firstChild); // the dark overlay
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does NOT close when the content inside is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        <p>Inside the box</p>
      </Modal>
    );

    await userEvent.setup().click(screen.getByText("Inside the box"));
    expect(onClose).not.toHaveBeenCalled();
  });
});