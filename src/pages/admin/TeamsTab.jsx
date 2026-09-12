import React, { useState, useEffect } from 'react';
import { Users, Trophy, Edit3, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';

export default function TeamsTab() {
  const [teams, setTeams] = useState([]);
  const [filterGame, setFilterGame] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.getTeams({ game: filterGame });
      if (res.success) setTeams(res.teams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [filterGame]);

  const handleStatusChange = async (teamId, newStatus) => {
    try {
      await api.updateTeam(teamId, { status: newStatus });
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateTeam(editingTeam.id, editingTeam);
      setEditingTeam(null);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  const statuses = ['REGISTERED', 'READY', 'WAITING', 'LIVE', 'ROUND 1', 'ROUND 2', 'ROUND 3', 'COMPLETED'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            TEAMS & TOURNAMENT ROSTER
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Monitor squad statuses, adjust round stages, and manage rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
          >
            <option value="all">All Games</option>
            <option value="brain">Engineer's Brain</option>
            <option value="pictionary">Engineering Pictionary</option>
          </select>
          <button
            onClick={fetchTeams}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div key={t.id} className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                t.game === 'brain' ? 'bg-cyan-950 text-cyan-400' : 'bg-indigo-950 text-indigo-400'
              }`}>
                {t.game}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Rank #{t.rank}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white font-heading">{t.team_name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Captain: {t.captain}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Squad Members:</div>
              <div className="text-slate-300">1. {t.member1}</div>
              <div className="text-slate-300">2. {t.member2}</div>
              <div className="text-slate-300">3. {t.member3}</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Score</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">{t.score} Pts</span>
              </div>

              {/* Status Select */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Status</span>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-[11px] focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setEditingTeam(t)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Team / Adjust Score
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">Edit Team: {editingTeam.team_name}</h3>
            <form onSubmit={handleEditSave} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-mono">Team Name</label>
                <input
                  type="text"
                  required
                  value={editingTeam.team_name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, team_name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono">Adjust Score (Points)</label>
                <input
                  type="number"
                  required
                  value={editingTeam.score}
                  onChange={(e) => setEditingTeam({ ...editingTeam, score: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono">Contact Phone</label>
                <input
                  type="text"
                  value={editingTeam.contact}
                  onChange={(e) => setEditingTeam({ ...editingTeam, contact: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
