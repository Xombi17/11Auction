"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Trash2, Plus, UserPlus, Users, Sparkles, Award } from "lucide-react";

interface VisualTeam {
  id: string;
  name: string;
}

interface VisualPlayer {
  id: string;
  name: string;
  category: string;
  basePrice: number; // in Lakhs
}

const PRESET_TEAMS = [
  "Mumbai Indians",
  "Chennai Super Kings",
  "Royal Challengers Bengaluru",
  "Kolkata Knight Riders",
  "Rajasthan Royals",
  "Gujarat Titans",
  "Sunrisers Hyderabad",
  "Lucknow Super Giants"
];

const PRESET_PLAYERS = [
  { name: "Virat Kohli", category: "Batsman", basePrice: 200 },
  { name: "Jasprit Bumrah", category: "Bowler", basePrice: 200 },
  { name: "MS Dhoni", category: "Wicketkeeper", basePrice: 200 },
  { name: "Ravindra Jadeja", category: "All-rounder", basePrice: 150 },
  { name: "Suryakumar Yadav", category: "Batsman", basePrice: 150 },
  { name: "Hardik Pandya", category: "All-rounder", basePrice: 150 },
  { name: "Rashid Khan", category: "Bowler", basePrice: 150 },
  { name: "Heinrich Klaasen", category: "Wicketkeeper", basePrice: 150 },
  { name: "Rohit Sharma", category: "Batsman", basePrice: 200 },
  { name: "Mitchell Starc", category: "Bowler", basePrice: 200 },
  { name: "Nicholas Pooran", category: "Wicketkeeper", basePrice: 150 },
  { name: "Glenn Maxwell", category: "All-rounder", basePrice: 100 }
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  Batsman: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    gradient: "from-amber-500 to-orange-600",
  },
  Bowler: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    gradient: "from-cyan-500 to-blue-600",
  },
  "All-rounder": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    gradient: "from-purple-500 to-indigo-600",
  },
  Wicketkeeper: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    gradient: "from-rose-500 to-pink-600",
  },
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatPrice = (lakhs: number) => {
  if (lakhs >= 100) {
    const crores = lakhs / 100;
    return `₹${crores.toFixed(2)} Cr`;
  }
  return `₹${lakhs} Lakhs`;
};

