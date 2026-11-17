import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FolderX } from "lucide-react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("shows the title, the text and any action passed in", () => {
    render(
      <EmptyState icon={FolderX} title="No rooms yet" text="Create your first room.">
        <button>Create room</button>
      </EmptyState>
    );
    expect(screen.getByText("No rooms yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first room.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
  });
});