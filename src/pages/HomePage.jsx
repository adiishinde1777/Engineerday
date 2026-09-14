import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Brain, 
  Palette, 
  Trophy, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Tv, 
  Code2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import { api } from '../utils/api';
import { useSquad } from '../context/SquadContext';

export default function HomePage({ setCurrentPage, eventSettings }) {
  const { currentSquad, isSquadRegistered } = useSquad();
  const [topTeams, setTopTeams] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    api.getTeams({ limit: 4 })
      .then((res) => {
        if (res.success) setTopTeams(res.teams.slice(0, 4));
      })
      .catch(console.error);

    api.getFaculty()
      .then((res) => {
        if (res.success) setFacultyList(res.faculty.slice(0, 3));
      })
      .catch(console.error);
  }, []);

  const eventBadge = "DATE & TIME: CLASSIFIED 🔒";

  return (
    <div className="relative min-h-screen">
      {/* Dynamic Circuit Background Pattern */}
      <div className="absolute inset-0 bg-circuit-pattern opacity-25 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-600/15 via-indigo-600/15 to-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-mono tracking-wider uppercase mb-6 shadow-lg shadow-cyan-950/50">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>DEPT. OF ELECTRONICS ENGINEERING (VLSI DESIGN & TECHNOLOGY) • {eventBadge}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 font-heading leading-tight sm:leading-none">
            ENGINEER'S DAY 2026
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg sm:text-2xl md:text-3xl font-semibold text-cyan-300 tracking-wide font-heading">
            Think. Create. Solve. Engineer the Future.
          </p>

          <p className="mt-4 max-w-3xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Organized by the <strong className="text-white">Department of Electronics Engineering (VLSI Design and Technology)</strong> in honor of Dr. Shrikant Honade. Join the premier departmental showdown: Engineer’s Brain and Engineering Pictionary.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {isSquadRegistered ? (
              <button
                onClick={() => setCurrentPage(currentSquad.game === 'pictionary' ? 'pictionary-arena' : 'brain-arena')}
                className="px-6 py-3.5 rounded-xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 hover:from-emerald-300 hover:to-sky-300 shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Enter {currentSquad.game === 'pictionary' ? 'Pictionary' : 'Brain'} Arena ({currentSquad.team_name})</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage('register')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Register for Event</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setCurrentPage('games')}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Game Information</span>
            </button>

            <button
              onClick={() => setCurrentPage('live-dashboard')}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 transition-all flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live Dashboard</span>
            </button>
          </div>

          {/* Countdown Section */}
          <div className="mt-14 max-w-xl mx-auto">
            <CountdownTimer
              eventDateStr={eventSettings?.eventDate || '2026-09-15T09:00:00'}
              eventStatusOverride={eventSettings?.eventStatus || 'AUTO'}
            />
          </div>

        </div>
      </section>

      {/* 2 Official Games Showcase */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              OFFICIAL COMPETITIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-heading">
              Two Premier Engineering Arenas
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Form your 3-member squad, prepare your intellect, and battle for the prestigious Engineer's Day trophy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GAME 01: ENGINEERING PICTIONARY (PRIMARY) */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-slate-900/95 to-slate-950/95 relative overflow-hidden group shadow-xl shadow-indigo-950/30">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/50 shadow-sm shadow-indigo-500/20">
                  GAME 01 • PRIMARY COMPETITION
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-[2px] mb-5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Palette className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                ENGINEERING PICTIONARY
              </h3>
              <p className="text-indigo-400 text-base sm:text-lg font-semibold italic mt-1">
                "Draw it. Guess it. Win it!"
              </p>

              <p className="text-sm text-slate-300 leading-relaxed mt-3">
                The flagship arena: Technical concepts, chips, components, and tools are drawn on the live digital whiteboard while your squad races the 30-second stopwatch to deduce and earn maximum speed bonus points!
              </p>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-800 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Clock</p>
                  <p className="text-sm font-bold text-white mt-0.5">30s / Turn</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Squad Size</p>
                  <p className="text-sm font-bold text-white mt-0.5">3 Members</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Evaluation</p>
                  <p className="text-sm font-bold text-indigo-300 mt-0.5">Speed Bonus</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage('pictionary-arena')}
                  className="flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Palette className="w-4 h-4" />
                  Enter Pictionary Arena
                </button>
                <button
                  onClick={() => setCurrentPage('games')}
                  className="px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                >
                  Rules
                </button>
              </div>
            </div>

            {/* GAME 02: ENGINEER'S BRAIN (SECONDARY) */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  GAME 02 • SECONDARY COMPETITION
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[2px] mb-5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Brain className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                ENGINEER’S BRAIN
              </h3>
              <p className="text-cyan-400 text-base sm:text-lg font-semibold italic mt-1">
                "Think faster than Google!"
              </p>

              <p className="text-sm text-slate-300 leading-relaxed mt-3">
                Rapid-fire technical showdown covering microprocessors, logic gates, chip identification, circuit components, and algorithmic reasoning. Speed counts!
              </p>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-800 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Structure</p>
                  <p className="text-sm font-bold text-white mt-0.5">3 Rounds</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Squad Size</p>
                  <p className="text-sm font-bold text-white mt-0.5">3 Members</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Evaluation</p>
                  <p className="text-sm font-bold text-cyan-300 mt-0.5">Time-Based</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage('brain-arena')}
                  className="flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                >
                  <Zap className="w-4 h-4" />
                  Enter Brain Arena
                </button>
                <button
                  onClick={() => setCurrentPage('games')}
                  className="px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                >
                  Rules
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Live Leaderboard Teaser */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono uppercase mb-2">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              LIVE LEADERBOARD TEASER
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Current Competition Standing
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('live-dashboard')}
            className="text-xs sm:text-sm font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            Open Full Live Dashboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {topTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topTeams.map((team, idx) => (
              <div
                key={team.id}
                onClick={() => setCurrentPage('live-dashboard')}
                className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                    {team.game}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {team.team_name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Capt: {team.captain}</p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Score</span>
                  <span className="text-lg font-black text-cyan-300 font-mono">{team.score} Pts</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center space-y-3 bg-slate-900/60 max-w-xl mx-auto">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white font-heading">
              Ready for Showdown
            </h4>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              No squads registered yet. As participants register for the games, real-time standings and scores will appear here!
            </p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentPage('register')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Register Squad Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Developer Banner */}
      <section className="py-10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm text-slate-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>
              Engineer's Day 2026 Web Platform Engineered with Precision by <strong className="text-cyan-300 font-bold tracking-wide">Aditya Shinde</strong>
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
