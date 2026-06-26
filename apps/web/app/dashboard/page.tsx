"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await apiRequest("/api/rooms", "GET");
        if (data.ok) {
          setRooms(data.rooms);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load rooms");
        // Redirect to login if unauthorized
        if (err.message?.includes("logged in") || err.message?.includes("expired")) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Commissioner Dashboard</h1>
          <p className="text-slate-400">Manage your player auction rooms.</p>
        </div>
        <Link
          href="/rooms/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          + Create Room
        </Link>
      </div>

      {error && <p className="text-red-400 mb-6 bg-red-950/40 border border-red-900 px-4 py-3 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex-1 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center py-20 px-4 text-center">
          <span className="text-4xl mb-4">🏆</span>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No Rooms Created Yet</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Get started by creating your first player auction room. Customize the purse, squad size, teams, and players.
          </p>
          <Link
            href="/rooms/new"
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Create Your First Room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-950 px-3 py-1 text-sm font-mono tracking-wider font-semibold text-blue-400 rounded border border-slate-800">
                    {room.code}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                      room.status === "LOBBY"
                        ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                        : room.status === "AUCTION"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20 animate-pulse"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2 truncate">{room.name}</h3>
                <div className="space-y-1 text-sm text-slate-400 mb-6">
                  <div className="flex justify-between">
                    <span>Teams:</span>
                    <span className="font-semibold text-slate-200">{room.teamCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Players Pool:</span>
                    <span className="font-semibold text-slate-200">{room.playerCount}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/room/${room.code}/lobby`}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg text-center transition block"
              >
                Enter Room
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
