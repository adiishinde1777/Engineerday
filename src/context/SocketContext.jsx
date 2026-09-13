import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { sound } from '../utils/soundEffects';
import { api } from '../utils/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scoreboard, setScoreboard] = useState([]);
  const [brainSession, setBrainSession] = useState({
    session: { status: 'IDLE', timer_remaining: 30, round: 1 },
    question: null,
    team: null
  });
  const [pictionarySession, setPictionarySession] = useState({
    session: { status: 'IDLE', timer_remaining: 30, round: 1 },
    question: null,
    team: null
  });

  useEffect(() => {
    // Initial fetch of session state from database
    api.getGameSession('brain')
      .then((res) => {
        if (res.success && res.session) {
          setBrainSession(res);
        }
      })
      .catch(() => {});

    api.getGameSession('pictionary')
      .then((res) => {
        if (res.success && res.session) {
          setPictionarySession(res);
        }
      })
      .catch(() => {});

    // In dev, Vite proxies /socket.io to backend
    const s = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_game', 'brain');
      s.emit('join_game', 'pictionary');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Scoreboard updates
    s.on('scoreboard_updated', (teams) => {
      setScoreboard(teams);
    });

    // Session state from server
    s.on('session_state', (data) => {
      if (data?.session?.game === 'brain') {
        setBrainSession(data);
      } else if (data?.session?.game === 'pictionary') {
        setPictionarySession(data);
      }
    });

    // Live updates for brain
    s.on('live_game_update_brain', (data) => {
      setBrainSession(data);
    });

    // Live updates for pictionary
    s.on('live_game_update_pictionary', (data) => {
      setPictionarySession(data);
    });

    // Timers
    s.on('timer_tick', ({ game, remaining }) => {
      if (game === 'brain') {
        setBrainSession((prev) => ({
          ...prev,
          session: { ...prev.session, timer_remaining: remaining, status: remaining > 0 ? 'RUNNING' : 'TIME_UP' }
        }));
      } else if (game === 'pictionary') {
        setPictionarySession((prev) => ({
          ...prev,
          session: { ...prev.session, timer_remaining: remaining, status: remaining > 0 ? 'RUNNING' : 'TIME_UP' }
        }));
      }

      if (remaining <= 5 && remaining > 0) {
        sound.playTick();
      }
    });

    s.on('time_up', () => {
      sound.playBuzzer();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        scoreboard,
        setScoreboard,
        brainSession,
        pictionarySession
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
