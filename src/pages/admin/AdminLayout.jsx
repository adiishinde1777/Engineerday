import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Brain, 
  Palette, 
  Trophy, 
  GraduationCap, 
  HelpCircle, 
  Sliders, 
  Settings, 
  Download, 
  LogOut, 
  Menu, 
  X, 
  ArrowLeft,
  Tv,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

import OverviewTab from './OverviewTab';
import RegistrationsTab from './RegistrationsTab';
import TeamsTab from './TeamsTab';
import BrainControlTab from './BrainControlTab';
import PictionaryControlTab from './PictionaryControlTab';
import QuestionBankTab from './QuestionBankTab';
import FacultyTab from './FacultyTab';
import ScoringSettingsTab from './ScoringSettingsTab';
import EventSettingsTab from './EventSettingsTab';
import ExportTab from './ExportTab';

export default function AdminLayout({ setCurrentPage, eventSettings, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { admin, logout } = useAuth();
  const { isConnected } = useSocket();

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'registrations', label: 'All Users & Teams', icon: Users },
    { id: 'teams', label: 'Teams Roster', icon: ShieldCheck },
    { id: 'brain', label: 'Engineer’s Brain', icon: Brain, badge: 'LIVE' },
    { id: 'pictionary', label: 'Engineering Pictionary', icon: Palette, badge: 'LIVE' },
    { id: 'live-dashboard-shortcut', label: 'Live Dashboard', icon: Trophy, isLink: true },
    { id: 'faculty', label: 'Faculty Management', icon: GraduationCap },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'scoring', label: 'Scoring Settings', icon: Sliders },
    { id: 'event-settings', label: 'Event Settings', icon: Settings },
    { id: 'export', label: 'Export Data', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-white text-sm font-heading">ADMIN PANEL</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950/95 md:bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[2px]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black text-white font-heading tracking-wide">
                ENGINEER'S DAY
              </h1>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                Admin Console
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Server Sync:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              {isConnected ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isLink) {
                    setCurrentPage('live-dashboard');
                  } else {
                    setActiveTab(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950 to-slate-900 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-white truncate max-w-[120px]">
                {admin?.username || 'Admin'}
              </p>
              <p className="text-[10px] font-mono text-cyan-400 truncate max-w-[130px]">
                Aditya Shinde
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab setActiveTab={setActiveTab} setCurrentPage={setCurrentPage} />
          )}
          {activeTab === 'registrations' && <RegistrationsTab />}
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'brain' && <BrainControlTab />}
          {activeTab === 'pictionary' && <PictionaryControlTab />}
          {activeTab === 'questions' && <QuestionBankTab />}
          {activeTab === 'faculty' && <FacultyTab />}
          {activeTab === 'scoring' && <ScoringSettingsTab />}
          {activeTab === 'event-settings' && (
            <EventSettingsTab onSettingsUpdated={onSettingsUpdated} />
          )}
          {activeTab === 'export' && <ExportTab />}
        </div>
      </main>

    </div>
  );
}
