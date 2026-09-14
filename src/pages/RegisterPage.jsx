import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Clock, 
  Search, 
  Sparkles, 
  Calendar, 
  Zap, 
  Phone, 
  User, 
  ShieldCheck, 
  Trophy, 
  Printer, 
  ArrowRight,
  RefreshCw,
  Crown,
  Share2,
  Layers,
  ChevronRight,
  Filter,
  Lock,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { useSquad } from '../context/SquadContext';

export default function RegisterPage({ eventSettings, setCurrentPage }) {
  const { currentSquad, saveSquad } = useSquad();
  const eventDateBadge = "15 SEPTEMBER 2026 • 09:00 AM";

  // Form State
  const [formData, setFormData] = useState({
    team_name: '',
    game: 'brain',
    student_name: '',
    student_mobile: '',
    member_name_2: '',
    member_name_3: '',
    password: '',
    confirm_password: '',
    department: 'Electronics Engineering (VLSI Design and Technology)'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredTeam, setRegisteredTeam] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Live Registered Teams List State
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState('all'); // 'all' | 'brain' | 'pictionary'

  // Fetch registered teams from database
  const fetchRegisteredTeams = async () => {
    try {
      setLoadingTeams(true);
      const res = await api.getTeams();
      if (res.success) {
        setTeams(res.teams || []);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchRegisteredTeams();

    // Check if registrations are locked by admin
    api.getSettings()
      .then((res) => {
        if (res.success && res.eventSettings) {
          const locked = res.eventSettings.registrations_locked === 'true' || res.eventSettings.registrations_locked === '1';
          setIsLocked(locked);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const teamName = formData.team_name.trim();
    const captain = formData.student_name.trim();
    const mobile = formData.student_mobile.trim();
    const member2 = formData.member_name_2.trim();
    const member3 = formData.member_name_3.trim();
    const password = (formData.password || '').trim();
    const confirmPassword = (formData.confirm_password || '').trim();

    if (!teamName) {
      setSubmitError('Please enter your Squad / Team Name');
      return;
    }
    if (!captain) {
      setSubmitError('Please enter Captain Name (Member 1)');
      return;
    }
    if (!mobile || mobile.length < 10) {
      setSubmitError('Please enter a valid 10-digit WhatsApp Mobile Number');
      return;
    }
    if (!member2) {
      setSubmitError('Please enter Squad Member 2 Name');
      return;
    }
    if (!member3) {
      setSubmitError('Please enter Squad Member 3 Name');
      return;
    }
    if (!password) {
      setSubmitError('Please create a Squad Access Password / PIN');
      return;
    }
    if (password.length < 4) {
      setSubmitError('Squad Password must be at least 4 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Squad Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        team_name: teamName,
        game: formData.game,
        captain: captain,
        member1: captain,
        member2: member2,
        member3: member3,
        contact: mobile,
        password: password,
        registration_status: 'VERIFIED'
      };

      const res = await api.createTeam(payload);
      if (res.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        const newTeamData = res.team || {
          ...payload,
          id: res.id || `team-${Date.now()}`,
          created_at: new Date().toISOString()
        };

        saveSquad(newTeamData);
        setRegisteredTeam(newTeamData);
        setFormData({
          team_name: '',
          game: 'brain',
          student_name: '',
          student_mobile: '',
          member_name_2: '',
          member_name_3: '',
          password: '',
          confirm_password: '',
          department: 'Electronics Engineering (VLSI Design and Technology)'
        });

        // Re-fetch teams to include the new entry immediately in database list
        await fetchRegisteredTeams();

        // Scroll smoothly to receipt
        window.scrollTo({ top: 120, behavior: 'smooth' });
      } else {
        setSubmitError(res.message || 'Registration failed');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered teams for display
  const filteredTeams = teams.filter((t) => {
    const matchesGame = filterGame === 'all' || 
      t.game === filterGame || 
      (filterGame === 'both' && t.game === 'both') ||
      (t.game === 'both' && (filterGame === 'brain' || filterGame === 'pictionary'));
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.team_name?.toLowerCase().includes(q) ||
      t.captain?.toLowerCase().includes(q) ||
      t.member1?.toLowerCase().includes(q) ||
      t.member2?.toLowerCase().includes(q) ||
      t.member3?.toLowerCase().includes(q);
    return matchesGame && matchesSearch;
  });

  const brainCount = teams.filter(t => t.game === 'brain' || t.game === 'both').length;
  const pictionaryCount = teams.filter(t => t.game === 'pictionary' || t.game === 'both').length;
  const bothCount = teams.filter(t => t.game === 'both').length;
  const activeReceipt = registeredTeam || currentSquad;

  return (
    <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-950/50">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>DEPT. OF ELECTRONICS ENGINEERING • {eventDateBadge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 font-heading tracking-tight">
          Event Registration Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Register your 3-member squad directly on the platform in honor of <strong className="text-white">Dr. Shrikant Honade</strong>. Your team is verified instantly and saved directly into the live tournament database.
        </p>
      </div>

      {/* 4 Feature Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center font-mono">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <Users className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
          <div className="text-[11px] text-slate-400 uppercase">Squad Rule</div>
          <div className="text-sm sm:text-base font-bold text-white">Exactly 3 Members</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <Clock className="w-6 h-6 text-indigo-400 mx-auto mb-1.5" />
          <div className="text-[11px] text-slate-400 uppercase">Turn Timer</div>
          <div className="text-sm sm:text-base font-bold text-white">30s / Turn</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
          <div className="text-[11px] text-slate-400 uppercase">Verification</div>
          <div className="text-sm sm:text-base font-bold text-emerald-300">Instant Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <Zap className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
          <div className="text-[11px] text-slate-400 uppercase">Database Sync</div>
          <div className="text-sm sm:text-base font-bold text-amber-300">Live & Realtime</div>
        </div>
      </div>

      {/* CONFIRMATION DISPLAY: If squad is registered (current session or saved in local storage), keep visible on refresh */}
      {activeReceipt && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/20 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/30">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-400 text-emerald-200 text-[11px] font-mono font-bold uppercase mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Official Registration Confirmed
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                  {activeReceipt.team_name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider">
                VERIFIED & READY
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                title="Print Registration Pass"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pass Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Selected Event</span>
              <div className="text-base font-bold text-cyan-300 uppercase">
                {activeReceipt.game === 'both'
                  ? "Both Competitions (Brain + Pictionary)"
                  : activeReceipt.game === 'brain' 
                    ? "Engineer’s Brain" 
                    : "Engineering Pictionary"}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeReceipt.game === 'both' ? 'All-Rounder Combo • 15 Sept 2026' : 'Technical showdown • 15 Sept 2026'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Captain (Member 1)</span>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{activeReceipt.captain}</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3 text-cyan-400" />
                <span>{activeReceipt.contact}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase">Squad Members</span>
              <div className="text-white font-semibold">2. {activeReceipt.member2}</div>
              <div className="text-white font-semibold">3. {activeReceipt.member3}</div>
              <span className="text-[10px] text-emerald-400 font-bold block pt-1">
                ✓ Exactly 3 Members Confirmed
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <p className="text-xs text-slate-400 font-mono">
              ✓ Stored in tournament database. All team members must report at the Technical Hub prior to round 1 with valid college ID.
            </p>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {setCurrentPage && (
                activeReceipt.game === 'both' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage('brain-arena')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs font-mono tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY BRAIN ARENA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('pictionary-arena')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300 text-white font-black text-xs font-mono tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY PICTIONARY</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(activeReceipt.game === 'brain' ? 'brain-arena' : 'pictionary-arena')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 hover:from-emerald-300 hover:to-sky-300 text-slate-950 font-black text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer animate-pulse"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>PLAY {activeReceipt.game === 'brain' ? "BRAIN ARENA" : "PICTIONARY ARENA"} NOW</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => {
                  setRegisteredTeam(null);
                  saveSquad(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                + Register Another Squad
              </button>
              {setCurrentPage && (
                <button
                  type="button"
                  onClick={() => setCurrentPage('live-dashboard')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Leaderboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION LOCK NOTICE IF ADMIN LOCKED */}
      {isLocked && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/50 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-rose-900/80 border border-rose-400 flex items-center justify-center shrink-0 shadow-lg">
            <Lock className="w-7 h-7 text-rose-300 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-wide">
                REGISTRATIONS CURRENTLY LOCKED
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-rose-500 text-slate-950 tracking-wider">
                CLOSED BY ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-rose-200/90 leading-relaxed">
              New team registrations have been officially closed by the event administrator. Registered squads can review their pass above and check their entry in the tournament directory below.
            </p>
          </div>
        </div>
      )}

      {/* MAIN REGISTRATION FORM */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl space-y-8">
        
        {/* Form Title & Guide */}
        <div className="pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
              OFFICIAL ENTRY FORM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading mt-0.5">
              Submit Your Squad Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Fill out the details below. All fields marked with * are required.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Direct Database Entry</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* STEP 1: Select Event */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span>1. Choose Competition Event *</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Select single game or choose both competitions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Brain */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, game: 'brain' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  formData.game === 'brain'
                    ? 'bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-base font-bold text-white font-heading">
                        Engineer’s Brain
                      </span>
                    </div>
                    {formData.game === 'brain' && (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-10">
                    High-stakes rapid buzzer quiz covering electronics fundamentals, circuit diagrams, and semiconductor logic.
                  </p>
                </div>
                <div className="mt-4 pl-10 flex items-center gap-2 text-[11px] font-mono text-cyan-300 pt-2 border-t border-slate-800/80">
                  <span>3 Rounds</span> • <span>30s Per Question</span> • <span>Speed Tier Points</span>
                </div>
              </button>

              {/* Option 2: Pictionary */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, game: 'pictionary' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  formData.game === 'pictionary'
                    ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-400 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-base font-bold text-white font-heading">
                        Engineering Pictionary
                      </span>
                    </div>
                    {formData.game === 'pictionary' && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-10">
                    Visual sketch guessing challenge: decode schematic symbols, hardware components, and engineering concepts live.
                  </p>
                </div>
                <div className="mt-4 pl-10 flex items-center gap-2 text-[11px] font-mono text-indigo-300 pt-2 border-t border-slate-800/80">
                  <span>3 Rounds</span> • <span>Digital Canvas</span> • <span>Deduction Points</span>
                </div>
              </button>

              {/* Option 3: BOTH GAMES */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, game: 'both' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  formData.game === 'both'
                    ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-cyan-950/80 border-amber-400 shadow-xl shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  ★ ALL-ROUNDER
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 pr-20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span className="text-base font-bold text-white font-heading">
                        Both Competitions
                      </span>
                    </div>
                    {formData.game === 'both' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-10">
                    The ultimate engineering showdown! Play both Engineer’s Brain AND Engineering Pictionary with your squad.
                  </p>
                </div>
                <div className="mt-4 pl-10 flex items-center gap-2 text-[11px] font-mono text-amber-300 pt-2 border-t border-slate-800/80">
                  <span>Double Arena Entry</span> • <span>6 Rounds</span> • <span>Dual Podium</span>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Squad Name & Department */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
              2. Squad Identification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unique Squad / Team Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VLSI Innovators, Silicon Titans"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Department / Branch</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Electronics Engineering (VLSI Design and Technology)"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Exactly 3 Squad Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
                3. Squad Members (Exactly 3 Members Required) *
              </label>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                1 Lead Captain + 2 Members
              </span>
            </div>

            {/* Captain / Member 1 */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>MEMBER 1: SQUAD CAPTAIN & PRIMARY CONTACT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400">
                    Captain Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Shinde"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400">
                    Captain WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9822011223"
                    value={formData.student_mobile}
                    onChange={(e) => setFormData({ ...formData, student_mobile: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Member 2 & 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Member 2 Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Deshmukh"
                  value={formData.member_name_2}
                  onChange={(e) => setFormData({ ...formData, member_name_2: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Member 3 Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Kulkarni"
                  value={formData.member_name_3}
                  onChange={(e) => setFormData({ ...formData, member_name_3: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Squad Security & Access Password */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>4. Squad Security & Access Password *</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Arena Entry Protection
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Create a secure password for your squad. You will need this password alongside your Team Name or WhatsApp Mobile to unlock live rounds in the competition arenas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Create Squad Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 4 characters (e.g. titans@26)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confirm Password *</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-3 ${
                isLocked 
                  ? 'bg-slate-800/90 text-rose-400 border border-rose-500/40 opacity-70 cursor-not-allowed shadow-none' 
                  : 'text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting & Saving Squad into Database...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-5 h-5 text-rose-400" />
                  <span>REGISTRATION FORM CURRENTLY LOCKED (ADMIN CLOSED)</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>CONFIRM & REGISTER SQUAD (INSTANT DATABASE ENTRY)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 font-mono text-center mt-3">
              {isLocked 
                ? '🔒 Registration submissions are paused. Please contact the department coordinators for inquiries.'
                : '⚡ Your squad will immediately appear in the registered teams list below and in the Live Dashboard!'}
            </p>
          </div>

        </form>
      </div>

      {/* LIVE REGISTERED SQUADS DIRECTORY (DATABASE DISPLAY) */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">
                LIVE DATABASE DIRECTORY
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading mt-1">
              Registered Squads ({teams.length})
            </h3>
            <p className="text-xs text-slate-400">
              Brain: <strong className="text-cyan-400">{brainCount}</strong> | Pictionary: <strong className="text-indigo-400">{pictionaryCount}</strong> | Both: <strong className="text-amber-400">{bothCount}</strong>
            </p>
          </div>

          {/* Controls: Search & Game Filter */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search squad or member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 w-48 sm:w-60"
              />
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterGame('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterGame === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('brain')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterGame === 'brain' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Brain
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('pictionary')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterGame === 'pictionary' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pictionary
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterGame === 'both' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                Both ({bothCount})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchRegisteredTeams}
              disabled={loadingTeams}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTeams ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Squad Cards Grid */}
        {loadingTeams ? (
          <div className="text-center py-12 space-y-3 font-mono text-xs text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Fetching registered squads from database...</p>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team, idx) => {
              const isJustRegistered = registeredTeam && registeredTeam.team_name.toLowerCase() === team.team_name.toLowerCase();
              return (
                <div
                  key={team.id || idx}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    isJustRegistered 
                      ? 'bg-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400' 
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-cyan-500/40'
                  }`}
                >
                  {isJustRegistered && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-bl-lg uppercase">
                      ★ Just Registered (Your Squad)
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                      team.game === 'both'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : team.game === 'brain'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {team.game === 'both' ? '★ Both Competitions' : team.game === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      VERIFIED
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white font-heading truncate mb-2">
                    {team.team_name}
                  </h4>

                  <div className="space-y-1 text-xs font-mono text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Capt: {team.captain}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate pl-4">
                      2. {team.member2 || 'Member 2'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate pl-4">
                      3. {team.member3 || 'Member 3'}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Squad of 3</span>
                    <span>Score: <strong className="text-cyan-400">{team.score || 0}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 font-mono text-xs text-slate-400">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>
              {searchQuery ? `No squads found matching "${searchQuery}"` : 'No squads registered yet. Be the first squad to register above!'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
