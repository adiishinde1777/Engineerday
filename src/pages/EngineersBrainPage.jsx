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
  ArrowRight,
  ArrowLeft,
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
  Medal,
  RefreshCw,
  AlertTriangle,
  Check,
  Send,
  Play
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSquad } from '../context/SquadContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { sound } from '../utils/soundEffects';

export default function EngineersBrainPage({ setCurrentPage }) {
  const { brainSession, socket } = useSocket();
  const { currentSquad, isSquadRegistered, loginSquad, logoutSquad } = useSquad();
  const { isAuthenticated } = useAuth();

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamProfile, setTeamProfile] = useState(null);

  // All questions in the current round
  const [roundQuestions, setRoundQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedRound, setSelectedRound] = useState(1);

  // Map of answers submitted by this team: { [questionId]: { is_correct, total_points, answer_text, time_bonus } }
  const [answeredMap, setAnsweredMap] = useState({});

  const [selectedOption, setSelectedOption] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [result, setResult] = useState(null);
  const [finishMessage, setFinishMessage] = useState(null);

  // Quick verification within gate
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Load Brain teams for selection or verification
  useEffect(() => {
    api.getTeams({ game: 'brain', registration_status: 'VERIFIED' })
      .then((res) => {
        if (res.success && res.teams.length > 0) {
          setTeams(res.teams);
          if (currentSquad && currentSquad.id && (currentSquad.game === 'brain' || currentSquad.game === 'both')) {
            setSelectedTeamId(currentSquad.id);
          } else if (!selectedTeamId) {
            setSelectedTeamId(res.teams[0].id);
          }
        }
      })
      .catch(console.error);
  }, [currentSquad]);

  // Keep selectedTeamId synced to currentSquad
  useEffect(() => {
    if (currentSquad && currentSquad.id && (currentSquad.game === 'brain' || currentSquad.game === 'both')) {
      setSelectedTeamId(currentSquad.id);
    }
  }, [currentSquad]);

  // Fetch all questions for the current round (supports preview mode when round has not started live)
  const fetchRoundQuestions = async (roundNum = 1, forcePreview = false) => {
    try {
      const params = { game: 'brain', round: roundNum };
      if (forcePreview || (!isRunning && !isAuthenticated)) {
        params.preview = 'true';
      }
      const res = await api.getQuestions(params);
      if (res.success && Array.isArray(res.questions)) {
        setRoundQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load round questions:', err);
    }
  };

  // Fetch team profile and prior answers
  const fetchTeamDetails = async (teamId) => {
    if (!teamId) return;
    try {
      const res = await api.getTeam(teamId);
      if (res.success) {
        setTeamProfile(res.team);
        if (Array.isArray(res.answers)) {
          const map = {};
          res.answers.forEach((ans) => {
            map[ans.question_id] = {
              is_correct: ans.is_correct === 1 || ans.is_correct === true,
              total_points: ans.total_points,
              answer_text: ans.answer_text,
              time_bonus: ans.time_bonus || 0
            };
          });
          setAnsweredMap(map);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team details:', err);
    }
  };

  const { session } = brainSession;
  const isTimeUp = session?.status === 'TIME_UP';
  const isStopped = session?.status === 'STOPPED' || session?.status === 'PAUSED' || Boolean(session?.is_paused && session?.status !== 'TIME_UP');
  const isRunning = session?.status === 'RUNNING' && !isTimeUp && !isStopped;
  const currentRoundNum = (isRunning || isStopped || isTimeUp) ? (session?.round || 1) : selectedRound;

  // Helper to jump to first remaining (unanswered) question in this round
  const jumpToFirstRemainingQuestion = (questionsList, answersMapObj) => {
    if (!Array.isArray(questionsList) || questionsList.length === 0) return;
    const unansweredIdx = questionsList.findIndex(q => !answersMapObj[q.id]);
    if (unansweredIdx !== -1) {
      setCurrentQIndex(unansweredIdx);
    }
  };

  // Initial fetch of questions for this round
  useEffect(() => {
    if (isRunning || isAuthenticated) {
      fetchRoundQuestions(currentRoundNum, false);
    } else {
      fetchRoundQuestions(selectedRound, true);
    }
  }, [isRunning, isStopped, isAuthenticated, currentRoundNum, selectedRound]);

  // Fetch team details whenever selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId]);

  // When answeredMap updates, ensure squad is on an unanswered question if current is answered
  useEffect(() => {
    if (roundQuestions.length > 0 && Object.keys(answeredMap).length > 0) {
      const activeQ = roundQuestions[currentQIndex];
      if (activeQ && answeredMap[activeQ.id]) {
        const firstUnanswered = roundQuestions.findIndex(q => !answeredMap[q.id]);
        if (firstUnanswered !== -1) {
          setCurrentQIndex(firstUnanswered);
        }
      }
    }
  }, [answeredMap, roundQuestions.length]);

  // Inform admin in real-time which question this squad is currently viewing
  useEffect(() => {
    if (socket && selectedTeamId) {
      socket.emit('team_viewing_question', {
        teamId: selectedTeamId,
        questionNumber: currentQIndex + 1
      });
    }
  }, [socket, selectedTeamId, currentQIndex]);

  // Sync if admin changes the active question in session
  useEffect(() => {
    if (brainSession?.question?.id && roundQuestions.length > 0) {
      const idx = roundQuestions.findIndex(q => q.id === brainSession.question.id);
      if (idx !== -1) {
        setCurrentQIndex(idx);
      }
    }
  }, [brainSession?.question?.id, roundQuestions]);

  // Reset inputs when switching between questions
  useEffect(() => {
    setSelectedOption('');
    setTextAnswer('');
    setResult(null);
  }, [currentQIndex]);

  // Listen to socket events for round finished, round stopped, round resumed, scoreboard update, etc.
  useEffect(() => {
    if (!socket) return;

    const handleRoundFinished = () => {
      if (selectedTeamId) {
        fetchTeamDetails(selectedTeamId);
      }
    };

    const handleRoundStopped = () => {
      if (selectedTeamId) {
        fetchTeamDetails(selectedTeamId);
      }
    };

    const handleRoundResumed = () => {
      if (selectedTeamId) {
        fetchTeamDetails(selectedTeamId);
      }
      fetchRoundQuestions(currentRoundNum);
      sound.playCountdown();
    };

    socket.on('brain_round_finished', handleRoundFinished);
    socket.on('scoreboard_updated', handleRoundFinished);
    socket.on('time_up', handleRoundFinished);
    socket.on('round_stopped', handleRoundStopped);
    socket.on('round_resumed', handleRoundResumed);

    return () => {
      socket.off('brain_round_finished', handleRoundFinished);
      socket.off('scoreboard_updated', handleRoundFinished);
      socket.off('time_up', handleRoundFinished);
      socket.off('round_stopped', handleRoundStopped);
      socket.off('round_resumed', handleRoundResumed);
    };
  }, [socket, selectedTeamId, currentRoundNum]);

  // Currently displayed question
  const activeQuestion = roundQuestions[currentQIndex] || brainSession?.question || null;
  const currentQAnsweredInfo = activeQuestion ? answeredMap[activeQuestion.id] : null;
  const hasSubmittedCurrentQ = Boolean(currentQAnsweredInfo);

  // Per-Question Countdown Clock
  const [questionTimer, setQuestionTimer] = useState(30);

  // Reset timer on question change
  useEffect(() => {
    if (activeQuestion) {
      const limit = activeQuestion.time_limit || 30;
      setQuestionTimer(limit);
    }
  }, [activeQuestion?.id, currentQIndex]);

  // Reset question index when admin switches rounds
  useEffect(() => {
    setCurrentQIndex(0);
    setSelectedOption('');
    setTextAnswer('');
    setResult(null);
  }, [currentRoundNum]);

  // Question countdown tick-down every second
  useEffect(() => {
    if (!isRunning || hasSubmittedCurrentQ || questionTimer <= 0) return;

    const interval = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, hasSubmittedCurrentQ, questionTimer, activeQuestion?.id]);

  // Extract options for the active question
  const optionsList = (() => {
    if (!activeQuestion) return [];
    if (Array.isArray(activeQuestion.options) && activeQuestion.options.length > 0) {
      return activeQuestion.options;
    }
    if (typeof activeQuestion.options_json === 'string') {
      try {
        const parsed = JSON.parse(activeQuestion.options_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (Array.isArray(activeQuestion.options_json)) return activeQuestion.options_json;
    return [];
  })();

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    if (!isRunning || hasSubmittedCurrentQ || isSubmitting || !selectedTeamId || !activeQuestion) return;
    submitAnswerToBackend(option);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!isRunning || hasSubmittedCurrentQ || isSubmitting || !textAnswer.trim() || !activeQuestion) return;
    submitAnswerToBackend(textAnswer.trim());
  };

  const submitAnswerToBackend = async (answerVal) => {
    if (!activeQuestion) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitAnswer({
        teamId: selectedTeamId,
        questionId: activeQuestion.id,
        answer: answerVal
      });

      setResult(res);
      setAnsweredMap(prev => ({
        ...prev,
        [activeQuestion.id]: {
          is_correct: res.isCorrect,
          total_points: res.pointsAwarded || 0,
          answer_text: answerVal,
          time_bonus: res.timeBonus || 0
        }
      }));

      // Refresh team profile to get updated total score and rank
      fetchTeamDetails(selectedTeamId);

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

  // Voluntary finish round action
  const handleFinishRound = async () => {
    if (!selectedTeamId || isFinishing) return;
    setIsFinishing(true);
    try {
      const res = await api.finishSquadRound({
        teamId: selectedTeamId,
        game: 'brain'
      });
      fetchTeamDetails(selectedTeamId);
      setFinishMessage(res.message);
      sound.playCorrect();
      setTimeout(() => setFinishMessage(null), 6000);
    } catch (err) {
      alert(err.message || 'Failed to complete round');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleGateVerify = async (e) => {
    e.preventDefault();
    setVerifyError('');
    if (!verifyInput.trim()) {
      setVerifyError('Please enter Team Name or Captain Mobile Number');
      return;
    }
    if (!verifyPassword.trim()) {
      setVerifyError('Please enter your Squad Password');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await loginSquad(verifyInput.trim(), verifyPassword.trim());
      if (res.success) {
        // RESTRICTION CHECK: Squad must not be registered for Pictionary only
        if (res.squad.game === 'pictionary') {
          logoutSquad();
          setVerifyError(`Squad "${res.squad.team_name}" is registered ONLY for Engineering Pictionary. You cannot participate in Engineer's Brain.`);
          return;
        }
        setSelectedTeamId(res.squad.id);
        fetchTeamDetails(res.squad.id);
      } else {
        setVerifyError(res.message || 'Squad not found in database');
      }
    } catch (err) {
      setVerifyError(err.message || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  // RESTRICTED ACCESS SCREEN: If squad is registered ONLY for Engineering Pictionary
  if (!isAuthenticated && isSquadRegistered && currentSquad?.game === 'pictionary') {
    return (
      <div className="py-16 max-w-xl mx-auto px-4 sm:px-6">
        <div className="glass-card p-8 sm:p-10 rounded-3xl border-2 border-rose-500/50 bg-slate-900 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
              ACCESS RESTRICTED • WRONG ARENA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Registered for Pictionary Only
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Squad <strong className="text-white">{currentSquad.team_name}</strong> is registered exclusively for <span className="text-indigo-400 font-semibold">Engineering Pictionary</span>. You do not have permission to play or submit answers in Engineer’s Brain.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setCurrentPage('pictionary-arena')}
              className="w-full py-3.5 rounded-2xl font-bold text-sm font-mono text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Go to Engineering Pictionary Arena</span>
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

  const selectedTeam = teamProfile || currentSquad || teams.find((t) => t.id === selectedTeamId);

  // Calculate score summary for this round
  const answeredQuestionsCount = Object.keys(answeredMap).length;
  const correctQuestionsCount = Object.values(answeredMap).filter(a => a.is_correct).length;
  const totalRoundPointsEarned = Object.values(answeredMap).reduce((sum, a) => sum + (Number(a.total_points) || 0), 0);
  const allQuestionsAnswered = roundQuestions.length > 0 && answeredQuestionsCount >= roundQuestions.length;

  // GATE CHECK: If user is not registered and not an admin, display registration gate
  if (!isSquadRegistered && !isAuthenticated) {
    return (
      <div className="py-16 max-w-xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              RESTRICTED ACCESS ARENA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Squad Registration Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Only verified registered squads for Engineer's Brain can enter the live arena to answer questions and score tournament points.
            </p>
          </div>

          {/* Quick Verify with Password */}
          <form onSubmit={handleGateVerify} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 text-left">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Already Registered? Enter Your Squad</span>
            </span>

            <div className="space-y-2.5">
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Team Name or Captain Mobile..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />

              <div className="relative">
                <input
                  type={showVerifyPassword ? 'text' : 'password'}
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  placeholder="Squad Password..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                >
                  {showVerifyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {verifyLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Verify & Enter Arena</span>
              </button>
            </div>

            {verifyError && (
              <p className="text-[11px] text-rose-400 font-mono pt-1">{verifyError}</p>
            )}
          </form>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setCurrentPage('register')}
              className="w-full py-3.5 rounded-2xl font-black text-sm font-mono text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>REGISTER SQUAD ON WEBSITE NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage('games')}
              className="w-full py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Games Rules</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Status & Team Identity Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white font-heading tracking-wide">
                ENGINEER’S BRAIN ARENA
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${
                isRunning 
                  ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                  : isStopped
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : isTimeUp
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isRunning ? `● ROUND ${currentRoundNum} LIVE` : isStopped ? `⏸ ROUND ${currentRoundNum} STOPPED` : isTimeUp ? `ROUND ${currentRoundNum} COMPLETED` : '🔒 STANDBY • WAITING FOR ADMIN'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Answer all questions at your pace. Points and live rankings automatically calculate on submission.
            </p>
          </div>
        </div>

        {/* Squad Identity & Points Badge */}
        <div className="flex items-center gap-3">
          {selectedTeam && (
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tournament Score</div>
              <div className="text-lg font-black text-cyan-300 font-mono leading-tight">
                {selectedTeam.score || 0} <span className="text-xs font-normal text-slate-400">Pts</span>
                {selectedTeam.rank ? <span className="ml-1.5 text-xs text-amber-400 font-bold">#{selectedTeam.rank}</span> : null}
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_name} ({t.score} pts)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate max-w-[140px] sm:max-w-[200px]">
                <span className="text-slate-400 block text-[10px]">Active Squad</span>
                <strong className="text-white truncate block">{selectedTeam?.team_name || 'Verified Squad'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROUND COMPLETED & FINAL POINTS SCORECARD */}
      {isTimeUp && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  ROUND {currentRoundNum} COMPLETED • FINAL SCORECARD
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                  Final Squad Points & Standings
                </h2>
              </div>
            </div>

            <button
              onClick={() => fetchTeamDetails(selectedTeamId)}
              className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              title="Refresh my score from server"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Score</span>
            </button>
          </div>

          {/* Performance Highlight Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1 text-center">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Total Tournament Score</span>
              <div className="text-3xl sm:text-4xl font-black text-cyan-300 font-mono">
                {selectedTeam?.score || 0} <span className="text-sm font-normal text-slate-400">Pts</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                +{totalRoundPointsEarned} pts scored in Round {currentRoundNum}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1 text-center">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Round Accuracy</span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono">
                {correctQuestionsCount} / {roundQuestions.length || 6}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Questions answered correctly
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1 text-center">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Tournament Rank</span>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono flex items-center justify-center gap-1.5">
                <Medal className="w-7 h-7 text-amber-400" />
                <span>#{selectedTeam?.rank || 1}</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Live calculated standing
              </p>
            </div>

          </div>

          {/* Question Breakdown List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Round {currentRoundNum} Question-by-Question Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roundQuestions.map((q, idx) => {
                const ansInfo = answeredMap[q.id];
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
                      ansInfo?.is_correct
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : ansInfo
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold">Q{idx + 1}:</span>
                      <span className="truncate">{q.question}</span>
                    </div>
                    <div className="shrink-0 font-bold">
                      {ansInfo?.is_correct ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          +{ansInfo.total_points} pts
                        </span>
                      ) : ansInfo ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          0 pts
                        </span>
                      ) : (
                        <span className="text-slate-500">Not answered</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA: Navigate to Live Dashboard */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-slate-300">
              Standings and live scores are updated on the global tournament board.
            </p>
            <button
              onClick={() => setCurrentPage('live-dashboard')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs font-mono bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <BarChart3 className="w-4 h-4" />
              <span>VIEW LIVE TOURNAMENT DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* QUESTION NAVIGATOR PILLS (Q1 to Q6) - Only visible when game is officially RUNNING */}
      {isRunning && roundQuestions.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-cyan-500/20 bg-slate-900/90 space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase tracking-wider">
              ROUND {currentRoundNum} QUESTION NAVIGATOR ({roundQuestions.length} Questions):
            </span>
            <div className="flex items-center gap-3">
              <span className="text-cyan-300">
                Answered: <strong>{answeredQuestionsCount} / {roundQuestions.length}</strong>
              </span>
              <span className="text-amber-300 font-bold">
                Remaining: <strong>{Math.max(0, roundQuestions.length - answeredQuestionsCount)}</strong>
              </span>

              {/* FINISH ROUND BUTTON: Shown when squad answers all questions or wants to submit */}
              {allQuestionsAnswered && !isTimeUp && (
                <button
                  type="button"
                  onClick={handleFinishRound}
                  disabled={isFinishing}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer transition-all animate-pulse"
                  title="Submit all answers and calculate points"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit All & Finish Round</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roundQuestions.map((q, idx) => {
              const ansInfo = answeredMap[q.id];
              const isCurrent = currentQIndex === idx;

              let pillStyles = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';
              if (isCurrent) {
                pillStyles = 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/20 font-black';
              } else if (ansInfo?.is_correct) {
                pillStyles = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
              } else if (ansInfo) {
                pillStyles = 'bg-rose-950/80 border-rose-500/50 text-rose-300';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${pillStyles}`}
                >
                  <span>Q{idx + 1}</span>
                  {ansInfo?.is_correct ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : ansInfo ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {finishMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{finishMessage}</span>
            </div>
          )}
        </div>
      )}


      {/* 1. DEDICATED STOPPED / PAUSED STATE SCREEN (When Admin stops the round) */}
      {isStopped && !isTimeUp && (
        <div className="glass-card p-8 sm:p-14 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 text-center space-y-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Pulsing Pause / Standby Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 animate-ping opacity-40"></div>
            <div className="relative w-24 h-24 rounded-3xl bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>ROUND {currentRoundNum} TEMPORARILY STOPPED BY ADMIN</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-heading">
              Round Questions Paused
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Coordinator / Admin ने गेमचे प्रश्न तात्पुरते थांबवले आहेत (Round Stopped). Admin ने पुन्हा सुरू (Resume) करताच तुमचे उर्वरित प्रश्न आपोआप स्क्रीनवर सुरू होतील.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              (Please stay on this screen. As soon as the Admin resumes the round, your remaining questions will automatically unlock in real-time.)
            </p>
          </div>

          {/* Progress Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Questions Completed</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                {answeredQuestionsCount} / {roundQuestions.length || 6}
              </div>
              <p className="text-[10px] font-mono text-emerald-400/80">Submitted Answers</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Remaining Questions</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {Math.max(0, (roundQuestions.length || 6) - answeredQuestionsCount)}
              </div>
              <p className="text-[10px] font-mono text-amber-400/80">Will resume shortly</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Round Points</span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                +{totalRoundPointsEarned} <span className="text-xs font-normal text-slate-400">Pts</span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400/80">Earned So Far</p>
            </div>
          </div>

          {/* Squad Status Pill */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Active Squad</span>
                <strong className="text-sm text-white font-heading truncate block max-w-[200px]">
                  {selectedTeam?.team_name || 'Verified Squad'}
                </strong>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Standby for Resume</span>
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage('live-dashboard')}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Live Scoreboard</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedTeamId) fetchTeamDetails(selectedTeamId);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ROUND PREVIEW & INTERACTIVE QUESTION ARENA (When official round is on standby) */}
      {!isRunning && !isStopped && !isTimeUp && (
        <div className="glass-card p-5 sm:p-7 rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    ROUND {selectedRound} QUESTIONS ACTIVE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    OFFICIAL LIVE TIMER ON STANDBY
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading mt-0.5">
                  Engineer's Brain: Round {selectedRound} Questions
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  Switch between Round 1 and Round 2 below. You can navigate questions and practice while waiting for the coordinator.
                </p>
              </div>
            </div>

            {/* Interactive Round Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => { setSelectedRound(1); setCurrentQIndex(0); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedRound === 1 
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50' 
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Round 1 (6 Qs)</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRound(2); setCurrentQIndex(0); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedRound === 2 
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50' 
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Round 2 (6 Qs)</span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.controlGame('brain', { action: 'START_GAME', round: selectedRound });
                    } catch (e) {
                      alert(e.message);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Round {selectedRound} Live</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Browsing Question {currentQIndex + 1} of {roundQuestions.length || 6}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage('live-dashboard')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Live Dashboard</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setCurrentPage('games')}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Rules & Matrix</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. QUESTION DISPLAY / PLAYING SCREEN */}
      {!isTimeUp && !isStopped && (
        !activeQuestion ? (
          <div className="glass-card p-12 sm:p-20 rounded-3xl border border-slate-800 text-center space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
              <Brain className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white font-heading">
              Loading Round {currentRoundNum} Questions...
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Syncing questions from the symposium server. Get ready!
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 relative overflow-hidden space-y-8">

          
          {/* Top Bar inside Card: Question Number & Points Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  QUESTION {currentQIndex + 1} OF {roundQuestions.length || 6}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 font-bold uppercase">
                  ROUND {activeQuestion.round}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Category: <span className="text-slate-200">{activeQuestion.type}</span> • Base Points: <span className="text-cyan-300 font-bold">{activeQuestion.base_points || 10} Pts</span>
              </p>
            </div>

            {/* Right Side: Per-Question Clock OR Answered Status Badge */}
            <div className="flex items-center gap-3">
              {/* Answered badge status if already answered */}
              {hasSubmittedCurrentQ ? (
                <div className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border ${
                  currentQAnsweredInfo.is_correct
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                }`}>
                  {currentQAnsweredInfo.is_correct ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Answered Correct (+{currentQAnsweredInfo.total_points} Pts)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Answered Incorrect (0 Pts)</span>
                    </>
                  )}
                </div>
              ) : isRunning ? (
                /* LIVE QUESTION TIMER CLOCK (USER REQUEST: USER LA CLOCK DISAYLA PAHIJE) */
                <div className={`px-4 py-2 rounded-2xl border font-mono flex items-center gap-3 shadow-lg transition-all ${
                  questionTimer <= 5
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-rose-950/60'
                    : questionTimer <= 10
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-950/50'
                      : 'bg-slate-950 border-cyan-500/40 text-cyan-300 shadow-cyan-950/50'
                }`}>
                  <div className={`p-2 rounded-xl ${
                    questionTimer <= 5 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : questionTimer <= 10 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <Clock className={`w-5 h-5 ${questionTimer <= 10 && questionTimer > 0 ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">
                      QUESTION TIME
                    </div>
                    <div className="text-xl sm:text-2xl font-black leading-tight flex items-baseline gap-1 mt-0.5">
                      <span className={
                        questionTimer <= 5 
                          ? 'text-rose-400 font-mono font-black' 
                          : questionTimer <= 10 
                            ? 'text-amber-400 font-mono font-black' 
                            : 'text-cyan-300 font-mono font-black'
                      }>
                        {String(questionTimer).padStart(2, '0')}s
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">/ {activeQuestion.time_limit || 30}s</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-slate-950 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{activeQuestion.time_limit || 30}s per Question</span>
                </div>
              )}
            </div>
          </div>

          {/* QUESTION TIMER PROGRESS BAR */}
          {!hasSubmittedCurrentQ && isRunning && (
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/90 shadow-inner -mt-4">
              <div 
                className={`h-full transition-all duration-1000 ${
                  questionTimer <= 5 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/50' 
                    : questionTimer <= 10 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                      : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${Math.max(0, (questionTimer / (activeQuestion.time_limit || 30)) * 100)}%` }}
              />
            </div>
          )}

          {/* Time Expired Notice */}
          {!hasSubmittedCurrentQ && isRunning && questionTimer === 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-mono flex items-center justify-between gap-3 animate-pulse -mt-4 shadow-lg shadow-rose-950/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">Time limit (30s) expired for this question! Select an option now to earn remaining points.</span>
              </div>
            </div>
          )}

          {/* Question Text & Optional Media */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-heading leading-snug">
              {activeQuestion.question}
            </h2>

            {activeQuestion.image_url && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-72 flex items-center justify-center p-2">
                <img
                  src={activeQuestion.image_url}
                  alt="Technical prompt"
                  className="max-h-64 object-contain rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Answer Area: Multiple Choice OR Direct Text */}
          {optionsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {optionsList.map((option, idx) => {
                const isSelected = selectedOption === option || currentQAnsweredInfo?.answer_text === option;
                const isLocked = (isRunning && hasSubmittedCurrentQ) || isSubmitting;

                let btnStyles = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-900';
                if (hasSubmittedCurrentQ) {
                  if (currentQAnsweredInfo?.is_correct && isSelected) {
                    btnStyles = 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20';
                  } else if (!currentQAnsweredInfo?.is_correct && isSelected) {
                    btnStyles = 'bg-rose-950 border-rose-400 text-rose-300';
                  } else {
                    btnStyles = 'bg-slate-950/40 border-slate-800/60 text-slate-500';
                  }
                } else if (isSelected) {
                  btnStyles = 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20';
                }

                return (
                  <button
                    key={idx}
                    disabled={isLocked}
                    onClick={() => handleOptionSelect(option)}
                    className={`p-5 rounded-2xl border text-left font-mono text-sm sm:text-base flex items-start gap-4 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${btnStyles}`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="pt-1 leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  disabled={(isRunning && hasSubmittedCurrentQ) || isSubmitting}
                  placeholder="Type your final answer..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-base focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={hasSubmittedCurrentQ || isSubmitting || !textAnswer.trim()}
                  className="px-8 py-4 rounded-2xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          )}

          {/* Submission Feedback Banner */}
          {result && (
            <div className={`p-6 rounded-2xl border flex items-center justify-between gap-4 animate-in fade-in duration-300 ${
              result.isCorrect
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/80 text-rose-300'
            }`}>
              <div className="flex items-center gap-4">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-lg font-bold font-heading">
                    {result.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                  </h4>
                  <p className="text-xs font-mono mt-0.5 opacity-90">
                    {result.message}
                  </p>
                </div>
              </div>

              {result.pointsAwarded !== undefined && (
                <div className="text-right font-mono">
                  <div className="text-2xl font-black text-white">
                    +{result.pointsAwarded} Pts
                  </div>
                  {result.timeBonus > 0 && (
                    <div className="text-[10px] text-cyan-300">
                      Incl. +{result.timeBonus} speed bonus
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls: Previous / Next Question & Submit All */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <span className="text-xs font-mono text-slate-400">
              Question {currentQIndex + 1} of {roundQuestions.length || 6}
            </span>

            <div className="flex items-center gap-2">
              {currentQIndex < roundQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.min(roundQuestions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentPage('live-dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-500/30"
                >
                  <span>View Dashboard</span>
                  <Trophy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      ))}

    </div>
  );
}
