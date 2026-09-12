import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Upload, 
  Download, 
  Plus, 
  AlertCircle, 
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  Key,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { api, getAuthToken } from '../../utils/api';

export default function RegistrationsTab() {
  const [teams, setTeams] = useState([]);
  const [filterGame, setFilterGame] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    game: 'brain',
    captain: '',
    member1: '',
    member2: '',
    member3: '',
    contact: '',
    registration_status: 'VERIFIED'
  });

  // Import CSV Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Google Forms API Modal
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.getTeams({
        game: filterGame,
        registration_status: filterStatus,
        search: search.trim()
      });
      if (res.success) setTeams(res.teams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [filterGame, filterStatus, search]);

  const handleToggleStatus = async (team) => {
    const newStatus = team.registration_status === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    try {
      await api.updateTeam(team.id, { registration_status: newStatus });
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to update registration status');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team registration?')) return;
    try {
      await api.deleteTeam(id);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    }
  };

  const handleClearSeed = async () => {
    if (!window.confirm('Clear all demo seed teams from the database? This action is permanent.')) return;
    try {
      const res = await api.clearSeedTeams();
      alert(res.message);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to clear seed teams');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/export/registrations?token=${encodeURIComponent(token || '')}`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to download registrations CSV');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'Engineers_Day_2026_Registrations.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Download Error: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const testGoogleFormWebhook = async () => {
    setTestLoading(true);
    setTestStatus(null);
    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const res = await fetch('/api/teams/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'engineers_day_google_form_key_2026'
        },
        body: JSON.stringify({
          apiKey: 'engineers_day_google_form_key_2026',
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
      setTestStatus({ success: false, message: `❌ Connection Failed: ${err.message}` });
    } finally {
      setTestLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createTeam(formData);
      setShowAddModal(false);
      setFormData({
        team_name: '',
        game: 'brain',
        captain: '',
        member1: '',
        member2: '',
        member3: '',
        contact: '',
        registration_status: 'VERIFIED'
      });
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to create team');
    }
  };

  // Google Form CSV parser
  const handleCSVImport = async () => {
    if (!importText.trim()) return;
    try {
      const lines = importText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least one data row');
        return;
      }

      // Simple CSV line splitter that handles quotes
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      
      const parsedTeams = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || '';
        });

        // Smart mapping for typical Google Form columns
        const teamName = obj['team name'] || obj['team_name'] || obj['team'] || vals[1] || '';
        const game = (obj['game'] || obj['competition'] || vals[2] || 'brain').toLowerCase().includes('pic') ? 'pictionary' : 'brain';
        const m1 = obj['member 1'] || obj['captain'] || obj['member 1 name'] || vals[3] || '';
        const m2 = obj['member 2'] || obj['member 2 name'] || vals[4] || 'Member 2';
        const m3 = obj['member 3'] || obj['member 3 name'] || vals[5] || 'Member 3';
        const captain = obj['captain'] || m1;
        const contact = obj['contact'] || obj['phone'] || obj['mobile'] || vals[6] || 'N/A';

        if (teamName) {
          parsedTeams.push({
            team_name: teamName,
            game,
            captain,
            member1: m1 || captain,
            member2: m2,
            member3: m3,
            contact
          });
        }
      }

      const res = await api.importTeams(parsedTeams);
      setImportResult(res);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Import failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            REGISTRATIONS & TEAMS DESK
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage registrations, verify team rosters, and import Google Form responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowGoogleFormModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm"
            title="Configure Google Forms live API key and webhook synchronization"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            Google Forms API
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Team
          </button>

          <button
            onClick={handleClearSeed}
            className="px-3 py-2 rounded-xl text-xs font-mono text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30"
            title="Clear all demo seed teams"
          >
            Clear Demo Data
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Game filter */}
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
          >
            <option value="all">All Games</option>
            <option value="brain">Engineer's Brain</option>
            <option value="pictionary">Engineering Pictionary</option>
          </select>

          {/* Verification status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search team or member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none font-mono text-xs"
            />
          </div>
          <button
            onClick={fetchTeams}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">TEAM NAME</th>
                <th className="py-3 px-4">GAME</th>
                <th className="py-3 px-4">MEMBERS (3 SQUAD)</th>
                <th className="py-3 px-4">CONTACT</th>
                <th className="py-3 px-4 text-center">VERIFICATION</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                    NO REGISTRATIONS FOUND
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white font-heading">
                      <div className="flex items-center gap-2">
                        <span>{t.team_name}</span>
                        {t.is_seed === 1 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        t.game === 'brain' ? 'bg-cyan-950 text-cyan-400' : 'bg-indigo-950 text-indigo-400'
                      }`}>
                        {t.game}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <div>1. <strong className="text-white">{t.member1} (Capt)</strong></div>
                      <div>2. {t.member2}</div>
                      <div>3. {t.member3}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {t.contact}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                          t.registration_status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40 hover:bg-amber-900'
                        }`}
                        title="Click to toggle status"
                      >
                        {t.registration_status}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTeam(t.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-500/30"
                        title="Delete team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white font-heading">Add New Team Registration</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-mono">Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono">Competition Game</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="brain">Engineer's Brain</option>
                    <option value="pictionary">Engineering Pictionary</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-mono">Captain Name</label>
                  <input
                    type="text"
                    required
                    value={formData.captain}
                    onChange={(e) => setFormData({ ...formData, captain: e.target.value, member1: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 font-mono">Member 1</label>
                  <input
                    type="text"
                    required
                    value={formData.member1}
                    onChange={(e) => setFormData({ ...formData, member1: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-mono">Member 2</label>
                  <input
                    type="text"
                    required
                    value={formData.member2}
                    onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-mono">Member 3</label>
                  <input
                    type="text"
                    required
                    value={formData.member3}
                    onChange={(e) => setFormData({ ...formData, member3: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono">Contact Phone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Import Google Form CSV Data
            </h3>
            <p className="text-xs text-slate-400">
              Paste the exported CSV text from your Google Form responses sheet. The system will automatically parse fields and detect duplicate team names.
            </p>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Timestamp,Team Name,Game,Member 1,Member 2,Member 3,Captain,Contact&#10;2026-09-12,Neural Knights,brain,Arjun,Riya,Karan,Arjun,+91 9811122233"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
            />

            {importResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <p className="text-emerald-400 font-bold">{importResult.message}</p>
                {importResult.duplicates && importResult.duplicates.length > 0 && (
                  <p className="text-amber-400">
                    Skipped duplicates: {importResult.duplicates.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCSVImport}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Forms Live API & Webhook Modal */}
      {showGoogleFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    Google Forms Live API & Webhook Sync
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Connect your official Google Form directly to the website database in real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleFormModal(false);
                  setTestStatus(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Official Google Form Link */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">1. Official Form URL</span>
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-cyan-300 break-all">
                  https://forms.gle/Wz7TfiFHX1hNsakb8
                </code>
                <a
                  href="https://forms.gle/Wz7TfiFHX1hNsakb8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Webhook URL & API Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">2. Webhook Endpoint</span>
                <code className="text-xs font-mono text-emerald-400 block break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/teams/webhook
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">3. Secret API Key</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('engineers_day_google_form_key_2026');
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 3000);
                    }}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-indigo-300 block">
                  engineers_day_google_form_key_2026
                </code>
              </div>
            </div>

            {/* Ready-to-use Google Apps Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase">
                  4. Google Apps Script (Auto-Sync on Form Submit)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const scriptCode = `function onFormSubmit(e) {\n  var WEBHOOK_URL = "${window.location.origin}/api/teams/webhook";\n  var API_KEY = "engineers_day_google_form_key_2026";\n  \n  var formResponse = e.response;\n  var itemResponses = formResponse.getItemResponses();\n  var payload = { apiKey: API_KEY };\n  \n  for (var i = 0; i < itemResponses.length; i++) {\n    var item = itemResponses[i];\n    payload[item.getItem().getTitle()] = item.getResponse();\n  }\n  \n  var options = {\n    method: "post",\n    contentType: "application/json",\n    headers: { "x-api-key": API_KEY },\n    payload: JSON.stringify(payload),\n    muteHttpExceptions: true\n  };\n  \n  UrlFetchApp.fetch(WEBHOOK_URL, options);\n}`;
                    navigator.clipboard.writeText(scriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-mono flex items-center gap-1.5"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Script Copied!' : 'Copy Apps Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44 leading-relaxed">
{`// Paste into your Google Form -> Script editor:
function onFormSubmit(e) {
  var WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/teams/webhook";
  var API_KEY = "engineers_day_google_form_key_2026";
  
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();
  var payload = { apiKey: API_KEY };
  
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    payload[item.getItem().getTitle()] = item.getResponse();
  }
  
  var options = {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`}
              </pre>

              <p className="text-[11px] text-slate-400 font-mono">
                💡 <strong>How to set up in 60 seconds:</strong> In your Google Form, click the 3 dots ➔ <strong>Script editor</strong> ➔ Paste the code above ➔ Click <strong>Triggers</strong> (clock icon) ➔ <strong>Add Trigger</strong> ➔ Event source: <em>From form</em> ➔ Event type: <em>On form submit</em>.
              </p>
            </div>

            {/* Live Test Connection */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">Test API Key & Webhook</h4>
                  <p className="text-[11px] text-slate-400">Sends a verified test squad directly to verify connectivity.</p>
                </div>
                <button
                  type="button"
                  onClick={testGoogleFormWebhook}
                  disabled={testLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  {testLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </button>
              </div>

              {testStatus && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  testStatus.success 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}>
                  {testStatus.message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleFormModal(false);
                  setTestStatus(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
              >
                Close Settings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
