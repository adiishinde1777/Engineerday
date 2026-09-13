import React from 'react';
import { Cpu, Heart, Code2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer({ setCurrentPage, eventSettings }) {
  const footerText = eventSettings?.footerText || "Engineer's Day 2026 | Designed & Developed by Aditya Shinde";
  const eventDate = "15 September 2026";

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800 text-slate-400 overflow-hidden">
      {/* Subtle circuit backdrop glow */}
      <div className="absolute inset-0 bg-circuit-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Subtitle */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-heading">
                ENGINEER'S DAY 2026
              </span>
            </div>
            <p className="text-cyan-400 text-sm font-semibold tracking-wide">
              "Think. Create. Solve. Engineer the Future."
            </p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Department of Electronics Engineering (VLSI Design & Technology). Organized in honor of Dr. Shrikant Honade with live technical competitions.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Event Date: {eventDate}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-semibold">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => setCurrentPage('home')} className="hover:text-cyan-400 transition-colors">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('games')} className="hover:text-cyan-400 transition-colors">
                  Games & Rules
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('faculty')} className="hover:text-cyan-400 transition-colors">
                  Department Faculty
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('register')} 
                  className="hover:text-cyan-400 transition-colors text-cyan-400 font-medium cursor-pointer"
                >
                  Register for Event
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Live Games & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-semibold">
              Live Arena
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => setCurrentPage('brain-arena')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Engineer’s Brain Arena
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('pictionary-arena')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Pictionary Drawing Arena
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('live-dashboard')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live Scoreboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('projector-scoreboard')} className="hover:text-cyan-400 transition-colors">
                  Projector / Auditorium Mode
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('winners')} className="hover:text-cyan-400 transition-colors text-amber-400">
                  Hall of Winners
                </button>
              </li>
              <li className="pt-2">
                <button 
                  onClick={() => setCurrentPage('admin-login')} 
                  className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Developer Signature */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-mono text-slate-400">
              {footerText}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-900/80 px-4 py-2 rounded-xl border border-cyan-500/20 shadow-sm">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              Website Designed & Developed by <strong className="text-cyan-300 font-bold tracking-wide">Aditya Shinde</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
