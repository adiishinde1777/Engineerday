import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SquadProvider } from './context/SquadContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProjectorScoreboard from './components/ProjectorScoreboard';

import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import EngineersBrainPage from './pages/EngineersBrainPage';
import PictionaryPage from './pages/PictionaryPage';
import FacultyPage from './pages/FacultyPage';
import RegisterPage from './pages/RegisterPage';
import LiveDashboardPage from './pages/LiveDashboardPage';
import WinnersPage from './pages/WinnersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import { api } from './utils/api';

function getPageFromLocation() {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) return hash;
  const path = window.location.pathname.replace(/^\//, '').trim();
  if (path && path !== 'index.html' && path !== '') return path;
  return 'home';
}

function MainApp() {
  const [currentPage, setCurrentPageState] = useState(() => getPageFromLocation());
  const [eventSettings, setEventSettings] = useState(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Synchronized navigation function that keeps URL hash and state in sync
  const setCurrentPage = (page) => {
    setCurrentPageState(page);
    if (typeof window !== 'undefined') {
      if (window.location.hash !== `#${page}`) {
        window.location.hash = page;
      }
    }
  };

  // Listen to browser forward/back and direct hash modifications
  useEffect(() => {
    const handleHashChange = () => {
      const newPage = getPageFromLocation();
      setCurrentPageState(newPage);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchSettings = () => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.eventSettings) {
          setEventSettings(res.eventSettings);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle Projector Mode (Standalone minimal UI)
  if (currentPage === 'projector-scoreboard') {
    return <ProjectorScoreboard onExit={() => setCurrentPage('live-dashboard')} />;
  }

  // Handle Admin Dashboard (Standalone layout with strict authentication guard)
  if (currentPage === 'admin') {
    // 1. While auth status is verifying, show a high-tech loader
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#070b14] text-cyan-400 flex flex-col items-center justify-center space-y-4 font-mono">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Verifying Admin Authorization...</p>
        </div>
      );
    }

    // 2. Strict protection: If unauthenticated (e.g. new user opens the link), CANNOT see dashboard
    if (!isAuthenticated) {
      return <AdminLoginPage setCurrentPage={setCurrentPage} />;
    }

    // 3. Authenticated admin: show full dashboard
    return (
      <AdminLayout
        setCurrentPage={setCurrentPage}
        eventSettings={eventSettings}
        onSettingsUpdated={setEventSettings}
      />
    );
  }

  // Handle Admin Login page: if already authenticated, take directly to dashboard
  if (currentPage === 'admin-login') {
    if (!authLoading && isAuthenticated) {
      return (
        <AdminLayout
          setCurrentPage={setCurrentPage}
          eventSettings={eventSettings}
          onSettingsUpdated={setEventSettings}
        />
      );
    }
    return <AdminLoginPage setCurrentPage={setCurrentPage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage setCurrentPage={setCurrentPage} eventSettings={eventSettings} />
        )}
        {currentPage === 'games' && (
          <GamesPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'brain-arena' && (
          <EngineersBrainPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'pictionary-arena' && (
          <PictionaryPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'faculty' && (
          <FacultyPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'register' && (
          <RegisterPage eventSettings={eventSettings} setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'live-dashboard' && (
          <LiveDashboardPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'winners' && (
          <WinnersPage
            eventSettings={eventSettings}
            setCurrentPage={setCurrentPage}
            onSettingsUpdated={setEventSettings}
          />
        )}
      </main>

      <Footer setCurrentPage={setCurrentPage} eventSettings={eventSettings} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SquadProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </SquadProvider>
    </AuthProvider>
  );
}
