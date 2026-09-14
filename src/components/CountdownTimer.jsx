import React, { useState, useEffect } from 'react';
import { Calendar, Zap, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function CountdownTimer({ eventDateStr = '2026-09-15T09:00:00', eventStatusOverride = 'AUTO' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(eventDateStr).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (isNaN(diff) || diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDateStr]);

  if (eventStatusOverride === 'LIVE' || (eventStatusOverride === 'AUTO' && timeLeft.isExpired)) {
    return (
      <div className="inline-flex items-center gap-3.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/60 shadow-2xl shadow-emerald-500/25 animate-pulse">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
        </span>
        <div className="text-left">
          <p className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-widest">Tournament In Progress</p>
          <p className="text-xl sm:text-2xl font-black text-white font-heading tracking-wide">EVENT IS LIVE NOW</p>
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

  const pad = (n) => String(n).padStart(2, '0');

  const timeUnits = [
    { label: 'DAYS', value: pad(timeLeft.days) },
    { label: 'HOURS', value: pad(timeLeft.hours) },
    { label: 'MINUTES', value: pad(timeLeft.minutes) },
    { label: 'SECONDS', value: pad(timeLeft.seconds) },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Live Countdown Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4 shadow-lg shadow-cyan-950/50">
        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="font-bold">COUNTDOWN TO ENGINEER'S DAY 2026</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
      </div>

      {/* 4 Glowing Digital Countdown Boxes */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg w-full">
        {timeUnits.map((unit, idx) => (
          <div
            key={idx}
            className="glass-card p-3 sm:p-4 rounded-2xl text-center border border-cyan-500/30 bg-slate-900/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/70 hover:shadow-cyan-500/20 hover:shadow-xl transition-all"
          >
            <div className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 font-mono tracking-widest">
              {unit.value}
            </div>
            <div className="text-[10px] sm:text-xs font-mono tracking-widest text-slate-400 uppercase font-bold mt-1">
              {unit.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Date Notice */}
      <p className="mt-3 text-xs font-mono text-slate-400 text-center max-w-md flex items-center justify-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
        <span>Grand Event Date: <strong className="text-cyan-300">15 September 2026 • 09:00 AM</strong></span>
      </p>
    </div>
  );
}
