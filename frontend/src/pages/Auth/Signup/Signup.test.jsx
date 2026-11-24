import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const signUp = vi.fn(async () => ({}));
vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    signUp,
    confirmSignUp: vi.fn(),
    resendCode: vi.fn(),
    signIn: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithMicrosoft: vi.fn(),
    socialLoginEnabled: false,
  }),
}));
vi.mock("../../../api/client", () => ({ api: { put: vi.fn(), get: vi.fn() } }));
vi.mock("../../../components/canvas/AuthNetworkCanvas", () => ({ default: () => null }));
vi.mock("../../../components/auth/AuthNestAccent", () => ({ default: () => null }));

import Signup from "./Signup";

const fill = () => {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(document.getElementById("su-password"), { target: { value: "Passw0rd!" } });
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Create account" }));

describe("Signup consent", () => {
  beforeEach(() => {
    cleanup();
    signUp.mockClear();
    render(<MemoryRouter><Signup /></MemoryRouter>);
  });

  it("blocks sign-up and shows an alert when consent is unchecked", () => {
    fill();
    submit();
    expect(screen.getByRole("alert").textContent).toMatch(/18 or older/);
    expect(signUp).not.toHaveBeenCalled();
    const box = screen.getByLabelText(/I am 18 or older/);
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(box.getAttribute("aria-describedby")).toBe("su-consent-error");
  });

  it("signs up once when consent is checked", async () => {
    fill();
    fireEvent.click(screen.getByLabelText(/I am 18 or older/));
    submit();
    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
  });

  it("links to the Terms and Privacy pages", () => {
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")).toBe("/privacy");
  });
});
