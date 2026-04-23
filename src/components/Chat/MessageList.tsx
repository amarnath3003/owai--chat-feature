// src/components/Chat/MessageList.tsx
import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  ListRenderItem,
} from 'react-native';
import { Message } from '../../ai/types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
}

export function MessageList({ messages }: Props): React.JSX.Element {
  const listRef = useRef<FlatList<Message>>(null);

  // Auto-scroll to bottom when new messages arrive or content changes
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to let the layout settle
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages]);

  const renderItem: ListRenderItem<Message> = ({ item }) => (
    <MessageBubble message={item} />
  );

  const keyExtractor = (item: Message) => item.id;

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>✦</Text>
        <Text style={styles.emptyTitle}>PocketAI</Text>
        <Text style={styles.emptySubtitle}>Your private AI. No cloud. No tracking.</Text>
        <Text style={styles.emptyHint}>Type a message to begin...</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      removeClippedSubviews={false}
      initialNumToRender={20}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#7C3AED',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
  },
});
