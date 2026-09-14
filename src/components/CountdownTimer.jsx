import React, { useState, useEffect } from 'react';
import { Lock, Zap, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export default function CountdownTimer({ eventDateStr = '2026-09-15T09:00:00', eventStatusOverride = 'AUTO' }) {
  const [glitchText, setGlitchText] = useState(['??', '??', '??', '??']);

  // Subtle digital scramble animation for suspense effect
  useEffect(() => {
    if (eventStatusOverride === 'LIVE' || eventStatusOverride === 'COMPLETED') return;
    const chars = '0123456789X#?%';
    const interval = setInterval(() => {
      setGlitchText([
        '??',
        '??',
        '??',
        Math.random() > 0.5 ? '??' : `0${chars[Math.floor(Math.random() * chars.length)]}`
      ]);
    }, 1800);
    return () => clearInterval(interval);
  }, [eventStatusOverride]);

  if (eventStatusOverride === 'LIVE') {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 shadow-xl shadow-emerald-500/20 animate-pulse">
        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></span>
        <div className="text-left">
          <p className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">Tournament Status</p>
          <p className="text-xl sm:text-2xl font-black text-white font-heading tracking-wide">EVENT LIVE NOW</p>
        </div>
      </div>
    );
  }

  if (eventStatusOverride === 'COMPLETED') {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl">
        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
        <div className="text-left">
          <p className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">Tournament Status</p>
          <p className="text-xl sm:text-2xl font-black text-cyan-300 font-heading tracking-wide">EVENT COMPLETED</p>
        </div>
      </div>
    );
  }

  const items = [
    { label: 'DAYS', value: glitchText[0] },
    { label: 'HOURS', value: glitchText[1] },
    { label: 'MINUTES', value: glitchText[2] },
    { label: 'SECONDS', value: glitchText[3] },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Suspense Header Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-wider mb-4 shadow-lg shadow-amber-950/40">
        <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-bold">DATE & TIME: CLASSIFIED UNDER WRAPS</span>
      </div>

      {/* 4 Mystery Boxes */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg w-full">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="glass-card p-3 sm:p-4 rounded-2xl text-center border border-amber-500/30 bg-slate-900/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-400/60 transition-all shadow-lg"
          >
            <div className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-400 font-mono tracking-widest">
              {item.value}
            </div>
            <div className="text-[10px] sm:text-xs font-mono tracking-widest text-slate-400 uppercase font-bold mt-1">
              {item.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Teaser Explanation */}
      <p className="mt-3 text-xs font-mono text-slate-400 text-center max-w-md">
        🔒 Official date & schedule are kept confidential for maximum suspense. <span className="text-amber-300 font-semibold">Stay ready & register your squad now!</span>
      </p>
    </div>
  );
}
