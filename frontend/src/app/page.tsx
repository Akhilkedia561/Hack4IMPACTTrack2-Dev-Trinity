"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    type Star = {
      x: number; y: number; r: number;
      opacityBase: number;
      twinkleSpeed: number;
      phase: number;
    };

    let stars: Star[] = [];

    const mkStars = () => {
      stars = [];
      const n = Math.max(250, Math.floor((W * H) / 3500));
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.2,
          opacityBase: Math.random() * 0.4 + 0.2,
          twinkleSpeed: 0.0003 + Math.random() * 0.0005,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed + s.phase);
        const alpha = s.opacityBase + twinkle * 0.2;
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      mkStars();
    };

    mkStars();
    animId = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleLaunch = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/dashboard"), 900);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.2, filter: "brightness(2) blur(10px)" }}
        transition={{ duration: 0.9 }}
        className="relative min-h-screen w-full bg-[#000000] font-['Outfit'] selection:bg-[#e6a817] selection:text-black"
      >
        <style jsx global>{`
          @import url('https://fonts.bunny.net/css?family=outfit:200,300,400,600');

          .stellar-gradient {
            background: radial-gradient(circle at 50% 100%, #1a150e 0%, #050403 70%, #000000 100%);
          }
          .sun-glow {
            position: absolute;
            bottom: -200px;
            left: 50%;
            transform: translateX(-50%);
            width: 150vw;
            height: 600px;
            background: radial-gradient(ellipse at 50% 100%,
              rgba(230,168,23,0.2) 0%,
              rgba(103,137,190,0.05) 50%,
              transparent 80%);
            filter: blur(100px);
            z-index: 1;
          }

          /* Extended bottom mask — now 50vh tall and bleeds into the next section */
          .hero-bottom-mask {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50vh;
            background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, #000000 100%);
            z-index: 5;
          }

          /* Continuation fade at the very top of section 2 */
          .section2-top-fade {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            background: linear-gradient(to bottom, #000000, transparent);
            z-index: 2;
            pointer-events: none;
          }

          .ring-o {
            position: absolute;
            top: 18%; left: 32%;
            width: clamp(45px, 9vw, 95px);
            height: clamp(45px, 9vw, 95px);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
          }
          .glass-card {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .glass-card-hover {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.08);
            transition: border-color 0.3s, background 0.3s;
          }
          .glass-card-hover:hover {
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.18);
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to   { transform: rotate(0deg); }
          }
          .animate-spin-slow     { animation: spin-slow 18s linear infinite; }
          .animate-reverse-spin { animation: reverse-spin 12s linear infinite; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #000; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        `}</style>

        {/* ═══════════════════════════════════
            HERO
        ═══════════════════════════════════ */}
        <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 stellar-gradient z-0" />
          <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none" />
          <div className="sun-glow" />
          <div className="hero-bottom-mask" />

          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none z-[2]"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <g stroke="#ffffff" strokeWidth="0.5" fill="none">
              {[0, 200, 400, 600, 800, 1000].map((x) => (
                <line key={x} x1="500" y1="1200" x2={x} y2="-200" />
              ))}
            </g>
          </svg>

          {/* NAVBAR */}
          <nav className="absolute top-0 w-full px-12 py-8 flex justify-between items-center z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center glass-card">
                <span className="text-sm">⚡</span>
              </div>
              <span className="text-white font-semibold tracking-widest text-xs">ADAPTGRID AI</span>
            </div>
            <div className="px-5 py-2 rounded-full glass-card text-[10px] text-white/70 tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse inline-block" />
              Odisha System: Nominal
            </div>
          </nav>

          {/* CENTER CONTENT */}
          <div className="relative z-10 flex flex-col items-center gap-12 text-center px-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <div className="ring-o" />
              <h1 className="text-white text-[clamp(60px,12vw,140px)] leading-[0.9] font-light uppercase tracking-tight">
                Adapt
                <br />
                <span className="font-semibold tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
                  Grid AI
                </span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <p className="text-[#fffbe6]/60 text-[clamp(14px,1.5vw,20px)] uppercase tracking-[0.3em] font-light">
                Smart Solar Intelligence for Odisha Homes
              </p>
              <div className="flex gap-4 md:gap-8">
                {["AI Prediction", "Grid Optimization", "Real-time Analytics"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] md:text-[11px] text-white/30 tracking-[0.2em] uppercase border-b border-white/10 pb-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <button
                onClick={handleLaunch}
                className="group relative px-14 py-5 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative text-sm tracking-[0.2em] uppercase font-light">
                  Launch Dashboard →
                </span>
              </button>
            </motion.div>
          </div>

          {/* scroll hint */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 z-10"
          >
            <span className="text-[10px] text-white/30 tracking-widest uppercase">Scroll to Explore</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent" />
          </motion.div>
        </section>

        {/* ═══════════════════════════════════
            SECTION 2 — LIVE GRID IMPACT
            Negative top margin pulls it under
            the hero's extended fade mask for a
            seamless bleed — no hard line.
        ═══════════════════════════════════ */}
        <section className="relative py-32 z-20 -mt-32 mb-24">
          {/* top fade continues the hero black */}
          <div className="section2-top-fade" />

          <div style={{ paddingLeft: "12vw", paddingRight: "6vw" }}>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-[#e6a817] text-[10px] font-semibold tracking-[0.3em] uppercase mb-6"
              >
                Live Impact
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-white text-4xl md:text-6xl font-light mb-24 leading-tight"
              >
                Real decisions.
                <br />
                <span className="text-white/30 italic">Real rupees saved.</span>
              </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="glass-card-hover p-12 rounded-[32px] flex flex-col gap-6"
              >
                <span className="text-[#e6a817] text-xs font-semibold tracking-widest">SAVINGS</span>
                <div className="text-white text-5xl font-light">₹4.2k</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">Avg / month / household</div>
                <div className="h-[1px] w-full bg-white/5 my-2" />
                <p className="text-white/40 text-sm leading-relaxed">
                  Predictive optimization cuts household bills in Odisha by up to 34% annually using real TPCODL tariff slabs.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="glass-card-hover p-12 rounded-[32px] md:col-span-2"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-white text-2xl font-light">Odisha Node Alpha</h3>
                    <p className="text-white/30 text-sm mt-2">
                      Active monitoring: Bhubaneswar · Cuttack · Puri · Rourkela
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Live</span>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-white/5 mb-10" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { l: "Efficiency",  v: "98.2%" },
                    { l: "Prediction",  v: "84ms"  },
                    { l: "Uptime",      v: "99.9%" },
                    { l: "Solar Nodes", v: "1.2k+" },
                  ].map((stat) => (
                    <div key={stat.l}>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">{stat.l}</p>
                      <p className="text-white text-2xl font-light">{stat.v}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION 3 — CORE INTELLIGENCE
        ═══════════════════════════════════ */}
        <section className="relative py-32 z-20 mb-24 overflow-hidden bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
          <div style={{ paddingLeft: "12vw", paddingRight: "6vw" }} className="flex flex-col md:flex-row items-center gap-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="flex-1"
            >
              <p className="text-[#6789be] text-[10px] font-semibold tracking-[0.3em] uppercase mb-8">
                Under the Hood
              </p>
              <h2 className="text-white text-5xl md:text-7xl font-light leading-tight mb-10">
                Smart Solar
                <br />
                <span className="text-white/30 italic">Intelligence.</span>
              </h2>
              <p className="text-white/40 text-lg leading-relaxed mb-12 max-w-lg">
                Using scikit-learn Linear Regression and Open-Meteo weather data, AdaptGrid predicts solar output
                24 hours ahead — enabling autonomous battery decisions with no manual input.
              </p>
              <ul className="space-y-6">
                {[
                  { label: "Physics-aware Solar Forecasting",    color: "#e6a817" },
                  { label: "Greedy Surplus Optimization Engine", color: "#6789be" },
                  { label: "Real-time WebSocket Data Stream",    color: "#22c55e" },
                  { label: "Dynamic IST Bell-curve Modelling",   color: "#e6a817" },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-5 text-white/70 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="flex-1 w-full max-w-sm mx-auto aspect-square glass-card rounded-full relative flex items-center justify-center"
            >
              <div className="absolute inset-10 border border-white/5 rounded-full animate-spin-slow" />
              <div className="absolute inset-20 border border-white/10 rounded-full animate-reverse-spin" />
              <div
                className="absolute inset-[5.5rem] border border-[#e6a817]/10 rounded-full animate-spin-slow"
                style={{ animationDuration: "30s" }}
              />
              <div className="text-center z-10">
                <p className="text-[#e6a817] text-4xl font-bold">AI</p>
                <p className="text-white/20 text-[9px] uppercase tracking-[0.5em] mt-2">Prediction Engine</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION 4 — OPTIMIZER DECISIONS
        ═══════════════════════════════════ */}
        <section className="relative py-32 z-20 mb-24">
          <div style={{ paddingLeft: "12vw", paddingRight: "6vw" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-24"
            >
              <p className="text-[#22c55e] text-[10px] font-semibold tracking-[0.3em] uppercase mb-6">
                Optimizer Logic
              </p>
              <h2 className="text-white text-4xl md:text-6xl font-light leading-tight">
                Every 5 seconds,
                <br />
                <span className="text-white/30 italic">a decision is made.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  tag: "STORE BATTERY",
                  tagColor: "#22c55e",
                  title: "Surplus Detected",
                  condition: "Production > Consumption · Battery < 80%",
                  desc: "Excess solar energy is intelligently routed to the battery bank, maximising stored capacity for evening demand peaks.",
                  icon: "🔋",
                },
                {
                  tag: "SEND TO GRID",
                  tagColor: "#6789be",
                  title: "Battery Full",
                  condition: "Surplus > 1.5 kW · Battery ≥ 80%",
                  desc: "When storage is saturated, surplus power exports to the grid, earning credits against your TPCODL bill automatically.",
                  icon: "⚡",
                },
                {
                  tag: "USE NOW",
                  tagColor: "#e6a817",
                  title: "Low Production",
                  condition: "Consumption > Production · Cloud cover high",
                  desc: "The system draws from battery reserves during low-irradiance periods, ensuring uninterrupted power without grid dependency.",
                  icon: "☀️",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.tag}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.12 }}
                  className="glass-card-hover p-10 rounded-[28px] flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{card.icon}</span>
                    <span
                      className="text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                      style={{
                        color: card.tagColor,
                        background: `${card.tagColor}18`,
                        border: `1px solid ${card.tagColor}30`,
                      }}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">{card.title}</h3>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest">{card.condition}</p>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <p className="text-white/40 text-sm leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION 5 — CITIES COVERAGE
        ═══════════════════════════════════ */}
        <section className="relative py-32 z-20 mb-24" style={{ marginTop: "80px" }}>
          <div style={{ paddingLeft: "12vw", paddingRight: "6vw" }} className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[#e6a817] text-[10px] font-semibold tracking-[0.3em] uppercase mb-10">Coverage</p>
              <h2 className="text-white text-4xl md:text-6xl font-light mb-8">
                All of Odisha,
                <br />
                <span className="text-white/30 italic">connected.</span>
              </h2>
              <p className="text-white/30 text-sm tracking-widest uppercase mb-24">
                Open-Meteo weather data for every district
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              {[
                "Bhubaneswar", "Cuttack",   "Rourkela",  "Sambalpur",
                "Berhampur",   "Puri",      "Balasore",  "Baripada",
                "Jharsuguda",  "Angul",     "Kendujhar", "Koraput",
              ].map((city, i) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass-card-hover flex items-center gap-3 px-6 py-4 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-white/70 text-sm tracking-wide">{city}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION 6 — FINAL CTA
        ═══════════════════════════════════ */}
        <section className="relative py-64 z-20 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#e6a817]/5 rounded-full blur-[150px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="pl-[8vw] md:pl-[12vw] lg:pl-[14vw] pr-8 md:pr-16 lg:pr-24 text-center"
          >
            <p className="text-[#6789be] text-[10px] font-semibold tracking-[0.3em] uppercase mb-8">Get Started</p>
            <h2 className="text-white text-5xl md:text-7xl font-light leading-tight mb-10">
              Your panels deserve
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e6a817] via-[#f5d060] to-[#e6a817]">
                smarter software.
              </span>
            </h2>
            <p className="text-white/30 text-lg mb-16 leading-relaxed">
              Live predictions, optimizer decisions, grid map, and savings — all in one dashboard built for Odisha.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleLaunch}
                className="group relative px-14 py-5 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 backdrop-blur-md transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative text-sm tracking-[0.2em] uppercase font-light">
                  Launch Dashboard →
                </span>
              </button>
              <a
                href="https://github.com/Akhilkedia561/Hack4IMPACTTrack2-Dev-Trinity"
                target="_blank"
                rel="noopener noreferrer"
                className="px-14 py-5 text-white/40 hover:text-white/70 rounded-full border border-white/5 hover:border-white/15 transition-all duration-300 text-sm tracking-[0.2em] uppercase font-light"
              >
                View on GitHub
              </a>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════
            FOOTER
        ═══════════════════════════════════ */}
        <footer className="relative py-20 border-t border-white/5 z-20">
          <div className="pl-[8vw] md:pl-[12vw] lg:pl-[14vw] pr-8 md:pr-16 lg:pr-24 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center glass-card">
                <span className="text-xs">⚡</span>
              </div>
              <span className="text-white/30 text-xs tracking-[0.2em] uppercase">AdaptGrid AI</span>
            </div>
            <p className="text-white/15 text-xs tracking-[0.3em] uppercase text-center">
              Built for Hack4IMPACT · Dev Trinity · Bhubaneswar, Odisha
            </p>
            <div className="flex gap-8">
              {["Dashboard", "Prediction", "Grid Map"].map((link) => (
                <button
                  key={link}
                  onClick={handleLaunch}
                  className="text-white/20 hover:text-white/50 text-xs tracking-widest uppercase transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </footer>

        {/* TRANSITION OVERLAY */}
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
            transition={{ duration: 0.8 }}
          />
        )}

      </motion.div>
    </AnimatePresence>
  );
}
