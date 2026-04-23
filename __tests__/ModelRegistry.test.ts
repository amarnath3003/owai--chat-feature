// tests/ModelRegistry.test.ts

// Mock the models.json manifest
jest.mock('../src/config/models.json', () => ({
  models: [
    {
      id: 'tiny-llama-1b-q4',
      name: 'Tiny LLaMA 1B',
      description: 'Fast, low-RAM model',
      sizeBytes: 669000000,
      url: 'https://example.com/model.gguf',
      sha256: 'abc123def456',
      filename: 'tiny-llama.gguf',
      capabilities: { vision: false },
      inferenceDefaults: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 512,
        context_length: 2048,
      },
    },
    {
      id: 'llava-vision',
      name: 'LLaVA Vision 7B',
      description: 'Vision-capable model',
      sizeBytes: 4300000000,
      url: 'https://example.com/llava.gguf',
      sha256: 'def456abc123',
      filename: 'llava.gguf',
      capabilities: { vision: true },
      inferenceDefaults: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        context_length: 4096,
      },
    },
  ],
}), { virtual: true });

import { modelRegistry } from '../src/ai/ModelRegistry';

describe('ModelRegistry', () => {
  test('getAvailableModels returns all models from manifest', async () => {
    const models = await modelRegistry.getAvailableModels();
    expect(models).toHaveLength(2);
  });

  test('getAvailableModels returns correctly typed models', async () => {
    const models = await modelRegistry.getAvailableModels();
    const first = models[0];

    expect(first.id).toBe('tiny-llama-1b-q4');
    expect(first.name).toBe('Tiny LLaMA 1B');
    expect(first.capabilities.vision).toBe(false);
    expect(first.inferenceDefaults.context_length).toBe(2048);
  });

  test('getModelById returns the correct model', () => {
    const model = modelRegistry.getModelById('tiny-llama-1b-q4');
    expect(model).not.toBeNull();
    expect(model?.name).toBe('Tiny LLaMA 1B');
  });

  test('getModelById returns null for unknown id', () => {
    const model = modelRegistry.getModelById('non-existent-model-id');
    expect(model).toBeNull();
  });

  test('correctly identifies vision-capable models', async () => {
    const models = await modelRegistry.getAvailableModels();
    const visionModel = models.find(m => m.id === 'llava-vision');
    const textModel = models.find(m => m.id === 'tiny-llama-1b-q4');

    expect(visionModel?.capabilities.vision).toBe(true);
    expect(textModel?.capabilities.vision).toBe(false);
  });

  test('all models have required fields', async () => {
    const models = await modelRegistry.getAvailableModels();
    for (const model of models) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.url).toBeTruthy();
      expect(model.sha256).toBeTruthy();
      expect(model.filename).toBeTruthy();
      expect(model.sizeBytes).toBeGreaterThan(0);
      expect(model.inferenceDefaults).toBeDefined();
    }
  });
});
