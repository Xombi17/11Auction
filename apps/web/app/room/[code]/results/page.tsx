"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  Trophy,
  Users,
  ArrowLeft,
  Loader2,
  Crown,
  Wallet,
  PackageOpen,
  Radio,
  Gavel,
} from "lucide-react";

export default function ResultsPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await apiRequest(`/api/rooms/${code}/results`, "GET");
      if (response.ok) {
        setData(response);
      } else {
        setError(response.message || "Failed to load results");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (!data || data.room?.status === "COMPLETED") {
      disconnectSocket();
      return;
    }

    let token = sessionStorage.getItem(`bidstand_token_${code}`);
    if (!token) {
      const interval = setInterval(() => fetchResults(), 3000);
      return () => clearInterval(interval);
    }

    const s = connectSocket(token);
    s.on("room:state", (state: any) => {
      if (state.ok && state.room.status === "COMPLETED") {
        fetchResults();
        disconnectSocket();
      }
    });

    return () => disconnectSocket();
  }, [data, code, fetchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-white/50">
        <Loader2 className="animate-spin text-brand-light w-12 h-12 mb-6" />
        <p className="text-xl font-medium">Calculating squad rosters & remaining purses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-danger">Failed to Load Results</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
              Go back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { room, teams = [], unsoldPlayers = [] } = data || {};

  if (room && room.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand2 animate-pulse" />
          <CardHeader>
            <Loader2 className="animate-spin text-brand-light w-12 h-12 mx-auto mb-4" />
            <CardTitle>Auction Wrapping Up...</CardTitle>
            <CardDescription>
              The live auction room is currently active. This page will automatically update once the Commissioner concludes the last item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="primary"
              onClick={() => router.push(`/room/${code}`)}
              leftIcon={<Radio className="w-4 h-4" />}
            >
              Enter Live Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-base text-white font-sans pb-16 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-brand2/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-base/80 backdrop-blur sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2.5 hover:bg-white/5 rounded-xl transition text-white/50 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                {room?.name} Results
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="sold">Auction Completed</Badge>
                <span className="text-xs text-white/40 font-mono">CODE: {code}</span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/room/${code}`)}
            disabled={room?.status !== "COMPLETED"}
          >
            View Room
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-10 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sold/10 border border-sold/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-sold" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Squad Standings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: any) => {
              const spent = team.purseTotal - team.purseRemaining;
              const spentPercent = Math.min(100, Math.max(0, (spent / team.purseTotal) * 100));
              const squadCapPercent = Math.min(
                100,
                Math.max(0, ((team.players || []).length / (room?.squadSizeCap || 18)) * 100)
              );

              return (
                <Card key={team.id} className="flex flex-col justify-between group">
                  <div>
                    <CardHeader className="border-b border-white/[0.08] pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <CardDescription>
                            Owner: {team.ownerParticipantName || "Unowned"}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="font-mono">
                          {(team.players || []).length} / {room?.squadSizeCap}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-white/40">Purse Spent</span>
                          <span className="text-white">
                            ₹{(spent / 100).toFixed(2)} Cr / ₹{(team.purseTotal / 100).toFixed(2)} Cr
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-brand to-brand2 h-full rounded-full transition-all duration-500"
                            style={{ width: `${spentPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-white/40">Squad Capacity</span>
                          <span className="text-white">
                            {(team.players || []).length} / {room?.squadSizeCap} slots
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-sold to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${squadCapPercent}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardContent className="pt-0">
                    <div className="mt-2 pt-4 border-t border-white/[0.08]">
                      <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                        Squad ({(team.players || []).length})
                      </h4>
                      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-none">
                        {(team.players || []).map((player: any) => (
                          <div
                            key={player.id}
                            className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 rounded-xl p-3 flex justify-between items-center transition"
                          >
                            <div>
                              <div className="font-bold text-sm text-white">{player.name}</div>
                              <Badge variant="default" className="mt-1 !px-2 !py-0.5 !text-[10px]">
                                {player.category}
                              </Badge>
                            </div>
                            <div className="text-xs font-mono font-bold text-sold tabular-nums">
                              ₹{(player.soldPrice / 100).toFixed(2)} Cr
                            </div>
                          </div>
                        ))}
                        {(team.players || []).length === 0 && (
                          <div className="text-center py-8 text-xs text-white/40 italic">
                            No players bought.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Card>
          <CardHeader className="border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-unsold/10 border border-unsold/30 flex items-center justify-center">
                <PackageOpen className="w-5 h-5 text-unsold" />
              </div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Unsold Players
                <Badge variant="unsold" className="ml-2">
                  {unsoldPlayers.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unsoldPlayers.map((player: any) => (
                <div
                  key={player.id}
                  className="bg-white/[0.03] border border-white/[0.08] p-4 rounded-2xl flex justify-between items-center hover:border-white/20 transition"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{player.name}</div>
                    <Badge variant="default" className="mt-1 !px-2 !py-0.5 !text-[10px]">
                      {player.category}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-white/40 tabular-nums">
                    ₹{(player.basePrice / 100).toFixed(2)} Cr
                  </div>
                </div>
              ))}
              {unsoldPlayers.length === 0 && (
                <div className="col-span-full text-center py-8 text-sm text-white/40 italic">
                  All players were successfully sold!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
