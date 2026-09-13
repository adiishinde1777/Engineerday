import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  StopCircle, 
  Brain, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Trophy,
  RefreshCw,
  Sparkles,
  Users,
  Check,
  Send,
  HelpCircle,
  Clock,
  Radio
} from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { sound } from '../../utils/soundEffects';

export default function BrainControlTab() {
  const { brainSession, socket } = useSocket();
  const [questions, setQuestions] = useState([]);
  const [monitor, setMonitor] = useState({
    round: 1,
    totalQuestions: 6,
    totalTeams: 0,
    activeTeamsCount: 0,
    completedTeamsCount: 0,
    leader: 'N/A',
    teamsProgress: [],
    recentAnswers: []
  });
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

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
    const interval = setInterval(fetchMonitor, 1500);
    return () => clearInterval(interval);
  }, []);

  // Live WebSocket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchMonitor();
    };

    socket.on('new_answer_submitted', handleUpdate);
    socket.on('team_progress_update', handleUpdate);
    socket.on('brain_round_finished', handleUpdate);
    socket.on('scoreboard_updated', handleUpdate);

    return () => {
      socket.off('new_answer_submitted', handleUpdate);
      socket.off('team_progress_update', handleUpdate);
      socket.off('brain_round_finished', handleUpdate);
      socket.off('scoreboard_updated', handleUpdate);
    };
  }, [socket]);

  const handleAction = async (action, extra = {}) => {
    setLoading(true);
    try {
      await api.controlGame('brain', { action, ...extra });
      fetchMonitor();
      if (action === 'STOP_GAME') {
        setActionSuccessMsg('Game stopped! Final points calculated for all teams and Live Dashboard updated.');
        sound.playCorrect();
      } else if (action === 'START_GAME') {
        setActionSuccessMsg('Round 1 Game Started! Teams can now answer questions.');
      }
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const { session } = brainSession;
  const isRunning = session?.status === 'RUNNING';
  const isTimeUp = session?.status === 'TIME_UP';

  const teamsList = monitor.teamsProgress || [];

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase font-bold mb-2">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            ENGINEER’S BRAIN • LIVE STAGE CONTROL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            Live Squad Progress & Scoring Monitor
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Real-time telemetry showing each team's current question number, live score, and accuracy.
          </p>
        </div>

        {/* Live Status Pill & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border text-xs font-mono font-bold uppercase flex items-center gap-2 shadow-lg ${
            isRunning
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-500/20 animate-pulse'
              : isTimeUp
                ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : isTimeUp ? 'bg-rose-400' : 'bg-slate-500'
            }`} />
            STATUS: {session?.status || 'IDLE'}
          </div>

          {!isRunning ? (
            <button
              onClick={() => handleAction('START_GAME')}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs font-mono uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Game (Round 1)</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('STOP_GAME')}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs font-mono uppercase bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50 animate-pulse"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop Game & Calculate Dashboard</span>
            </button>
          )}

          <button
            onClick={fetchMonitor}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Teams"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-cyan-950/90 border-2 border-cyan-500 text-cyan-200 font-mono text-xs flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="font-bold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* STATS OVERVIEW DECK */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/90 text-center space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Squads</div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {teamsList.length}
          </div>
          <p className="text-[10px] font-mono text-slate-500">Registered Brain Teams</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 bg-slate-900/90 text-center space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">Active Solvers</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
            {monitor.activeTeamsCount || teamsList.filter(t => t.answeredCount > 0 && !t.isCompleted).length}
          </div>
          <p className="text-[10px] font-mono text-cyan-400/80">Currently Answering</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-slate-900/90 text-center space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">Completed Squads</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
            {monitor.completedTeamsCount || teamsList.filter(t => t.isCompleted).length}
          </div>
          <p className="text-[10px] font-mono text-emerald-400/80">Submitted All Questions</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 text-center space-y-1">
          <div className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Tournament Leader</div>
          <div className="text-lg sm:text-xl font-black text-amber-300 font-mono truncate px-1">
            {monitor.leader || 'N/A'}
          </div>
          <p className="text-[10px] font-mono text-amber-400/80">Highest Scorer</p>
        </div>

      </div>

      {/* LIVE TEAM PROGRESS & SCORING TABLE (MAIN USER REQUEST) */}
      <div className="glass-card p-6 rounded-3xl border-2 border-cyan-500/40 bg-slate-900/95 shadow-2xl space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-heading">
                All Squads Live Progress & Scoring
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Real-time indicator showing which question each team is on and their current points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE AUTO-SYNC
            </span>
          </div>
        </div>

        {/* Squads Progress Grid / Table */}
        {teamsList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto opacity-40 text-cyan-400" />
            <p className="text-sm font-mono">No verified squads found for Engineer's Brain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamsList.map((team, idx) => {
              const isDone = team.isCompleted;
              const isSolving = team.status === 'SOLVING' || (!isDone && team.answeredCount > 0);

              return (
                <div
                  key={team.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3.5 shadow-lg ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-950/30'
                      : isSolving
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  
                  {/* Team Header & Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h4 className="text-base font-black text-white font-heading truncate max-w-[220px]">
                          {team.team_name}
                        </h4>
                      </div>
                      <p className="text-xs font-mono text-slate-400 pl-8">
                        Captain: <strong className="text-slate-200">{team.captain}</strong>
                      </p>
                    </div>

                    {/* Team Total Points */}
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Total Points</div>
                      <div className="text-2xl font-black text-cyan-300 font-mono leading-tight">
                        {team.score} <span className="text-xs font-normal text-slate-400">Pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Which Question Are They On? (Prominently Displayed) */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : isSolving
                            ? 'bg-cyan-500 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : `Q${team.currentQuestionNum}`}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">CURRENT QUESTION STATUS:</div>
                        <div className="text-xs font-mono font-bold text-white">
                          {isDone 
                            ? 'Completed All Questions ✓' 
                            : `Currently on Question ${team.currentQuestionNum} of ${team.totalQuestions}`}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : isSolving
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isDone ? 'COMPLETED' : isSolving ? '● SOLVING' : 'WAITING'}
                    </span>
                  </div>

                  {/* Progress & Accuracy breakdown */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      Answered: <strong className="text-white">{team.answeredCount} / {team.totalQuestions}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">{team.correctCount} Correct</span>
                      <span>•</span>
                      <span className="text-rose-400 font-semibold">{team.wrongCount} Wrong</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* STAGE CONTROLS */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
          Manual Stage Actions
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleAction('START_GAME')}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Game</span>
          </button>

          <button
            onClick={() => handleAction('STOP_GAME')}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Game & Broadcast Dashboard</span>
          </button>

          <button
            onClick={() => handleAction('RESTART_QUESTION')}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Round</span>
          </button>
        </div>
      </div>

    </div>
  );
}
