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
  Zap,
  Eye,
  Save,
  Link2
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

  // Import CSV & Google Forms Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('upload'); // 'upload' | 'paste' | 'live'
  const [importText, setImportText] = useState('');
  const [fileSelectedName, setFileSelectedName] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Google Forms API & Sheets Config
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const [googleConfig, setGoogleConfig] = useState({
    google_form_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_sheet_url: '',
    google_cloud_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_form_url: 'https://forms.gle/Wz7TfiFHX1hNsakb8'
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);
  const [syncingGoogleSheet, setSyncingGoogleSheet] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const fetchGoogleConfig = async () => {
    try {
      const res = await api.getGoogleApiConfig();
      if (res.success && res.config) {
        setGoogleConfig(prev => ({ ...prev, ...res.config }));
      }
    } catch (err) {
      console.error('Failed to load Google API config:', err);
    }
  };

  useEffect(() => {
    fetchGoogleConfig();
  }, []);

  // Background auto-sync if enabled
  useEffect(() => {
    let interval = null;
    if (autoSyncEnabled && googleConfig.google_sheet_url) {
      interval = setInterval(() => {
        handleSyncGoogleSheet(false);
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSyncEnabled, googleConfig.google_sheet_url]);

  const handleSaveGoogleConfig = async () => {
    setSavingConfig(true);
    try {
      await api.updateGoogleApiConfig(googleConfig);
      setSaveConfigSuccess(true);
      setTimeout(() => setSaveConfigSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save Google API settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSyncGoogleSheet = async (previewOnly = false) => {
    if (!googleConfig.google_sheet_url) {
      alert('Please enter your Google Sheet URL or Spreadsheet ID');
      return;
    }
    setSyncingGoogleSheet(true);
    setSyncResult(null);
    try {
      const res = await api.syncGoogleSheet({
        sheetUrl: googleConfig.google_sheet_url,
        apiKey: googleConfig.google_cloud_api_key,
        previewOnly
      });
      if (res.success) {
        setSyncResult(res);
        if (!previewOnly) {
          fetchTeams();
        }
      } else {
        setSyncResult({ success: false, message: res.message || 'Sync failed' });
      }
    } catch (err) {
      setSyncResult({ success: false, message: err.message || 'Sync failed' });
    } finally {
      setSyncingGoogleSheet(false);
    }
  };

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

  // Flexible CSV and TSV parser for Google Form exports
  const parseRawContentToTeams = (rawText) => {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Auto-detect delimiter: check first line for tabs, semicolons or commas
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t') && (firstLine.split('\t').length >= firstLine.split(',').length)) {
      delimiter = '\t';
    } else if (firstLine.includes(';') && (firstLine.split(';').length > firstLine.split(',').length)) {
      delimiter = ';';
    }

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Find column index by checking keywords
    const findColIdx = (keywords) => {
      for (let idx = 0; idx < headers.length; idx++) {
        const h = headers[idx];
        for (const kw of keywords) {
          if (h.includes(kw.toLowerCase())) return idx;
        }
      }
      return -1;
    };

    const teamNameIdx = findColIdx(['team name', 'team_name', 'squad name', 'team', 'संघ नाव', 'ग्रुप', 'नाव']);
    const gameIdx = findColIdx(['game', 'competition', 'event', 'स्पर्धा']);
    const captainIdx = findColIdx(['captain', 'leader', 'head', 'full name', 'नाव 1', 'participant 1']);
    const m1Idx = findColIdx(['member 1', 'member1', 'captain', 'leader', 'नाव 1']);
    const m2Idx = findColIdx(['member 2', 'member2', 'नाव 2']);
    const m3Idx = findColIdx(['member 3', 'member3', 'नाव 3']);
    const contactIdx = findColIdx(['contact', 'phone', 'mobile', 'whatsapp', 'number', 'संपर्क', 'मोबाईल']);

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (!vals || vals.length === 0 || vals.every(v => !v)) continue;

      let teamName = (teamNameIdx !== -1 ? vals[teamNameIdx] : vals[1] || vals[0] || '').trim();
      const rawGame = (gameIdx !== -1 ? vals[gameIdx] : vals[2] || '').toLowerCase();
      const game = rawGame.includes('pic') ? 'pictionary' : 'brain';

      const captain = (captainIdx !== -1 ? vals[captainIdx] : vals[3] || vals[1] || '').trim() || 'Captain';
      const m1 = (m1Idx !== -1 ? vals[m1Idx] : vals[3] || captain).trim() || captain;
      const m2 = (m2Idx !== -1 ? vals[m2Idx] : vals[4] || 'Member 2').trim() || 'Member 2';
      const m3 = (m3Idx !== -1 ? vals[m3Idx] : vals[5] || 'Member 3').trim() || 'Member 3';
      const contact = (contactIdx !== -1 ? vals[contactIdx] : vals[6] || 'N/A').trim() || 'N/A';

      if (!teamName && captain && captain !== 'Captain') {
        teamName = `${captain}'s Team`;
      }

      if (teamName) {
        parsed.push({
          team_name: teamName,
          game,
          captain,
          member1: m1,
          member2: m2,
          member3: m3,
          contact
        });
      }
    }
    return parsed;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSelectedName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result || '';
      setImportText(content);
      const parsed = parseRawContentToTeams(content);
      setParsedPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text) => {
    setImportText(text);
    setImportResult(null);
    const parsed = parseRawContentToTeams(text);
    setParsedPreview(parsed);
  };

  const executeImport = async () => {
    const teamsToImport = parsedPreview.length > 0 ? parsedPreview : parseRawContentToTeams(importText);
    if (teamsToImport.length === 0) {
      alert('No valid team rows found to import. Please check your CSV file or pasted text.');
      return;
    }

    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await api.importTeams(teamsToImport);
      setImportResult(res);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Import failed');
    } finally {
      setImportLoading(false);
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
            onClick={() => {
              setShowImportModal(true);
              setImportTab('upload');
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
            title="Import responses directly from your Google Form"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950" />
            Import Google Form Entries
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

      {/* Google Form Responses Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    Import Google Form Responses
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Add entries from your official Google Form directly into the database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setParsedPreview([]);
                  setFileSelectedName('');
                  setImportText('');
                }}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Google Form Link Banner */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400">Official Form:</span>
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

            {/* Tabs: File Upload vs Copy Paste vs Live Google API Sync */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setImportTab('upload')}
                className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  importTab === 'upload'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .CSV File
              </button>
              <button
                type="button"
                onClick={() => setImportTab('paste')}
                className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  importTab === 'paste'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                Paste Text / Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => setImportTab('live')}
                className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  importTab === 'live'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Live Google API Key Sync
              </button>
            </div>

            {/* Tab 1: File Upload */}
            {importTab === 'upload' && (
              <div className="space-y-3">
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-6 text-center bg-slate-950/60 hover:bg-slate-950 transition-all space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">
                        {fileSelectedName ? fileSelectedName : 'Click to select Google Form CSV File'}
                      </span>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Download responses from Google Sheets / Form as .csv and select it here
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold">
                      {fileSelectedName ? 'Change File' : 'Browse Computer (.csv)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <p className="text-[11px] font-mono text-slate-500">
                  💡 <strong>How to get CSV:</strong> Open your Google Form ➔ <strong>Responses</strong> ➔ click the green Sheets icon (or 3 dots ➔ <em>Download responses (.csv)</em>).
                </p>
              </div>
            )}

            {/* Tab 2: Paste Content */}
            {importTab === 'paste' && (
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">
                  Paste rows directly from Google Sheets or CSV:
                </label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Timestamp,Team Name,Game,Member 1,Member 2,Member 3,Captain,Contact&#10;2026-09-12,VLSI Knights,brain,Aditya,Rohan,Pooja,Aditya,9822011223"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Tab 3: Live Google API Key & Sheet Sync */}
            {importTab === 'live' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      Google Sheet URL or Spreadsheet ID
                    </label>
                    <input
                      type="text"
                      value={googleConfig.google_sheet_url}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, google_sheet_url: e.target.value })}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Tip: In your Google Form, click <strong>Responses</strong> ➔ <strong>Link to Sheets</strong> to get this spreadsheet URL.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Google Cloud API Key
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional if sheet is public</span>
                    </label>
                    <input
                      type="text"
                      value={googleConfig.google_cloud_api_key}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, google_cloud_api_key: e.target.value })}
                      placeholder="e.g. AIzaSy..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Enables secure automated fetching via Google Sheets API v4.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSyncGoogleSheet(true)}
                      disabled={syncingGoogleSheet || !googleConfig.google_sheet_url}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {syncingGoogleSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>Preview Entries</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSyncGoogleSheet(false)}
                      disabled={syncingGoogleSheet || !googleConfig.google_sheet_url}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      {syncingGoogleSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Fetch & Import All Teams</span>
                    </button>

                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-400 focus:ring-0"
                      />
                      <span className={autoSyncEnabled ? "text-emerald-400 font-bold" : "text-slate-400"}>
                        {autoSyncEnabled ? "● Live Auto-Sync Active (10s)" : "Enable Auto-Sync (10s)"}
                      </span>
                    </label>
                  </div>
                </div>

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
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Detected {parsedPreview.length} Teams Ready to Import:
                  </span>
                  <span className="text-slate-400">Review before saving</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Team Name</th>
                        <th className="p-2">Game</th>
                        <th className="p-2">Captain</th>
                        <th className="p-2">Members</th>
                        <th className="p-2">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {parsedPreview.slice(0, 50).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2 text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-bold text-white">{t.team_name}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                              t.game === 'brain' ? 'bg-cyan-950 text-cyan-300' : 'bg-purple-950 text-purple-300'
                            }`}>
                              {t.game}
                            </span>
                          </td>
                          <td className="p-2 text-cyan-300">{t.captain}</td>
                          <td className="p-2 text-slate-400 text-[11px]">
                            {[t.member1, t.member2, t.member3].filter(Boolean).join(', ')}
                          </td>
                          <td className="p-2 text-slate-400 text-[11px]">{t.contact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedPreview.length > 50 && (
                  <p className="text-[10px] text-slate-500 font-mono text-right">
                    Showing first 50 of {parsedPreview.length} entries
                  </p>
                )}
              </div>
            )}

            {/* Import Status Alert */}
            {importResult && (
              <div className={`p-4 rounded-2xl border text-xs font-mono space-y-1 ${
                importResult.success
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500 text-rose-300'
              }`}>
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.message}
                </p>
                {importResult.duplicates && importResult.duplicates.length > 0 && (
                  <p className="text-amber-300 text-[11px]">
                    ⚠️ Skipped duplicates ({importResult.duplicates.length}): {importResult.duplicates.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setShowGoogleFormModal(true);
                }}
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                Want real-time automatic sync? Use Webhook
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    setParsedPreview([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={executeImport}
                  disabled={importLoading || (parsedPreview.length === 0 && !importText.trim())}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/25"
                >
                  {importLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {parsedPreview.length > 0 
                      ? `Import ${parsedPreview.length} Google Form Entries` 
                      : 'Parse & Import Entries'}
                  </span>
                </button>
              </div>
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

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">3. Secret API Key</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveGoogleConfig}
                      disabled={savingConfig}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      {saveConfigSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saveConfigSuccess ? 'Saved' : 'Save Key'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 3000);
                      }}
                      className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={googleConfig.google_form_api_key}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, google_form_api_key: e.target.value })}
                  placeholder="engineers_day_google_form_key_2026"
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-400"
                />
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
                    const scriptCode = `function onFormSubmit(e) {\n  var WEBHOOK_URL = "${window.location.origin}/api/teams/webhook";\n  var API_KEY = "${googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026'}";\n  \n  var formResponse = e.response;\n  var itemResponses = formResponse.getItemResponses();\n  var payload = { apiKey: API_KEY };\n  \n  for (var i = 0; i < itemResponses.length; i++) {\n    var item = itemResponses[i];\n    payload[item.getItem().getTitle()] = item.getResponse();\n  }\n  \n  var options = {\n    method: "post",\n    contentType: "application/json",\n    headers: { "x-api-key": API_KEY },\n    payload: JSON.stringify(payload),\n    muteHttpExceptions: true\n  };\n  \n  UrlFetchApp.fetch(WEBHOOK_URL, options);\n}`;
                    navigator.clipboard.writeText(scriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Script Copied!' : 'Copy Apps Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44 leading-relaxed">
{`// Paste into your Google Form -> Script editor:
function onFormSubmit(e) {
  var WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/teams/webhook";
  var API_KEY = "${googleConfig.google_form_api_key || 'engineers_day_google_form_key_2026'}";
  
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

              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Notice for Local Computer Testing (localhost):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Google Apps Script executes on Google Cloud and <strong>cannot reach localhost</strong> directly without a public tunnel (like <code>npm run tunnel</code>).
                </p>
                <p className="text-[11px] leading-relaxed text-cyan-300">
                  ⚡ <strong>Recommended:</strong> In your Google Form, click <strong>Responses ➔ Link to Sheets</strong>. Then paste your Google Sheet URL in the <strong>Live Sync</strong> tab below and turn on <strong>Auto-Sync</strong> — it reads form entries directly into the database on localhost with zero tunnels!
                </p>
              </div>
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

            {/* Quick Switch to Live Sync */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  Have a Google Sheet link or Google Cloud API Key?
                </span>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  You can fetch and import all Google Form registrations directly without writing code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleFormModal(false);
                  setShowImportModal(true);
                  setImportTab('live');
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold whitespace-nowrap cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Open Live Sync Tab ➔
              </button>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleFormModal(false);
                  setTestStatus(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
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
