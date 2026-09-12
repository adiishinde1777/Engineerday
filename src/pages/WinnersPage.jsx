import React, { useEffect, useState } from 'react';
import { Trophy, Award, Sparkles, Star, Users, Brain, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export default function WinnersPage({ eventSettings }) {
  const [brainWinners, setBrainWinners] = useState([]);
  const [pictionaryWinners, setPictionaryWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    Promise.all([
      api.getTeams({ game: 'brain' }),
      api.getTeams({ game: 'pictionary' })
    ]).then(([brainRes, picRes]) => {
      if (brainRes.success) setBrainWinners(brainRes.teams.slice(0, 3));
      if (picRes.success) setPictionaryWinners(picRes.teams.slice(0, 3));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const renderPodium = (teams, gameTitle, icon) => {
    const first = teams[0] || null;
    const second = teams[1] || null;
    const third = teams[2] || null;

    if (!first) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-heading">{gameTitle}</h2>
              <p className="text-xs font-mono text-slate-400">Tournament Standing</p>
            </div>
          </div>
          <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center text-slate-400 font-mono text-xs bg-slate-900/60">
            No winners finalized yet for {gameTitle}. Once teams compete and scores are submitted, the podium champions will be crowned here live!
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-heading">{gameTitle}</h2>
            <p className="text-xs font-mono text-slate-400">Tournament Champions</p>
          </div>
        </div>

        {/* Podium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* 2nd Place */}
          {second && (
            <div className="glass-card p-6 rounded-3xl border border-slate-700 bg-slate-900/80 text-center space-y-4 md:mt-8 order-2 md:order-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg">
                🥈 2nd
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-heading">{second.team_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Capt: {second.captain}</p>
                <p className="text-xs text-slate-500 mt-1">{second.member1}, {second.member2}, {second.member3}</p>
              </div>
              <div className="pt-3 border-t border-slate-800 text-cyan-300 font-black text-xl font-mono">
                {second.score} <span className="text-xs text-slate-400 font-normal">PTS</span>
              </div>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {first && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 text-center space-y-4 shadow-2xl shadow-amber-500/20 order-1 md:order-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-xl glow-amber animate-pulse-glow">
                🥇 1st
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  CHAMPIONS
                </span>
                <h3 className="text-2xl font-black text-white font-heading mt-2">{first.team_name}</h3>
                <p className="text-xs text-amber-300 font-mono mt-0.5">Captain: {first.captain}</p>
                <p className="text-xs text-slate-400 mt-1">{first.member1}, {first.member2}, {first.member3}</p>
              </div>
              <div className="pt-4 border-t border-amber-500/30 text-amber-300 font-black text-3xl font-mono">
                {first.score} <span className="text-sm text-slate-400 font-normal">PTS</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="glass-card p-6 rounded-3xl border border-amber-800/40 bg-slate-900/80 text-center space-y-4 md:mt-12 order-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg">
                🥉 3rd
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-heading">{third.team_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Capt: {third.captain}</p>
                <p className="text-xs text-slate-500 mt-1">{third.member1}, {third.member2}, {third.member3}</p>
              </div>
              <div className="pt-3 border-t border-slate-800 text-cyan-300 font-black text-xl font-mono">
                {third.score} <span className="text-xs text-slate-400 font-normal">PTS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          HALL OF FAME • 15 SEPTEMBER 2026
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Engineers’ Day 2026 Champions
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Celebrating the victorious squads who demonstrated peerless speed, technical precision, and creative ingenuity.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Calculating grand results...
        </div>
      ) : (
        <div className="space-y-16">
          {renderPodium(brainWinners, "ENGINEER’S BRAIN WINNERS", <Brain className="w-5 h-5" />)}
          <div className="border-t border-slate-800"></div>
          {renderPodium(pictionaryWinners, "ENGINEERING PICTIONARY WINNERS", <Palette className="w-5 h-5" />)}
        </div>
      )}
    </div>
  );
}