export default function CreateRoomPage() {
  const router = useRouter();
  
  // Room basic config
  const [name, setName] = useState("");
  const [defaultPurse, setDefaultPurse] = useState(10000); // 100 Crore in Lakhs
  const [squadSizeCap, setSquadSizeCap] = useState(18);
  const [timerSeconds, setTimerSeconds] = useState(15);

  // Teams state
  const [teams, setTeams] = useState<VisualTeam[]>(
    PRESET_TEAMS.map((name, i) => ({ id: `team-${i}`, name }))
  );
  const [newTeamName, setNewTeamName] = useState("");

  // Players state
  const [players, setPlayers] = useState<VisualPlayer[]>(
    PRESET_PLAYERS.map((p, i) => ({ id: `player-${i}`, ...p }))
  );
  
  // New player form state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCategory, setNewPlayerCategory] = useState("Batsman");
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add a team to list
  const handleAddTeam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newTeamName.trim();
    if (!cleanName) return;

    if (teams.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      setError("Team name must be unique");
      return;
    }

    setTeams([...teams, { id: `team-${Date.now()}`, name: cleanName }]);
    setNewTeamName("");
    setError("");
  };

  // Remove team from list
  const handleRemoveTeam = (id: string) => {
    setTeams(teams.filter((t) => t.id !== id));
  };

  // Add a player to list
  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newPlayerName.trim();
    if (!cleanName) return;

    setPlayers([
      ...players,
      {
        id: `player-${Date.now()}`,
        name: cleanName,
        category: newPlayerCategory,
        basePrice: newPlayerBasePrice,
      },
    ]);
    setNewPlayerName("");
    setError("");
  };

  // Remove player from list
  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  // Load preset configurations
  const handleLoadPresetTeams = () => {
    setTeams(PRESET_TEAMS.map((name, i) => ({ id: `team-preset-${i}`, name })));
  };

  const handleLoadPresetPlayers = () => {
    setPlayers(PRESET_PLAYERS.map((p, i) => ({ id: `player-preset-${i}`, ...p })));
  };

  const handleClearTeams = () => setTeams([]);
  const handleClearPlayers = () => setPlayers([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (teams.length === 0) {
      setError("At least one team is required to run an auction");
      return;
    }

    if (players.length === 0) {
      setError("At least one player is required in the draft pool");
      return;
    }

    setLoading(true);

    try {
      const body = {
        name: name.trim() || "Championship Auction Room",
        defaultPurse,
        squadSizeCap,
        timerSeconds,
        incrementRule: [
          { threshold: 0, increment: 5 },     // +5 lakhs below 100 lakhs
          { threshold: 100, increment: 10 },  // +10 lakhs above 100 lakhs
          { threshold: 500, increment: 20 },  // +20 lakhs above 500 lakhs
        ],
        teams: teams.map((t) => ({ name: t.name })),
        players: players.map((p) => ({
          name: p.name,
          category: p.category,
          basePrice: p.basePrice,
        })),
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
    <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Create Auction Room
          </h1>
          <p className="text-slate-400 mt-1">Configure room settings, franchises, and the draft pool.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Realtime Authority Enabled</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 px-4 py-3 rounded-xl mb-8 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Room Settings */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Room Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Room Name</label>
              <input
                type="text"
                placeholder="e.g. IPL 2026 Mega Auction"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Default Purse</label>
              <div className="relative">
                <input
                  type="number"
                  value={defaultPurse}
                  onChange={(e) => setDefaultPurse(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-16 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Lakhs</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">e.g. 10000 = ₹100 Crore</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Squad Size Cap</label>
              <input
                type="number"
                value={squadSizeCap}
                onChange={(e) => setSquadSizeCap(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-900 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bid Timer</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850 text-sm font-bold text-indigo-400 w-16 text-center">
                  {timerSeconds}s
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                The timer resets automatically whenever a team places a higher bid. When the timer hits 0, the active player is sold to the highest bidder.
              </p>
            </div>
          </div>
        </div>

        {/* Team Franchise Configuration */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Franchise Teams ({teams.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoadPresetTeams}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition px-2.5 py-1 rounded hover:bg-blue-500/10"
              >
                Load Presets
              </button>
              <button
                type="button"
                onClick={handleClearTeams}
                className="text-xs font-semibold text-slate-500 hover:text-slate-400 transition px-2.5 py-1 rounded hover:bg-slate-500/10"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Add Team Input */}
          <div className="flex gap-2 max-w-md mb-6">
            <input
              type="text"
              placeholder="Enter franchise name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTeam())}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="button"
              onClick={() => handleAddTeam()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-xl flex items-center gap-1.5 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Teams Visual List */}
          {teams.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/30 border border-dashed border-slate-850 rounded-xl">
              <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No franchise teams added yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {teams.map((team, idx) => (
                <div
                  key={team.id}
                  className="group flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition shadow-lg"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{team.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(team.id)}
                    className="text-slate-500 hover:text-rose-400 transition ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Draft Pool */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Draft Pool ({players.length} Players)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoadPresetPlayers}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition px-2.5 py-1 rounded hover:bg-purple-500/10"
              >
                Load Star Presets
              </button>
              <button
                type="button"
                onClick={handleClearPlayers}
                className="text-xs font-semibold text-slate-500 hover:text-slate-400 transition px-2.5 py-1 rounded hover:bg-slate-500/10"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Add Player Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Player Name</label>
              <input
                type="text"
                placeholder="e.g. AB de Villiers"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role / Category</label>
              <select
                value={newPlayerCategory}
                onChange={(e) => setNewPlayerCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Base Price (Lakhs)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPlayerBasePrice}
                  onChange={(e) => setNewPlayerBasePrice(parseInt(e.target.value, 10) || 0)}
                  className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition text-center"
                />
                <button
                  type="button"
                  onClick={() => handleAddPlayer()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1 text-sm transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Player
                </button>
              </div>
            </div>
          </div>

          {/* Players Visual Grid */}
          {players.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-850 rounded-xl">
              <Award className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No players added to the draft pool yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((player) => {
                const style = CATEGORY_STYLES[player.category] || CATEGORY_STYLES.Batsman;
                return (
                  <div
                    key={player.id}
                    className="bg-slate-900/60 border border-slate-850/70 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition group shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-950/20`}>
                        {getInitials(player.name)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-850 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold text-slate-200 group-hover:text-white transition line-clamp-1">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {player.category}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Base Price</span>
                      <span className="text-xs font-bold text-slate-300">{formatPrice(player.basePrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-semibold py-3.5 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-xl transition disabled:opacity-50 shadow-xl shadow-indigo-950/10"
          >
            {loading ? "Initializing Draft Pool..." : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
