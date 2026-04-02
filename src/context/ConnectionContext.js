import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const ConnectionContext = createContext();

// Module-level state so api.js can read it outside the React render cycle
let _connectionState = { isOffline: false, connectionType: 'unknown' };

/**
 * Returns the current connection state without requiring a hook.
 * Safe to call from api.js interceptors.
 */
export function getConnectionState() {
  return _connectionState;
}

export function ConnectionProvider({ children }) {
  const [state, setState] = useState({ isOffline: false, connectionType: 'unknown' });
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Subscribe to NetInfo changes
    const unsubscribeNetInfo = NetInfo.addEventListener(netState => {
      const isOffline = !netState.isConnected || !netState.isInternetReachable;
      const next = {
        isOffline: !!isOffline,
        connectionType: netState.type ?? 'unknown',
      };
      _connectionState = next;
      setState(next);
    });

    // Re-check on foreground resume
    const appStateSub = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        NetInfo.fetch().then(netState => {
          const isOffline = !netState.isConnected || !netState.isInternetReachable;
          const next = {
            isOffline: !!isOffline,
            connectionType: netState.type ?? 'unknown',
          };
          _connectionState = next;
          setState(next);
        });
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      unsubscribeNetInfo();
      appStateSub.remove();
    };
  }, []);

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
}
