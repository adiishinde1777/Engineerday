import React from 'react';
import { Brain, Palette, Clock, Trophy, Award, Zap, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

export default function GamesPage({ setCurrentPage }) {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          COMPETITION MATRIX & RULES
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Official Tournament Games
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Comprehensive round specifications, timing constraints, and dynamic scoring rules for both competitions.
        </p>
      </div>

      {/* GAME 1: ENGINEER'S BRAIN */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/80 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">GAME 01</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">ENGINEER’S BRAIN</h2>
              <p className="text-cyan-300 text-sm italic">"Think faster than Google!"</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('brain-arena')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 self-start md:self-auto shadow-md shadow-cyan-500/25"
          >
            <Zap className="w-4 h-4" />
            Launch Brain Arena
          </button>
        </div>

        {/* 3 Rounds breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              round: 'ROUND 1',
              title: 'Fundamentals & Fast MCQ',
              desc: 'Core electronics, computer architecture, notable engineering milestones, and rapid logic problems.',
              timer: '30 Seconds / Q',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 2',
              title: 'Component & Chip Identification',
              desc: 'High-resolution diagram prompts, pinouts, passive & active circuit elements, and algorithmic complexity.',
              timer: '30 Seconds / Q',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 3',
              title: 'Grand Rapid Finale',
              desc: 'Advanced modern technology, VLSI, quantum computing concepts, and multi-disciplinary puzzles.',
              timer: '25-30 Seconds / Q',
              points: '15 Base Pts'
            }
          ].map((r, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  {r.round}
                </span>
                <span className="text-xs font-mono text-slate-400">{r.timer}</span>
              </div>
              <h4 className="text-lg font-bold text-white font-heading">{r.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
              <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-300">
                Reward: <strong className="text-cyan-300">{r.points}</strong> + Time Bonus
              </div>
            </div>
          ))}
        </div>

        {/* Time-Based Scoring Table */}
        <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono text-cyan-400 uppercase font-bold">
            <Clock className="w-4 h-4" />
            Configurable Time-Bonus Matrix (Backend Evaluated)
          </div>
          <p className="text-xs text-slate-400">
            Points are calculated on the server using microsecond timestamps to reward lightning-fast reflexes:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs font-mono">
            {[
              { time: '0 – 5 sec', bonus: '+5 Bonus Pts' },
              { time: '6 – 10 sec', bonus: '+4 Bonus Pts' },
              { time: '11 – 15 sec', bonus: '+3 Bonus Pts' },
              { time: '16 – 20 sec', bonus: '+2 Bonus Pts' },
              { time: '21 – 25 sec', bonus: '+1 Bonus Pts' },
              { time: '26 – 30 sec', bonus: '+0 Bonus Pts' },
            ].map((t, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">{t.time}</div>
                <div className="text-cyan-300 font-bold mt-1">{t.bonus}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAME 2: ENGINEERING PICTIONARY */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-indigo-500/30 bg-slate-900/80 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">GAME 02</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">ENGINEERING PICTIONARY</h2>
              <p className="text-indigo-300 text-sm italic">"Draw it. Guess it. Win it!"</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('pictionary-arena')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-500 hover:bg-indigo-400 text-white transition-all flex items-center gap-2 self-start md:self-auto shadow-md shadow-indigo-500/25"
          >
            <Palette className="w-4 h-4" />
            Launch Pictionary Arena
          </button>
        </div>

        {/* Categories Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
            Covered Engineering Disciplines & Concept Domains
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Computer Systems',
              'VLSI & Semiconductors', 'Artificial Intelligence', 'Robotics', 'Engineering Tools', 'Famous Inventions'
            ].map((cat, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Rounds for Pictionary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              round: 'ROUND 1',
              title: 'Tools & Foundational Hardware',
              desc: 'Everyday instruments, core circuit elements, turbines, and structural mechanics.',
              timer: '30 Seconds / Concept',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 2',
              title: 'Integrated Circuits & Robotics',
              desc: 'Microcontrollers, sensor architectures, robotic actuators, and network topologies.',
              timer: '30 Seconds / Concept',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 3',
              title: 'Frontier Tech & Complex Systems',
              desc: 'Autonomous rovers, neural networks, 3D printing pipelines, and aerospace structures.',
              timer: '30 Seconds / Concept',
              points: '15 Base Pts'
            }
          ].map((r, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-500/30">
                  {r.round}
                </span>
                <span className="text-xs font-mono text-slate-400">{r.timer}</span>
              </div>
              <h4 className="text-lg font-bold text-white font-heading">{r.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
              <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-300">
                Reward: <strong className="text-indigo-300">{r.points}</strong> + Time Bonus
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
