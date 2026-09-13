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

function MainApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [eventSettings, setEventSettings] = useState(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

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

  // Handle Admin Dashboard (Standalone layout)
  if (currentPage === 'admin') {
    const token = typeof window !== 'undefined' ? localStorage.getItem('engineers_day_admin_token') : null;
    if (!isAuthenticated && !token) {
      return <AdminLoginPage setCurrentPage={setCurrentPage} />;
    }
    return (
      <AdminLayout
        setCurrentPage={setCurrentPage}
        eventSettings={eventSettings}
        onSettingsUpdated={setEventSettings}
      />
    );
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
        {currentPage === 'admin-login' && (
          <AdminLoginPage setCurrentPage={setCurrentPage} />
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
