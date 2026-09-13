import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Sparkles, 
  StopCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Crown,
  Trophy,
  ShieldCheck,
  AlertCircle,
  Flame,
  Check
} from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import PictionaryCanvas from '../../components/PictionaryCanvas';
import { sound } from '../../utils/soundEffects';

export default function PictionaryControlTab() {
  const { pictionarySession, socket } = useSocket();
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [showSecretWord, setShowSecretWord] = useState(true);
  const [judgeMessage, setJudgeMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [teamsRes, qRes] = await Promise.all([
        api.getTeams({ registration_status: 'VERIFIED' }),
        api.getQuestions({ game: 'pictionary' })
      ]);
      if (teamsRes.success) {
        setTeams(teamsRes.teams);
        if (teamsRes.teams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamsRes.teams[0].id);
        }
      }
      if (qRes.success) {
        setQuestions(qRes.questions);
        if (qRes.questions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(qRes.questions[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const { session, question, team: activeSessionTeam } = pictionarySession;
  const timerRemaining = session?.timer_remaining ?? 30;
  const isRunning = session?.status === 'RUNNING';
  const isTimeUp = session?.status === 'TIME_UP' || timerRemaining <= 0;
  const isEnded = session?.status === 'ROUND_ENDED';

  // Calculate elapsed time
  const elapsedSec = Math.max(1, 30 - timerRemaining);

  // Selected Team Object
  const selectedTeam = teams.find(t => t.id === selectedTeamId) || activeSessionTeam;
  const activeQuestion = questions.find(q => q.id === selectedQuestionId) || question;

  const handleAction = async (action, extra = {}) => {
    setLoading(true);
    try {
      await api.controlGame('pictionary', { action, ...extra });
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  // Start 30s Game Turn for Selected Team
  const handleStartGameTurn = async () => {
    if (!selectedTeamId) {
      alert('Please select a registered squad to play');
      return;
    }
    if (!selectedQuestionId) {
      alert('Please select an engineering concept/object for this round');
      return;
    }

    setLoading(true);
    try {
      await api.controlGame('pictionary', {
        action: 'START_PICTIONARY_TURN',
        teamId: selectedTeamId,
        questionId: selectedQuestionId
      });
      sound.playCountdown();
      setJudgeMessage(`Game Started! 30s clock running for ${selectedTeam?.team_name}. Draw now!`);
      setTimeout(() => setJudgeMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to start game turn');
    } finally {
      setLoading(false);
    }
  };

  // Finish Round & Award Points (Correct Guess in minimum seconds)
  const handleFinishRound = async (isCorrect) => {
    const targetTeamId = activeSessionTeam?.id || selectedTeamId;
    const targetQId = question?.id || selectedQuestionId;

    if (!targetTeamId || !targetQId) {
      alert('Active team and concept required before finishing');
      return;
    }

    const timeTaken = elapsedSec;
    setLoading(true);
    try {
      const res = await api.judgePictionary({
        teamId: targetTeamId,
        questionId: targetQId,
        isCorrect,
        responseTime: timeTaken
      });

      if (isCorrect) {
        sound.playCorrect();
        setJudgeMessage(`🏆 FINISHED IN ${timeTaken}s! Awarded +${res.totalPoints} PTS (Base ${res.basePoints} + Speed Bonus ${res.timeBonus}) to ${activeSessionTeam?.team_name || selectedTeam?.team_name}!`);
      } else {
        sound.playWrong();
        setJudgeMessage(`Round ended for ${activeSessionTeam?.team_name || selectedTeam?.team_name} (Pass / 0 pts).`);
      }

      // Re-fetch teams to update scores in selector
      fetchDependencies();
      setTimeout(() => setJudgeMessage(null), 7000);
    } catch (err) {
      alert(err.message || 'Error evaluating round');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono uppercase font-bold mb-1">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            PRIMARY EVENT • LIVE JURY DESK
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            ENGINEERING PICTIONARY CONTROL
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Admin Whiteboard drawing, 30s turn dispatch, and speed-tier scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase flex items-center gap-2 border ${
            isRunning 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 animate-pulse'
              : isTimeUp
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : isTimeUp ? 'bg-rose-400' : 'bg-slate-500'}`} />
            STATUS: {session?.status || 'IDLE'}
          </div>
        </div>
      </div>

      {/* TEAM SELECTION & TURN DISPATCH PANEL */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2">
            <Users className="w-4 h-4" />
            1. Select Registered Squad & Drawing Concept
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {teams.length} Registered Squads Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* SQUAD SELECTOR */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
              <span>Choose Playing Squad (Team on Stage) *</span>
              {selectedTeam && (
                <span className="text-cyan-300 font-bold">
                  Score: {selectedTeam.score} PTS
                </span>
              )}
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
            >
              {teams.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  {idx + 1}. {t.team_name} (Capt: {t.captain}) — {t.score} PTS
                </option>
              ))}
            </select>

            {selectedTeam && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Members: {selectedTeam.member1}, {selectedTeam.member2}, {selectedTeam.member3}</span>
                <span className="text-emerald-400 font-bold">● Active Squad</span>
              </div>
            )}
          </div>

          {/* CONCEPT / OBJECT SELECTOR */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
              <span>Choose Object / Schematic to Draw *</span>
              <button
                type="button"
                onClick={() => setShowSecretWord(!showSecretWord)}
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {showSecretWord ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecretWord ? 'Hide Word' : 'Reveal Word'}</span>
              </button>
            </label>

            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-400"
            >
              {questions.map((q, idx) => (
                <option key={q.id} value={q.id}>
                  Round {q.round} #{idx + 1}: {q.correct_answer} ({q.type || 'Schematic'})
                </option>
              ))}
            </select>

            {activeQuestion && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono flex items-center justify-between">
                <span className="text-slate-400">Secret Word:</span>
                <span className="text-sm font-black text-amber-300 font-heading">
                  {showSecretWord ? activeQuestion.correct_answer : '••••••••••••••••'}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* START GAME & FINISH ROUND CONTROL BAR */}
        <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Start 30s Game Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleStartGameTurn}
            className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-sm font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START 30s GAME FOR {selectedTeam?.team_name || 'TEAM'}</span>
          </button>

          {/* LIVE TIMER CLOCK DISPLAY */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${
              timerRemaining <= 5 && isRunning
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-500/30'
                : isRunning
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-700 text-slate-400'
            }`}>
              <Clock className={`w-6 h-6 ${isRunning ? 'animate-spin text-emerald-400' : ''}`} />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  30s Round Clock
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  00:{String(timerRemaining).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Stop Clock button if running */}
            {isRunning && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('STOP_TIMER')}
                className="px-3.5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Stop the 30-second clock"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Clock</span>
              </button>
            )}

            {/* FINISH BUTTON (When team finishes/guesses in minimum seconds) */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFinishRound(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-sm font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-40 hover:scale-[1.02]"
              title="Click when team correctly guesses the object to stop the clock, calculate points, and update live dashboard"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>🏁 FINISH & CALCULATE POINTS</span>
            </button>

            {/* Time Over / Pass Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFinishRound(false)}
              className="px-4 py-3 rounded-2xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="End round with 0 points"
            >
              <XCircle className="w-4 h-4" />
              <span>Pass / 0 Pts</span>
            </button>
          </div>

        </div>

        {/* Feedback Message */}
        {judgeMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-mono text-xs text-center font-bold animate-in fade-in duration-200 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{judgeMessage}</span>
          </div>
        )}
      </div>

      {/* ADMIN WHITEBOARD (DRAWING TOOLS - ADMIN ONLY) */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/90 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-heading">
                  Admin Whiteboard Drawing Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950 uppercase">
                  ADMIN ONLY CAN DRAW
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Draw the secret concept here. Your strokes stream to all student screens in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span>Playing Squad: <strong className="text-cyan-300">{activeSessionTeam?.team_name || selectedTeam?.team_name || 'None Selected'}</strong></span>
            <span>•</span>
            <span>Target Word: <strong className="text-amber-300 font-bold">{question?.correct_answer || activeQuestion?.correct_answer || 'None'}</strong></span>
          </div>
        </div>

        {/* Whiteboard with Drawing Controls */}
        <div className="relative">
          <PictionaryCanvas isReadOnly={false} />
        </div>
      </div>

    </div>
  );
}
