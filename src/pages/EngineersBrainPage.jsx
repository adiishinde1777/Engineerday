import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  Users, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import { sound } from '../utils/soundEffects';

export default function EngineersBrainPage({ setCurrentPage }) {
  const { brainSession } = useSocket();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load Brain teams for selection
  useEffect(() => {
    api.getTeams({ game: 'brain', registration_status: 'VERIFIED' })
      .then((res) => {
        if (res.success && res.teams.length > 0) {
          setTeams(res.teams);
          setSelectedTeamId(res.teams[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Reset when question changes
  useEffect(() => {
    setSelectedOption('');
    setTextAnswer('');
    setResult(null);
    setHasSubmitted(false);
  }, [brainSession?.question?.id]);

  const { session, question } = brainSession;
  const timerRemaining = session?.timer_remaining ?? 30;
  const isTimeUp = session?.status === 'TIME_UP' || timerRemaining <= 0;
  const isRunning = session?.status === 'RUNNING' && !isTimeUp;

  const handleOptionSelect = async (option) => {
    if (!isRunning || hasSubmitted || isSubmitting || !selectedTeamId || !question) return;

    setSelectedOption(option);
    submitAnswerToBackend(option);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!isRunning || hasSubmitted || isSubmitting || !textAnswer.trim()) return;
    submitAnswerToBackend(textAnswer.trim());
  };

  const submitAnswerToBackend = async (answerVal) => {
    setIsSubmitting(true);
    try {
      const res = await api.submitAnswer({
        teamId: selectedTeamId,
        questionId: question.id,
        answer: answerVal
      });

      setResult(res);
      setHasSubmitted(true);
      if (res.isCorrect) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      alert(err.message || 'Error submitting answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Status & Team Selector Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white font-heading tracking-wide">
              ENGINEER’S BRAIN ARENA
            </h1>
            <p className="text-xs font-mono text-cyan-400">
              ROUND {session?.round || 1} • LIVE STAGE
            </p>
          </div>
        </div>

        {/* Team Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono hidden sm:inline">Playing as:</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={hasSubmitted || isSubmitting}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.team_name} ({t.score} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Question Arena Card */}
      {!question ? (
        <div className="glass-card p-12 sm:p-20 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Brain className="w-8 h-8 animate-pulse text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-white font-heading">
            Waiting for Question Broadcast
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The symposium coordinator will activate the next question from the admin console. Watch the screen or wait for the timer to trigger.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setCurrentPage('live-dashboard')}
              className="px-5 py-2.5 rounded-xl text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-500/30"
            >
              View Live Scoreboard
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 relative overflow-hidden space-y-8">
          
          {/* Top Bar inside Card: Question Number & Dedicated Stopwatch */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                ROUND {question.round}
              </span>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Category: <span className="text-slate-200">{question.type}</span> • Points: <span className="text-cyan-300 font-bold">{question.base_points} Pts</span>
              </p>
            </div>

            {/* Stopwatch Countdown Box */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${
              timerRemaining <= 5 && timerRemaining > 0
                ? 'bg-rose-950/80 border-rose-500/80 shadow-lg shadow-rose-500/30 animate-pulse'
                : timerRemaining <= 10
                ? 'bg-amber-950/70 border-amber-500/50'
                : 'bg-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-950/50'
            }`}>
              <Clock className={`w-6 h-6 ${
                timerRemaining <= 5 ? 'text-rose-400 animate-spin' : 'text-cyan-400'
              }`} />
              <div className="text-right">
                <div className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
                  TIMER
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${
                  timerRemaining <= 5 ? 'text-rose-300' : 'text-cyan-300'
                }`}>
                  00:{String(timerRemaining).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Time's Up Banner */}
          {isTimeUp && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-center font-mono font-bold text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              TIME'S UP! SUBMISSIONS ARE LOCKED FOR THIS QUESTION.
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-3xl font-black text-white font-heading leading-snug">
              {question.question}
            </h2>

            {/* Image identification if available */}
            {question.image_url && (
              <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-cyan-500/30 shadow-xl my-4">
                <img
                  src={question.image_url}
                  alt="Component or Chip Prompt"
                  className="w-full h-56 object-cover"
                />
              </div>
            )}
          </div>

          {/* Options Matrix (A, B, C, D) or Text Input */}
          {question.options && question.options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === opt;
                const isLocked = isTimeUp || hasSubmitted;

                let btnStyle = "bg-slate-950/80 border-slate-800 hover:border-cyan-500/50 text-slate-200";
                if (isSelected) {
                  btnStyle = "bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20";
                }

                if (result && hasSubmitted) {
                  if (opt === result.correctAnswer) {
                    btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-300";
                  } else if (isSelected && !result.isCorrect) {
                    btnStyle = "bg-rose-950/80 border-rose-500 text-rose-300";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={isLocked}
                    className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-start gap-4 ${btnStyle} ${
                      isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {label}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-white mt-1">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="flex gap-3 max-w-xl">
              <input
                type="text"
                placeholder="Type your technical answer here..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isTimeUp || hasSubmitted}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isTimeUp || hasSubmitted || !textAnswer.trim()}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
              >
                Submit
              </button>
            </form>
          )}

          {/* Submission Result Feedback Banner */}
          {result && (
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in ${
              result.isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                : 'bg-rose-950/40 border-rose-500/50'
            }`}>
              <div className="flex items-center gap-3">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {result.isCorrect ? 'Correct Answer! Superb Speed!' : 'Incorrect Answer'}
                  </h4>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Response Time: <strong>{result.responseTime}s</strong> • Base: +{result.basePoints} Pts • Time Bonus: +{result.timeBonus} Pts
                  </p>
                  {!result.isCorrect && (
                    <p className="text-xs text-slate-400 mt-1">
                      Correct Answer was: <strong className="text-cyan-300">{result.correctAnswer}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <div className="text-xs font-mono text-slate-400 uppercase">Total Points Awarded</div>
                <div className="text-2xl font-black text-cyan-300 font-mono">
                  +{result.totalPoints} PTS
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Quick Team Standing Footer */}
      {selectedTeam && (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Active Squad: <strong className="text-white">{selectedTeam.team_name}</strong></span>
          <span>Cumulative Score: <strong className="text-cyan-300">{selectedTeam.score} Pts</strong> (Rank #{selectedTeam.rank})</span>
        </div>
      )}

    </div>
  );
}
