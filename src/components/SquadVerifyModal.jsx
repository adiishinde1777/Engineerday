import React, { useState } from 'react';
import { ShieldAlert, Users, Phone, ArrowRight, X, CheckCircle2, AlertCircle, Sparkles, Zap, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { useSquad } from '../context/SquadContext';

export default function SquadVerifyModal({ isOpen, onClose, onSuccess, targetGame, setCurrentPage }) {
  const { loginSquad, logoutSquad } = useSquad();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your registered Team Name or Captain Mobile Number');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your Squad Password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginSquad(identifier.trim(), password.trim());
      if (res.success) {
        // Strict game restriction check
        if (targetGame && res.squad.game !== 'both' && res.squad.game !== targetGame) {
          logoutSquad();
          setError(`Squad "${res.squad.team_name}" is registered ONLY for ${res.squad.game === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}. You cannot enter ${targetGame === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"}.`);
          return;
        }
        if (onSuccess) onSuccess(res.squad);
        onClose();
      } else {
        setError(res.message || 'Squad not found in tournament records.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    onClose();
    if (setCurrentPage) {
      setCurrentPage('register');
    }
  };

  const gameLabel = targetGame === 'pictionary' ? 'Engineering Pictionary' : "Engineer’s Brain";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              SQUAD VERIFICATION & LOGIN
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
              Enter {gameLabel}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Authenticate your registered squad with your credentials to participate in live tournament arenas.
        </p>

        {/* Option 1: Already Registered - Fast Login with Password */}
        <form onSubmit={handleVerify} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>ALREADY REGISTERED? ENTER SQUAD CREDENTIALS</span>
          </span>

          <div className="space-y-3">
            {/* Squad Name or Mobile */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Registered Team Name or Captain Mobile:</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. VLSI Titans or 9822011223"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
              />
            </div>

            {/* Squad Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Squad Access Password:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your squad password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Enter Arena Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-current" />
              )}
              <span>Verify & Enter Arena</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Option 2: Not Registered Yet */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white font-heading">Not Registered Yet?</div>
            <div className="text-[11px] text-slate-400 font-mono">Fill out the quick 3-member squad form.</div>
          </div>
          <button
            type="button"
            onClick={handleGoToRegister}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Register Squad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
