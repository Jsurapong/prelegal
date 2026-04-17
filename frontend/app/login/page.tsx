"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail ?? "Sign in failed. Please try again.");
        return;
      }

      const data = await res.json();
      if (!data.access_token) {
        setError("Sign in failed. Please try again.");
        return;
      }
      login(data.access_token);
      router.push("/");
    } catch {
      setError("Connection error. Please check the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment-texture flex flex-col">
      <header className="border-b border-navy/10 bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
            <span className="text-brass-light font-serif text-sm font-bold leading-none">P</span>
          </div>
          <span className="font-sans font-semibold text-navy tracking-tight">Prelegal</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-navy mb-2">Sign In</h1>
            <p className="font-sans text-navy/60 text-sm">Welcome back to Prelegal</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-navy/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm font-sans text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-sans font-semibold tracking-widest uppercase text-navy/60 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-navy/20 rounded-lg px-4 py-2.5 text-sm font-sans text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold tracking-widest uppercase text-navy/60 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-navy/20 rounded-lg px-4 py-2.5 text-sm font-sans text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#753991] text-white font-sans font-semibold text-sm py-3 rounded-lg hover:bg-[#5e2c75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm font-sans text-navy/50 mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-primary underline underline-offset-2 hover:text-blue-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
