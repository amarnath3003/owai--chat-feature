// src/components/Common/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeType = 'text' | 'vision' | 'active' | 'downloading';

interface Props {
  type: BadgeType;
}

const BADGE_CONFIG: Record<BadgeType, { label: string; bg: string; color: string }> = {
  text: { label: 'Text', bg: '#1A1A3E', color: '#818CF8' },
  vision: { label: 'Vision', bg: '#1A2E1A', color: '#4ADE80' },
  active: { label: 'Active', bg: '#2E1A1A', color: '#F97316' },
  downloading: { label: 'Downloading', bg: '#1E1A2E', color: '#A78BFA' },
};

export function Badge({ type }: Props): React.JSX.Element {
  const config = BADGE_CONFIG[type];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
