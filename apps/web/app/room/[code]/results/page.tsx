"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { Trophy, Users, HelpCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function ResultsPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);

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

  // Handle active socket connection if room is not COMPLETED
  useEffect(() => {
    if (!data || data.room?.status === "COMPLETED") {
      disconnectSocket();
      return;
    }

    // Try to get token to connect socket for real-time completion
    let token = sessionStorage.getItem(`bidstand_token_${code}`);
    if (!token) {
      // Fallback: poll every 3 seconds if there is no token (spectator / anonymous viewer without token)
      const interval = setInterval(() => {
        fetchResults();
      }, 3000);
      return () => clearInterval(interval);
    }

    const s = connectSocket(token);
    setSocket(s);

    s.on("room:state", (state: any) => {
      if (state.ok && state.room.status === "COMPLETED") {
        fetchResults();
        disconnectSocket();
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [data, code, fetchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin text-amber-500 w-10 h-10 mb-4" />
        <p className="text-lg">Calculating squad rosters & remaining purses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center px-4">
        <div className="bg-[#131826] border border-[#262E40] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Results</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#1B2233] hover:bg-[#262E40] text-slate-100 py-3 rounded-xl transition font-semibold"
          >
            Go back Home
          </button>
        </div>
      </div>
    );
  }

  const { room, teams = [], unsoldPlayers = [] } = data || {};

  if (room && room.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center px-4">
        <div className="bg-[#131826] border border-amber-500/30 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 animate-pulse" />
          <Loader2 className="animate-spin text-amber-500 w-12 h-12 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Auction Wrapping Up...</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            The live auction room is currently active. Once the Commissioner concludes the last item, this page will automatically update with final results and squads.
          </p>
          <button
            onClick={() => router.push(`/room/${code}`)}
            className="bg-amber-500 hover:bg-amber-600 text-[#0B0F17] font-bold px-6 py-3 rounded-xl transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Enter Live Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F4F6FA] font-sans pb-16">
      {/* Top Header Section */}
      <header className="border-b border-[#262E40] bg-[#0B0F17]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-[#131826] rounded-lg transition text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                {room?.name} Results
              </h1>
              <p className="text-xs text-slate-400 font-mono">ROOM CODE: {code}</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Auction Completed
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-12">
        {/* Team Squads Grid */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Squad Standings</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: any) => {
              const spent = team.purseTotal - team.purseRemaining;
              const spentPercent = Math.min(100, Math.max(0, (spent / team.purseTotal) * 100));
              const squadCapPercent = Math.min(100, Math.max(0, (team.players.length / (room?.squadSizeCap || 18)) * 100));

              return (
                <div
                  key={team.id}
                  className="bg-[#131826] border border-[#262E40] rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-[#262E40] pb-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-amber-400 transition">
                          {team.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Owner: {team.ownerParticipantName || "Unowned"}
                        </p>
                      </div>
                      <span className="bg-[#1B2233] text-slate-300 border border-slate-700/60 font-mono text-xs px-2.5 py-1 rounded-md font-bold">
                        {team.players.length} / {room?.squadSizeCap}
                      </span>
                    </div>

                    {/* Spend Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Purse Spent</span>
                        <span className="text-slate-200">
                          ₹{(spent / 100).toFixed(2)} Cr / ₹{(team.purseTotal / 100).toFixed(2)} Cr
                        </span>
                      </div>
                      <div className="w-full bg-[#1B2233] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${spentPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Squad Cap Indicator */}
                    <div className="space-y-2 pb-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Squad Capacity</span>
                        <span className="text-slate-200">
                          {team.players.length} / {room?.squadSizeCap} slots
                        </span>
                      </div>
                      <div className="w-full bg-[#1B2233] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${squadCapPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Squad Members */}
                    <div className="space-y-2 pt-2 border-t border-[#262E40]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Squad Rosters ({team.players.length})
                      </h4>
                      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {team.players.map((player: any) => (
                          <div
                            key={player.id}
                            className="bg-[#1B2233]/40 hover:bg-[#1B2233] border border-[#262E40]/60 hover:border-slate-700/80 rounded-xl p-2.5 flex justify-between items-center transition"
                          >
                            <div>
                              <div className="font-bold text-sm text-slate-200">{player.name}</div>
                              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {player.category}
                              </span>
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              ₹{(player.soldPrice / 100).toFixed(2)} Cr
                            </div>
                          </div>
                        ))}
                        {team.players.length === 0 && (
                          <div className="text-center py-8 text-xs text-slate-600 italic">
                            No players bought.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Unsold Players Section */}
        <section className="bg-[#131826] border border-[#262E40] rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-slate-200 border-b border-[#262E40] pb-3 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <span>Unsold Players</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-[#1B2233] px-2.5 py-0.5 rounded-md ml-2 border border-slate-700">
              {unsoldPlayers.length} Players
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unsoldPlayers.map((player: any) => (
              <div
                key={player.id}
                className="bg-[#1B2233]/40 border border-[#262E40]/70 p-3.5 rounded-xl flex justify-between items-center hover:border-slate-600 transition"
              >
                <div>
                  <div className="font-bold text-sm text-slate-300">{player.name}</div>
                  <span className="text-[9px] bg-slate-800/80 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {player.category}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Base: ₹{(player.basePrice / 100).toFixed(2)} Cr
                </div>
              </div>
            ))}
            {unsoldPlayers.length === 0 && (
              <div className="col-span-full text-center py-6 text-sm text-slate-500 italic">
                All players were successfully sold!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
