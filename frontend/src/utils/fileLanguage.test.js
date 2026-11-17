import { describe, it, expect } from "vitest";
import { languageFromFileName, monacoLanguage } from "./fileLanguage";

describe("languageFromFileName", () => {
  it("maps the supported extensions", () => {
    expect(languageFromFileName("main.py")).toBe("Python");
    expect(languageFromFileName("Main.java")).toBe("Java");
    expect(languageFromFileName("solution.cpp")).toBe("C++");
    expect(languageFromFileName("app.js")).toBe("JavaScript");
    expect(languageFromFileName("app.ts")).toBe("TypeScript");
  });

  it("ignores letter case", () => {
    expect(languageFromFileName("MAIN.JS")).toBe("JavaScript");
  });

  it("falls back to plain text", () => {
    expect(languageFromFileName("notes.txt")).toBe("Plain Text");
    expect(languageFromFileName("Makefile")).toBe("Plain Text");
  });
});

describe("monacoLanguage", () => {
  it("returns the ids the editor understands", () => {
    expect(monacoLanguage("a.js")).toBe("javascript");
    expect(monacoLanguage("a.jsx")).toBe("javascript");
    expect(monacoLanguage("a.py")).toBe("python");
    expect(monacoLanguage("a.cpp")).toBe("cpp");
    expect(monacoLanguage("README.md")).toBe("markdown");
  });

  it("uses plaintext for anything unknown", () => {
    expect(monacoLanguage("data.xyz")).toBe("plaintext");
  });
});