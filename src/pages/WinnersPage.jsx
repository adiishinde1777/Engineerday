import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Star, 
  Users, 
  Brain, 
  Palette, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Clock, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function WinnersPage({ eventSettings, setCurrentPage, onSettingsUpdated }) {
  const { isAuthenticated } = useAuth();
  const [brainWinners, setBrainWinners] = useState([]);
  const [pictionaryWinners, setPictionaryWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSettings, setLocalSettings] = useState(eventSettings || {});
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch latest settings and winner squads
  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.eventSettings) {
          setLocalSettings(res.eventSettings);
          if (onSettingsUpdated) onSettingsUpdated(res.eventSettings);
        }
      })
      .catch(console.error);

    Promise.all([
      api.getTeams({ game: 'brain' }),
      api.getTeams({ game: 'pictionary' })
    ])
      .then(([brainRes, picRes]) => {
        if (brainRes.success) setBrainWinners(brainRes.teams.slice(0, 3));
        if (picRes.success) setPictionaryWinners(picRes.teams.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isPublished = Boolean(
    localSettings?.winnersFinalized === 'true' || 
    localSettings?.winnersFinalized === true || 
    localSettings?.winnersFinalized === '1'
  );

  // Trigger celebratory confetti if published
  useEffect(() => {
    if (isPublished && !loading) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [isPublished, loading]);

  // Admin Publish / Hide Handler
  const handleTogglePublish = async (publish) => {
    setIsPublishing(true);
    try {
      const updated = {
        ...localSettings,
        winnersFinalized: publish ? 'true' : 'false'
      };
      const res = await api.updateEventSettings(updated);
      if (res.success) {
        setLocalSettings(updated);
        if (onSettingsUpdated) onSettingsUpdated(updated);
        if (publish) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
      } else {
        alert(res.message || 'Failed to update publication status');
      }
    } catch (err) {
      alert(err.message || 'Error updating winners publication');
    } finally {
      setIsPublishing(false);
    }
  };

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
            No squads registered or scores submitted yet for {gameTitle}. Once matches conclude, the podium champions will be crowned here live!
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
            <p className="text-xs font-mono text-slate-400">Official Tournament Champions</p>
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

  // Case 1: NOT Published AND NOT Admin -> Show High-Tech Locked State
  if (!isPublished && !isAuthenticated) {
    return (
      <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-14 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-center space-y-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Circuit Background */}
          <div className="absolute inset-0 bg-circuit-pattern opacity-10 pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Animated Lock Shield */}
          <div className="relative z-10 mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border-2 border-amber-400/60 flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Lock className="w-12 h-12 text-amber-400 animate-pulse" />
          </div>

          <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              OFFICIAL RESULTS SEALED • CONFIDENTIAL EVALUATION
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              Podium Champions Under Seal
            </h1>
            <p className="text-base text-slate-300 leading-relaxed pt-1">
              Tournament scores and grand winners are currently under confidential evaluation by the Faculty Jury and Steering Committee. 
              The official champions will be revealed here live once announced by the Administration.
            </p>
          </div>

          {/* Status Box */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Event Status</span>
              <div className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Results Pending
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Auditing Body</span>
              <div className="text-sm font-bold text-cyan-300 truncate">
                VLSI Faculty Jury
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Live Broadcast</span>
              <div className="text-sm font-bold text-emerald-400">
                Auditorium & Online
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="relative z-10 pt-4 flex flex-wrap items-center justify-center gap-4">
            {setCurrentPage && (
              <button
                type="button"
                onClick={() => setCurrentPage('live-dashboard')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <span>CHECK LIVE DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Either Published OR Viewed by Admin
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* ADMIN CONTROL / PREVIEW BANNER */}
      {isAuthenticated && (
        <div className={`p-6 rounded-3xl border-2 transition-all ${
          isPublished 
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl shadow-emerald-500/10' 
            : 'bg-amber-950/40 border-amber-500/60 shadow-2xl shadow-amber-500/20'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isPublished 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {isPublished ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    ADMIN PRIVILEGE ACTIVE
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                    isPublished 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {isPublished ? '● PUBLICLY VISIBLE' : '🔒 HIDDEN FROM GENERAL PUBLIC'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {isPublished
                    ? 'The official winners podium is currently published and viewable by all students and visitors.'
                    : 'The winners podium is currently hidden from general visitors. Only logged-in administrators can preview this.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {!isPublished ? (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => handleTogglePublish(true)}
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isPublishing ? 'PUBLISHING...' : 'PUBLISH WINNERS TO PUBLIC NOW'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => handleTogglePublish(false)}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <span>{isPublishing ? 'UPDATING...' : 'HIDE FROM PUBLIC (LOCK RESULTS)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-wider shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          HALL OF FAME • OFFICIAL PODIUM
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
          Engineer's Day 2026 Champions
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Celebrating the victorious squads who demonstrated peerless speed, technical precision, and creative ingenuity.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Calculating grand results & podium standings...
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
