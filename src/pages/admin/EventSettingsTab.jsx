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
    winnersFinalized: 'false'
  });
  const [loading, setLoading] = useState(false);
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
