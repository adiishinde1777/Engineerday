import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Clock, 
  Trophy, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ShieldCheck, 
  AlertCircle,
  Lock,
  ArrowRight,
  ChevronLeft,
  Zap,
  Sparkles,
  Flame,
  Crown,
  Volume2,
  Tv,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PictionaryCanvas from '../components/PictionaryCanvas';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useSquad } from '../context/SquadContext';
import { api } from '../utils/api';
import { sound } from '../utils/soundEffects';

export default function PictionaryPage({ setCurrentPage }) {
  const { pictionarySession, socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const { currentSquad, isSquadRegistered, loginSquad, logoutSquad } = useSquad();

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showSecretWord, setShowSecretWord] = useState(false);
  const [adminSecretQuestion, setAdminSecretQuestion] = useState(null);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeMessage, setJudgeMessage] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  // Quick verification in gate
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Load Pictionary teams
  const fetchTeams = () => {
    api.getTeams({ game: 'pictionary', registration_status: 'VERIFIED' })
      .then((res) => {
        if (res.success && res.teams.length > 0) {
          setTeams(res.teams);
          if (currentSquad && currentSquad.id && (currentSquad.game === 'pictionary' || currentSquad.game === 'both')) {
            setSelectedTeamId(currentSquad.id);
          } else {
            setSelectedTeamId(res.teams[0].id);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTeams();
  }, [currentSquad]);

  const { session, question, team: activeSessionTeam } = pictionarySession;
  const timerRemaining = session?.timer_remaining ?? 30;
  const isRunning = session?.status === 'RUNNING';
  const isTimeUp = session?.status === 'TIME_UP' || timerRemaining <= 0;
  const isEnded = session?.status === 'ROUND_ENDED';

  // Identify playing team
  const currentTeam = currentSquad || activeSessionTeam || teams.find(t => t.id === selectedTeamId);

  // When admin is logged in, securely fetch unmasked question details
  useEffect(() => {
    if (isAuthenticated && question?.id) {
      api.getQuestion(question.id)
        .then(res => {
          if (res.success && res.question) {
            setAdminSecretQuestion(res.question);
          }
        })
        .catch(console.error);
    } else {
      setAdminSecretQuestion(null);
    }
  }, [isAuthenticated, question?.id]);

  // Listen to socket round finished event
  useEffect(() => {
    if (!socket) return;

    const handleRoundFinished = (data) => {
      setRoundResult(data);
      if (data.isCorrect) {
        try {
          confetti({
            particleCount: 130,
            spread: 85,
            origin: { y: 0.6 }
          });
        } catch {}
        sound.playCorrect();
      } else {
        sound.playWrong();
      }

      // Re-fetch teams to update live points
      fetchTeams();

      // Clear toast after 8 seconds
      setTimeout(() => {
        setRoundResult(null);
      }, 8000);
    };

    socket.on('pictionary_round_finished', handleRoundFinished);
    return () => {
      socket.off('pictionary_round_finished', handleRoundFinished);
    };
  }, [socket]);

  // Admin evaluation / finish from arena page
  const handleJudge = async (isCorrect) => {
    const targetTeam = activeSessionTeam || currentTeam;
    if (!question || !targetTeam || isJudging) return;
    setIsJudging(true);

    const elapsed = Math.max(1, 30 - timerRemaining);
    try {
      const res = await api.judgePictionary({
        teamId: targetTeam.id,
        questionId: question.id,
        isCorrect,
        responseTime: elapsed
      });

      setJudgeMessage(res.message);
      if (isCorrect) sound.playCorrect();
      else sound.playWrong();
      fetchTeams();
      setTimeout(() => setJudgeMessage(null), 5000);
    } catch (err) {
      alert(err.message || 'Judging failed');
    } finally {
      setIsJudging(false);
    }
  };

  const handleGateVerify = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setVerifyLoading(true);
    setVerifyError('');

    try {
      const res = await api.verifySquad(verifyInput.trim(), verifyPassword.trim());
      if (res.success && res.squad) {
        if (res.squad.game === 'brain') {
          setVerifyError(`Squad "${res.squad.team_name}" is registered ONLY for Engineer's Brain. You cannot participate in Engineering Pictionary.`);
          return;
        }
        loginSquad(res.squad);
        sound.playCorrect();
      } else {
        setVerifyError(res.message || 'Squad verification failed');
      }
    } catch (err) {
      setVerifyError(err.message || 'No registered squad found. Please check team name or password.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // RESTRICTED ACCESS SCREEN: If squad is registered ONLY for Engineer's Brain
  if (!isAuthenticated && isSquadRegistered && currentSquad?.game === 'brain') {
    return (
      <div className="py-16 max-w-xl mx-auto px-4">
        <div className="glass-card p-8 sm:p-10 rounded-3xl border-2 border-rose-500/50 bg-slate-900 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
              ACCESS RESTRICTED • WRONG ARENA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Registered for Brain Game Only
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Squad <strong className="text-white">{currentSquad.team_name}</strong> is registered exclusively for <span className="text-cyan-400 font-semibold">Engineer’s Brain</span>. You do not have permission to play or view Engineering Pictionary.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setCurrentPage('brain-arena')}
              className="w-full py-3.5 rounded-2xl font-bold text-sm font-mono text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Go to Engineer’s Brain Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={logoutSquad}
              className="w-full py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Switch Squad or Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GATE SCREEN: If not registered squad and not admin, prompt them to verify or register
  if (!isSquadRegistered && !isAuthenticated) {
    return (
      <div className="py-12 max-w-xl mx-auto px-4">
        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-indigo-500/30 bg-slate-900/90 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
            <Palette className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono uppercase font-bold">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              PRIMARY TOURNAMENT EVENT
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Engineering Pictionary Arena
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Please verify your squad credentials or register your 3-member team to enter the live arena.
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleGateVerify} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Squad Name or Captain Mobile *</label>
              <input
                type="text"
                required
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="e.g. VLSI Titans or 9876543210"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Squad Access Password *</label>
              <div className="relative">
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  required
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  placeholder="Enter your squad password"
                  className="w-full p-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showVerifyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyLoading}
              className="w-full py-2.5 rounded-xl font-mono text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {verifyLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Verify & Enter Pictionary Arena</span>
            </button>

            {verifyError && (
              <p className="text-[11px] text-rose-400 font-mono pt-1 text-center">{verifyError}</p>
            )}
          </form>

          {/* Action Links */}
          <div className="space-y-2 pt-1">
            {setCurrentPage && (
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="w-full py-3 rounded-xl font-mono font-bold text-xs bg-gradient-to-r from-indigo-400 to-sky-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <span>REGISTER SQUAD NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {setCurrentPage && (
              <button
                type="button"
                onClick={() => setCurrentPage('games')}
                className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Games Rules</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Arena Screen
  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* SQUAD SCORE & LIVE TELEMETRY DASHBOARD */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          {/* Squad Brand & Details */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg shadow-indigo-500/20">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 uppercase">
                  ENGINEERING PICTIONARY • PRIMARY EVENT
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                  isRunning 
                    ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                    : isTimeUp
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {isRunning ? '● 30s TURN IN PLAY' : isTimeUp ? '⏰ TIME OVER' : isEnded ? '✓ ROUND COMPLETED' : 'READY ON STAGE'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-heading mt-1">
                {currentTeam?.team_name || 'Tournament Squad'}
              </h1>
              <p className="text-xs font-mono text-slate-400">
                Captain: <strong className="text-slate-200">{currentTeam?.captain || 'Captain'}</strong> • Members: {currentTeam?.member1}, {currentTeam?.member2}, {currentTeam?.member3}
              </p>
            </div>
          </div>

          {/* SQUAD POINTS METRIC BADGE */}
          <div className="flex items-center gap-4 self-end md:self-auto">
            
            {/* Total Points Display */}
            <div className="p-3.5 px-6 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-center shadow-lg shadow-cyan-500/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">
                TOTAL SQUAD POINTS
              </span>
              <div className="text-3xl font-black font-mono text-cyan-300 tracking-tight flex items-center justify-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>{currentTeam?.score ?? 0}</span>
                <span className="text-xs text-slate-400 font-normal">PTS</span>
              </div>
            </div>

            {/* 30-Second Countdown Clock */}
            <div className={`flex items-center gap-3 p-3.5 px-5 rounded-2xl border-2 transition-all ${
              timerRemaining <= 5 && isRunning
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-xl shadow-rose-500/30'
                : isRunning
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-xl shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Clock className={`w-7 h-7 ${isRunning ? 'animate-spin text-emerald-400' : ''}`} />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">
                  30s Round Clock
                </span>
                <span className="text-2xl font-black font-mono tracking-tight text-white">
                  00:{String(timerRemaining).padStart(2, '0')}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Turn Advisory Subtitle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              {isRunning
                ? "👀 Admin is sketching live! Watch the whiteboard and shout your guess to the jury!"
                : isTimeUp
                  ? "⏰ 30-Second time limit expired for this round."
                  : isEnded
                    ? "✓ Turn completed. Standby for jury confirmation."
                    : "Standby on stage. The jury will start the 30-second sketching clock shortly."}
            </span>
          </div>

          <div className="text-slate-400">
            Speed Tier Reward: <strong className="text-cyan-300">10 Base PTS + Up to +5 Speed Bonus</strong>
          </div>
        </div>
      </div>

      {/* ROUND FINISHED CELEBRATION TOAST */}
      {roundResult && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-slate-950 uppercase">
                    ROUND RESULT CONFIRMED
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Concept: <strong className="text-white">{roundResult.concept || 'Engineering Concept'}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white font-heading mt-1">
                  {roundResult.isCorrect 
                    ? `🎉 Correct Guess in ${roundResult.responseTime}s!` 
                    : `Round Ended (Pass / 0 pts)`}
                </h3>
                <p className="text-xs font-mono text-slate-300">
                  Points Awarded: <strong className="text-emerald-300 font-bold">+{roundResult.totalPoints} PTS</strong> (Base: {roundResult.basePoints}, Speed Bonus: {roundResult.timeBonus}) • New Squad Total: <strong className="text-cyan-300 font-bold">{roundResult.newScore} PTS</strong>
                </p>
              </div>
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-mono font-black text-sm uppercase tracking-wider">
              +{roundResult.totalPoints} POINTS
            </div>
          </div>
        </div>
      )}

      {/* Secret Word Display: ADMIN ONLY */}
      {isAuthenticated && (question || adminSecretQuestion) && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              ROUND {(adminSecretQuestion || question).round} • {(adminSecretQuestion || question).type || 'Schematic'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Concept to Draw:</span>
              <span className="text-base font-bold text-white font-heading">
                {showSecretWord ? ((adminSecretQuestion && adminSecretQuestion.correct_answer) || question?.correct_answer || 'Secret Concept') : '••••••••••••••••'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSecretWord(!showSecretWord)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            {showSecretWord ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSecretWord ? 'Hide Secret Word' : 'Reveal Word (Admin Only)'}</span>
          </button>
        </div>
      )}

      {/* WHITEBOARD CANVAS SECTION */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl space-y-3 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {isAuthenticated ? "ADMIN WHITEBOARD STUDIO (Drawing Enabled)" : "LIVE JURY WHITEBOARD STREAM (View Only)"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Current Stage: <strong className="text-white">{currentTeam?.team_name || 'Squad'}</strong></span>
            {isAuthenticated && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                ADMIN DRAWER
              </span>
            )}
          </div>
        </div>

        {/* 
          CRITICAL: Whiteboard is VIEW-ONLY for everyone except logged-in Admin!
          Normal teams do NOT have drawing tools or pencil options.
        */}
        <div className="relative overflow-hidden rounded-2xl">
          <PictionaryCanvas 
            isReadOnly={!isAuthenticated} 
          />
        </div>
      </div>

      {/* ADMIN FINISH & JURY CONTROLS (Visible ONLY if Admin is logged in) */}
      {isAuthenticated && (
        <div className="glass-card p-6 rounded-3xl border-2 border-indigo-500/40 bg-slate-950/90 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 uppercase font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Admin On-Stage Control & Finish Button
            </span>
            {judgeMessage && (
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {judgeMessage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* The Big Finish Button */}
            <button
              type="button"
              disabled={isJudging || !question}
              onClick={() => handleJudge(true)}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-sm font-mono tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>🏁 FINISH ROUND & CALCULATE POINTS</span>
            </button>

            {/* Pass / Time Expired Button */}
            <button
              type="button"
              disabled={isJudging || !question}
              onClick={() => handleJudge(false)}
              className="px-6 py-3.5 rounded-2xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" />
              <span>Pass / 0 Pts</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
