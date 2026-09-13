import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Edit3, 
  CheckCircle2, 
  Shield, 
  RefreshCw,
  Key,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Zap,
  Eye,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../utils/api';

export default function TeamsTab() {
  const [teams, setTeams] = useState([]);
  const [filterGame, setFilterGame] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Google Form API & Sync
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleConfig, setGoogleConfig] = useState({
    google_form_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_sheet_url: '',
    google_cloud_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_form_url: 'https://forms.gle/Wz7TfiFHX1hNsakb8'
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchGoogleConfig = async () => {
    try {
      const res = await api.getGoogleApiConfig();
      if (res.success && res.config) {
        setGoogleConfig(prev => ({ ...prev, ...res.config }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncGoogleSheet = async (previewOnly = false) => {
    if (!googleConfig.google_sheet_url) {
      alert('Please enter your Google Sheet responses URL or Spreadsheet ID');
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncGoogleSheet({
        sheetUrl: googleConfig.google_sheet_url,
        apiKey: googleConfig.google_cloud_api_key,
        previewOnly
      });
      setSyncResult(res);
      if (!previewOnly && res.success) {
        fetchTeams();
      }
    } catch (err) {
      setSyncResult({ success: false, message: err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const testGoogleFormWebhook = async () => {
    setTestLoading(true);
    setTestStatus(null);
    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const activeKey = googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026';
      const res = await fetch('/api/teams/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeKey
        },
        body: JSON.stringify({
          apiKey: activeKey,
          'Team Name': `VLSI Innovators #${randomNum}`,
          'Game': 'brain',
          'Captain Name': 'Aditya Shinde',
          'Member 1': 'Aditya Shinde',
          'Member 2': 'Rahul Deshmukh',
          'Member 3': 'Pooja Kulkarni',
          'Contact': '+91 98220 11223'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Webhook test failed');
      setTestStatus({ success: true, message: `✅ Webhook Connected! Created sample team: "${data.team?.team_name}"` });
      fetchTeams();
    } catch (err) {
      setTestStatus({ success: false, message: `❌ Error: ${err.message}` });
    } finally {
      setTestLoading(false);
    }
  };

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
    fetchGoogleConfig();
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowGoogleModal(true);
              fetchGoogleConfig();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-950 to-indigo-900 hover:from-indigo-900 hover:to-indigo-800 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Import teams directly from Google Form responses or Webhook using API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Form API</span>
          </button>

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
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
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

      {/* Google Forms API & Sync Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    Google Forms & Sheets API Sync
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Connect your official Google Form directly to the tournament roster using an API Key.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  setSyncResult(null);
                  setTestStatus(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Official Form Link */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400">Official Google Form:</span>
                <span className="text-cyan-400 font-bold truncate">https://forms.gle/Wz7TfiFHX1hNsakb8</span>
              </div>
              <a
                href="https://forms.gle/Wz7TfiFHX1hNsakb8"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 shrink-0 text-[11px]"
              >
                <span>Open Form</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Live Google Sheets API Sync Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  Method 1: Sync via Google Sheets API (Recommended)
                </h4>
                <span className="text-[10px] text-amber-400 font-mono font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  Instant Fetch
                </span>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Google Sheet URL / ID (Linked to Google Form)
                </label>
                <input
                  type="text"
                  value={googleConfig.google_sheet_url}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, google_sheet_url: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Google Cloud API Key</span>
                  <span className="text-[10px] text-slate-500">Optional for public sheet, required for private</span>
                </label>
                <input
                  type="text"
                  value={googleConfig.google_cloud_api_key}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, google_cloud_api_key: e.target.value })}
                  placeholder="e.g. AIzaSy..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheet(true)}
                  disabled={syncing || !googleConfig.google_sheet_url}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>Preview Entries</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheet(false)}
                  disabled={syncing || !googleConfig.google_sheet_url}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Fetch & Import All Teams Now</span>
                </button>
              </div>
            </div>

            {/* Sync Results View */}
            {syncResult && (
              <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${
                syncResult.success 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{syncResult.message}</span>
                </div>

                {syncResult.previewOnly && syncResult.teams && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 mt-2">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 sticky top-0">
                        <tr>
                          <th className="p-2">Team Name</th>
                          <th className="p-2">Game</th>
                          <th className="p-2">Captain</th>
                          <th className="p-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                        {syncResult.teams.slice(0, 8).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-2 font-bold text-white">{t.team_name}</td>
                            <td className="p-2 text-cyan-400 uppercase">{t.game}</td>
                            <td className="p-2 text-slate-300">{t.captain}</td>
                            <td className="p-2 text-slate-400">{t.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Webhook & Test Connection Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Method 2: Google Forms Live Webhook & API Key
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 3000);
                  }}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copied' : 'Copy API Key'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Webhook Endpoint:</span>
                  <code className="text-[11px] text-emerald-400 break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/teams/webhook
                  </code>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Secret API Key:</span>
                  <code className="text-[11px] text-indigo-300 break-all">
                    {googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026'}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-400">
                  Test API key and webhook reception:
                </span>
                <button
                  type="button"
                  onClick={testGoogleFormWebhook}
                  disabled={testLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {testLoading ? (
                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  <span>Test Connection</span>
                </button>
              </div>

              {testStatus && (
                <div className={`p-2.5 rounded-xl text-xs font-mono border ${
                  testStatus.success 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}>
                  {testStatus.message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  setSyncResult(null);
                  setTestStatus(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
