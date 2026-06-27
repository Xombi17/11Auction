"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export default function LiveAuctionPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Socket & Auth state
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [role, setRole] = useState<"COMMISSIONER" | "TEAM_OWNER" | "SPECTATOR" | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string>("");
  const [socket, setSocket] = useState<any>(null);

  // Timer & Bidding state
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState("");

  // Resolution banners/overlays
  const [resolutionOverlay, setResolutionOverlay] = useState<{
    show: boolean;
    outcome: "SOLD" | "UNSOLD" | "";
    playerName: string;
    teamName?: string;
    price?: number;
  }>({ show: false, outcome: "", playerName: "" });

  const prevItemRef = useRef<any>(null);

  // Load Room and Initialize Socket
  useEffect(() => {
    let active = true;

    async function loadRoom() {
      try {
        const data = await apiRequest(`/api/rooms/${code}`, "GET");
        if (!active) return;

        if (data.ok) {
          setRoom(data.room);
          setTeams(data.teams);
          setParticipants(data.participants);

          let token = data.token;
          if (!token && typeof window !== "undefined") {
            token = sessionStorage.getItem(`bidstand_token_${code}`);
          }

          if (!token) {
            router.push(`/join/${code}`);
            return;
          }

          // Decode JWT to extract role & identity
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
            setRole(decoded.role);
            setTeamId(decoded.teamId || null);
            setParticipantId(decoded.participantId);
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
              // Handle Redirects based on status
              if (state.room.status === "LOBBY") {
                router.push(`/room/${code}/lobby`);
                return;
              }
              if (state.room.status === "COMPLETED") {
                router.push(`/room/${code}/results`);
                return;
              }

              // Detect item transitions to trigger SOLD/UNSOLD visual banners
              const prevItem = prevItemRef.current;
              const nextItem = state.room.currentItem;

              if (prevItem && (!nextItem || prevItem.id !== nextItem.id)) {
                // Determine resolution
                const lastBid = prevItem.bids?.[0];
                const outcome = lastBid ? "SOLD" : "UNSOLD";
                const teamName = lastBid ? lastBid.teamName : undefined;
                const price = lastBid ? lastBid.amount : undefined;

                setResolutionOverlay({
                  show: true,
                  outcome,
                  playerName: prevItem.name,
                  teamName,
                  price
                });

                setTimeout(() => {
                  setResolutionOverlay({ show: false, outcome: "", playerName: "" });
                }, 3500);
              }

              prevItemRef.current = nextItem;
              setRoom(state.room);
              setTeams(state.teams);
              setParticipants(state.participants);
            }
          });

          s.on("bid:rejected", (err: any) => {
            setBidError(err.reason || "Bid was rejected");
            setIsBidding(false);
            setTimeout(() => setBidError(""), 3000);
          });

          s.on("bid:accepted", () => {
            setIsBidding(false);
          });

          s.on("error", (err: any) => {
            setError(err.message || "Realtime connection error");
          });
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load room details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      active = false;
      disconnectSocket();
    };
  }, [code, router]);

  // Timer Countdown loop
  useEffect(() => {
    if (!room || room.status !== "AUCTION" || !room.timerEndsAt) {
      setSecondsRemaining(room?.timerSeconds ?? 15);
      return;
    }

    const interval = setInterval(() => {
      const endsAt = new Date(room.timerEndsAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setSecondsRemaining(remaining);
    }, 200);

    return () => clearInterval(interval);
  }, [room?.timerEndsAt, room?.status, room?.timerSeconds]);

  // Next bid increment logic
  const getIncrementForPrice = (price: number, incrementRule: any) => {
    let rules = incrementRule;
    if (typeof rules === "string") {
      try {
        rules = JSON.parse(rules);
      } catch (e) {
        rules = [];
      }
    }
    if (!Array.isArray(rules) || rules.length === 0) {
      rules = [
        { threshold: 0, increment: 5 },
        { threshold: 100, increment: 10 }
      ];
    }
    const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
    for (const tier of sorted) {
      if (price >= tier.threshold) {
        return tier.increment;
      }
    }
    return 5;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center text-slate-400">
        Entering live auction room...
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

  const currentItem = room?.currentItem;
  const bids = currentItem?.bids || [];
  const highestBid = bids[0] || null;
  const currentPrice = highestBid ? highestBid.amount : (currentItem?.basePrice || 0);

  // Pre-calculate next bid
  const nextBidAmount = highestBid
    ? currentPrice + getIncrementForPrice(currentPrice, room?.incrementRule)
    : currentItem?.basePrice || 0;

  // Validate bid buttons
  const myTeam = teams.find((t) => t.id === teamId);
  const purseRemaining = myTeam ? myTeam.purseRemaining : 0;

  // Caps Validation
  const hasPurse = purseRemaining >= nextBidAmount;
  
  // Squad Size Validation
  const mySquadSize = myTeam?.players ? myTeam.players.length : 0;
  const underSquadCap = mySquadSize < (room?.squadSizeCap ?? 18);

  // Category Role Cap Validation
  let underRoleCap = true;
  if (myTeam && currentItem && room?.roleCaps) {
    const caps = typeof room.roleCaps === "string" ? JSON.parse(room.roleCaps) : room.roleCaps;
    const playerRole = currentItem.category;
    const categoryCap = caps[playerRole];
    if (categoryCap) {
      const categoryCount = myTeam.players ? myTeam.players.filter((p: any) => p.category === playerRole).length : 0;
      underRoleCap = categoryCount < categoryCap.max;
    }
  }

  const canPlaceBid =
    role === "TEAM_OWNER" &&
    room?.status === "AUCTION" &&
    currentItem &&
    hasPurse &&
    underSquadCap &&
    underRoleCap &&
    secondsRemaining > 0;

  const handlePlaceBid = () => {
    if (!socket || !currentItem || !teamId || !canPlaceBid) return;
    setIsBidding(true);
    socket.emit("bid:place", {
      roomCode: code,
      itemId: currentItem.id,
      teamId,
      amount: nextBidAmount
    });
  };

  // Commissioner Controls handlers
  const handlePause = () => {
    if (socket && role === "COMMISSIONER") {
      socket.emit("room:pause", { roomCode: code });
    }
  };

  const handleResume = () => {
    if (socket && role === "COMMISSIONER") {
      socket.emit("room:resume", { roomCode: code });
    }
  };

  const handleForceResolve = (outcome: "SOLD" | "UNSOLD") => {
    if (socket && role === "COMMISSIONER") {
      socket.emit("room:force-resolve", { roomCode: code, outcome });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full">
      {/* Disconnected Alert Banner */}
      {socketStatus !== "connected" && (
        <div className="w-full bg-red-600 text-white text-center py-2 text-sm font-semibold tracking-wider animate-pulse flex justify-center items-center gap-2 z-50">
          <span>⚠️ Websocket Connection Lost. Reconnecting to stadium servers...</span>
        </div>
      )}

      {/* SOLD / UNSOLD Banners */}
      {resolutionOverlay.show && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center p-8 max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl scale-up">
            <span
              className={`text-6xl font-extrabold tracking-widest uppercase block mb-4 ${
                resolutionOverlay.outcome === "SOLD" ? "text-green-500" : "text-slate-400"
              }`}
            >
              {resolutionOverlay.outcome}
            </span>
            <h2 className="text-3xl font-bold mb-2">{resolutionOverlay.playerName}</h2>
            {resolutionOverlay.outcome === "SOLD" ? (
              <p className="text-xl text-slate-300">
                Won by <span className="font-bold text-blue-400">{resolutionOverlay.teamName}</span> for{" "}
                <span className="font-mono font-bold text-green-400">
                  ₹{(resolutionOverlay.price! / 100).toFixed(2)} Cr
                </span>
              </p>
            ) : (
              <p className="text-xl text-slate-400">Player goes unsold this round.</p>
            )}
          </div>
        </div>
      )}

      {/* Top Zone: Team Purse Strip */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 shadow-md w-full">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{room?.name}</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  room?.status === "AUCTION"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : room?.status === "PAUSED"
                    ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
              >
                ● {room?.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Live Scoreboard</p>
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-none flex gap-4 px-4 justify-end">
            {teams.map((team) => {
              const remainingPct = (team.purseRemaining / team.purseTotal) * 100;
              const isMyTeam = team.id === teamId;

              return (
                <div
                  key={team.id}
                  className={`flex flex-col min-w-[180px] p-2.5 rounded-lg border transition ${
                    isMyTeam
                      ? "bg-blue-950/20 border-blue-500/50"
                      : "bg-slate-950/40 border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-300 truncate max-w-[100px]">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(team.players || []).length}/{room?.squadSizeCap}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-100 mt-1">
                    ₹{(team.purseRemaining / 100).toFixed(2)} Cr
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        remainingPct > 50
                          ? "bg-green-500"
                          : remainingPct > 20
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${remainingPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Zone */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        
        {/* Left 2 Columns: Player Card & Bidding Controls */}
        <div className="xl:col-span-2 flex flex-col justify-between space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex-1 flex flex-col md:flex-row gap-8 items-center shadow-lg relative overflow-hidden">
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-500/5 rounded-full blur-3xl" />

            {/* Player Image / Graphic */}
            <div className="w-full md:w-64 h-64 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-600 relative shrink-0">
              {currentItem?.imageUrl ? (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-5xl mb-2 block">🏏</span>
                  <span className="text-xs uppercase tracking-widest text-slate-500">Player Card</span>
                </div>
              )}
            </div>

            {/* Player Details & Prices */}
            <div className="flex-1 space-y-6 w-full text-center md:text-left">
              <div>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
                  {currentItem?.category || "No active player"}
                </span>
                <h2 className="text-4xl font-extrabold text-slate-100 mt-3 tracking-tight">
                  {currentItem?.name || "Waiting for Commissioner"}
                </h2>
              </div>

              {currentItem && (
                <div className="grid grid-cols-2 gap-6 bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Base Price</span>
                    <p className="text-2xl font-mono font-bold text-slate-300 mt-1">
                      ₹{(currentItem.basePrice / 100).toFixed(2)} Cr
                    </p>
                    <span className="text-[10px] text-slate-500">({currentItem.basePrice} Lakhs)</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Current Bid</span>
                    <p className="text-2xl font-mono font-bold text-green-400 mt-1">
                      ₹{(currentPrice / 100).toFixed(2)} Cr
                    </p>
                    <span className="text-xs text-slate-400 truncate block">
                      {highestBid ? `By ${highestBid.teamName}` : "No bids placed yet"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown circular ring */}
            {currentItem && room?.status === "AUCTION" && (
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    className="text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    className="text-blue-500 transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={
                      (2 * Math.PI * 52) * (1 - secondsRemaining / room.timerSeconds)
                    }
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-mono font-extrabold">{secondsRemaining}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Secs</span>
                </div>
              </div>
            )}
          </div>

          {/* Bidding Controls Zone */}
          {currentItem && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              {role === "TEAM_OWNER" ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">
                      Your Team: <span className="font-bold text-slate-200">{myTeam?.name}</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      Purse Left: ₹{(purseRemaining / 100).toFixed(2)} Cr
                    </span>
                  </div>

                  {bidError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm text-center">
                      {bidError}
                    </div>
                  )}

                  <button
                    onClick={handlePlaceBid}
                    disabled={!canPlaceBid || isBidding}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xl py-5 rounded-xl transition-all shadow-lg active:scale-[0.99] flex flex-col items-center justify-center"
                  >
                    <span>
                      {isBidding ? "Submitting Bid..." : `Place Bid: ₹${(nextBidAmount / 100).toFixed(2)} Cr`}
                    </span>
                    <span className="text-xs font-normal opacity-80 mt-1">
                      (Next Minimum: {nextBidAmount} Lakhs)
                    </span>
                  </button>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 mt-2">
                    <div className={`p-2 rounded border ${hasPurse ? 'border-slate-800' : 'border-red-500 bg-red-500/5 text-red-400'}`}>
                      {hasPurse ? "✓ Sufficient Purse" : "✗ Insufficient Purse"}
                    </div>
                    <div className={`p-2 rounded border ${underSquadCap ? 'border-slate-800' : 'border-red-500 bg-red-500/5 text-red-400'}`}>
                      {underSquadCap ? `✓ Squad slots (${mySquadSize}/${room?.squadSizeCap})` : "✗ Squad size cap reached"}
                    </div>
                    <div className={`p-2 rounded border ${underRoleCap ? 'border-slate-800' : 'border-red-500 bg-red-500/5 text-red-400'}`}>
                      {underRoleCap ? "✓ Category quota" : "✗ Category quota exceeded"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  {role === "COMMISSIONER"
                    ? "You are logged in as the Commissioner. Bidding controls are only available to Team Owners."
                    : "You are spectating this room. Bidding controls are view-only."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Bid History Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col h-[500px] xl:h-auto">
          <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <span>Bid History</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              {bids.length} bid(s)
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {bids.map((bid: any) => (
              <div
                key={bid.id}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex justify-between items-center animate-slide-up"
              >
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{bid.teamName}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(bid.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-green-400">
                  ₹{(bid.amount / 100).toFixed(2)} Cr
                </span>
              </div>
            ))}
            {bids.length === 0 && (
              <div className="h-full flex items-center justify-center text-center text-slate-600">
                <div>
                  <span className="text-4xl block mb-2">⚖️</span>
                  <p className="text-sm">No bids placed yet for this player.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Zone: Commissioner Control Console */}
      {role === "COMMISSIONER" && (
        <div className="bg-slate-900 border-t border-slate-800 p-6 w-full shadow-lg">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-200">Commissioner Command Center</h4>
              <p className="text-xs text-slate-500 mt-0.5">Manage live auction session timers and manual resolutions.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {room?.status === "AUCTION" ? (
                <button
                  onClick={handlePause}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition"
                >
                  Pause Timer
                </button>
              ) : room?.status === "PAUSED" ? (
                <button
                  onClick={handleResume}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition"
                >
                  Resume Timer
                </button>
              ) : null}

              {currentItem && (
                <>
                  <button
                    onClick={() => handleForceResolve("SOLD")}
                    disabled={bids.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition"
                  >
                    Force Sold
                  </button>
                  <button
                    onClick={() => handleForceResolve("UNSOLD")}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition"
                  >
                    Force Unsold
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
