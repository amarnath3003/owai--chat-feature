// src/screens/Chat/ChatScreen.tsx
// Main chat interface. Uses useChat + useModel hooks only.
// NEVER imports AI layer or DB directly.

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useChat } from '../../hooks/useChat';
import { useModel } from '../../hooks/useModel';
import { MessageList } from '../../components/Chat/MessageList';
import { InputBar } from '../../components/Chat/InputBar';
import { StopButton } from '../../components/Chat/StopButton';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

export function ChatScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const {
    conversation,
    messages,
    isStreaming,
    error,
    startConversation,
    sendMessage,
    stopGeneration,
    clearError,
  } = useChat();

  const { activeModel } = useModel();

  // Start a new conversation on mount if none exists
  useEffect(() => {
    if (!conversation) {
      startConversation();
    }
  }, [conversation, startConversation]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleSend = async (text: string) => {
    if (!activeModel) {
      Alert.alert(
        'No Model Selected',
        'Please select and download a model first.',
        [{ text: 'Choose Model', onPress: () => navigation.navigate('ModelSelect') }],
      );
      return;
    }
    await sendMessage(text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>PocketAI</Text>
            {activeModel && (
              <Text style={styles.modelBadge}>
                ✦ {activeModel.name}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.newChatBtn}
              onPress={startConversation}
              accessibilityLabel="New conversation"
              accessibilityRole="button"
            >
              <Text style={styles.newChatIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modelBtn}
              onPress={() => navigation.navigate('ModelSelect')}
              accessibilityLabel="Manage models"
              accessibilityRole="button"
            >
              <Text style={styles.modelBtnText}>Models</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message list */}
        <MessageList messages={messages} />

        {/* Stop button — shown only during streaming */}
        {isStreaming && <StopButton onPress={stopGeneration} />}

        {/* Input bar */}
        <InputBar
          onSend={handleSend}
          disabled={isStreaming}
          canAttach={activeModel?.capabilities.vision ?? false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modelBadge: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newChatBtn: {
    padding: 6,
  },
  newChatIcon: {
    fontSize: 18,
  },
  modelBtn: {
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  modelBtnText: {
    fontSize: 13,
    color: '#A0A0C0',
    fontWeight: '600',
  },
});
