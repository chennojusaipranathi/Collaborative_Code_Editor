import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input", () => {
  it("connects the label to the field", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows an error message when there is one", () => {
    render(<Input label="Email" id="email" error="Enter a valid email" />);
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
  });

  it("shows no error text when there is none", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.queryByText(/valid/i)).not.toBeInTheDocument();
  });

  it("reports every keystroke", async () => {
    const onChange = vi.fn();
    render(<Input label="Name" id="name" onChange={onChange} />);

    await userEvent.setup().type(screen.getByLabelText("Name"), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});