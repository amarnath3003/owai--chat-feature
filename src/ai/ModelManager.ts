// src/ai/ModelManager.ts
// ⚠️ CRITICAL: Manages the entire model lifecycle.
// ONLY ONE model may be loaded in memory at a time.
// Must always unload before loading.

import { LlamaContext, initLlama, releaseAllLlama } from 'llama.rn';
import { ModelDefinition, DownloadProgressCallback, InstalledModel } from './types';
import { modelRegistry } from './ModelRegistry';
import { storageService } from '../services/storage.service';
import { modelsRepo } from '../db/repositories/models.repo';

class ModelManager {
  private activeModel: ModelDefinition | null = null;
  private llamaContext: LlamaContext | null = null;
  private isLoading: boolean = false;

  // ─── Public Accessors ──────────────────────────────────────────────────────

  getActiveModel(): ModelDefinition | null {
    return this.activeModel;
  }

  getLlamaContext(): LlamaContext | null {
    return this.llamaContext;
  }

  isModelLoaded(): boolean {
    return this.llamaContext !== null;
  }

  // ─── Model Installation ────────────────────────────────────────────────────

  /**
   * Downloads, verifies, and marks a model as installed.
   * Does NOT load the model into memory.
   */
  async installModel(
    id: string,
    onProgress: DownloadProgressCallback,
  ): Promise<void> {
    const modelDef = modelRegistry.getModelById(id);
    if (!modelDef) {
      throw new Error(`[ModelManager] Model not found in registry: ${id}`);
    }

    const destPath = storageService.getModelPath(modelDef.filename);

    // Download
    console.log(`[ModelManager] Downloading ${modelDef.name}...`);
    await storageService.downloadFile(modelDef.url, destPath, onProgress);

    // Verify integrity — skip if sha256 is a placeholder
    if (!modelDef.sha256.startsWith('PLACEHOLDER')) {
      const valid = await storageService.verifySHA256(destPath, modelDef.sha256);
      if (!valid) {
        await storageService.deleteFile(destPath);
        throw new Error(
          `[ModelManager] SHA256 mismatch for ${modelDef.name}. Download may be corrupt.`,
        );
      }
    }

    // Mark as installed in DB
    const installed: InstalledModel = {
      id: modelDef.id,
      localPath: destPath,
      sizeBytes: modelDef.sizeBytes,
      sha256: modelDef.sha256,
      installedAt: Date.now(),
    };
    modelsRepo.markInstalled(installed);

    console.log(`[ModelManager] Installed: ${modelDef.name}`);
  }

  /**
   * Removes a model file and its DB record.
   * If removing the active model, unloads it first.
   */
  async removeModel(id: string): Promise<void> {
    if (this.activeModel?.id === id) {
      await this.unloadCurrentModel();
      modelsRepo.clearActiveModelId();
    }

    const installed = modelsRepo.getById(id);
    if (installed) {
      await storageService.deleteFile(installed.localPath);
      modelsRepo.remove(id);
    }

    console.log(`[ModelManager] Removed model: ${id}`);
  }

  // ─── Active Model Management ───────────────────────────────────────────────

  /**
   * Sets the active model (persists to DB).
   * Does NOT immediately load the model into memory.
   * Call loadModelIfNeeded() separately when ready to infer.
   */
  async setActiveModel(id: string): Promise<void> {
    const modelDef = modelRegistry.getModelById(id);
    if (!modelDef) {
      throw new Error(`[ModelManager] Model not found: ${id}`);
    }

    if (!modelsRepo.isInstalled(id)) {
      throw new Error(`[ModelManager] Model ${id} is not installed. Download it first.`);
    }

    // Unload current if switching to a different model
    if (this.activeModel && this.activeModel.id !== id) {
      await this.unloadCurrentModel();
    }

    this.activeModel = modelDef;
    modelsRepo.setActiveModelId(id);

    console.log(`[ModelManager] Active model set to: ${modelDef.name}`);
  }

  /**
   * Restores the previously active model from DB on app restart.
   */
  async restoreActiveModel(): Promise<void> {
    const savedId = modelsRepo.getActiveModelId();
    if (!savedId) return;

    const modelDef = modelRegistry.getModelById(savedId);
    if (!modelDef) return;

    if (!modelsRepo.isInstalled(savedId)) {
      modelsRepo.clearActiveModelId();
      return;
    }

    this.activeModel = modelDef;
    console.log(`[ModelManager] Restored active model: ${modelDef.name}`);
  }

  // ─── Model Loading ─────────────────────────────────────────────────────────

  /**
   * Loads the active model into memory if not already loaded.
   * CRITICAL: Never loads more than one model simultaneously.
   */
  async loadModelIfNeeded(): Promise<void> {
    if (this.llamaContext) {
      return; // Already loaded
    }

    if (this.isLoading) {
      throw new Error('[ModelManager] Model is already being loaded.');
    }

    if (!this.activeModel) {
      throw new Error('[ModelManager] No active model selected. Call setActiveModel() first.');
    }

    const installed = modelsRepo.getById(this.activeModel.id);
    if (!installed) {
      throw new Error(
        `[ModelManager] Active model ${this.activeModel.id} is not installed.`,
      );
    }

    const modelPath = installed.localPath;
    const exists = await storageService.fileExists(modelPath);
    if (!exists) {
      modelsRepo.remove(this.activeModel.id);
      modelsRepo.clearActiveModelId();
      this.activeModel = null;
      throw new Error(
        `[ModelManager] Model file missing at ${modelPath}. Please reinstall.`,
      );
    }

    try {
      this.isLoading = true;
      console.log(`[ModelManager] Loading model: ${this.activeModel.name}`);

      this.llamaContext = await initLlama({
        model: modelPath,
        use_mlock: false,
        n_ctx: this.activeModel.inferenceDefaults.context_length,
        n_threads: 4,
      });

      console.log(`[ModelManager] Model loaded: ${this.activeModel.name}`);
    } catch (error) {
      this.llamaContext = null;
      throw new Error(`[ModelManager] Failed to load model: ${String(error)}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Unloads the currently loaded model from memory.
   * Safe to call even if no model is loaded.
   */
  async unloadCurrentModel(): Promise<void> {
    if (!this.llamaContext) {
      return;
    }

    try {
      await releaseAllLlama();
      this.llamaContext = null;
      console.log('[ModelManager] Model unloaded from memory.');
    } catch (error) {
      console.error('[ModelManager] Error unloading model:', error);
      // Force clear anyway to prevent stale state
      this.llamaContext = null;
    }
  }
}

// Singleton — global model lifecycle manager
export const modelManager = new ModelManager();
