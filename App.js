import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { WalletProvider } from './src/context/WalletContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ConnectionProvider } from './src/context/ConnectionContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

/**
 * Root App Component
 * Complete app setup with:
 * - Redux State Management
 * - Context Providers (Auth, Wallet, Theme)
 * - Navigation (AppNavigator)
 * - Splash Screen Orchestration
 */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen while initializing
  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <SafeAreaProvider>
      <ConnectionProvider>
      <AuthProvider>
        <WalletProvider>
          <ThemeProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </WalletProvider>
      </AuthProvider>
      </ConnectionProvider>
    </SafeAreaProvider>
  );
}
