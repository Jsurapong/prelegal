import React from "react";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../lib/auth-context";

// A simple consumer component that exposes auth state
function AuthConsumer() {
  const { token, email, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="email">{email ?? "null"}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <button onClick={() => login("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.abc")}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated when no token in localStorage", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("null");
  });

  it("reads token from localStorage on mount", () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdG9yZWRAZXhhbXBsZS5jb20ifQ.xyz";
    localStorage.setItem("token", fakeToken);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    // useEffect runs async, so check after it fires
    expect(screen.getByTestId("token").textContent).not.toBe("null");
  });

  it("login sets token and email", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("Login").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    expect(localStorage.getItem("token")).toBeTruthy();
  });

  it("logout clears token and email", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("Login").click();
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("true");

    act(() => {
      screen.getByText("Logout").click();
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(localStorage.getItem("token")).toBeNull();
  });
});
