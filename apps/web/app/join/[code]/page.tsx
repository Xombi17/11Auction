"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Radio, User, Eye, ArrowRight, AlertTriangle, Trophy, Users } from "lucide-react";

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
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-white/50">
        <div className="w-12 h-12 border-4 border-white/10 border-t-brand rounded-full animate-spin mb-6" />
        <p className="text-lg font-medium">Loading room details...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-danger flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Room Not Found
            </CardTitle>
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

  const unclaimedTeams = teams.filter((t) => !t.ownerParticipantId);
  const canClaimTeam = role === "TEAM_OWNER" && unclaimedTeams.length > 0;
  const isLate = room && room.status !== "LOBBY";

  return (
    <div className="relative min-h-screen bg-base text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand2/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand-light text-xs font-bold uppercase tracking-widest mb-6">
            <Radio className="w-3.5 h-3.5" />
            Joining Room
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3 font-display">
            {room?.name}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="default" className="font-mono">
              CODE: {code}
            </Badge>
            {isLate && (
              <Badge variant="warning" pulse>
                Auction in progress
              </Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-light" />
              Choose your seat
            </CardTitle>
            <CardDescription>
              Enter your display name and pick a role. No account required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm text-center font-medium mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("TEAM_OWNER")}
                    className={`py-4 px-4 rounded-2xl font-semibold border transition-all text-center flex flex-col items-center justify-center gap-2 ${
                      role === "TEAM_OWNER"
                        ? "bg-brand/10 border-brand/40 text-brand-light shadow-glow"
                        : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm">Team Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("SPECTATOR")}
                    className={`py-4 px-4 rounded-2xl font-semibold border transition-all text-center flex flex-col items-center justify-center gap-2 ${
                      role === "SPECTATOR"
                        ? "bg-brand2/10 border-brand2/40 text-brand2-light shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <Eye className="w-6 h-6" />
                    <span className="text-sm">Spectator</span>
                  </button>
                </div>
              </div>

              {role === "TEAM_OWNER" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    Claim Franchise
                  </label>
                  {unclaimedTeams.length === 0 ? (
                    <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-xl text-sm">
                      All teams are already claimed. You can only join as a Spectator.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {unclaimedTeams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => setSelectedTeamId(team.id)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedTeamId === team.id
                              ? "bg-brand/10 border-brand/40 shadow-glow"
                              : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{team.name}</span>
                            {selectedTeamId === team.id && (
                              <div className="size-5 rounded-full bg-brand flex items-center justify-center">
                                <ArrowRight className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1 block">
                            Available
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitLoading || (role === "TEAM_OWNER" && unclaimedTeams.length === 0)}
                isLoading={submitLoading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {submitLoading ? "Joining..." : "Enter Lobby"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/30">
          Joining as {role === "TEAM_OWNER" ? "a bidding team owner" : "a view-only spectator"}.
        </p>
      </div>
    </div>
  );
}
