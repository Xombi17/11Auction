"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const DEFAULT_TEAMS = "Mumbai Indians, Chennai Super Kings, Royal Challengers Bengaluru, Kolkata Knight Riders";

const DEFAULT_PLAYERS = `Virat Kohli, Batsman, 200
Jasprit Bumrah, Bowler, 200
MS Dhoni, Wicketkeeper, 200
Ravindra Jadeja, All-rounder, 150
Suryakumar Yadav, Batsman, 150
Hardik Pandya, All-rounder, 150
Rashid Khan, Bowler, 150
Heinrich Klaasen, Wicketkeeper, 150`;

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [defaultPurse, setDefaultPurse] = useState(10000); // 100 Crore in Lakhs
  const [squadSizeCap, setSquadSizeCap] = useState(18);
  const [timerSeconds, setTimerSeconds] = useState(15);
  
  // Teams inputs
  const [teamsText, setTeamsText] = useState(DEFAULT_TEAMS);
  // Players inputs
  const [playersText, setPlayersText] = useState(DEFAULT_PLAYERS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Parse teams
      const teamList = teamsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((name) => ({ name }));

      if (teamList.length === 0) {
        throw new Error("At least one team is required");
      }

      // Parse players (CSV format: Name, Category, Base Price)
      const playerList = playersText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split(",");
          if (parts.length < 3) {
            throw new Error(`Invalid player format on line: "${line}". Format: Name, Category, BasePrice`);
          }
          const basePrice = parseInt(parts[2].trim(), 10);
          if (isNaN(basePrice) || basePrice <= 0) {
            throw new Error(`Invalid base price on line: "${line}"`);
          }
          return {
            name: parts[0].trim(),
            category: parts[1].trim(),
            basePrice,
          };
        });

      if (playerList.length === 0) {
        throw new Error("At least one player is required in the pool");
      }

      const body = {
        name,
        defaultPurse,
        squadSizeCap,
        timerSeconds,
        incrementRule: [
          { threshold: 0, increment: 5 },     // +5 lakhs below 100 lakhs
          { threshold: 100, increment: 10 },  // +10 lakhs above 100 lakhs
          { threshold: 500, increment: 20 },  // +20 lakhs above 500 lakhs
        ],
        teams: teamList,
        players: playerList,
      };

      const data = await apiRequest("/api/rooms", "POST", body);
      if (data.ok) {
        router.push(`/room/${data.room.code}/lobby`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full flex-1">
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Auction Room</h1>
      <p className="text-slate-400 mb-8">Configure your room settings, teams, and player draft pool.</p>

      {error && <p className="text-red-400 bg-red-950/40 border border-red-900 px-4 py-3 rounded-lg mb-6">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">Room Basics</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Room Name</label>
            <input
              type="text"
              placeholder="e.g. IPL 2026 Mega Auction"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Default Purse (Lakhs)</label>
              <input
                type="number"
                value={defaultPurse}
                onChange={(e) => setDefaultPurse(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-xs text-slate-500">e.g. 10000 = ₹100 Crore</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Squad Size Cap</label>
              <input
                type="number"
                value={squadSizeCap}
                onChange={(e) => setSquadSizeCap(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Bid Timer (seconds)</label>
              <input
                type="number"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">Teams List</h2>
          <p className="text-xs text-slate-400">Comma-separated list of team names.</p>
          <textarea
            rows={2}
            value={teamsText}
            onChange={(e) => setTeamsText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-sm"
            required
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">Players Draft Pool</h2>
          <p className="text-xs text-slate-400">One player per line. Format: Name, Category, Base Price (in Lakhs)</p>
          <textarea
            rows={8}
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-sm"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Creating Room..." : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
