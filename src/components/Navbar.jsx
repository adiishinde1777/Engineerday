import React, { useState } from 'react';
import { 
  Cpu, 
  Trophy, 
  Calendar, 
  ShieldCheck, 
  Menu, 
  X, 
  Layers, 
  Award, 
  Users, 
  Tv, 
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSquad } from '../context/SquadContext';

export default function Navbar({ currentPage, setCurrentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isConnected } = useSocket();
  const { currentSquad, isSquadRegistered, logoutSquad } = useSquad();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'games', label: 'Games' },
    { id: 'faculty', label: 'Department Faculty' },
    { id: 'register', label: 'Registration' },
    { id: 'live-dashboard', label: 'Live Dashboard', isLive: true },
    { id: 'winners', label: 'Winners' },
  ];

  const handleItemClick = (item) => {
    if (item.isExternal && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      setMobileOpen(false);
      return;
    }
    setCurrentPage(item.id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 shadow-lg shadow-black/50">
      {/* Top micro bar with date and developer credit */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 py-1 px-4 sm:px-8 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold tracking-wider">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            DATE & TIME: CLASSIFIED 🔒
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300 italic">
            "Think. Create. Solve. Engineer the Future."
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-[11px] font-mono text-slate-400">
              {isConnected ? 'LIVE SYNC ACTIVE' : 'CONNECTING...'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium">
            Dev: <span className="text-cyan-300 font-semibold">Aditya Shinde</span>
          </span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-500 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 font-heading">
                  ENGINEER'S DAY 2026
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-cyan-400 font-mono tracking-wider uppercase font-semibold">
                Dept of Electronics Engineering (VLSI Design & Technology)
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative flex items-center gap-1.5 ${
                    active 
                      ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 shadow-sm shadow-cyan-500/30' 
                      : item.isExternal
                      ? 'text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.isLive && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-ping"></span>
                  )}
                  <span>{item.label}</span>
                  {item.isExternal && (
                    <ExternalLink className="w-3 h-3 text-cyan-400 opacity-80" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons: Squad Status, Admin & Projector */}
          <div className="hidden lg:flex items-center gap-3">
            {isSquadRegistered && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold truncate max-w-[130px]" title={currentSquad.team_name}>
                  {currentSquad.team_name}
                </span>
                <button
                  type="button"
                  onClick={logoutSquad}
                  className="text-slate-400 hover:text-rose-300 ml-1 text-sm font-bold cursor-pointer"
                  title="Switch Squad"
                >
                  ×
                </button>
              </div>
            )}

            <button
              onClick={() => setCurrentPage('projector-scoreboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
              title="Auditorium Presentation Display"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              Projector Mode
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => setCurrentPage('admin')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage('admin-login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/40 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Login
              </button>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-sm flex items-center justify-between transition-colors ${
                currentPage === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.isLive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              )}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <button
              onClick={() => {
                setCurrentPage('projector-scoreboard');
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-slate-900 text-slate-300 border border-slate-800"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              Projector / Auditorium Display
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setCurrentPage('admin');
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-cyan-500 text-slate-950"
              >
                <ShieldCheck className="w-4 h-4" />
                Go to Admin Dashboard
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage('admin-login');
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-cyan-500/40 text-cyan-300"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
