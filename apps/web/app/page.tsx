"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lightning, ShieldCheck, Sword, Users, X, ArrowRight } from "@phosphor-icons/react";
import { apiRequest } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Forms state
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useGSAP(() => {
    // Reveal text
    gsap.utils.toArray(".scrub-text").forEach((text: any) => {
      gsap.fromTo(
        text,
        { opacity: 0.1 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: text,
            start: "top 80%",
            end: "bottom 40%",
            scrub: true,
          },
        }
      );
    });

    // Image scale and fade
    gsap.utils.toArray(".gsap-img").forEach((img: any) => {
      gsap.fromTo(
        img,
        { scale: 0.8, opacity: 0.2 },
        {
          scale: 1,
          opacity: 1,
          scrollTrigger: {
            trigger: img,
            start: "top 90%",
            end: "bottom 20%",
            scrub: true,
          },
        }
      );
    });

    // Horizontal Scroll Section
    if (horizontalRef.current) {
      const panels = gsap.utils.toArray(".horizontal-panel");
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: horizontalRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          end: () => "+=" + horizontalRef.current!.offsetWidth * panels.length
        }
      });
    }

  }, { scope: containerRef });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 6) {
      setJoinError("Room code must be exactly 6 characters");
      return;
    }
    setJoinError("");
    setJoinLoading(true);
    try {
      const data = await apiRequest(`/api/rooms/${roomCode.toUpperCase()}`, "GET");
      if (data.ok) {
        router.push(`/join/${roomCode.toUpperCase()}`);
      }
    } catch (err: any) {
      setJoinError(err.message || "Room not found");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (isLogin) {
        const data = await apiRequest("/api/auth/login", "POST", { email, password });
        if (data.ok) {
          router.push("/dashboard");
        }
      } else {
        const data = await apiRequest("/api/auth/signup", "POST", { email, password, name });
        if (data.ok) {
          setIsLogin(true);
          setAuthError("Account created! Please log in.");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[#050508] text-white selection:bg-fuchsia-500 selection:text-white relative" ref={containerRef}>
      
      {/* Mesh Gradient Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/30 blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[100px]" />
      </div>

      {/* Navigation (Glass Pill) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex items-center justify-between w-[calc(100%-2rem)] max-w-5xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Lightning weight="fill" className="text-fuchsia-400" /> BIDSTAND
        </span>
        <div className="flex items-center gap-4 md:gap-8">
          <button onClick={() => setShowLoginModal(true)} className="hidden md:block text-sm font-medium text-white/70 hover:text-white transition">
            Commissioner Login
          </button>
          <button onClick={() => setShowJoinModal(true)} className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all">
            Join Room
          </button>
        </div>
      </nav>

      {/* Attention (Hero) */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-32 px-4 z-10">
        <div className="text-center w-full max-w-6xl mx-auto">
          <h1 className="text-[clamp(3.5rem,7vw,7.5rem)] font-extrabold leading-[0.95] tracking-tighter mb-12 drop-shadow-2xl">
            The elite auction platform <br/>
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400">modern franchises.</span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => setShowJoinModal(true)} 
              className="bg-white text-black w-full md:w-auto px-12 py-5 rounded-full text-lg font-bold hover:scale-105 transition-transform duration-300"
            >
              Join Live Auction
            </button>
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="bg-white/5 backdrop-blur-md border border-white/20 text-white w-full md:w-auto px-12 py-5 rounded-full text-lg font-bold hover:bg-white/10 transition-colors duration-300"
            >
              Host an Auction
            </button>
          </div>
        </div>
      </section>

      {/* Infinite Marquee */}
      <section className="py-20 border-y border-white/5 overflow-hidden flex whitespace-nowrap opacity-60 bg-black/40 backdrop-blur-sm z-10 relative">
        <div className="animate-[marquee_25s_linear_infinite] flex items-center gap-24 shrink-0">
          <span className="text-4xl font-bold tracking-tight uppercase">High Performance WebSockets</span>
          <span className="text-4xl font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-indigo-500">Millisecond Precision</span>
          <span className="text-4xl font-bold tracking-tight uppercase">Secure Realtime Bidding</span>
          <span className="text-4xl font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Zero Latency Sync</span>
        </div>
        <div className="animate-[marquee_25s_linear_infinite] flex items-center gap-24 shrink-0 pl-24">
          <span className="text-4xl font-bold tracking-tight uppercase">High Performance WebSockets</span>
          <span className="text-4xl font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-indigo-500">Millisecond Precision</span>
          <span className="text-4xl font-bold tracking-tight uppercase">Secure Realtime Bidding</span>
          <span className="text-4xl font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Zero Latency Sync</span>
        </div>
      </section>

      {/* GSAP Horizontal Scroll Section */}
      <div className="overflow-x-hidden z-10 relative bg-black/50">
        <section ref={horizontalRef} className="h-screen flex flex-nowrap w-[400vw]">
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center p-12 bg-[#0a0a0f]">
            <h2 className="text-6xl md:text-8xl font-black mb-8">01. Setup</h2>
            <p className="text-2xl text-white/60 max-w-2xl text-center">Configure your franchise teams and draft pool in seconds with our cinematic builder.</p>
          </div>
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center p-12 bg-indigo-950/20">
            <h2 className="text-6xl md:text-8xl font-black mb-8 text-indigo-400">02. Connect</h2>
            <p className="text-2xl text-white/60 max-w-2xl text-center">Team owners join via a secure 6-digit code. WebSockets ensure perfect synchronization.</p>
          </div>
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center p-12 bg-fuchsia-950/20">
            <h2 className="text-6xl md:text-8xl font-black mb-8 text-fuchsia-400">03. Bid Wars</h2>
            <p className="text-2xl text-white/60 max-w-2xl text-center">Experience the adrenaline of live bidding with millisecond precision and automatic timer resets.</p>
          </div>
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center p-12 bg-emerald-950/20">
            <h2 className="text-6xl md:text-8xl font-black mb-8 text-emerald-400">04. Glory</h2>
            <p className="text-2xl text-white/60 max-w-2xl text-center">Build your dream roster and dominate the league. The ultimate franchise warfare.</p>
          </div>
        </section>
      </div>

      {/* Interest (Gapless Bento Grid) */}
      <section className="py-32 md:py-48 px-4 max-w-7xl mx-auto z-10 relative">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-24 text-center scrub-text tracking-tighter">
          Engineered for <br/> <span className="italic text-indigo-400">intense bidding wars.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[450px] gap-2 grid-flow-dense">
          
          {/* Card 1 */}
          <div className="md:col-span-2 group relative overflow-hidden bg-neutral-900 rounded-3xl flex items-end p-12 border border-white/5">
            <img src="https://picsum.photos/seed/auction/1920/1080" className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-30 group-hover:scale-110 group-hover:opacity-50 transition-all duration-1000 ease-out gsap-img" alt="Auction" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="relative z-10 w-full max-w-lg">
              <Lightning weight="fill" className="text-fuchsia-500 w-12 h-12 mb-8" />
              <h3 className="text-4xl font-bold mb-4">Realtime WebSockets</h3>
              <p className="text-white/60 text-xl leading-relaxed">Experience zero latency syncing across all connected clients. When a bid drops, everyone sees it instantly.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="md:col-span-1 md:row-span-2 group relative overflow-hidden bg-neutral-900 rounded-3xl flex items-center justify-center p-12 border border-white/5">
            <img src="https://picsum.photos/seed/security/800/1200" className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-30 group-hover:scale-110 group-hover:opacity-50 transition-all duration-1000 ease-out gsap-img" alt="Security" />
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-1000" />
            <div className="relative z-10 text-center">
              <ShieldCheck weight="fill" className="text-emerald-400 w-16 h-16 mb-8 mx-auto" />
              <h3 className="text-4xl font-bold mb-6">Bulletproof Security</h3>
              <p className="text-white/60 text-xl leading-relaxed">Cryptographically signed tokens ensure your purse limits are strictly enforced server-side.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="md:col-span-1 group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-800 text-white rounded-3xl flex items-start p-12 border border-white/10">
            <div className="relative z-10 w-full">
              <Sword weight="fill" className="text-white w-12 h-12 mb-8" />
              <h3 className="text-4xl font-bold mb-4">Franchise Warfare</h3>
              <p className="text-white/80 text-xl leading-relaxed">Build your ultimate dream team with precise purse management.</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-1 group relative overflow-hidden bg-neutral-900 rounded-3xl flex items-end p-12 border border-white/5">
            <img src="https://picsum.photos/seed/crowd/800/800" className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-30 group-hover:scale-110 group-hover:opacity-50 transition-all duration-1000 ease-out gsap-img" alt="Crowd" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="relative z-10 w-full">
              <Users weight="fill" className="text-indigo-400 w-12 h-12 mb-8" />
              <h3 className="text-4xl font-bold mb-4">Spectator Mode</h3>
              <p className="text-white/60 text-xl leading-relaxed">Let thousands watch the drama unfold with view-only connections.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Action (Footer) */}
      <footer className="py-40 flex flex-col items-center justify-center text-center px-4 bg-black relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-fuchsia-600/20 blur-[100px] pointer-events-none" />

        <h2 className="text-[clamp(4rem,10vw,12rem)] font-black leading-none tracking-tighter mb-16 z-10 drop-shadow-2xl">
          START NOW
        </h2>
        <button 
          onClick={() => setShowLoginModal(true)} 
          className="group relative bg-white text-black px-12 py-6 rounded-full text-2xl font-black hover:scale-105 transition-all duration-500 z-10 flex items-center gap-4"
        >
          Create Commissioner Account
          <ArrowRight weight="bold" className="group-hover:translate-x-2 transition-transform" />
        </button>
      </footer>

      {/* MODALS */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-12 w-full max-w-lg relative shadow-[0_0_100px_rgba(192,38,211,0.2)]">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition">
              <X weight="bold" size={28} />
            </button>
            <h2 className="text-4xl font-bold mb-3">Join Room</h2>
            <p className="text-white/50 mb-10 text-lg">Enter the 6-character room code to join the live auction.</p>
            
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-3xl font-mono tracking-[0.3em] text-center text-white focus:outline-none focus:border-fuchsia-500 focus:bg-white/10 transition-all uppercase"
                />
              </div>
              {joinError && <p className="text-rose-400 text-sm text-center font-medium">{joinError}</p>}
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold py-5 rounded-2xl text-xl transition-all disabled:opacity-50 hover:shadow-[0_0_30px_rgba(192,38,211,0.4)]"
              >
                {joinLoading ? "Connecting..." : "Enter Room"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-12 w-full max-w-lg relative shadow-[0_0_100px_rgba(79,70,229,0.2)]">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition">
              <X weight="bold" size={28} />
            </button>
            
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-3">{isLogin ? "Welcome Back" : "Host Setup"}</h2>
              <p className="text-white/50 text-lg">{isLogin ? "Log in to your commissioner account." : "Create your commissioner account."}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 placeholder:text-white/30 transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 placeholder:text-white/30 transition-all"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 placeholder:text-white/30 transition-all"
                  required
                />
              </div>

              {authError && <p className="text-rose-400 text-sm text-center font-medium">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-white text-black font-bold py-5 rounded-2xl text-xl transition-all disabled:opacity-50 hover:scale-[1.02] mt-4"
              >
                {authLoading ? "Authenticating..." : isLogin ? "Log In" : "Register"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError("");
                }}
                className="text-base text-white/50 hover:text-white transition font-medium"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marquee Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </main>
  );
}
