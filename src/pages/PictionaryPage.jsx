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
  AlertCircle 
} from 'lucide-react';
import PictionaryCanvas from '../components/PictionaryCanvas';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { sound } from '../utils/soundEffects';

export default function PictionaryPage({ setCurrentPage }) {
  const { pictionarySession } = useSocket();
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showSecretWord, setShowSecretWord] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeMessage, setJudgeMessage] = useState(null);

  // Load Pictionary teams
  useEffect(() => {
    api.getTeams({ game: 'pictionary', registration_status: 'VERIFIED' })
      .then((res) => {
        if (res.success && res.teams.length > 0) {
          setTeams(res.teams);
          setSelectedTeamId(res.teams[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const { session, question, team: activeSessionTeam } = pictionarySession;
  const timerRemaining = session?.timer_remaining ?? 30;
  const isTimeUp = session?.status === 'TIME_UP' || timerRemaining <= 0;

  const currentTeam = activeSessionTeam || teams.find(t => t.id === selectedTeamId);

  // Admin / Judge evaluation
  const handleJudge = async (isCorrect) => {
    if (!question || !currentTeam || isJudging) return;
    setIsJudging(true);

    const elapsed = Math.max(1, 30 - timerRemaining);
    try {
      const res = await api.judgePictionary({
        teamId: currentTeam.id,
        questionId: question.id,
        isCorrect,
        responseTime: elapsed
      });

      setJudgeMessage(res.message);
      if (isCorrect) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
      setTimeout(() => setJudgeMessage(null), 5000);
    } catch (err) {
      alert(err.message || 'Judging failed');
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-heading tracking-wide">
              ENGINEERING PICTIONARY ARENA
            </h1>
            <p className="text-xs font-mono text-indigo-400">
              ROUND {session?.round || 1} • LIVE CANVAS
            </p>
          </div>
        </div>

        {/* Current Team Display & Stopwatch */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-slate-400">Active Team</p>
            <p className="text-sm font-bold text-white font-heading">
              {currentTeam?.team_name || 'Selecting Squad...'}
            </p>
          </div>

          {/* Stopwatch */}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${
            timerRemaining <= 5 && timerRemaining > 0
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-950 border-indigo-500/40 text-indigo-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-xl font-black font-mono">
              00:{String(timerRemaining).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Secret Word Prompt (For the designated Drawer or Admin) */}
      {question ? (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              {question.type}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Concept to Draw:</span>
              <span className="text-base font-bold text-white font-heading">
                {showSecretWord ? question.correct_answer : '••••••••••••••••'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowSecretWord(!showSecretWord)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
          >
            {showSecretWord ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSecretWord ? 'Hide Secret Word' : 'Reveal Word (Drawer Only)'}
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono text-center">
          No active word broadcast. Admin can assign and start a word from the Admin Control Panel.
        </div>
      )}

      {/* Interactive Digital Canvas */}
      <div className="space-y-4">
        <PictionaryCanvas />
      </div>

      {/* Admin / Judge Evaluation Panel */}
      {isAuthenticated && question && (
        <div className="glass-card p-5 rounded-2xl border border-indigo-500/40 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Judge / Convener Controls
            </h4>
            <p className="text-xs text-slate-400">
              Evaluating: <strong className="text-white">{currentTeam?.team_name}</strong> • Word: <strong className="text-indigo-300">{question.correct_answer}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleJudge(true)}
              disabled={isJudging}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark CORRECT
            </button>

            <button
              onClick={() => handleJudge(false)}
              disabled={isJudging}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center gap-2 shadow-md shadow-rose-500/20"
            >
              <XCircle className="w-4 h-4" />
              Mark WRONG / Pass
            </button>
          </div>
        </div>
      )}

      {/* Evaluation Toast feedback */}
      {judgeMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-center font-mono text-xs animate-fade-in font-bold">
          {judgeMessage}
        </div>
      )}

    </div>
  );
}
