import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Globe, Calendar, Link, FileText, Sparkles, Clock, Zap, Timer } from 'lucide-react';
import { api } from '../../utils/api';
import { formatEventDateTime } from '../../utils/dateFormatter';

export default function EventSettingsTab({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    eventName: "Engineers' Day Celebration 2026",
    eventDate: '2026-09-15T10:00:00',
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
  const [countdownSaving, setCountdownSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countdownSaved, setCountdownSaved] = useState(false);

  // Live countdown preview calculation
  const [previewTimeLeft, setPreviewTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.eventSettings) {
          setSettings(prev => ({ ...prev, ...res.eventSettings }));
        }
      })
      .catch(console.error);
  }, []);

  // Update live preview every second
  useEffect(() => {
    const calc = () => {
      const target = new Date(settings.eventDate || '2026-09-15T10:00:00').getTime();
      const now = Date.now();
      const diff = target - now;
      if (isNaN(diff) || diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    setPreviewTimeLeft(calc());
    const interval = setInterval(() => {
      setPreviewTimeLeft(calc());
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.eventDate]);

  // Extract separate date (YYYY-MM-DD) and time (HH:mm) for easy editing
  const currentDate = settings.eventDate ? settings.eventDate.substring(0, 10) : '2026-09-15';
  const currentTime = settings.eventDate && settings.eventDate.length >= 16 ? settings.eventDate.substring(11, 16) : '10:00';

  const handleDateChange = (newDate) => {
    setSettings(prev => ({
      ...prev,
      eventDate: `${newDate}T${currentTime}:00`
    }));
  };

  const handleTimeChange = (newTime) => {
    setSettings(prev => ({
      ...prev,
      eventDate: `${currentDate}T${newTime}:00`
    }));
  };

  const handleQuickTimePreset = (presetTime) => {
    handleTimeChange(presetTime);
  };

  const handleQuickSaveCountdown = async () => {
    setCountdownSaving(true);
    setCountdownSaved(false);
    try {
      const res = await api.updateEventSettings({
        eventDate: settings.eventDate,
        eventStatus: settings.eventStatus
      });
      setCountdownSaved(true);
      if (onSettingsUpdated) onSettingsUpdated(settings);
      setTimeout(() => setCountdownSaved(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update countdown schedule');
    } finally {
      setCountdownSaving(false);
    }
  };

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
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white font-heading">
          GLOBAL EVENT CONFIGURATION
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Manage event date & opening time countdown, registration form lock, Google Form URL, and symposium settings.
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

      {/* DEDICATED COUNTDOWN & SCHEDULE EDITOR */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 relative overflow-hidden shadow-2xl shadow-cyan-950/40">
        
        {/* Glow Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-heading tracking-wide">
                  EVENT COUNTDOWN & SCHEDULE EDITOR
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  Live Public Widget
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Set the exact event date & opening time. The public website countdown updates in real time for all users.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={countdownSaving}
            onClick={handleQuickSaveCountdown}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{countdownSaving ? 'Updating...' : 'Save Countdown Schedule'}</span>
          </button>
        </div>

        {countdownSaved && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Countdown schedule updated! Public website is now counting down to {formatEventDateTime(settings.eventDate)}.</span>
          </div>
        )}

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Left Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Input */}
              <div>
                <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Event Date
                </label>
                <input
                  type="date"
                  required
                  value={currentDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Time Input */}
              <div>
                <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Opening / Start Time
                </label>
                <input
                  type="time"
                  required
                  value={currentTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                Quick Time Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { time: '10:00', label: '10:00 AM', tag: 'Official Opening' },
                  { time: '09:00', label: '09:00 AM', tag: 'Early Access' },
                  { time: '11:00', label: '11:00 AM', tag: 'Mid-Morning' },
                  { time: '14:00', label: '02:00 PM', tag: 'Afternoon Round' }
                ].map(preset => {
                  const isSelected = currentTime === preset.time;
                  return (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => handleQuickTimePreset(preset.time)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs flex items-center justify-between">
                        <span>{preset.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{preset.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Override */}
            <div>
              <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                Countdown Behavior & Status Override
              </label>
              <select
                value={settings.eventStatus}
                onChange={(e) => setSettings({ ...settings, eventStatus: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="AUTO">AUTO (Calculate Live Countdown from Date & Time)</option>
                <option value="UPCOMING">Force UPCOMING (Always Show Countdown Box)</option>
                <option value="LIVE">Force EVENT LIVE (Display "EVENT LIVE NOW" Banner)</option>
                <option value="COMPLETED">Force EVENT COMPLETED (Display Concluded Badge)</option>
              </select>
            </div>

          </div>

          {/* Right Live Preview Box (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Live Countdown Preview
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>

              {/* 4 Digital Time Counters */}
              <div className="grid grid-cols-4 gap-2 text-center my-3">
                {[
                  { label: 'DAYS', val: pad(previewTimeLeft.days) },
                  { label: 'HRS', val: pad(previewTimeLeft.hours) },
                  { label: 'MINS', val: pad(previewTimeLeft.minutes) },
                  { label: 'SECS', val: pad(previewTimeLeft.seconds) },
                ].map((box, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                    <div className="text-xl sm:text-2xl font-mono font-black text-cyan-300">
                      {box.val}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase mt-0.5">
                      {box.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-slate-400">Target Event Schedule:</div>
              <div className="text-white font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{formatEventDateTime(settings.eventDate)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Global event settings updated and published successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
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
              <label className="text-slate-300 font-mono">Event Date & Time (ISO String)</label>
              <input
                type="datetime-local"
                required
                value={settings.eventDate ? settings.eventDate.substring(0, 16) : '2026-09-15T10:00'}
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
            Registration Link & Podium Status
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

              <div>
                <label className="text-slate-300 font-mono">Countdown Status Override</label>
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
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Global Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
