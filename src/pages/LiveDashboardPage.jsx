import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Tv, 
  Search, 
  Filter, 
  Users, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import TeamProfileModal from '../components/TeamProfileModal';

export default function LiveDashboardPage({ setCurrentPage }) {
  const { socket, scoreboard, setScoreboard, isConnected } = useSocket();
  const [filterGame, setFilterGame] = useState('all'); // 'all' | 'brain' | 'pictionary'
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchScoreboard = async () => {
    setLoading(true);
    try {
      const res = await api.getTeams({ game: filterGame, search: search.trim() });
      if (res.success) {
        setScoreboard(res.teams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, [filterGame, search]);

  // Real-time listener for score updates and round conclusions
  useEffect(() => {
    if (!socket) return;
    const handleLiveScoreUpdate = () => {
      fetchScoreboard();
    };

    socket.on('scoreboard_updated', handleLiveScoreUpdate);
    socket.on('pictionary_round_finished', handleLiveScoreUpdate);
    socket.on('brain_round_finished', handleLiveScoreUpdate);
    socket.on('new_answer_submitted', handleLiveScoreUpdate);

    return () => {
      socket.off('scoreboard_updated', handleLiveScoreUpdate);
      socket.off('pictionary_round_finished', handleLiveScoreUpdate);
      socket.off('brain_round_finished', handleLiveScoreUpdate);
      socket.off('new_answer_submitted', handleLiveScoreUpdate);
    };
  }, [socket, filterGame, search]);

  const filteredTeams = scoreboard.filter((team) => {
    if (filterGame !== 'all' && team.game !== filterGame && team.game !== 'both') return false;
    if (search && !team.team_name.toLowerCase().includes(search.toLowerCase()) && !team.captain.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Banner with Projector Mode action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              REAL-TIME BROADCAST
            </span>
            <span className="text-xs font-mono text-slate-400">
              15 September 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
            LIVE ENGINEER'S DAY DASHBOARD
          </h1>
          <p className="text-sm text-slate-300">
            Real-time standings, round progressions, and scoring telemetry synchronized with zero latency.
          </p>
        </div>

        {/* Projector Mode Launch Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('projector-scoreboard')}
            className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Tv className="w-4 h-4" />
            Launch Projector Mode
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Game Filter Pills */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'all', label: 'All Competitions' },
            { id: 'brain', label: "Engineer's Brain" },
            { id: 'pictionary', label: 'Engineering Pictionary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterGame(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                filterGame === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search team or captain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchScoreboard}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Scoreboard Table */}
      <div className="glass-card rounded-3xl border border-cyan-500/20 overflow-hidden shadow-2xl bg-slate-900/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                <th className="py-4 px-4 sm:px-6">RANK</th>
                <th className="py-4 px-4 sm:px-6">TEAM NAME & SQUAD</th>
                <th className="py-4 px-4 sm:px-6">GAME</th>
                <th className="py-4 px-4 sm:px-6 text-center">STATUS</th>
                <th className="py-4 px-4 sm:px-6 text-right">TOTAL SCORE</th>
                <th className="py-4 px-4 sm:px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-500 font-mono">
                    <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                    NO REGISTERED TEAMS FOUND IN THIS CATEGORY
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`hover:bg-slate-850/60 transition-colors cursor-pointer ${
                        isTop1 ? 'bg-amber-950/15' : isTop2 ? 'bg-slate-800/20' : isTop3 ? 'bg-amber-900/10' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-mono font-black text-xs ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                              : isTop2
                              ? 'bg-slate-300 text-slate-950'
                              : isTop3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>

                      {/* Team Name & Squad */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-white text-sm sm:text-base font-heading flex items-center gap-2">
                          <span>{team.team_name}</span>
                          {isTop1 && <span className="text-xs text-amber-400">👑</span>}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Capt: {team.captain} • {team.member2}, {team.member3}
                        </div>
                      </td>

                      {/* Game */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                          team.game === 'both'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : team.game === 'brain'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {team.game === 'both' ? 'Both Games' : team.game === 'brain' ? 'Brain' : 'Pictionary'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                            team.status === 'LIVE' || team.status.includes('ROUND')
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                              : team.status === 'COMPLETED'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {team.status}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono tracking-tight">
                          {team.score}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 ml-1">PTS</span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeamId(team.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 hover:text-white bg-slate-800 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/40 inline-flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Profile Modal */}
      {selectedTeamId && (
        <TeamProfileModal
          teamId={selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
        />
      )}

    </div>
  );
}
