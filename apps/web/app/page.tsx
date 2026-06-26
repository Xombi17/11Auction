"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  
  // Join room code state
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Commissioner login state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 6) {
      setJoinError("Room code must be exactly 6 characters");
      return;
    }
    setJoinError("");
    setJoinLoading(true);
    try {
      // Check if room exists
      const data = await apiRequest(`/api/rooms/${roomCode.toUpperCase()}`, "GET");
      if (data.ok) {
        router.push(`/join/${roomCode.toUpperCase()}`);
      }
    } catch (err: any) {
      setJoinError(err.message || "Room not found");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (isLogin) {
        const data = await apiRequest("/api/auth/login", "POST", { email, password });
        if (data.ok) {
          router.push("/dashboard");
        }
      } else {
        const data = await apiRequest("/api/auth/signup", "POST", { email, password, name });
        if (data.ok) {
          setIsLogin(true);
          setAuthError("Account created! Please log in.");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col md:flex-row gap-12 items-start justify-center flex-1">
      {/* Participant Section */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl w-full">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Join Auction Room</h2>
        <p className="text-slate-400 mb-6">Enter the 6-character room code to join as a Team Owner or Spectator.</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
            <input
              type="text"
              placeholder="e.g. ABC123"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-xl font-mono tracking-wider text-center text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>

          {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

          <button
            type="submit"
            disabled={joinLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {joinLoading ? "Checking..." : "Join Room"}
          </button>
        </form>
      </div>

      {/* Commissioner Section */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            {isLogin ? "Commissioner Login" : "Commissioner Signup"}
          </h2>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setAuthError("");
            }}
            className="text-sm text-blue-400 hover:underline"
          >
            {isLogin ? "Create Account" : "Log In"}
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Commissioner Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="name@franchise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {authError && <p className="text-blue-400 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {authLoading ? "Please wait..." : isLogin ? "Log In" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
