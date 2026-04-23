// src/hooks/useModel.ts
// Exposes model state and actions to UI components.
// Calls model.service only — never AI layer or DB directly.

import { useState, useEffect, useCallback } from 'react';
import { modelService } from '../services/model.service';
import { ModelDefinition, InstalledModel } from '../ai/types';

interface ModelState {
  activeModel: ModelDefinition | null;
  availableModels: ModelDefinition[];
  installedModels: InstalledModel[];
  downloadProgress: Record<string, number>; // modelId → 0–100
  isLoading: boolean;
  error: string | null;
}

interface ModelActions {
  downloadModel: (id: string) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  setActiveModel: (id: string) => Promise<void>;
  isInstalled: (id: string) => boolean;
  refresh: () => Promise<void>;
}

export function useModel(): ModelState & ModelActions {
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [activeModel, setActiveModelState] = useState<ModelDefinition | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const available = await modelService.getAvailableModels();
      const installed = modelService.getInstalledModels();
      const active = modelService.getActiveModel();

      setAvailableModels(available);
      setInstalledModels(installed);
      setActiveModelState(active);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const downloadModel = useCallback(async (id: string) => {
    setError(null);
    setDownloadProgress(prev => ({ ...prev, [id]: 0 }));

    try {
      await modelService.downloadAndInstall(id, (pct: number) => {
        setDownloadProgress(prev => ({ ...prev, [id]: pct }));
      });
      // Remove from progress map when done
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refresh();
    } catch (err) {
      setError(`Download failed: ${String(err)}`);
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [refresh]);

  const deleteModel = useCallback(async (id: string) => {
    setError(null);
    try {
      await modelService.deleteModel(id);
      await refresh();
    } catch (err) {
      setError(`Delete failed: ${String(err)}`);
    }
  }, [refresh]);

  const setActiveModel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await modelService.setActiveModel(id);
      await refresh();
    } catch (err) {
      setError(`Failed to set active model: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const isInstalled = useCallback((id: string) => {
    return modelService.isInstalled(id);
  }, []);

  return {
    activeModel,
    availableModels,
    installedModels,
    downloadProgress,
    isLoading,
    error,
    downloadModel,
    deleteModel,
    setActiveModel,
    isInstalled,
    refresh,
  };
}
