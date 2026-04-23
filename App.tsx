// App.tsx — Root application entry point
// Initializes the database and storage before rendering the navigation tree.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RootNavigator } from './src/navigation/RootNavigator';
import { initDb } from './src/db/client';
import { modelService } from './src/services/model.service';
import { modelManager } from './src/ai/ModelManager';

type AppState = 'loading' | 'ready' | 'error';

export default function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState>('loading');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // 1. Initialize SQLite DB (creates tables, runs migrations)
        await initDb();

        // 2. Ensure file system directories exist
        await modelService.ensureStorageReady();

        // 3. Restore previously active model from DB
        await modelManager.restoreActiveModel();

        setAppState('ready');
      } catch (error) {
        console.error('[App] Initialization failed:', error);
        setInitError(String(error));
        setAppState('error');
      }
    }

    void initialize();
  }, []);

  if (appState === 'loading') {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>✦</Text>
        <Text style={styles.splashTitle}>PocketAI</Text>
        <ActivityIndicator color="#7C3AED" style={styles.spinner} />
        <Text style={styles.splashSub}>Initializing...</Text>
      </View>
    );
  }

  if (appState === 'error') {
    return (
      <View style={styles.splash}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorTitle}>Failed to Start</Text>
        <Text style={styles.errorMsg}>{initError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  splashIcon: {
    fontSize: 56,
    color: '#7C3AED',
    marginBottom: 4,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  spinner: {
    marginTop: 24,
  },
  splashSub: {
    fontSize: 14,
    color: '#555',
  },
  errorIcon: {
    fontSize: 48,
    color: '#EF4444',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorMsg: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 32,
    textAlign: 'center',
  },
});
