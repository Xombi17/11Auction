"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function LobbyPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Realtime connection status
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function loadLobby() {
      try {
        const data = await apiRequest(`/api/rooms/${code}`, "GET");
        if (!active) return;

        if (data.ok) {
          if (data.room.status === "AUCTION" || data.room.status === "PAUSED") {
            router.push(`/room/${code}`);
            return;
          }

          setRoom(data.room);
          setTeams(data.teams);
          setParticipants(data.participants);

          // Determine token
          let token = data.token; // returned if logged in as commissioner
          if (!token && typeof window !== "undefined") {
            token = sessionStorage.getItem(`bidstand_token_${code}`);
          }

          if (!token) {
            router.push(`/join/${code}`);
            return;
          }

          // Check if user is Commissioner
          // Decode token manually to check role
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              window
                .atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const decoded = JSON.parse(jsonPayload);
            if (decoded.role === "COMMISSIONER") {
              setIsCommissioner(true);
            }
          } catch (e) {
            console.error("Error decoding token:", e);
          }

          // Connect Socket
          const s = connectSocket(token);
          setSocket(s);

          s.on("connect", () => {
            setSocketStatus("connected");
          });

          s.on("disconnect", () => {
            setSocketStatus("disconnected");
          });

          s.on("room:state", (state: any) => {
            if (state.ok) {
              setRoom(state.room);
              setTeams(state.teams);
              setParticipants(state.participants);

              if (state.room.status === "AUCTION" || state.room.status === "PAUSED") {
                router.push(`/room/${code}`);
              }
            }
          });

          socket.on("error", (err: any) => {
            setError(err.message || "Realtime connection error");
          });
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load lobby details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLobby();

    return () => {
      active = false;
      disconnectSocket();
    };
  }, [code, router]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/join/${code}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  const handleStartAuction = () => {
    if (socket) {
      socket.emit("room:start", { roomCode: code });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center text-slate-400">
        Loading room lobby...
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

  const joinedTeamOwnersCount = teams.filter((t) => t.ownerParticipantId).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 flex flex-col">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-100">{room?.name}</h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                socketStatus === "connected"
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : socketStatus === "connecting"
                  ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              ● {socketStatus === "connected" ? "Live" : socketStatus === "connecting" ? "Connecting" : "Disconnected"}
            </span>
          </div>
          <p className="text-slate-400 mt-1">Lobby Room — Waiting for owners to join</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">ROOM CODE</span>
          <span className="text-3xl font-mono font-bold text-blue-500 tracking-wider bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg">
            {code}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-1">
        {/* Left Column: Shareable Link & Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Invite Participants</h2>
            <p className="text-sm text-slate-400 mb-4">Share this link with Team Owners and Spectators so they can join the room.</p>
            <div className="flex gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 items-center justify-between">
              <span className="text-sm text-slate-300 truncate font-mono select-all px-2">
                {typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition shrink-0"
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md text-sm text-slate-400 space-y-3">
            <h3 className="font-bold text-slate-200">Room Rules</h3>
            <div className="flex justify-between">
              <span>Purse per Team:</span>
              <span className="font-mono text-slate-200">₹{(room?.defaultPurse || 0) / 100} Cr</span>
            </div>
            <div className="flex justify-between">
              <span>Squad Limit:</span>
              <span className="text-slate-200">{room?.squadSizeCap} Players</span>
            </div>
            <div className="flex justify-between">
              <span>Timer duration:</span>
              <span className="text-slate-200">{room?.timerSeconds} seconds</span>
            </div>
          </div>
        </div>

        {/* Right Column: Roster list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Franchise Teams */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-200">Franchise Roster ({joinedTeamOwnersCount} / {teams.length} Joined)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const owner = participants.find((p) => p.id === team.ownerParticipantId);
                const isConnected = owner?.connected;

                return (
                  <div
                    key={team.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-slate-200">{team.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Owner:{" "}
                        <span className="font-medium text-slate-300">
                          {owner?.displayName || "Waiting for claim..."}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          team.ownerParticipantId
                            ? isConnected
                              ? "bg-green-500"
                              : "bg-yellow-500"
                            : "bg-slate-700"
                        }`}
                        title={
                          team.ownerParticipantId
                            ? isConnected
                              ? "Connected"
                              : "Disconnected"
                            : "Unclaimed"
                        }
                      />
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        {team.ownerParticipantId
                          ? isConnected
                            ? "Online"
                            : "Offline"
                          : "Unclaimed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Spectators / All Connected list */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-800 pb-3">Connected Users</h3>
            <div className="flex flex-wrap gap-3">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 border border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm text-slate-300"
                >
                  <span className={`w-2 h-2 rounded-full ${p.connected ? "bg-green-500" : "bg-slate-700"}`} />
                  <span className="font-medium">{p.displayName}</span>
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {p.role}
                  </span>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-slate-500 text-sm">No connected participants listed.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom controls */}
      {isCommissioner && (
        <div className="mt-8 bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-lg">
          <p className="text-slate-300 text-sm">
            You are the **Commissioner** of this room. You can start the auction when you are ready.
          </p>
          <button
            onClick={handleStartAuction}
            disabled={joinedTeamOwnersCount === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-8 py-3 rounded-lg transition"
          >
            Start Auction
          </button>
        </div>
      )}
    </div>
  );
}
