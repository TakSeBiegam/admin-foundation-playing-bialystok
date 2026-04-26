"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Nieprawidłowy login, email lub hasło.");
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-brand-red flex items-center justify-center mb-4 shadow-lg shadow-red-900/40">
            <span className="text-white font-black text-2xl">GB</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Grający Białystok
          </h1>
          <p className="text-white/40 text-sm mt-1">Panel administracyjny</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Zaloguj się</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Email lub nazwa użytkownika
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-brand-yellow/60 focus:ring-1 focus:ring-brand-yellow/20 transition-colors"
                placeholder="admin@example.com lub nazwa_użytkownika"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Hasło
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 pr-11 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-brand-yellow/60 focus:ring-1 focus:ring-brand-yellow/20 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Logowanie…" : "Zaloguj się"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
