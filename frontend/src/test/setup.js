import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Remove rendered components after every test so tests cannot affect each other
afterEach(() => cleanup());