import React, { useState } from 'react';
import { 
  Brain, 
  Palette, 
  Clock, 
  Trophy, 
  Award, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Users, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { useSquad } from '../context/SquadContext';
import SquadVerifyModal from '../components/SquadVerifyModal';

export default function GamesPage({ setCurrentPage }) {
  const { currentSquad, isSquadRegistered, logoutSquad } = useSquad();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [targetGame, setTargetGame] = useState('brain');

  const handleLaunchGame = (gameId) => {
    if (isSquadRegistered) {
      if (currentSquad.game !== 'both' && currentSquad.game !== gameId) {
        alert(`Access Restricted: Squad "${currentSquad.team_name}" is registered ONLY for ${currentSquad.game === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}. You cannot participate in ${gameId === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}.`);
        return;
      }
      setCurrentPage(gameId === 'brain' ? 'brain-arena' : 'pictionary-arena');
    } else {
      setTargetGame(gameId);
      setVerifyModalOpen(true);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
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

      {/* SQUAD REGISTRATION STATUS BANNER */}
      {isSquadRegistered ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Verified Tournament Squad</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-lg font-black text-white font-heading">
                {currentSquad.team_name}
                <span className="ml-2 text-xs font-mono font-normal text-slate-400">
                  (Captain: {currentSquad.captain} • {
                    currentSquad.game === 'both' 
                      ? "Both Competitions (Brain + Pictionary)" 
                      : currentSquad.game === 'brain' 
                        ? "Engineer's Brain" 
                        : "Engineering Pictionary"
                  })
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {currentSquad.game === 'both' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunchGame('brain')}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Brain Arena</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchGame('pictionary')}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Pictionary Arena</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleLaunchGame(currentSquad.game || 'brain')}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Enter {currentSquad.game === 'pictionary' ? 'Pictionary' : 'Brain'} Arena</span>
              </button>
            )}
            <button
              type="button"
              onClick={logoutSquad}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700 cursor-pointer"
              title="Switch Squad / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                PARTICIPATION INFORMATION
              </div>
              <p className="text-xs text-slate-300">
                You are currently viewing competition guidelines. Squad registration is mandatory to enter and play in live arenas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setCurrentPage('register')}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Register Squad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setTargetGame('brain'); setVerifyModalOpen(true); }}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              Already Registered?
            </button>
          </div>
        </div>
      )}

      {/* GAME 1: ENGINEERING PICTIONARY (PRIMARY EVENT) */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-indigo-500/40 bg-slate-900/90 space-y-8 shadow-xl shadow-indigo-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">GAME 01</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  PRIMARY COMPETITION
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">ENGINEERING PICTIONARY</h2>
              <p className="text-indigo-300 text-sm italic">"Draw it. Guess it. Win it!"</p>
            </div>
          </div>

          <button
            onClick={() => handleLaunchGame('pictionary')}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-lg ${
              isSquadRegistered && currentSquad.game === 'brain'
                ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-rose-500/50'
                : isSquadRegistered && (currentSquad.game === 'pictionary' || currentSquad.game === 'both')
                  ? 'bg-gradient-to-r from-emerald-400 to-indigo-400 text-slate-950 shadow-indigo-500/25 animate-pulse'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25'
            }`}
          >
            {isSquadRegistered ? (
              currentSquad.game === 'brain' ? (
                <>
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Locked (Registered for Brain Only)</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  <span>Launch Pictionary Arena ({currentSquad.team_name})</span>
                </>
              )
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Register / Verify to Play</span>
              </>
            )}
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
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 hover:border-indigo-500/40 transition-colors"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Rounds Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              round: 'ROUND 1',
              title: 'Standard Sketch Deduction',
              desc: 'Admin sketches technical diagrams, chip packages, logic topologies, or instrumentation. Squad guesses before 30s expires.',
              timer: '30 Seconds / Turn',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 2',
              title: 'Abstract Engineering Concepts',
              desc: 'Sketching complex terms like Superposition, Cache Miss, P-N Junction Depletion, or Pipelining on the live canvas.',
              timer: '30 Seconds / Turn',
              points: '10 Base Pts'
            },
            {
              round: 'ROUND 3',
              title: 'Lightning Speed Rush',
              desc: 'Fastest deduction wins! Press Finish as soon as your squad answers correctly to capture massive Speed Bonus points.',
              timer: '30 Seconds / Turn',
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
                Reward: <strong className="text-indigo-300">{r.points}</strong> + Speed Bonus
              </div>
            </div>
          ))}
        </div>

        {/* Speed Bonus Matrix */}
        <div className="p-6 rounded-2xl bg-slate-950/90 border border-indigo-500/20 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono text-indigo-400 uppercase font-bold">
            <Clock className="w-4 h-4" />
            30-Second Turn Speed Bonus Matrix (Admin Finish Button)
          </div>
          <p className="text-xs text-slate-400">
            When a team solves in minimum seconds, Admin presses the <strong>Finish</strong> button to freeze the clock and award instant speed bonus points:
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
                <div className="text-indigo-300 font-bold mt-1">{t.bonus}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAME 2: ENGINEER'S BRAIN (SECONDARY EVENT) */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/80 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">GAME 02</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  SECONDARY COMPETITION
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">ENGINEER’S BRAIN</h2>
              <p className="text-cyan-300 text-sm italic">"Think faster than Google!"</p>
            </div>
          </div>

          <button
            onClick={() => handleLaunchGame('brain')}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-lg ${
              isSquadRegistered && currentSquad.game === 'pictionary'
                ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-rose-500/50'
                : isSquadRegistered && (currentSquad.game === 'brain' || currentSquad.game === 'both')
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-emerald-500/25 animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
            }`}
          >
            {isSquadRegistered ? (
              currentSquad.game === 'pictionary' ? (
                <>
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Locked (Registered for Pictionary Only)</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Launch Brain Arena ({currentSquad.team_name})</span>
                </>
              )
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Register / Verify to Play</span>
              </>
            )}
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

      {/* Verification Modal if unregistered squad clicks Launch */}
      <SquadVerifyModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onSuccess={(squad) => {
          setCurrentPage(targetGame === 'brain' ? 'brain-arena' : 'pictionary-arena');
        }}
        targetGame={targetGame}
        setCurrentPage={setCurrentPage}
      />

    </div>
  );
}
