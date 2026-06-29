"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  Radio,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  Trophy,
  Wallet,
  Clock,
  Crown,
  Play,
  Trash2,
  UserMinus,
  Gavel,
  ArrowLeft,
} from "lucide-react";

export default function LobbyPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            setIsCommissioner(decoded.role === "COMMISSIONER");
          } catch (e) {
            console.error("Error decoding token:", e);
          }

          const s = connectSocket(token);
          setSocket(s);

          s.on("connect", () => setSocketStatus("connected"));
          s.on("disconnect", () => setSocketStatus("disconnected"));

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

          s.on("room:disbanded", (data: any) => {
            sessionStorage.removeItem(`bidstand_token_${code}`);
            router.push("/");
            alert(data.message || "The auction has been disbanded by the Commissioner.");
          });

          s.on("participant:kicked", (data: any) => {
            sessionStorage.removeItem(`bidstand_token_${code}`);
            router.push("/");
            alert(data.message || "You have been kicked from the room by the Commissioner.");
          });

          s.on("error", (err: any) => {
            setError(err.message || "Realtime connection error");
          });
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load lobby details");
        }
      } finally {
        if (active) setLoading(false);
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

  const handleStartAuction = () => socket?.emit("room:start", { roomCode: code });

  const handleDisbandAuction = () => {
    if (
      socket &&
      window.confirm(
        "Are you sure you want to disband the auction? This will delete the room and all its data permanently."
      )
    ) {
      socket.emit("room:disband", { roomCode: code });
    }
  };

  const handleKickParticipant = (participantId: string, name: string) => {
    if (socket && window.confirm(`Are you sure you want to kick ${name}?`)) {
      socket.emit("participant:kick", { roomCode: code, participantId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-white/50">
        <div className="w-12 h-12 border-4 border-white/10 border-t-brand rounded-full animate-spin mb-6" />
        <p className="text-lg font-medium">Loading room lobby...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-danger">Error</CardTitle>
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

  const joinedTeamOwnersCount = teams.filter((t) => t.ownerParticipantId).length;
  const canStart = joinedTeamOwnersCount >= 2 && teams.length > 0 && (room?.players?.length || 0) > 0;

  const statusBadgeVariant =
    socketStatus === "connected" ? "sold" : socketStatus === "connecting" ? "warning" : "danger";
  const statusLabel =
    socketStatus === "connected" ? "Live" : socketStatus === "connecting" ? "Connecting" : "Disconnected";

  return (
    <div className="relative min-h-screen bg-base text-white flex flex-col w-full overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-brand2/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-base/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2.5 hover:bg-white/5 rounded-xl transition text-white/50 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">{room?.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={statusBadgeVariant} pulse={socketStatus === "connecting"}>
                  {statusLabel}
                </Badge>
                <span className="text-xs text-white/40 font-mono">LOBBY</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">
                Room Code
              </span>
              <span className="text-2xl font-mono font-bold text-white tracking-wider">{code}</span>
            </div>
            <div className="flex items-center justify-center size-12 rounded-xl bg-brand/10 border border-brand/30">
              <Radio className="w-6 h-6 text-brand-light" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-brand-light" />
                  Invite Participants
                </CardTitle>
                <CardDescription>
                  Share this link with Team Owners and Spectators so they can join the room.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 bg-black/30 border border-white/10 rounded-xl p-2 items-center">
                  <span className="text-sm text-white/70 truncate font-mono select-all px-3">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/join/${code}`
                      : `/join/${code}`}
                  </span>
                  <Button
                    variant={copySuccess ? "secondary" : "primary"}
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                    leftIcon={copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copySuccess ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-1">
                    Room Code
                  </span>
                  <span className="text-3xl font-mono font-bold text-white tracking-[0.15em]">{code}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-live" />
                  Room Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Wallet className="w-4 h-4" /> Purse per Team
                    </span>
                    <span className="font-mono font-bold text-white">
                      ₹{(room?.defaultPurse || 0) / 100} Cr
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Users className="w-4 h-4" /> Squad Limit
                    </span>
                    <span className="font-mono font-bold text-white">{room?.squadSizeCap} Players</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Clock className="w-4 h-4" /> Timer
                    </span>
                    <span className="font-mono font-bold text-white">{room?.timerSeconds}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-white/[0.08] pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-brand-light" />
                    Franchise Roster
                  </CardTitle>
                  <Badge variant="brand">
                    {joinedTeamOwnersCount} / {teams.length} Joined
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => {
                    const owner = participants.find((p) => p.id === team.ownerParticipantId);
                    const isConnected = owner?.connected;

                    return (
                      <div
                        key={team.id}
                        className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex justify-between items-center hover:border-white/20 transition"
                      >
                        <div>
                          <h4 className="font-bold text-white">{team.name}</h4>
                          <p className="text-xs text-white/40 mt-1">
                            Owner:{" "}
                            <span className="font-medium text-white/70">
                              {owner?.displayName || "Waiting for claim..."}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={team.ownerParticipantId ? (isConnected ? "sold" : "warning") : "unsold"}>
                            {team.ownerParticipantId ? (isConnected ? "Online" : "Offline") : "Open"}
                          </Badge>
                          {isCommissioner && team.ownerParticipantId && owner && (
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                              onClick={() => handleKickParticipant(owner.id, owner.displayName)}
                            >
                              Kick
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-white/[0.08] pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Radio className="w-5 h-5 text-sold" />
                  Connected Users
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex flex-wrap gap-3">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/[0.05] border border-white/[0.10] rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-2.5 text-sm"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${p.connected ? "bg-sold" : "bg-white/20"}`}
                      />
                      <span className="font-medium text-white">{p.displayName}</span>
                      <Badge variant="default" className="!px-2 !py-0.5 !text-[10px]">
                        {p.role}
                      </Badge>
                      {isCommissioner && p.role !== "COMMISSIONER" && (
                        <button
                          onClick={() => handleKickParticipant(p.id, p.displayName)}
                          className="text-white/30 hover:text-danger ml-1 transition"
                          title={`Kick ${p.displayName}`}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-white/40 text-sm">No connected participants listed.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isCommissioner && (
          <div className="mt-8 glass-panel p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center">
                <Crown className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <h4 className="font-bold text-white">Commissioner Controls</h4>
                <p className="text-xs text-white/40">
                  Start when at least 2 franchises have owners. Need {Math.max(0, 2 - joinedTeamOwnersCount)} more.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <Button
                variant="danger"
                size="md"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDisbandAuction}
              >
                Disband
              </Button>
              <Button
                size="lg"
                leftIcon={<Play className="w-5 h-5" />}
                onClick={handleStartAuction}
                disabled={!canStart}
              >
                Start Auction
              </Button>
            </div>
          </div>
        )}

        {!isCommissioner && (
          <div className="mt-8 glass-panel p-8 text-center">
            <Gavel className="w-10 h-10 mx-auto mb-3 text-live/70" />
            <h3 className="text-xl font-bold text-white mb-1">Waiting for the Commissioner</h3>
            <p className="text-white/50 text-sm">
              The auction will begin once the Commissioner starts the room.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
