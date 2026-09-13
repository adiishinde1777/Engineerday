import React, { useState } from 'react';
import { 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Clock, 
  ShieldAlert, 
  Search, 
  Sparkles, 
  Calendar, 
  Send,
  Zap,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  Trophy,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export default function RegisterPage({ eventSettings }) {
  const googleFormUrl = eventSettings?.googleFormUrl || 'https://forms.gle/Wz7TfiFHX1hNsakb8';
  const eventDate = "15 September 2026";

  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'google'
  const [showEmbed, setShowEmbed] = useState(false);

  // Direct Form State
  const [formData, setFormData] = useState({
    team_name: '',
    game: 'brain',
    student_name: '',
    student_mobile: '',
    member_name_2: '',
    member_name_3: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredTeam, setRegisteredTeam] = useState(null);

  // Sync Google Form state
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncGoogleMessage, setSyncGoogleMessage] = useState(null);

  // Search Team State
  const [searchTeam, setSearchTeam] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Compute clean embedded Google Form URL
  const embedUrl = (() => {
    if (!googleFormUrl) return 'https://docs.google.com/forms/d/e/1FAIpQLSfi7dSLkVP4LStLupemIR8H9ZteEA2RGd66HOSfRz_wBNMoFw/viewform?embedded=true';
    if (googleFormUrl.includes('1FAIpQLSfi7dSLkVP4LStLupemIR8H9ZteEA2RGd66HOSfRz_wBNMoFw') || googleFormUrl.includes('Wz7TfiFHX1hNsakb8')) {
      return 'https://docs.google.com/forms/d/e/1FAIpQLSfi7dSLkVP4LStLupemIR8H9ZteEA2RGd66HOSfRz_wBNMoFw/viewform?embedded=true';
    }
    if (googleFormUrl.includes('forms.gle/')) {
      return 'https://docs.google.com/forms/d/e/1FAIpQLSfi7dSLkVP4LStLupemIR8H9ZteEA2RGd66HOSfRz_wBNMoFw/viewform?embedded=true';
    }
    if (googleFormUrl.includes('/viewform')) {
      return googleFormUrl.split('?')[0] + '?embedded=true';
    }
    return googleFormUrl;
  })();

  // Handle Direct Online Registration
  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.team_name.trim()) {
      setSubmitError('Please enter a unique Team Name');
      return;
    }
    if (!formData.student_name.trim()) {
      setSubmitError('Please enter Student Name (Captain)');
      return;
    }
    if (!formData.student_mobile.trim()) {
      setSubmitError('Please enter Student Mobile Number');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        team_name: formData.team_name.trim(),
        game: formData.game,
        captain: formData.student_name.trim(),
        member1: formData.student_name.trim(),
        member2: formData.member_name_2.trim() || 'Member 2',
        member3: formData.member_name_3.trim() || 'Member 3',
        contact: formData.student_mobile.trim(),
        registration_status: 'VERIFIED'
      };

      const res = await api.createTeam(payload);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setRegisteredTeam(res.team || payload);
        setFormData({
          team_name: '',
          game: 'brain',
          student_name: '',
          student_mobile: '',
          member_name_2: '',
          member_name_3: ''
        });
      } else {
        setSubmitError(res.message || 'Registration failed');
      }
    } catch (err) {
      setSubmitError(err.message || 'Network error during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync Google Form on-demand
  const handleSyncGoogleNow = async () => {
    setSyncingGoogle(true);
    setSyncGoogleMessage(null);
    try {
      const res = await fetch('/api/teams/sync-now', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncGoogleMessage({
          success: true,
          text: data.message || `Successfully synced ${data.importedCount || 0} teams!`
        });
        if (data.importedCount > 0) {
          confetti({ particleCount: 75, spread: 60 });
        }
      } else {
        setSyncGoogleMessage({
          success: false,
          text: data.message || 'Sync failed. Make sure your Google Sheet is linked in Admin Settings.'
        });
      }
    } catch (err) {
      setSyncGoogleMessage({
        success: false,
        text: 'Sync request failed: ' + err.message
      });
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Quick lookup of registration status
  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!searchTeam.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await api.getTeams({ search: searchTeam.trim() });
      if (res.success && res.teams.length > 0) {
        setSearchResult({ found: true, team: res.teams[0] });
      } else {
        setSearchResult({ found: false, message: `No registered team matching "${searchTeam}" was found.` });
      }
    } catch (err) {
      setSearchResult({ found: false, message: 'Lookup query failed. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          REGISTRATION DESK • {eventDate}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Team Registration Portal
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Register your squad directly online for instant verification, or submit via the official Google Form.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-[11px] text-slate-400 uppercase">Squad Size</div>
          <div className="text-base font-bold text-white mt-0.5">Exactly 3 Members</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-[11px] text-slate-400 uppercase">Turn Timer</div>
          <div className="text-base font-bold text-white mt-0.5">30 Seconds / Q</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-[11px] text-slate-400 uppercase">Rounds</div>
          <div className="text-base font-bold text-white mt-0.5">3 Rounds / Game</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-[11px] text-slate-400 uppercase">Event Date</div>
          <div className="text-base font-bold text-cyan-300 mt-0.5">15 Sept 2026</div>
        </div>
      </div>

      {/* REGISTRATION CARD WITH TABS */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 space-y-8 shadow-2xl">
        
        {/* Tab Selection Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">REGISTRATION METHODS</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading mt-0.5">
              Submit Your Squad
            </h2>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Instant Web Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Form</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DIRECT ONLINE REGISTRATION (INSTANT) */}
        {activeTab === 'direct' && (
          <div className="space-y-6">
            
            {/* Success Card when just registered */}
            {registeredTeam && (
              <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-heading">
                        🎉 Registration Confirmed!
                      </h3>
                      <p className="text-xs text-emerald-300 font-mono">
                        Team "{registeredTeam.team_name}" is verified and ready for the symposium!
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-900 border border-emerald-500 text-emerald-200 text-xs font-mono font-bold">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Competition:</span>
                    <span className="text-cyan-300 font-bold uppercase">
                      {registeredTeam.game === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Captain / Lead:</span>
                    <span className="text-white font-bold">{registeredTeam.captain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact:</span>
                    <span className="text-slate-300">{registeredTeam.contact}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-400 font-mono">
                    ✓ Your team is live on the system. You can view your squad on the Leaderboard.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRegisteredTeam(null)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
                  >
                    Register Another Team
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleDirectSubmit} className="space-y-6">
              
              {/* Competition Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
                  1. Select Competition Event *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, game: 'brain' })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.game === 'brain'
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white font-heading">
                        Engineer’s Brain
                      </span>
                      {formData.game === 'brain' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-xs text-slate-400">
                      High-stakes technical quiz with speed bonus points.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, game: 'pictionary' })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.game === 'pictionary'
                        ? 'bg-sky-950/60 border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white font-heading">
                        Engineering Pictionary
                      </span>
                      {formData.game === 'pictionary' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </div>
                    <p className="text-xs text-slate-400">
                      Visual sketching & engineering concept deduction challenge.
                    </p>
                  </button>
                </div>
              </div>

              {/* Team Name & Student Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VLSI Innovators"
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Student Name (Captain / Lead) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Shinde"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  Student Mobile Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9822011223"
                  value={formData.student_mobile}
                  onChange={(e) => setFormData({ ...formData, student_mobile: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Squad Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Member Name 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Deshmukh"
                    value={formData.member_name_2}
                    onChange={(e) => setFormData({ ...formData, member_name_2: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Member Name 3
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pooja Kulkarni"
                    value={formData.member_name_3}
                    onChange={(e) => setFormData({ ...formData, member_name_3: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-black text-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Registering Squad...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>COMPLETE TEAM REGISTRATION (INSTANT)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 font-mono text-center mt-2">
                  ✓ Instant entry into tournament database • Verified immediately for event day
                </p>
              </div>

            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE FORM REGISTRATION */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white font-heading">
                    Official Department Google Form
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Already filled the Google Form? Click "Sync Google Form Responses" to update the website immediately!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncGoogleNow}
                    disabled={syncingGoogle}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {syncingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Sync Google Form</span>
                  </button>
                  <a
                    href={googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5"
                  >
                    <span>Open Form</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Sync Status Banner */}
              {syncGoogleMessage && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  syncGoogleMessage.success 
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                }`}>
                  {syncGoogleMessage.text}
                </div>
              )}
            </div>

            {/* Toggle Embedded View */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Want to fill the Google Form without opening a new tab?
              </span>
              <button
                type="button"
                onClick={() => setShowEmbed(!showEmbed)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 bg-slate-900 cursor-pointer"
              >
                {showEmbed ? 'Hide Embedded Form' : 'Show Embedded Form'}
              </button>
            </div>

            {showEmbed ? (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-inner">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="820"
                  frameBorder="0"
                  marginHeight="0"
                  marginWidth="0"
                  title="Google Form Registration"
                  className="w-full bg-white rounded-2xl"
                >
                  Loading Google Form…
                </iframe>
              </div>
            ) : (
              <div className="text-center py-6 p-8 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  Click below to open the official Google Form in a new tab. When you submit, our system auto-syncs your entry into the tournament database.
                </p>
                <a
                  href={googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-xl shadow-cyan-500/30 hover:scale-[1.02] transition-all"
                >
                  <span>FILL OUT GOOGLE FORM</span>
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}

          </div>
        )}

      </div>

      {/* TEAM REGISTRATION STATUS LOOKUP */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Check Your Team Registration Status
          </h3>
          <p className="text-xs text-slate-400">
            Enter your registered Team Name or Captain Name to check whether your squad has been verified.
          </p>
        </div>

        <form onSubmit={handleCheckStatus} className="flex gap-3 max-w-xl">
          <input
            type="text"
            placeholder="Enter Team Name..."
            value={searchTeam}
            onChange={(e) => setSearchTeam(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={isSearching || !searchTeam.trim()}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 disabled:opacity-40 cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Lookup Status'}
          </button>
        </form>

        {searchResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
            {searchResult.found ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{searchResult.team.team_name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                      {searchResult.team.game === 'brain' ? "Engineer's Brain" : 'Pictionary'}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono">
                    Captain: {searchResult.team.captain} • Squad: {searchResult.team.member1}, {searchResult.team.member2}, {searchResult.team.member3}
                  </p>
                </div>

                <div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                    searchResult.team.registration_status === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    {searchResult.team.registration_status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-400 font-mono">{searchResult.message}</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
