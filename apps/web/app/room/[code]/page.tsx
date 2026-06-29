"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { CountdownRing } from "@/components/ui/CountdownRing";
import Image from "next/image";
import { initAudio, playBidSound, playWarningSound, playSoldSound, playUnsoldSound, playErrorSound } from "@/lib/sounds";
import { useToast } from "@/components/ui/Toast";
import {
  Radio,
  Users,
  Trophy,
  AlertTriangle,
  Play,
  Pause,
  Gavel,
  X,
  Crown,
  Wallet,
  UserMinus,
  Trash2,
  TrendingUp,
  Eye,
} from "lucide-react";

export default function LiveAuctionPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [role, setRole] = useState<"COMMISSIONER" | "TEAM_OWNER" | "SPECTATOR" | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string>("");
  const [socket, setSocket] = useState<any>(null);
  const { showToast } = useToast();

  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState("");
  const [showManageUsers, setShowManageUsers] = useState(false);

  const [resolutionOverlay, setResolutionOverlay] = useState<{
    show: boolean;
    outcome: "SOLD" | "UNSOLD" | "";
    playerName: string;
    teamName?: string;
    price?: number;
  }>({ show: false, outcome: "", playerName: "" });

  const prevItemRef = useRef<any>(null);
  const warningPlayedRef = useRef<Set<number>>(new Set());

  // Initialize audio on first user interaction
  useEffect(() => {
    initAudio();
  }, []);

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

          const s = connectSocket(token);
          setSocket(s);

          s.on("connect", () => setSocketStatus("connected"));
          s.on("disconnect", () => setSocketStatus("disconnected"));

          s.on("room:state", (state: any) => {
            if (state.ok) {
              if (state.room.status === "LOBBY") {
                router.push(`/room/${code}/lobby`);
                return;
              }
              if (state.room.status === "COMPLETED") {
                router.push(`/room/${code}/results`);
                return;
              }

              const prevItem = prevItemRef.current;
              const nextItem = state.room.currentItem;

              if (prevItem && (!nextItem || prevItem.id !== nextItem.id)) {
                const lastBid = prevItem.bids?.[0];
                const outcome = lastBid ? "SOLD" : "UNSOLD";
                setResolutionOverlay({
                  show: true,
                  outcome,
                  playerName: prevItem.name,
                  teamName: lastBid?.teamName,
                  price: lastBid?.amount,
                });

                if (outcome === "SOLD") {
                  playSoldSound();
                } else {
                  playUnsoldSound();
                }

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
            const reason = err.reason || "Bid was rejected";
            setBidError(reason);
            setIsBidding(false);
            showToast({ type: "error", title: "Bid Rejected", message: reason });
            setTimeout(() => setBidError(""), 4000);
          });

          s.on("bid:accepted", () => {
            setIsBidding(false);
            playBidSound();
          });

          s.on("room:disbanded", (data: any) => {
            sessionStorage.removeItem(`bidstand_token_${code}`);
            router.push("/");
            showToast({
              type: "warning",
              title: "Auction Disbanded",
              message: data.message || "The auction has been disbanded by the Commissioner.",
            });
          });

          s.on("participant:kicked", (data: any) => {
            sessionStorage.removeItem(`bidstand_token_${code}`);
            router.push("/");
            showToast({
              type: "error",
              title: "Kicked from Room",
              message: data.message || "You have been kicked from the room by the Commissioner.",
            });
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
        if (active) setLoading(false);
      }
    }

    loadRoom();

    return () => {
      active = false;
      disconnectSocket();
    };
  }, [code, router]);

  const roomTimerEndsAt = room?.timerEndsAt;
  const roomStatus = room?.status;
  const roomTimerSeconds = room?.timerSeconds;

  useEffect(() => {
    if (roomStatus !== "AUCTION" || !roomTimerEndsAt) {
      setSecondsRemaining(roomTimerSeconds ?? 15);
      warningPlayedRef.current.clear();
      return;
    }

    const interval = setInterval(() => {
      const endsAt = new Date(roomTimerEndsAt).getTime();
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Play warning sound at 5s, 3s, 1s
      if ([5, 3, 1].includes(remaining) && !warningPlayedRef.current.has(remaining)) {
        warningPlayedRef.current.add(remaining);
        playWarningSound();
      }
      // Clear warnings when timer resets (goes back up)
      if (remaining > 5) {
        warningPlayedRef.current.clear();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [roomTimerEndsAt, roomStatus, roomTimerSeconds]);

  const getIncrementForPrice = (price: number, incrementRule: any) => {
    let rules = incrementRule;
    if (typeof rules === "string") {
      try {
        rules = JSON.parse(rules);
      } catch {
        rules = [];
      }
    }
    if (!Array.isArray(rules) || rules.length === 0) {
      rules = [
        { threshold: 0, increment: 5 },
        { threshold: 100, increment: 10 },
      ];
    }
    const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
    for (const tier of sorted) {
      if (price >= tier.threshold) return tier.increment;
    }
    return 5;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-white/50">
        <div className="w-12 h-12 border-4 border-white/10 border-t-brand rounded-full animate-spin mb-6" />
        <p className="text-lg font-medium">Entering live auction room...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-danger">Connection Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentItem = room?.currentItem;
  const bids = currentItem?.bids || [];
  const highestBid = bids[0] || null;
  const currentPrice = highestBid ? highestBid.amount : currentItem?.basePrice || 0;
  const nextBidAmount = highestBid
    ? currentPrice + getIncrementForPrice(currentPrice, room?.incrementRule)
    : currentItem?.basePrice || 0;

  const myTeam = teams.find((t) => t.id === teamId);
  const purseRemaining = myTeam ? myTeam.purseRemaining : 0;
  const mySquadSize = myTeam?.players ? myTeam.players.length : 0;

  let underRoleCap = true;
  if (myTeam && currentItem && room?.roleCaps) {
    const caps = typeof room.roleCaps === "string" ? JSON.parse(room.roleCaps) : room.roleCaps;
    const categoryCap = caps[currentItem.category];
    if (categoryCap) {
      const categoryCount = myTeam.players
        ? myTeam.players.filter((p: any) => p.category === currentItem.category).length
        : 0;
      underRoleCap = categoryCount < categoryCap.max;
    }
  }

  const hasPurse = purseRemaining >= nextBidAmount;
  const underSquadCap = mySquadSize < (room?.squadSizeCap ?? 18);

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
      amount: nextBidAmount,
    });
  };

  const handlePause = () => socket?.emit("room:pause", { roomCode: code });
  const handleResume = () => socket?.emit("room:resume", { roomCode: code });
  const handleForceResolve = (outcome: "SOLD" | "UNSOLD") =>
    socket?.emit("room:force-resolve", { roomCode: code, outcome });

  const handleDisbandAuction = () => {
    if (!socket) return;
    showToast({
      type: "warning",
      title: "Disband Auction?",
      message: "This will delete the room and all its data permanently.",
      action: { label: "Confirm", onClick: () => socket.emit("room:disband", { roomCode: code }) },
      duration: 0, // Don't auto-dismiss
    });
  };

  const handleKickParticipant = (participantId: string, name: string) => {
    if (!socket) return;
    showToast({
      type: "warning",
      title: `Kick ${name}?`,
      action: { label: "Confirm", onClick: () => socket.emit("participant:kick", { roomCode: code, participantId }) },
      duration: 0,
    });
  };

  const statusBadgeVariant =
    room?.status === "AUCTION" ? "live" : room?.status === "PAUSED" ? "warning" : "default";

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && canPlaceBid && !isBidding) {
        e.preventDefault();
        handlePlaceBid();
      }
      if (e.code === "KeyP" && role === "COMMISSIONER") {
        e.preventDefault();
        if (room?.status === "AUCTION") handlePause();
        else if (room?.status === "PAUSED") handleResume();
      }
      if (e.code === "Escape") {
        setShowManageUsers(false);
        setResolutionOverlay({ show: false, outcome: "", playerName: "" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPlaceBid, isBidding, role, room?.status, handlePlaceBid, handlePause, handleResume]);

  return (
    <div className="relative min-h-screen bg-base text-white flex flex-col w-full overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-brand/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-brand2/5 rounded-full blur-[120px]" />
      </div>

      {/* Disconnected banner */}
      {socketStatus !== "connected" && (
        <div className="relative z-50 w-full bg-danger/20 border-b border-danger/30 text-danger px-4 py-2.5 text-center text-sm font-bold flex justify-center items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          Websocket connection lost. Reconnecting to stadium servers...
        </div>
      )}

      {/* Resolution overlay */}
      {resolutionOverlay.show && (
        <div className="fixed inset-0 bg-base/95 backdrop-blur-xl z-50 flex items-center justify-center animate-fade-in">
          <div
            className={`text-center p-10 max-w-xl w-full rounded-[2.5rem] border shadow-2xl ${
              resolutionOverlay.outcome === "SOLD"
                ? "bg-sold/5 border-sold/30 shadow-glow"
                : "bg-unsold/5 border-unsold/30"
            }`}
          >
            <span
              className={`text-7xl font-black tracking-widest uppercase block mb-4 font-display ${
                resolutionOverlay.outcome === "SOLD" ? "text-sold" : "text-unsold"
              }`}
            >
              {resolutionOverlay.outcome}
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">{resolutionOverlay.playerName}</h2>
            {resolutionOverlay.outcome === "SOLD" ? (
              <p className="text-xl text-white/70">
                Won by <span className="font-bold text-brand-light">{resolutionOverlay.teamName}</span> for{" "}
                <span className="font-mono font-bold text-sold">
                  ₹{(resolutionOverlay.price! / 100).toFixed(2)} Cr
                </span>
              </p>
            ) : (
              <p className="text-xl text-white/50">Player goes unsold this round.</p>
            )}
          </div>
        </div>
      )}

      {/* Top header */}
      <header className="relative z-10 border-b border-white/10 bg-base/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-brand to-brand2 shadow-glow">
              <Gavel className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{room?.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={statusBadgeVariant} pulse={room?.status === "AUCTION"}>
                  {room?.status}
                </Badge>
                <span className="text-xs text-white/40 font-mono">CODE: {code}</span>
                {/* Spectator count badge */}
                {participants && participants.length > 0 && (
                  <Badge variant="ghost" className="gap-1.5">
                    <Eye className="w-3 h-3" />
                    {participants.filter((p: any) => p.role === "SPECTATOR" || (p.role === "TEAM_OWNER" && !p.connected)).length} watching
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === "COMMISSIONER" && (
              <Button variant="ghost" size="sm" leftIcon={<Users className="w-4 h-4" />} onClick={() => setShowManageUsers(true)}>
                Users
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Team purse strip */}
      <div className="relative z-10 bg-surface/50 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 shrink-0 mr-2">
              Purses
            </span>
            {teams.map((team) => {
              const remainingPct = (team.purseRemaining / team.purseTotal) * 100;
              const isMyTeam = team.id === teamId;
              const squadCount = (team.players || []).length;

              return (
                <div
                  key={team.id}
                  className={`shrink-0 min-w-[190px] p-3 rounded-2xl border transition-all duration-300 ${
                    isMyTeam
                      ? "bg-brand/10 border-brand/30 shadow-glow"
                      : "bg-white/[0.03] border-white/[0.08]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[110px]">{team.name}</span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {squadCount}/{room?.squadSizeCap}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    ₹{(team.purseRemaining / 100).toFixed(2)} Cr
                  </span>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        remainingPct > 50 ? "bg-sold" : remainingPct > 20 ? "bg-live" : "bg-danger"
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

      {/* Main auction area */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        {/* Left 2 cols: player card + bid controls */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden min-h-[420px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand2/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Player image/graphic */}
            <div className="relative w-full md:w-72 h-72 bg-black/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center text-white/30 shrink-0">
              {currentItem?.imageUrl ? (
                <Image
                  src={currentItem.imageUrl}
                  alt={currentItem.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-white/20" />
                  <span className="text-xs uppercase tracking-widest font-bold text-white/40">
                    On the Block
                  </span>
                </div>
              )}
            </div>

            {/* Player details */}
            <div className="flex-1 space-y-6 w-full text-center md:text-left relative z-10">
              <div>
                <Badge variant="brand" className="mb-3">
                  {currentItem?.category || "Waiting"}
                </Badge>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
                  {currentItem?.name || "Waiting for Commissioner"}
                </h2>
              </div>

              {currentItem && (
                <div className="grid grid-cols-2 gap-4 bg-white/[0.03] border border-white/[0.08] p-5 rounded-2xl">
                  <div>
                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
                      Base Price
                    </span>
                    <p className="text-2xl font-mono font-bold text-white/70 mt-1 tabular-nums">
                      ₹{(currentItem.basePrice / 100).toFixed(2)} Cr
                    </p>
                    <span className="text-[10px] text-white/30">{currentItem.basePrice} Lakhs</span>
                  </div>
                  <div>
                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
                      Current Bid
                    </span>
                    <p className="text-2xl font-mono font-bold text-live mt-1 tabular-nums">
                      ₹{(currentPrice / 100).toFixed(2)} Cr
                    </p>
                    <span className="text-xs text-white/50 truncate block">
                      {highestBid ? `By ${highestBid.teamName}` : "No bids yet"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown */}
            {currentItem && room?.status === "AUCTION" && (
              <CountdownRing
                secondsRemaining={secondsRemaining}
                totalSeconds={room.timerSeconds}
                size={140}
                stroke={10}
                className="shrink-0"
              />
            )}

            {currentItem && room?.status === "PAUSED" && (
              <div className="shrink-0 w-36 h-36 rounded-full border-4 border-warning/30 bg-warning/10 flex flex-col items-center justify-center text-warning">
                <Pause className="w-8 h-8 mb-1" />
                <span className="text-xs font-bold uppercase tracking-widest">Paused</span>
              </div>
            )}
          </Card>

          {/* Bid controls */}
          {currentItem && (
            <Card>
              {role === "TEAM_OWNER" ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <Crown className="w-4 h-4 text-brand-light" />
                      <span>
                        Your Team: <span className="font-bold text-white">{myTeam?.name}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-white/70">
                      <Wallet className="w-4 h-4 text-sold" />
                      <span>
                        Purse Left:{" "}
                        <span className="text-white font-bold tabular-nums">
                          ₹{(purseRemaining / 100).toFixed(2)} Cr
                        </span>
                      </span>
                    </div>
                  </div>

                  {bidError && (
                    <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm text-center font-medium">
                      {bidError}
                    </div>
                  )}

                  <Button
                    variant="live"
                    size="xl"
                    className="w-full"
                    onClick={handlePlaceBid}
                    disabled={!canPlaceBid || isBidding}
                    isLoading={isBidding}
                    leftIcon={<TrendingUp className="w-5 h-5" />}
                  >
                    {isBidding
                      ? "Submitting Bid..."
                      : `Bid ₹${(nextBidAmount / 100).toFixed(2)} Cr`}
                  </Button>

                  {/* Keyboard shortcut hint */}
                  <p className="text-center text-[10px] text-white/30 uppercase tracking-wider font-mono">
                    Space to bid &bull; P to pause/resume &bull; Esc to close modals
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                    <div
                      className={`p-3 rounded-xl border ${
                        hasPurse
                          ? "border-white/10 bg-white/[0.03] text-white/60"
                          : "border-danger/30 bg-danger/10 text-danger"
                      }`}
                    >
                      {hasPurse ? "Sufficient Purse" : "Insufficient Purse"}
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        underSquadCap
                          ? "border-white/10 bg-white/[0.03] text-white/60"
                          : "border-danger/30 bg-danger/10 text-danger"
                      }`}
                    >
                      {underSquadCap ? `Squad slots (${mySquadSize}/${room?.squadSizeCap})` : "Squad cap reached"}
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        underRoleCap
                          ? "border-white/10 bg-white/[0.03] text-white/60"
                          : "border-danger/30 bg-danger/10 text-danger"
                      }`}
                    >
                      {underRoleCap ? "Category quota OK" : "Category quota exceeded"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  {role === "COMMISSIONER" ? (
                    <div className="space-y-2">
                      <Crown className="w-10 h-10 mx-auto text-brand-light/50" />
                      <p className="font-medium">You are the Commissioner.</p>
                      <p className="text-sm">Bidding controls are only available to Team Owners.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Radio className="w-10 h-10 mx-auto text-white/20" />
                      <p className="font-medium">You are spectating this room.</p>
                      <p className="text-sm">Bidding controls are view-only.</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right col: Bid history */}
        <Card className="flex flex-col h-[520px] xl:h-auto">
          <CardHeader className="pb-3 border-b border-white/[0.08]">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-brand-light" />
                Bid History
              </CardTitle>
              <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                {bids.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto scrollbar-none pt-4">
            <div className="space-y-3">
              {bids.map((bid: any) => (
                <div
                  key={bid.id}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex justify-between items-center animate-fade-in"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{bid.teamName}</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-sold tabular-nums">
                    ₹{(bid.amount / 100).toFixed(2)} Cr
                  </span>
                </div>
              ))}
              {bids.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-white/30 py-16">
                  <div>
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No bids placed yet for this player.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Commissioner controls */}
      {role === "COMMISSIONER" && (
        <div className="relative z-10 bg-surface/80 border-t border-white/10 backdrop-blur-md p-6">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h4 className="font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-brand-light" />
                Commissioner Command Center
              </h4>
              <p className="text-xs text-white/40 mt-0.5">
                Manage timers, participants, and manual resolutions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Users className="w-4 h-4" />}
                onClick={() => setShowManageUsers(true)}
              >
                Manage Users
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDisbandAuction}
              >
                Disband
              </Button>
              {room?.status === "AUCTION" ? (
                <Button
                  variant="warning"
                  size="sm"
                  leftIcon={<Pause className="w-4 h-4" />}
                  onClick={handlePause}
                >
                  Pause
                </Button>
              ) : room?.status === "PAUSED" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={handleResume}
                >
                  Resume
                </Button>
              ) : null}
              {currentItem && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Gavel className="w-4 h-4" />}
                    onClick={() => handleForceResolve("SOLD")}
                    disabled={bids.length === 0}
                  >
                    Force Sold
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<X className="w-4 h-4" />}
                    onClick={() => handleForceResolve("UNSOLD")}
                  >
                    Force Unsold
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Users Modal */}
      {showManageUsers && (
        <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md relative">
            <button
              onClick={() => setShowManageUsers(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <CardHeader>
              <CardTitle>Manage Participants</CardTitle>
              <CardDescription>Kick disconnected or disruptive users from the room.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-none">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${p.connected ? "bg-sold" : "bg-white/20"}`}
                      />
                      <div>
                        <span className="font-semibold text-white block leading-tight">{p.displayName}</span>
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">
                          {p.role} {p.connected ? "(Online)" : "(Offline)"}
                        </span>
                      </div>
                    </div>
                    {p.role !== "COMMISSIONER" && (
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                        onClick={() => handleKickParticipant(p.id, p.displayName)}
                      >
                        Kick
                      </Button>
                    )}
                  </div>
                ))}
                {participants.length <= 1 && (
                  <p className="text-white/40 text-sm text-center py-4">No other participants connected.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
