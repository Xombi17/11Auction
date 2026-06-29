"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Zap, X, ArrowRight, Gavel, Users, Radio } from "lucide-react";

type AuthMode = "login" | "signup";

export default function LandingPage() {
  const router = useRouter();

  // Dialog refs
  const joinDialogRef = useRef<HTMLDialogElement>(null);
  const authDialogRef = useRef<HTMLDialogElement>(null);

  // Join form state
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Demo state
  const [demoLoading, setDemoLoading] = useState(false);

  const { showToast } = useToast();

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const data = await apiRequest("/api/demo/room", "POST");
      if (data.ok) {
        router.push(`/room/${data.room.code}/lobby`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create demo room";
      showToast({ type: "error", title: message });
    } finally {
      setDemoLoading(false);
    }
  };

  const openJoin = () => {
    setJoinError("");
    joinDialogRef.current?.showModal();
  };

  const closeJoin = () => {
    joinDialogRef.current?.close();
  };

  const openAuth = (mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthError("");
    authDialogRef.current?.showModal();
  };

  const closeAuth = () => {
    authDialogRef.current?.close();
  };

  const validateRoomCode = (code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return "Room code is required";
    if (cleaned.length !== 6) return "Room code must be exactly 6 characters";
    if (!/^[A-Z0-9]+$/.test(cleaned)) return "Room code must be letters and numbers only";
    return "";
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateRoomCode(roomCode);
    if (error) {
      setJoinError(error);
      return;
    }

    setJoinError("");
    setJoinLoading(true);

    try {
      const code = roomCode.trim().toUpperCase();
      const data = await apiRequest(`/api/rooms/${code}`, "GET");
      if (data.ok) {
        router.push(`/join/${code}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Room not found";
      setJoinError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const validateAuth = () => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (authMode === "signup" && !name.trim()) return "Name is required";
    return "";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateAuth();
    if (error) {
      setAuthError(error);
      return;
    }

    setAuthError("");
    setAuthLoading(true);

    try {
      const payload = authMode === "login"
        ? { email, password }
        : { email, password, name };
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const data = await apiRequest(endpoint, "POST", payload);
      if (data.ok) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
    setAuthError("");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0B0F17] text-[#F4F6FA]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#F5B83D]/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-[#262E40]/60 bg-[#0B0F17]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center size-9 rounded-lg bg-[#F5B83D] text-[#0B0F17]">
              <Gavel className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-display)]">BIDSTAND</span>
          </a>
          <nav className="flex items-center gap-3">
            <button
              onClick={() => openAuth("login")}
              className="hidden sm:inline-flex h-10 px-4 items-center justify-center rounded-lg text-sm font-medium text-[#9AA4B8] hover:text-[#F4F6FA] transition-colors"
            >
              Commissioner Login
            </button>
            <button
              onClick={openJoin}
              className="inline-flex h-10 px-4 items-center justify-center rounded-lg text-sm font-medium bg-[#F5B83D] text-[#0B0F17] hover:bg-[#F5B83D]/90 transition-colors"
            >
              Join Room
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B2233] border border-[#262E40] text-[#F5B83D] text-xs font-medium uppercase tracking-wider mb-8">
            <Radio className="size-3.5" aria-hidden="true" />
            Live Player Auctions
          </div>

          <h1 className="text-balance text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6 font-[family-name:var(--font-display)]">
            Run realtime auctions <br className="hidden sm:block" />
            that <span className="text-[#F5B83D]">feel alive</span>.
          </h1>

          <p className="text-pretty text-lg sm:text-xl text-[#9AA4B8] max-w-2xl mx-auto mb-12 leading-relaxed">
            Commissioners set the room. Team owners bid live. Spectators watch every
            hammer drop in perfect sync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openJoin}
              className="w-full sm:w-auto inline-flex h-14 px-8 items-center justify-center gap-2 rounded-xl bg-[#F5B83D] text-[#0B0F17] text-lg font-bold hover:bg-[#F5B83D]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            >
              <Users className="size-5" aria-hidden="true" />
              Join a Room
            </button>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto inline-flex h-14 px-8 items-center justify-center gap-2 rounded-xl bg-[#1B2233] border border-[#262E40] text-[#F4F6FA] text-lg font-bold hover:bg-[#262E40] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            >
              <Zap className="size-5" aria-hidden="true" />
              Try Demo Auction
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="w-full sm:w-auto inline-flex h-14 px-8 items-center justify-center gap-2 rounded-xl bg-[#1B2233] border border-[#262E40] text-[#F4F6FA] text-lg font-bold hover:bg-[#262E40] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            >
              Host an Auction
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-sm text-[#5C667A]">
            No signup needed to bid. Commissioners manage rooms with a free account.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-[#262E40]/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5C667A]">
          <span className="flex items-center gap-2">
            <Zap className="size-4 text-[#F5B83D]" aria-hidden="true" />
            Bidstand
          </span>
          <span>Built for live franchise auctions.</span>
        </div>
      </footer>

      {/* Join Room Dialog */}
      <dialog
        ref={joinDialogRef}
        onClose={() => setJoinError("")}
        className="m-auto w-full max-w-md p-0 rounded-2xl bg-[#131826] border border-[#262E40] text-[#F4F6FA] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">Join a Room</h2>
              <p className="text-[#9AA4B8] text-sm mt-1">Enter the 6-character room code to enter the auction.</p>
            </div>
            <button
              type="button"
              onClick={closeJoin}
              aria-label="Close join dialog"
              className="inline-flex items-center justify-center size-9 rounded-lg text-[#9AA4B8] hover:text-[#F4F6FA] hover:bg-[#1B2233] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label htmlFor="room-code" className="block text-sm font-medium text-[#9AA4B8] mb-2">
                Room Code
              </label>
              <input
                id="room-code"
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={6}
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full h-14 px-4 rounded-xl bg-[#0B0F17] border border-[#262E40] text-center text-2xl font-medium tracking-[0.2em] uppercase font-[family-name:var(--font-mono)] tabular-nums text-[#F4F6FA] placeholder:text-[#5C667A] focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] transition-colors"
              />
            </div>

            {joinError && (
              <p className="text-sm text-[#E3564B] text-center" role="alert">
                {joinError}
              </p>
            )}

            <button
              type="submit"
              disabled={joinLoading}
              className="w-full h-14 rounded-xl bg-[#F5B83D] text-[#0B0F17] font-bold text-lg hover:bg-[#F5B83D]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131826]"
            >
              {joinLoading ? "Connecting..." : "Enter Room"}
            </button>
          </form>
        </div>
      </dialog>

      {/* Auth Dialog */}
      <dialog
        ref={authDialogRef}
        onClose={() => setAuthError("")}
        className="m-auto w-full max-w-md p-0 rounded-2xl bg-[#131826] border border-[#262E40] text-[#F4F6FA] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">
                {authMode === "login" ? "Commissioner Login" : "Create Commissioner Account"}
              </h2>
              <p className="text-[#9AA4B8] text-sm mt-1">
                {authMode === "login"
                  ? "Log in to manage your auction rooms."
                  : "Sign up to create and host auction rooms."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Close auth dialog"
              className="inline-flex items-center justify-center size-9 rounded-lg text-[#9AA4B8] hover:text-[#F4F6FA] hover:bg-[#1B2233] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {authMode === "signup" && (
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-[#9AA4B8] mb-2">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#0B0F17] border border-[#262E40] text-[#F4F6FA] placeholder:text-[#5C667A] focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-[#9AA4B8] mb-2">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#0B0F17] border border-[#262E40] text-[#F4F6FA] placeholder:text-[#5C667A] focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-[#9AA4B8] mb-2">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#0B0F17] border border-[#262E40] text-[#F4F6FA] placeholder:text-[#5C667A] focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] transition-colors"
              />
            </div>

            {authError && (
              <p className="text-sm text-[#E3564B] text-center" role="alert">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-14 rounded-xl bg-[#F5B83D] text-[#0B0F17] font-bold text-lg hover:bg-[#F5B83D]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131826]"
            >
              {authLoading
                ? "Authenticating..."
                : authMode === "login"
                  ? "Log In"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-sm text-[#9AA4B8] hover:text-[#F4F6FA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B83D] rounded"
            >
              {authMode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
