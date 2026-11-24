import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InitialsAvatar, { initialsFor, colorFor } from "./InitialsAvatar";

describe("InitialsAvatar", () => {
  it("uses first and last initial", () => {
    expect(initialsFor("Ada Lovelace")).toBe("AL");
  });
  it("handles a single name", () => {
    expect(initialsFor("ada")).toBe("A");
  });
  it("falls back to U for empty names", () => {
    expect(initialsFor("")).toBe("U");
    expect(initialsFor(undefined)).toBe("U");
  });
  it("gives the same colour for the same name", () => {
    expect(colorFor("Ada Lovelace")).toBe(colorFor("Ada Lovelace"));
  });
  it("renders an accessible image role with the name", () => {
    render(<InitialsAvatar name="Ada Lovelace" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" }).textContent).toBe("AL");
  });
});
