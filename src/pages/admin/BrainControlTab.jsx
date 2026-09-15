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

  const session = brainSession?.session || monitor?.session || null;
  const isRunning = session?.status === 'RUNNING';
  const isStopped = session?.status === 'STOPPED' || session?.status === 'PAUSED' || Boolean(session?.is_paused && session?.status !== 'TIME_UP');
  const isTimeUp = session?.status === 'TIME_UP';

  const [selectedRound, setSelectedRound] = useState(1);
  const [elapsedTimeStr, setElapsedTimeStr] = useState('00m 00s');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync selectedRound with active session round on first load or when session changes
  useEffect(() => {
    if (session?.round) {
      setSelectedRound(session.round);
    }
  }, [session?.round]);

  // Live stopwatch calculating elapsed time since game started
  useEffect(() => {
    const calcElapsed = () => {
      const startedAtStr = session?.started_at || monitor.session?.started_at;
      if (startedAtStr && (session?.status === 'RUNNING' || session?.status === 'TIME_UP' || session?.status === 'STOPPED' || session?.status === 'PAUSED')) {
        const startMs = new Date(startedAtStr).getTime();
        const nowMs = Date.now();
        const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setElapsedSeconds(diffSec);

        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        if (hours > 0) {
          setElapsedTimeStr(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
        } else {
          setElapsedTimeStr(`${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
        }
      } else {
        setElapsedTimeStr('00m 00s');
        setElapsedSeconds(0);
      }
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [session?.started_at, session?.status, monitor.session?.started_at]);

  const handleAction = async (action, extra = {}) => {
    setLoading(true);
    try {
      const payload = { action, round: selectedRound, ...extra };
      await api.controlGame('brain', payload);
      fetchMonitor();
      if (action === 'STOP_ROUND' || action === 'STOP_GAME') {
        setActionSuccessMsg(`Round ${selectedRound} stopped! Questions locked on participants' screens.`);
        sound.playWrong();
      } else if (action === 'RESUME_ROUND' || action === 'RESUME_GAME') {
        setActionSuccessMsg(`Round ${selectedRound} resumed! Remaining questions unlocked for all squads.`);
        sound.playCorrect();
      } else if (action === 'FINALIZE_ROUND') {
        setActionSuccessMsg(`Round ${selectedRound} finalized! Final scores calculated for all teams and Live Dashboard updated.`);
        sound.playCorrect();
      } else if (action === 'START_GAME') {
        setActionSuccessMsg(`Round ${extra.round || selectedRound} Started! Teams can now view & answer questions in real-time.`);
      } else if (action === 'RESET_GAME') {
        setActionSuccessMsg(`Round ${extra.round || selectedRound} has been reset to standby.`);
      }
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const startedAtDate = (session?.started_at || monitor.session?.started_at)
    ? new Date(session?.started_at || monitor.session?.started_at)
    : null;
  const formattedStartTime = startedAtDate
    ? startedAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : null;
  const formattedStartDate = startedAtDate
    ? startedAtDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

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
            Select round, monitor live stopwatch, and manage team telemetry in real-time.
          </p>
        </div>

        {/* Live Status Pill & Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border text-xs font-mono font-bold uppercase flex items-center gap-2 shadow-lg ${
            isRunning
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-500/20 animate-pulse'
              : isStopped
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-amber-500/20 animate-pulse'
                : isTimeUp
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : isStopped ? 'bg-amber-400 animate-pulse' : isTimeUp ? 'bg-rose-400' : 'bg-slate-500'
            }`} />
            STATUS: {isRunning ? 'RUNNING (LIVE)' : isStopped ? 'STOPPED (STANDBY TO RESUME)' : isTimeUp ? 'ROUND COMPLETED' : (session?.status || 'IDLE')}
          </div>

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

      {/* ROUND SELECTION & LIVE TELEMETRY CONSOLE (USER REQUEST) */}
      <div className="glass-card p-6 rounded-3xl border-2 border-cyan-500/40 bg-slate-900/95 shadow-2xl space-y-6">
        
        {/* Header with Title and Live Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                ROUND CONTROL & LIVE TIMING TELEMETRY
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading mt-1">
              Select Round & Manage Game Execution
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Choose which round to start (Round 1, 2, or 3) and control Start / Stop / Resume.
            </p>
          </div>

          {/* Real-time Elapsed Stopwatch Widget */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Clock className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                {isRunning ? '● LIVE ELAPSED TIME' : isStopped ? '⏸ ROUND STOPPED (PAUSED)' : isTimeUp ? 'ROUND DURATION' : 'SESSION STOPWATCH'}
              </div>
              <div className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-300">
                {elapsedTimeStr}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {formattedStartTime ? (
                  <span>Started at: <strong className="text-amber-300">{formattedStartTime}</strong> ({formattedStartDate})</span>
                ) : (
                  <span>Game not started yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Interactive Round Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          
          {/* Round 1 Card */}
          <button
            type="button"
            onClick={() => setSelectedRound(1)}
            disabled={isRunning}
            className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
              selectedRound === 1
                ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80'
            } ${isRunning && session?.round !== 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedRound === 1 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                Round 1
              </span>
              {session?.round === 1 && isRunning && (
                <span className="text-[10px] font-bold text-emerald-400 animate-pulse">● LIVE NOW</span>
              )}
              {session?.round === 1 && isStopped && (
                <span className="text-[10px] font-bold text-amber-400 animate-pulse">⏸ STOPPED</span>
              )}
            </div>
            <div className="text-sm font-bold text-white font-heading">
              Fundamental Engineering & Logic
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Resistor Opposes Flow, 2's Complement, Silicon, Sir Visvesvaraya, Family Blood Relation & Silicon Valence.
            </p>
            <div className="text-[10px] text-cyan-300 font-bold mt-2 pt-2 border-t border-slate-800/80">
              6 Questions • 30s per Q • 10 Pts
            </div>
          </button>

          {/* Round 2 Card */}
          <button
            type="button"
            onClick={() => setSelectedRound(2)}
            disabled={isRunning}
            className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
              selectedRound === 2
                ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80'
            } ${isRunning && session?.round !== 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedRound === 2 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                Round 2
              </span>
              {session?.round === 2 && isRunning && (
                <span className="text-[10px] font-bold text-emerald-400 animate-pulse">● LIVE NOW</span>
              )}
              {session?.round === 2 && isStopped && (
                <span className="text-[10px] font-bold text-amber-400 animate-pulse">⏸ STOPPED</span>
              )}
            </div>
            <div className="text-sm font-bold text-white font-heading">
              Applied Engineering & Hardware
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              AI GPU Hardware, Combinational Circuits, Algebra, 4-to-2 Encoder, RAM & Capacitors.
            </p>
            <div className="text-[10px] text-cyan-300 font-bold mt-2 pt-2 border-t border-slate-800/80">
              6 Questions • 30s per Q • 10 Pts
            </div>
          </button>

          {/* Round 3 Card */}
          <button
            type="button"
            onClick={() => setSelectedRound(3)}
            disabled={isRunning}
            className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
              selectedRound === 3
                ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80'
            } ${isRunning && session?.round !== 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedRound === 3 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                Round 3
              </span>
              {session?.round === 3 && isRunning && (
                <span className="text-[10px] font-bold text-emerald-400 animate-pulse">● LIVE NOW</span>
              )}
              {session?.round === 3 && isStopped && (
                <span className="text-[10px] font-bold text-amber-400 animate-pulse">⏸ STOPPED</span>
              )}
            </div>
            <div className="text-sm font-bold text-white font-heading">
              Advanced Logic, Circuits & Calculus
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              ELECTRONICS Cipher, C Code Logic, Class-B Amplifier, Moore's Law, Geometry & Integral Equations.
            </p>
            <div className="text-[10px] text-cyan-300 font-bold mt-2 pt-2 border-t border-slate-800/80">
              6 Questions • 30s per Q • 10 Pts
            </div>
          </button>

        </div>

        {/* Action Controls for the Chosen Round */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">Target Action:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-bold">
              Round {selectedRound}
            </span>
            {isRunning && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Currently Live on Screen
              </span>
            )}
            {isStopped && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Round Stopped (Waiting for Resume)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isRunning ? (
              <>
                {/* STOP ROUND BUTTON (Stops the round questions and pauses the session) */}
                <button
                  type="button"
                  onClick={() => handleAction('STOP_ROUND')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 transition-all"
                  title="Temporarily stop this round and lock questions on participant screens"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Stop Round {selectedRound} (Stop Questions)</span>
                </button>

                {/* FINALIZE ROUND & LOCK SCORES */}
                <button
                  type="button"
                  onClick={() => handleAction('FINALIZE_ROUND')}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                  title="Finalize round, calculate scores, and permanently lock"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Finalize Round & Lock Scores</span>
                </button>
              </>
            ) : isStopped ? (
              <>
                {/* RESUME ROUND BUTTON (Resumes the round and starts remaining questions) */}
                <button
                  type="button"
                  onClick={() => handleAction('RESUME_ROUND')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 flex items-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-50 animate-pulse ring-2 ring-emerald-400/60"
                  title="Resume the round and let squads continue with remaining questions"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Round {selectedRound} (Remaining Questions)</span>
                </button>

                {/* FINALIZE ROUND & LOCK SCORES */}
                <button
                  type="button"
                  onClick={() => handleAction('FINALIZE_ROUND')}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                  title="Finalize round without resuming"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Finalize Round</span>
                </button>

                {/* RESET ROUND */}
                <button
                  type="button"
                  onClick={() => handleAction('RESET_GAME', { round: selectedRound })}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Reset round to standby"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Round {selectedRound}</span>
                </button>
              </>
            ) : isTimeUp ? (
              <>
                {/* REOPEN / RESUME ROUND */}
                <button
                  type="button"
                  onClick={() => handleAction('RESUME_ROUND')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                  title="Reopen round for squads to answer remaining questions"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Reopen / Resume Round {selectedRound}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('RESET_GAME', { round: selectedRound })}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Round {selectedRound}</span>
                </button>
              </>
            ) : (
              <>
                {/* FRESH START ROUND */}
                <button
                  type="button"
                  onClick={() => handleAction('START_GAME', { round: selectedRound })}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Round {selectedRound} (Live)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('RESET_GAME', { round: selectedRound })}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl font-bold text-xs font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Reset questions and session timer for this round"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Round {selectedRound}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

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
                            : isStopped
                              ? `Paused on Question ${team.currentQuestionNum} (${team.remainingCount !== undefined ? team.remainingCount : Math.max(0, team.totalQuestions - team.answeredCount)} remaining)`
                              : `Currently on Question ${team.currentQuestionNum} of ${team.totalQuestions}`}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : isStopped
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : isSolving
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isDone ? 'COMPLETED' : isStopped ? '⏸ PAUSED' : isSolving ? '● SOLVING' : 'WAITING'}
                    </span>
                  </div>

                  {/* Progress & Accuracy breakdown */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      Answered: <strong className="text-white">{team.answeredCount} / {team.totalQuestions}</strong>
                      <span className="ml-2 text-cyan-300 font-bold">
                        ({team.remainingCount !== undefined ? team.remainingCount : Math.max(0, team.totalQuestions - team.answeredCount)} remaining)
                      </span>
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
