// src/ai/ModelRegistry.ts
// Loads model definitions from the bundled models.json manifest.
// This is the ONLY source of truth for available model metadata.

import { ModelDefinition } from './types';

// Bundled JSON — no network needed
const modelsManifest = require('../config/models.json') as {
  models: ModelDefinition[];
};

class ModelRegistry {
  private models: ModelDefinition[] = modelsManifest.models;

  /**
   * Returns all available model definitions from the manifest.
   */
  async getAvailableModels(): Promise<ModelDefinition[]> {
    return this.models;
  }

  /**
   * Find a single model by its unique ID.
   * Returns null if not found (never throws).
   */
  getModelById(id: string): ModelDefinition | null {
    return this.models.find(m => m.id === id) ?? null;
  }

  /**
   * Reloads models from the manifest (useful for testing or future hot-reload).
   */
  refreshManifest(): void {
    // Re-require the JSON (in production, this could fetch a remote manifest)
    this.models = modelsManifest.models;
  }
}

// Export a singleton — no need to instantiate multiple registries
export const modelRegistry = new ModelRegistry();
