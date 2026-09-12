import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Brain, 
  Palette, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Play, 
  Layers, 
  Activity, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function OverviewTab({ setActiveTab, setCurrentPage }) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    brainTeams: 0,
    pictionaryTeams: 0,
    totalPlayers: 0,
    verifiedTeams: 0,
    pendingTeams: 0,
    totalFaculty: 0,
  });
  const [loading, setLoading] = useState(true);
  const { brainSession, pictionarySession } = useSocket();

  useEffect(() => {
    Promise.all([
      api.getTeams(),
      api.getFaculty()
    ]).then(([teamsRes, facRes]) => {
      if (teamsRes.success) {
        const teams = teamsRes.teams;
        const brain = teams.filter(t => t.game === 'brain').length;
        const pic = teams.filter(t => t.game === 'pictionary').length;
        const verified = teams.filter(t => t.registration_status === 'VERIFIED').length;
        const pending = teams.filter(t => t.registration_status === 'PENDING').length;

        setStats({
          totalTeams: teams.length,
          brainTeams: brain,
          pictionaryTeams: pic,
          totalPlayers: teams.length * 3,
          verifiedTeams: verified,
          pendingTeams: pending,
          totalFaculty: facRes.success ? facRes.faculty.length : 0,
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'TOTAL TEAMS', val: stats.totalTeams, sub: 'All Registered Squads', icon: Users, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { label: 'TOTAL PLAYERS', val: stats.totalPlayers, sub: '3 Members Per Team', icon: Users, color: 'text-sky-400', border: 'border-sky-500/30' },
    { label: 'BRAIN TEAMS', val: stats.brainTeams, sub: "Engineer's Brain", icon: Brain, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { label: 'PICTIONARY TEAMS', val: stats.pictionaryTeams, sub: 'Engineering Pictionary', icon: Palette, color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { label: 'VERIFIED TEAMS', val: stats.verifiedTeams, sub: 'Approved Roster', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'PENDING TEAMS', val: stats.pendingTeams, sub: 'Awaiting Verification', icon: Clock, color: 'text-amber-400', border: 'border-amber-500/30' },
    { label: 'TOTAL FACULTY', val: stats.totalFaculty, sub: 'Department Mentors', icon: GraduationCap, color: 'text-purple-400', border: 'border-purple-500/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading tracking-wide">
            ADMIN OVERVIEW DASHBOARD
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Engineers’ Day 2026 • Real-Time Telemetry & Tournament Health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('brain')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <Brain className="w-3.5 h-3.5" />
            Control Brain
          </button>
          <button
            onClick={() => setActiveTab('pictionary')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Palette className="w-3.5 h-3.5" />
            Control Pictionary
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className={`glass-card p-5 rounded-2xl border ${c.border} bg-slate-900/80 relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  {c.label}
                </span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-3xl font-black text-white font-mono mt-2 tracking-tight">
                {c.val}
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-1">
                {c.sub}
              </div>
            </div>
          );
        })}

        {/* Live Game Status Card */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVE SESSIONS
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Brain:</span>
              <strong className="text-cyan-300">R{brainSession?.session?.round || 1} ({brainSession?.session?.status || 'IDLE'})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pictionary:</span>
              <strong className="text-indigo-300">R{pictionarySession?.session?.round || 1} ({pictionarySession?.session?.status || 'IDLE'})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Registrations quick jump */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-heading">Registration Desk</h3>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage student registrations, review team rosters, import Google Form CSV responses, and verify eligibility.
          </p>
          <button
            onClick={() => setActiveTab('registrations')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center gap-1.5"
          >
            <span>Open Registrations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Question Bank */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-heading">Question Bank</h3>
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Curate MCQs, chip diagrams, component identification graphics, logical questions, and pictionary engineering concepts.
          </p>
          <button
            onClick={() => setActiveTab('questions')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center justify-center gap-1.5"
          >
            <span>Manage Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Live Scoreboard & Projector */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-heading">Projector & Scores</h3>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Launch the high-contrast presentation mode for stage projection or export full event results to CSV.
          </p>
          <button
            onClick={() => setCurrentPage('projector-scoreboard')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <span>Launch Projector Display</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
