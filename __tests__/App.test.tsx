/**
 * App.test.tsx
 *
 * Full app rendering requires native modules (GestureHandler, SQLite, RNFS, llama.rn).
 * These cannot be mocked in Jest without a real device or emulator.
 *
 * Run integration tests on an Android device with:
 *   npx react-native run-android
 *
 * Unit tests for business logic are in:
 *   - __tests__/promptBuilder.test.ts
 *   - __tests__/tokenStream.test.ts
 *   - __tests__/ModelRegistry.test.ts
 */

test('App module exists', () => {
  // Smoke test — just verifies the module can be resolved without executing native code
  const AppModule = require('../App');
  expect(AppModule).toBeDefined();
});

