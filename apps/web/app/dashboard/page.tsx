"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Plus, Trophy } from "@phosphor-icons/react";

export default function DashboardPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
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
        if (err.message?.includes("logged in") || err.message?.includes("expired")) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [router]);

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(
        ".gsap-fade-in",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, { scope: containerRef, dependencies: [loading] });

  return (
    <div className="min-h-screen bg-[#050508] w-full text-white selection:bg-fuchsia-500 selection:text-white relative overflow-hidden" ref={containerRef}>
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/20 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 gsap-fade-in">
          <div>
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
              Commissioner Dashboard
            </h1>
            <p className="text-xl text-white/50">Manage your franchise auction rooms.</p>
          </div>
          <Link
            href="/rooms/new"
            className="group bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all duration-300"
          >
            <Plus weight="bold" className="w-5 h-5" />
            Create Room
          </Link>
        </div>

        {error && (
          <p className="text-rose-400 mb-8 bg-rose-950/20 border border-rose-900/50 px-6 py-4 rounded-2xl font-medium gsap-fade-in">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-white/40 gsap-fade-in">
            <div className="w-12 h-12 border-4 border-white/10 border-t-fuchsia-500 rounded-full animate-spin mb-6" />
            <span className="text-xl font-medium tracking-widest uppercase">Loading Rooms</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex-1 border border-white/5 bg-white/5 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center py-32 px-6 text-center shadow-2xl gsap-fade-in">
            <Trophy weight="fill" className="w-24 h-24 text-white/20 mb-8" />
            <h3 className="text-4xl font-bold mb-4">No Rooms Active</h3>
            <p className="text-white/50 text-xl max-w-lg mb-10">
              Get started by creating your first player auction room. Customize the purse, squad size, franchises, and draft pool.
            </p>
            <Link
              href="/rooms/new"
              className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(192,38,211,0.4)] transition-all"
            >
              Configure First Auction
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gsap-fade-in">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-colors" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <span className="bg-black/50 px-4 py-2 text-sm font-mono tracking-[0.2em] font-bold text-fuchsia-400 rounded-full border border-fuchsia-500/20">
                      {room.code}
                    </span>
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest ${
                        room.status === "LOBBY"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : room.status === "AUCTION"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                          : "bg-white/10 text-white/60 border border-white/10"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-8 truncate">{room.name}</h3>
                  
                  <div className="space-y-4 text-lg text-white/60 mb-10">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="uppercase text-xs tracking-widest font-bold">Franchises</span>
                      <span className="font-medium text-white">{room.teamCount}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="uppercase text-xs tracking-widest font-bold">Draft Pool</span>
                      <span className="font-medium text-white">{room.playerCount}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/room/${room.code}/lobby`}
                  className="relative z-10 w-full bg-white text-black font-bold py-4 rounded-xl text-center flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
                >
                  Enter Command Center
                  <ArrowRight weight="bold" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
