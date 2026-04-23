// src/services/model.service.ts
// Orchestrates model management: discovery, download, activation, deletion.
// Never imports llama.rn directly.

import { modelRegistry } from '../ai/ModelRegistry';
import { modelManager } from '../ai/ModelManager';
import { modelsRepo } from '../db/repositories/models.repo';
import { storageService } from './storage.service';
import {
  ModelDefinition,
  InstalledModel,
  DownloadProgressCallback,
} from '../ai/types';

class ModelService {
  /**
   * Returns all models defined in the manifest (available to download/use).
   */
  async getAvailableModels(): Promise<ModelDefinition[]> {
    return modelRegistry.getAvailableModels();
  }

  /**
   * Returns all currently installed (downloaded) models.
   */
  getInstalledModels(): InstalledModel[] {
    return modelsRepo.getAll();
  }

  /**
   * Returns the currently active ModelDefinition, or null if none selected.
   */
  getActiveModel(): ModelDefinition | null {
    return modelManager.getActiveModel();
  }

  /**
   * Downloads and installs a model, verifying integrity.
   * Reports progress via onProgress (0–100).
   */
  async downloadAndInstall(
    id: string,
    onProgress: DownloadProgressCallback,
  ): Promise<void> {
    await modelManager.installModel(id, onProgress);
  }

  /**
   * Sets a model as active (must be installed first).
   * Persists the choice to the database.
   */
  async setActiveModel(id: string): Promise<void> {
    await modelManager.setActiveModel(id);
  }

  /**
   * Deletes a model's file and removes it from the DB.
   * If this was the active model, it is also unloaded.
   */
  async deleteModel(id: string): Promise<void> {
    await modelManager.removeModel(id);
  }

  /**
   * Checks whether a specific model is installed.
   */
  isInstalled(id: string): boolean {
    return modelsRepo.isInstalled(id);
  }

  /**
   * Returns free storage space available on the device (bytes).
   * Useful for showing warnings before large downloads.
   */
  async getFreeSpace(): Promise<number> {
    try {
      const RNFS = require('react-native-fs');
      const stat = await RNFS.getFSInfo();
      return stat.freeSpace as number;
    } catch {
      return 0;
    }
  }

  /**
   * Ensures the model storage directory exists.
   * Should be called at app startup.
   */
  async ensureStorageReady(): Promise<void> {
    await storageService.ensureDirectories();
  }
}

export const modelService = new ModelService();
