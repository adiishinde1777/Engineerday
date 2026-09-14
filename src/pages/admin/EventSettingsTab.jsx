import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Globe, Calendar, Link, FileText, Sparkles } from 'lucide-react';
import { api } from '../../utils/api';

export default function EventSettingsTab({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    eventName: "Engineers' Day Celebration 2026",
    eventDate: '2026-09-15T09:00:00',
    eventSubtitle: 'Think. Create. Solve. Engineer the Future.',
    eventDescription: '',
    googleFormUrl: 'https://forms.google.com',
    eventStatus: 'AUTO',
    footerText: "Engineer's Day 2026 | Designed & Developed by Aditya Shinde",
    reportingInstructions: 'All team members must report at the Technical Auditorium 30 minutes prior to Round 1 with valid college ID cards.',
    winnersFinalized: 'false',
    registrations_locked: 'false'
  });
  const [loading, setLoading] = useState(false);
  const [lockingLoading, setLockingLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.eventSettings) {
          setSettings(prev => ({ ...prev, ...res.eventSettings }));
        }
      })
      .catch(console.error);
  }, []);

  const handleQuickToggleLock = async () => {
    const isCurrentlyLocked = settings.registrations_locked === 'true' || settings.registrations_locked === '1';
    const newLockState = isCurrentlyLocked ? 'false' : 'true';
    const actionName = isCurrentlyLocked ? 'UNLOCK' : 'LOCK';
    
    if (!window.confirm(`Are you sure you want to ${actionName} squad registrations? ${!isCurrentlyLocked ? 'Students will immediately be blocked from registering new teams.' : 'Students will be allowed to submit new registrations.'}`)) {
      return;
    }

    setLockingLoading(true);
    try {
      await api.updateEventSettings({ registrations_locked: newLockState });
      setSettings(prev => ({ ...prev, registrations_locked: newLockState }));
      if (onSettingsUpdated) onSettingsUpdated({ ...settings, registrations_locked: newLockState });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update registration lock state');
    } finally {
      setLockingLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.updateEventSettings(settings);
      setSaved(true);
      if (onSettingsUpdated) onSettingsUpdated(settings);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save event settings');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = settings.registrations_locked === 'true' || settings.registrations_locked === '1';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white font-heading">
          GLOBAL EVENT CONFIGURATION
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Update event branding, registration Google Form URL, reporting guidelines, and symposium status.
        </p>
      </div>

      {/* Emergency / Registration Gateway Lock Control */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isLocked 
          ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/50' 
          : 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono text-xl shrink-0 ${
              isLocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isLocked ? '🔒' : '🟢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                  Registration Gateway Lock
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  isLocked ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isLocked ? 'Form Locked' : 'Form Open'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {isLocked 
                  ? 'Squad registration is currently LOCKED. Public visitors cannot register new teams. Form fields and API submissions are disabled.'
                  : 'Squad registration is currently OPEN. Candidates can register their squads and view confirmation receipts.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={lockingLoading}
            onClick={handleQuickToggleLock}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0 ${
              isLocked
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            } disabled:opacity-50`}
          >
            {lockingLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isLocked ? (
              <>
                <span>🔓</span>
                <span>Unlock Registrations</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Lock / Stop Registration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Global event settings updated and published successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Event Info */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Symposium Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-mono">Event Name</label>
              <input
                type="text"
                required
                value={settings.eventName}
                onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans text-sm"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono">Event Date & Opening Time</label>
              <input
                type="datetime-local"
                required
                value={settings.eventDate ? settings.eventDate.substring(0, 16) : '2026-09-15T09:00'}
                onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="text-slate-300 font-mono">Event Subtitle / Motto</label>
            <input
              type="text"
              value={settings.eventSubtitle}
              onChange={(e) => setSettings({ ...settings, eventSubtitle: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans"
            />
          </div>

          <div className="text-xs">
            <label className="text-slate-300 font-mono">Event Description</label>
            <textarea
              rows={3}
              value={settings.eventDescription}
              onChange={(e) => setSettings({ ...settings, eventDescription: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans"
            />
          </div>
        </div>

        {/* Google Form Link & Status */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Link className="w-4 h-4 text-cyan-400" />
            Registration Link & Symposium Status Override
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-mono font-bold text-cyan-400">
                Official Google Form Registration URL
              </label>
              <p className="text-slate-400 text-[11px] mb-1">
                The public "REGISTER NOW" button dynamically opens this link.
              </p>
              <input
                type="url"
                required
                value={settings.googleFormUrl}
                onChange={(e) => setSettings({ ...settings, googleFormUrl: e.target.value })}
                placeholder="https://forms.google.com/..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-slate-300 font-mono">Event Countdown Status Override</label>
                <select
                  value={settings.eventStatus}
                  onChange={(e) => setSettings({ ...settings, eventStatus: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                >
                  <option value="AUTO">AUTO (Calculate from Date)</option>
                  <option value="UPCOMING">Force UPCOMING (Show Countdown)</option>
                  <option value="LIVE">Force EVENT LIVE (Show Live Banner)</option>
                  <option value="COMPLETED">Force EVENT COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-mono">Finalize Winners Podium</label>
                <select
                  value={settings.winnersFinalized}
                  onChange={(e) => setSettings({ ...settings, winnersFinalized: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                >
                  <option value="false">In Progress (Preliminary Ranks)</option>
                  <option value="true">Finalized (Show Official Hall of Fame)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines & Footer */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Reporting Advisory & Website Footer Text
          </h3>

          <div>
            <label className="text-slate-300 font-mono">Reporting Advisory</label>
            <textarea
              rows={2}
              value={settings.reportingInstructions}
              onChange={(e) => setSettings({ ...settings, reportingInstructions: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono">Public Footer Credit Text</label>
            <input
              type="text"
              value={settings.footerText}
              onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Global Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
