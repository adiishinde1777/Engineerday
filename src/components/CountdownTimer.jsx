import React, { useState, useEffect } from 'react';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';

export default function CountdownTimer({ eventDateStr = '2026-09-15T09:00:00', eventStatusOverride = 'AUTO' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isCompleted: false
  });

  useEffect(() => {
    function calculate() {
      if (eventStatusOverride === 'LIVE') {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true, isCompleted: false });
        return;
      }
      if (eventStatusOverride === 'COMPLETED') {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isCompleted: true });
        return;
      }

      const target = new Date(eventDateStr).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        // Assume event lasts 8 hours
        const eventEnd = target + (8 * 60 * 60 * 1000);
        if (now < eventEnd) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true, isCompleted: false });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isCompleted: true });
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isLive: false, isCompleted: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [eventDateStr, eventStatusOverride]);

  if (timeLeft.isLive) {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 shadow-xl shadow-emerald-500/20 animate-pulse">
        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></span>
        <div className="text-left">
          <p className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">Symposium Status</p>
          <p className="text-xl sm:text-2xl font-black text-white font-heading tracking-wide">EVENT LIVE</p>
        </div>
      </div>
    );
  }

  if (timeLeft.isCompleted) {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl">
        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
        <div className="text-left">
          <p className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">Symposium Status</p>
          <p className="text-xl sm:text-2xl font-black text-cyan-300 font-heading tracking-wide">EVENT COMPLETED</p>
        </div>
      </div>
    );
  }

  const items = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4">
        <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ENGINEER'S DAY STARTS IN
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg w-full">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="glass-card p-3 sm:p-4 rounded-2xl text-center border border-cyan-500/20 bg-slate-900/60 backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/50 transition-all"
          >
            <div className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 font-mono tracking-tight">
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-mono tracking-widest text-cyan-400/80 uppercase font-semibold mt-1">
              {item.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
