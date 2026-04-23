// src/screens/ModelSelect/ModelSelectScreen.tsx
// Model selection / management screen.
// Shown on first launch if no active model exists.
// Uses useModel hook only.

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useModel } from '../../hooks/useModel';
import { ModelDefinition } from '../../ai/types';
import { ProgressBar } from '../../components/Common/ProgressBar';
import { Badge } from '../../components/Common/Badge';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ModelSelect'>;

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${bytes} B`;
}

export function ModelSelectScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const {
    availableModels,
    installedModels,
    activeModel,
    downloadProgress,
    isLoading,
    error,
    downloadModel,
    deleteModel,
    setActiveModel,
    isInstalled,
    refresh,
  } = useModel();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDownload = (model: ModelDefinition) => {
    Alert.alert(
      `Download ${model.name}`,
      `This will download ${formatBytes(model.sizeBytes)}. Make sure you have enough storage and a stable connection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => void downloadModel(model.id) },
      ],
    );
  };

  const handleSetActive = async (model: ModelDefinition) => {
    await setActiveModel(model.id);
    navigation.navigate('Chat');
  };

  const handleDelete = (model: ModelDefinition) => {
    Alert.alert(
      `Delete ${model.name}`,
      'This will remove the model file from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteModel(model.id),
        },
      ],
    );
  };

  const renderModel = ({ item }: { item: ModelDefinition }) => {
    const installed = isInstalled(item.id);
    const isActive = activeModel?.id === item.id;
    const progress = downloadProgress[item.id];
    const isDownloading = progress !== undefined;

    return (
      <View style={[styles.card, isActive && styles.activeCard]}>
        {/* Model header */}
        <View style={styles.cardHeader}>
          <Text style={styles.modelName}>{item.name}</Text>
          <View style={styles.badges}>
            {item.capabilities.vision ? (
              <Badge type="vision" />
            ) : (
              <Badge type="text" />
            )}
            {isActive && <Badge type="active" />}
            {isDownloading && <Badge type="downloading" />}
          </View>
        </View>

        {/* Description + size */}
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.size}>{formatBytes(item.sizeBytes)}</Text>

        {/* Download progress */}
        {isDownloading && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} label="Downloading..." />
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {!installed && !isDownloading && (
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => handleDownload(item)}
              accessibilityLabel={`Download ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.downloadBtnText}>⬇ Download</Text>
            </TouchableOpacity>
          )}

          {installed && !isActive && (
            <TouchableOpacity
              style={styles.setActiveBtn}
              onPress={() => void handleSetActive(item)}
              disabled={isLoading}
              accessibilityLabel={`Set ${item.name} as active`}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.setActiveBtnText}>✓ Use This Model</Text>
              )}
            </TouchableOpacity>
          )}

          {isActive && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeText}>✦ Currently Active</Text>
            </View>
          )}

          {installed && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Model</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {installedModels.length} installed · {availableModels.length} available
        </Text>
        <Text style={styles.infoHint}>Models run fully offline on your device</Text>
      </View>

      <FlatList
        data={availableModels}
        keyExtractor={item => item.id}
        renderItem={renderModel}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#7C3AED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: '#2E1A1A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  infoHint: {
    fontSize: 12,
    color: '#555',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#12121F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 8,
  },
  activeCard: {
    borderColor: '#7C3AED',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  description: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  size: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  downloadBtn: {
    backgroundColor: '#1A1A3E',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  downloadBtnText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  setActiveBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  setActiveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeIndicator: {
    flex: 1,
  },
  activeText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
  },
});
