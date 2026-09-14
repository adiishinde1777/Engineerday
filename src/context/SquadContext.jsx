import React, { createContext, useContext, useState } from 'react';
import { api } from '../utils/api';

const SquadContext = createContext(null);

export function SquadProvider({ children }) {
  const [currentSquad, setCurrentSquad] = useState(() => {
    try {
      const saved = localStorage.getItem('engineers_day_registered_squad');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cachedTeams, setCachedTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('engineers_day_cached_teams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCachedTeams = (teamsList) => {
    if (Array.isArray(teamsList) && teamsList.length > 0) {
      setCachedTeams(teamsList);
      try {
        localStorage.setItem('engineers_day_cached_teams', JSON.stringify(teamsList));
      } catch {}
    }
  };

  const saveSquad = (squad) => {
    setCurrentSquad(squad);
    if (squad) {
      try {
        localStorage.setItem('engineers_day_registered_squad', JSON.stringify(squad));
        // Also ensure squad is present in cachedTeams
        setCachedTeams((prev) => {
          const exists = prev.some(t => t.id === squad.id || t.team_name?.toLowerCase() === squad.team_name?.toLowerCase());
          const updated = exists ? prev.map(t => (t.id === squad.id ? { ...t, ...squad } : t)) : [squad, ...prev];
          try { localStorage.setItem('engineers_day_cached_teams', JSON.stringify(updated)); } catch {}
          return updated;
        });
      } catch {}
    } else {
      localStorage.removeItem('engineers_day_registered_squad');
    }
  };

  const loginSquad = async (identifier, password = '') => {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please enter your registered Team Name or Captain Mobile Number' };
    }

    try {
      const res = await api.verifySquad(identifier.trim(), password ? password.trim() : '');
      if (res.success && res.squad) {
        saveSquad(res.squad);
        return { success: true, squad: res.squad };
      }
      return { 
        success: false, 
        message: res.message || `Verification failed for "${identifier}".` 
      };
    } catch (err) {
      return { success: false, message: err.message || 'Squad verification failed' };
    }
  };

  const logoutSquad = () => {
    saveSquad(null);
  };

  const isSquadRegistered = Boolean(currentSquad && currentSquad.id);

  return (
    <SquadContext.Provider value={{
      currentSquad,
      isSquadRegistered,
      cachedTeams,
      saveCachedTeams,
      saveSquad,
      loginSquad,
      logoutSquad
    }}>
      {children}
    </SquadContext.Provider>
  );
}

export function useSquad() {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad must be used within a SquadProvider');
  }
  return context;
}
