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
  Eye
} from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import PictionaryCanvas from '../../components/PictionaryCanvas';
import { sound } from '../../utils/soundEffects';

export default function PictionaryControlTab() {
  const { pictionarySession } = useSocket();
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [judgeMessage, setJudgeMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [teamsRes, qRes] = await Promise.all([
        api.getTeams({ game: 'pictionary' }),
        api.getQuestions({ game: 'pictionary' })
      ]);
      if (teamsRes.success) {
        setTeams(teamsRes.teams);
        if (teamsRes.teams.length > 0) setSelectedTeamId(teamsRes.teams[0].id);
      }
      if (qRes.success) {
        setQuestions(qRes.questions);
        if (qRes.questions.length > 0) setSelectedQuestionId(qRes.questions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

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

  const handleAssignPrompt = () => {
    if (!selectedQuestionId || !selectedTeamId) return;
    handleAction('SET_QUESTION', { questionId: selectedQuestionId });
    handleAction('SET_TEAM', { teamId: selectedTeamId });
  };

  const { session, question, team: activeSessionTeam } = pictionarySession;
  const timerRemaining = session?.timer_remaining ?? 30;

  const handleJudge = async (isCorrect) => {
    const activeTeam = activeSessionTeam || teams.find(t => t.id === selectedTeamId);
    if (!question || !activeTeam) {
      alert('Active word and active team are required before judging');
      return;
    }

    const elapsed = Math.max(1, 30 - timerRemaining);
    try {
      const res = await api.judgePictionary({
        teamId: activeTeam.id,
        questionId: question.id,
        isCorrect,
        responseTime: elapsed
      });

      setJudgeMessage(res.message);
      if (isCorrect) sound.playCorrect();
      else sound.playWrong();
      setTimeout(() => setJudgeMessage(null), 5000);
    } catch (err) {
      alert(err.message || 'Evaluation error');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            ENGINEERING PICTIONARY CONTROL DESK
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage drawing turns, assign concepts, and score live team guesses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/30">
            SESSION: {session?.status || 'IDLE'}
          </span>
        </div>
      </div>

      {/* Control Actions Deck */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/90 space-y-6">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
          Turn & Concept Assignment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400">Select Active Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.team_name} ({t.score} pts)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400">Select Concept Word</label>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>R{q.round}: {q.correct_answer} ({q.type})</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAssignPrompt}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              Push Team & Concept to Stage
            </button>
          </div>
        </div>

        {/* Timer Trigger & Judge Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('START_TIMER')}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Clock className="w-3.5 h-3.5" />
              Start 30s Timer
            </button>
            <button
              onClick={() => handleAction('PAUSE_TIMER')}
              className="px-3 py-2 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Pause
            </button>
            <button
              onClick={() => handleAction('END_ROUND')}
              className="px-3 py-2 rounded-xl font-semibold text-xs bg-rose-950 text-rose-300 border border-rose-500/30"
            >
              End Turn
            </button>
          </div>

          {/* Judge Evaluation Buttons */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">Judge Action:</span>
            <button
              onClick={() => handleJudge(true)}
              className="px-5 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark CORRECT (+Score)
            </button>
            <button
              onClick={() => handleJudge(false)}
              className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-400 text-white flex items-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <XCircle className="w-4 h-4" />
              Mark WRONG / Pass
            </button>
          </div>
        </div>

        {judgeMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-xs text-center font-bold">
            {judgeMessage}
          </div>
        )}
      </div>

      {/* Live Drawing Stage Monitor */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded border border-indigo-500/30">
              STAGE VIEW
            </span>
            <span className="text-xs font-mono text-slate-400">
              Active Team: <strong className="text-white">{activeSessionTeam?.team_name || 'N/A'}</strong> • Concept: <strong className="text-indigo-300">{question?.correct_answer || 'N/A'}</strong>
            </span>
          </div>

          <div className="text-xs font-mono text-cyan-300 font-bold">
            Timer: {timerRemaining}s
          </div>
        </div>

        {/* Live Canvas (Read Only sync viewer for judge) */}
        <PictionaryCanvas isReadOnly={false} />
      </div>

    </div>
  );
}
