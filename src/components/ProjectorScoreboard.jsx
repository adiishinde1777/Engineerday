import React, { useState, useEffect } from 'react';
import { Trophy, Maximize2, Minimize2, ArrowLeft, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';

export default function ProjectorScoreboard({ onExit }) {
  const { scoreboard, setScoreboard } = useSocket();
  const [filterGame, setFilterGame] = useState('all'); // 'all' | 'brain' | 'pictionary'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    api.getTeams({ game: filterGame })
      .then((res) => {
        if (res.success) setScoreboard(res.teams);
      })
      .catch(console.error);
  }, [filterGame]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const filteredTeams = scoreboard.filter((t) => {
    if (filterGame === 'all') return true;
    return t.game === filterGame || t.game === 'both';
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12] text-white flex flex-col p-6 sm:p-10 overflow-hidden font-sans select-none">
      {/* Dynamic backdrop grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none"></div>

      {/* Top Projector Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between pb-6 border-b border-cyan-500/30 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 text-sm font-bold tracking-wide transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            Exit Projector Mode
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 font-heading tracking-wide">
                ENGINEER'S DAY 2026
              </span>
              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/40 animate-pulse">
                ● LIVE SCOREBOARD
              </span>
            </div>
            <p className="text-sm font-mono text-slate-400 mt-0.5">
              AUDITORIUM PRESENTATION DISPLAY • 15 SEPTEMBER 2026
            </p>
          </div>
        </div>

        {/* Filter controls & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {['all', 'brain', 'pictionary'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterGame(mode)}
                className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                  filterGame === mode ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'all' ? 'All Games' : mode === 'brain' ? "Engineer's Brain" : 'Pictionary'}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main High-Visibility Scoreboard Table */}
      <div className="relative z-10 flex-1 overflow-y-auto mt-6 pr-2">
        <div className="space-y-3">
          {filteredTeams.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500 font-mono">
              <Trophy className="w-16 h-16 text-slate-700 mb-3" />
              <p className="text-xl">NO TEAMS REGISTERED FOR THIS CATEGORY</p>
            </div>
          ) : (
            filteredTeams.map((team, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;

              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                    isTop1
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : isTop2
                      ? 'bg-gradient-to-r from-slate-800/50 via-slate-900 to-slate-900 border-slate-400/40'
                      : isTop3
                      ? 'bg-gradient-to-r from-amber-900/20 via-slate-900 to-slate-900 border-amber-700/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Rank badge & Team name */}
                  <div className="flex items-center gap-5 sm:gap-8">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl shadow-md ${
                        isTop1
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 glow-amber'
                          : isTop2
                          ? 'bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950'
                          : isTop3
                          ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                          {team.team_name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                          {team.game === 'brain' ? "Engineer's Brain" : 'Pictionary'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-mono text-slate-400 mt-1">
                        Captain: <strong className="text-slate-200">{team.captain}</strong> • Members: {team.member1}, {team.member2}, {team.member3}
                      </p>
                    </div>
                  </div>

                  {/* Status & Massive Score */}
                  <div className="flex items-center gap-6 sm:gap-10">
                    <div className="hidden sm:block text-right font-mono">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                        team.status.includes('ROUND') 
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40' 
                          : team.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {team.status}
                      </span>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 font-mono tracking-tight">
                        {team.score}
                      </div>
                      <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-400/80 font-bold">
                        POINTS
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom ticker & credit */}
      <div className="relative z-10 pt-4 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          <span>LIVE AUDITORIUM DISPLAY • REFRESH-FREE REAL-TIME SYNC</span>
        </div>
        <div>
          <span>Engineer's Day 2026 | Designed & Developed by <strong className="text-cyan-300">Aditya Shinde</strong></span>
        </div>
      </div>
    </div>
  );
}
