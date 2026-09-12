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
  Send
} from 'lucide-react';
import { api } from '../utils/api';

export default function RegisterPage({ eventSettings }) {
  const googleFormUrl = eventSettings?.googleFormUrl || 'https://docs.google.com/forms';
  const eventDate = "15 September 2026";
  const [searchTeam, setSearchTeam] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

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
          Please review the official participation criteria and rules before proceeding to the Google Form registration.
        </p>
      </div>

      {/* BEFORE YOU REGISTER Card */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 space-y-8 shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">CRITICAL GUIDANCE</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading mt-0.5">
              BEFORE YOU REGISTER
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            Mandatory Checklist
          </span>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-[11px] text-slate-400 uppercase">Squad Size</div>
            <div className="text-base font-bold text-white mt-0.5">Exactly 3 Members</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-[11px] text-slate-400 uppercase">Turn Timer</div>
            <div className="text-base font-bold text-white mt-0.5">30 Seconds / Q</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-[11px] text-slate-400 uppercase">Rounds</div>
            <div className="text-base font-bold text-white mt-0.5">3 Rounds / Game</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-[11px] text-slate-400 uppercase">Event Date</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">15 Sept 2026</div>
          </div>
        </div>

        {/* Essential Rules */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-white font-heading">
            Key Regulations & Reporting Instructions
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            {[
              'Each team must designate one Captain who will be the point of contact for tournament updates.',
              'A student can only participate in one competition (either Engineer’s Brain or Engineering Pictionary).',
              'Scoring features dynamic time bonuses: answering in under 5 seconds awards +5 bonus points on top of base points.',
              'Both games strictly enforce the 30-second countdown; zero tolerance for late or duplicate submissions.',
              'Verification is conducted by faculty conveners. Ensure valid college student ID cards on the event day.',
            ].map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prominent REGISTER NOW Button */}
        <div className="pt-6 border-t border-slate-800 text-center space-y-3">
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] transition-all"
          >
            <span>REGISTER NOW VIA GOOGLE FORM</span>
            <ExternalLink className="w-5 h-5" />
          </a>
          <p className="text-xs text-slate-400 font-mono">
            Opens the official department Google Form in a new tab. Managed live by the Admin Panel.
          </p>
        </div>
      </div>

      {/* Team Registration Status Lookup */}
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
            className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 disabled:opacity-40"
          >
            {isSearching ? 'Searching...' : 'Lookup Status'}
          </button>
        </form>

        {searchResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
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
