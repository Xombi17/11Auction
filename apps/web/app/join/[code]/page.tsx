"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("bidstand_anon_id");
  if (!id) {
    id = "anon_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("bidstand_anon_id", id);
  }
  return id;
}

export default function JoinRoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"TEAM_OWNER" | "SPECTATOR">("TEAM_OWNER");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  useEffect(() => {
    async function loadRoomDetails() {
      try {
        const data = await apiRequest(`/api/rooms/${code}`, "GET");
        if (data.ok) {
          setRoom(data.room);
          setTeams(data.teams);
          // Set default team selection if any unclaimed teams exist
          const unclaimed = data.teams.filter((t: any) => !t.ownerParticipantId);
          if (unclaimed.length > 0) {
            setSelectedTeamId(unclaimed[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load room details");
      } finally {
        setLoading(false);
      }
    }
    loadRoomDetails();
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      const anonId = getOrCreateAnonId();
      const body = {
        displayName,
        role,
        teamId: role === "TEAM_OWNER" ? selectedTeamId : null,
        anonId,
      };

      const data = await apiRequest(`/api/rooms/${code}/join`, "POST", body);
      if (data.ok) {
        if (typeof window !== "undefined" && data.token) {
          sessionStorage.setItem(`bidstand_token_${code}`, data.token);
        }
        router.push(`/room/${code}/lobby`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to join room");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-slate-400">
        Loading room details...
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-6 py-2.5 rounded-lg transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const unclaimedTeams = teams.filter((t) => !t.ownerParticipantId);

  return (
    <div className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-3 inline-block">
            Joining Room
          </span>
          <h1 className="text-2xl font-bold text-slate-100">{room?.name}</h1>
          <p className="text-slate-400 font-mono mt-1 text-lg">Code: {code}</p>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 px-4 py-3 rounded-lg mb-6">{error}</p>}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("TEAM_OWNER")}
                className={`py-3 px-4 rounded-lg font-semibold border transition text-center flex flex-col items-center justify-center ${
                  role === "TEAM_OWNER"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-lg">🏏</span>
                <span className="text-sm mt-1">Team Owner</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("SPECTATOR")}
                className={`py-3 px-4 rounded-lg font-semibold border transition text-center flex flex-col items-center justify-center ${
                  role === "SPECTATOR"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-lg">👀</span>
                <span className="text-sm mt-1">Spectator</span>
              </button>
            </div>
          </div>

          {role === "TEAM_OWNER" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Claim Franchise / Team</label>
              {unclaimedTeams.length === 0 ? (
                <p className="text-yellow-500 text-sm bg-yellow-950/40 border border-yellow-900 px-4 py-3 rounded-lg">
                  All teams are already claimed. You can only join as a Spectator.
                </p>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                >
                  {unclaimedTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitLoading || (role === "TEAM_OWNER" && unclaimedTeams.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {submitLoading ? "Joining..." : "Enter Lobby"}
          </button>
        </form>
      </div>
    </div>
  );
}
