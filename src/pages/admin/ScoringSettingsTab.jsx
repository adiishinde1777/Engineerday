import React, { useState, useEffect } from 'react';
import { Settings2, Save, Clock, Trophy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';

export default function ScoringSettingsTab() {
  const [activeGame, setActiveGame] = useState('brain'); // 'brain' | 'pictionary'
  const [scoring, setScoring] = useState({
    brain: {
      base_points: 10,
      timer_duration: 30,
      negative_points: 0,
      tier_0_5: 5,
      tier_6_10: 4,
      tier_11_15: 3,
      tier_16_20: 2,
      tier_21_25: 1,
      tier_26_30: 0,
      tie_breaker: 'correct_then_time'
    },
    pictionary: {
      base_points: 10,
      timer_duration: 30,
      negative_points: 0,
      tier_0_5: 5,
      tier_6_10: 4,
      tier_11_15: 3,
      tier_16_20: 2,
      tier_21_25: 1,
      tier_26_30: 0,
      tie_breaker: 'correct_then_time'
    }
  });
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.scoringSettings) {
          setScoring(prev => ({ ...prev, ...res.scoringSettings }));
        }
      })
      .catch(console.error);
  }, []);

  const current = scoring[activeGame] || scoring.brain;

  const handleFieldChange = (field, value) => {
    setScoring((prev) => ({
      ...prev,
      [activeGame]: {
        ...prev[activeGame],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');
    try {
      await api.updateScoringSettings(activeGame, current);
      setSavedMessage(`Scoring settings for ${activeGame === 'brain' ? "Engineer's Brain" : 'Engineering Pictionary'} saved successfully!`);
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update scoring settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            SCORING SETTINGS & TIME-BONUS MATRIX
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Configure dynamic response-time rewards, timer durations, and tie-breakers without modifying source code.
          </p>
        </div>

        {/* Game Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveGame('brain')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeGame === 'brain' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Engineer's Brain
          </button>
          <button
            onClick={() => setActiveGame('pictionary')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeGame === 'pictionary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Engineering Pictionary
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Parameters */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            Core Point Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-mono">Base Correct Points</label>
              <input
                type="number"
                min="1"
                max="100"
                value={current.base_points}
                onChange={(e) => handleFieldChange('base_points', Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 10 points</span>
            </div>

            <div>
              <label className="text-slate-300 font-mono">Question Stopwatch Duration (Seconds)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={current.timer_duration}
                onChange={(e) => handleFieldChange('timer_duration', Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 30 seconds</span>
            </div>

            <div>
              <label className="text-slate-300 font-mono">Negative Penalty (Wrong Answer)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={current.negative_points}
                onChange={(e) => handleFieldChange('negative_points', Number(e.target.value))}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Deducted on incorrect answer (0 = disabled)</span>
            </div>
          </div>
        </div>

        {/* 6 Time-Bonus Bands */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Dynamic Time-Bonus Tier Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Teams answering within these response time brackets earn extra bonus points.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            {[
              { field: 'tier_0_5', label: '0 – 5 sec' },
              { field: 'tier_6_10', label: '6 – 10 sec' },
              { field: 'tier_11_15', label: '11 – 15 sec' },
              { field: 'tier_16_20', label: '16 – 20 sec' },
              { field: 'tier_21_25', label: '21 – 25 sec' },
              { field: 'tier_26_30', label: '26 – 30 sec' },
            ].map((t) => (
              <div key={t.field} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                <label className="text-[11px] font-mono text-slate-400 block font-semibold">{t.label}</label>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-cyan-400 font-mono font-bold">+</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={current[t.field]}
                    onChange={(e) => handleFieldChange(t.field, Number(e.target.value))}
                    className="w-14 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center text-cyan-300 font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tie-breaker policy */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3">
          <h3 className="text-sm font-bold text-white font-heading">
            Automated Tie-Breaker Priority
          </h3>
          <p className="text-xs text-slate-400">
            If two squads finish with identical points, ranking resolves by:
          </p>

          <select
            value={current.tie_breaker}
            onChange={(e) => handleFieldChange('tie_breaker', e.target.value)}
            className="w-full sm:w-96 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
          >
            <option value="correct_then_time">1. Higher Correct Answers, then 2. Lower Total Response Time</option>
            <option value="time_then_correct">1. Lower Response Time, then 2. Higher Correct Answers</option>
            <option value="earlier_completion">1. Earlier Round Completion Timestamp</option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Scoring Criteria'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
