// src/components/Chat/StopButton.tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  onPress: () => void;
}

export function StopButton({ onPress }: Props): React.JSX.Element {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        accessibilityLabel="Stop generating"
        accessibilityRole="button"
      >
        <Text style={styles.icon}>⏹</Text>
        <Text style={styles.label}>Stop</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  icon: {
    fontSize: 14,
    color: '#EF4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
