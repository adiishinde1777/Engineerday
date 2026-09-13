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

  const saveSquad = (squad) => {
    setCurrentSquad(squad);
    if (squad) {
      localStorage.setItem('engineers_day_registered_squad', JSON.stringify(squad));
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
