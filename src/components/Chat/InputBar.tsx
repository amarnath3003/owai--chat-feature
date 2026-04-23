// src/components/Chat/InputBar.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';

interface Props {
  onSend: (text: string) => void;
  onAttach?: () => void;
  disabled: boolean;
  canAttach?: boolean; // Only true for vision-capable models
}

export function InputBar({ onSend, onAttach, disabled, canAttach = false }: Props): React.JSX.Element {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.blur();
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      {/* Attach button — only shown for vision models */}
      {canAttach && (
        <TouchableOpacity
          style={styles.attachButton}
          onPress={onAttach}
          disabled={disabled}
          accessibilityLabel="Attach image"
          accessibilityRole="button"
        >
          <Text style={[styles.attachIcon, disabled && styles.disabledIcon]}>📎</Text>
        </TouchableOpacity>
      )}

      {/* Text input */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={disabled ? 'Generating...' : 'Message PocketAI...'}
        placeholderTextColor="#555"
        multiline
        maxLength={4000}
        editable={!disabled}
        onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
        returnKeyType="send"
        blurOnSubmit={false}
        accessibilityLabel="Message input"
      />

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendButton, canSend ? styles.sendActive : styles.sendDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        <Text style={styles.sendIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    gap: 8,
  },
  attachButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  attachIcon: {
    fontSize: 22,
  },
  disabledIcon: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#E0E0F0',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendActive: {
    backgroundColor: '#7C3AED',
  },
  sendDisabled: {
    backgroundColor: '#2E2E3E',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
