import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  StopCircle, 
  Brain, 
  Clock, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Trophy,
  RefreshCw 
} from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function BrainControlTab() {
  const { brainSession } = useSocket();
  const [questions, setQuestions] = useState([]);
  const [monitor, setMonitor] = useState({
    answersCount: 0,
    totalTeams: 0,
    fastestAnswer: null,
    correctCount: 0,
    wrongCount: 0,
    leader: 'N/A',
    recentAnswers: []
  });
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await api.getQuestions({ game: 'brain' });
      if (res.success) setQuestions(res.questions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonitor = async () => {
    try {
      const res = await api.getGameMonitor('brain');
      if (res.success) setMonitor(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action, extra = {}) => {
    setLoading(true);
    try {
      await api.controlGame('brain', { action, ...extra });
      fetchMonitor();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const { session, question } = brainSession;
  const timerRemaining = session?.timer_remaining ?? 30;

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            ENGINEER’S BRAIN CONTROL CONSOLE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Real-time stage orchestration, question pushing, and timer triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            SESSION: {session?.status || 'IDLE'}
          </span>
        </div>
      </div>

      {/* Control Buttons Deck */}
      <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/90 space-y-6">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
          Stage Control Actions
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleAction('START_GAME')}
            disabled={loading}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Game (R1 Q1)
          </button>

          <button
            onClick={() => handleAction('START_TIMER')}
            disabled={loading}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            Start / Trigger Timer
          </button>

          {session?.is_paused ? (
            <button
              onClick={() => handleAction('RESUME_TIMER')}
              disabled={loading}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Resume Timer
            </button>
          ) : (
            <button
              onClick={() => handleAction('PAUSE_TIMER')}
              disabled={loading}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pause Timer
            </button>
          )}

          <button
            onClick={() => handleAction('NEXT_QUESTION')}
            disabled={loading}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            Next Question
          </button>

          <button
            onClick={() => handleAction('RESTART_QUESTION')}
            disabled={loading}
            className="px-4 py-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Question
          </button>

          <button
            onClick={() => handleAction('END_ROUND')}
            disabled={loading}
            className="px-4 py-3 rounded-xl font-semibold text-xs bg-rose-950 text-rose-300 border border-rose-500/30 hover:bg-rose-900 flex items-center gap-2 disabled:opacity-50"
          >
            <StopCircle className="w-4 h-4" />
            End Round
          </button>

          <button
            onClick={() => handleAction('END_GAME')}
            disabled={loading}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 flex items-center gap-2 disabled:opacity-50 ml-auto"
          >
            <Trophy className="w-4 h-4" />
            Finalize Game
          </button>
        </div>

        {/* Round switchers */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Jump to Round:</span>
          {[1, 2, 3].map((r) => (
            <button
              key={r}
              onClick={() => handleAction('START_ROUND', { round: r })}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                session?.round === r
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Round {r}
            </button>
          ))}
        </div>
      </div>

      {/* Live Monitor Telemetry (Section 33) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Submissions Received</span>
          <div className="text-3xl font-black text-cyan-300 font-mono mt-1">
            {monitor.answersCount} / {monitor.totalTeams}
          </div>
          <span className="text-xs text-slate-400 font-mono">Participating Teams</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Fastest Response</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-2 line-clamp-1">
            {monitor.fastestAnswer ? `${monitor.fastestAnswer.teamName} (${monitor.fastestAnswer.time}s)` : 'Awaiting...'}
          </div>
          <span className="text-xs text-slate-400 font-mono">+5 Bonus Points Tier</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Accuracy Ratio</span>
          <div className="text-2xl font-black text-white font-mono mt-1 flex items-center gap-3">
            <span className="text-emerald-400 font-bold">{monitor.correctCount} Correct</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-bold">{monitor.wrongCount} Wrong</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Current Question</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Current Game Leader</span>
          <div className="text-lg font-black text-amber-300 font-mono mt-2 line-clamp-1">
            {monitor.leader || 'N/A'}
          </div>
          <span className="text-xs text-slate-400 font-mono">Rank 1 Standing</span>
        </div>
      </div>

      {/* Currently Broadcast Question Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              ACTIVE QUESTION • ROUND {session?.round || 1}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Timer: <strong>{timerRemaining}s remaining</strong>
            </span>
          </div>

          {/* Manually pick question dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-mono hidden sm:inline">Force Push:</label>
            <select
              onChange={(e) => {
                if (e.target.value) handleAction('SET_QUESTION', { questionId: e.target.value });
              }}
              value={question?.id || ''}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
            >
              <option value="">Select Question...</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  R{q.round}: {q.question.substring(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {question ? (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white font-heading">
              {question.question}
            </h3>
            <p className="text-xs font-mono text-emerald-400">
              Correct Answer: <strong>{question.correct_answer}</strong>
            </p>
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-500">No question active right now.</p>
        )}
      </div>

    </div>
  );
}
