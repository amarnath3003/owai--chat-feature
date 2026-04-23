// src/components/Common/ProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  progress: number; // 0–100
  label?: string;
}

export function ProgressBar({ progress, label }: Props): React.JSX.Element {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.percent}>{clampedProgress.toFixed(0)}%</Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  percent: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  track: {
    height: 4,
    backgroundColor: '#1E1E2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
});
