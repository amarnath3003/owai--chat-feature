module.exports = {
  preset: '@react-native/jest-preset',
  // Scope jest to pure unit tests only.
  // App.test.tsx requires native modules (GestureHandler, SQLite, llama.rn)
  // which must be tested on a real Android device or emulator.
  testMatch: [
    '**/__tests__/promptBuilder.test.ts',
    '**/__tests__/tokenStream.test.ts',
    '**/__tests__/ModelRegistry.test.ts',
  ],
};


