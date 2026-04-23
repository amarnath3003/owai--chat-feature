# PocketAI — Offline AI Chat App

> Run large language models entirely on your Android device. No cloud. No tracking. No internet required during inference.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 22.11.0 |
| JDK | 17 (recommended) |
| Android Studio | Hedgehog or later |
| React Native CLI | 20.x |
| Android NDK | r26+ (for llama.rn) |

---

## Installation

```bash
# 1. Clone and enter the project
cd PocketAI

# 2. Install Node dependencies
npm install

# 3. Android — configure NDK for llama.rn
# See "Android Build Configuration" section below

# 4. Run on Android
npx react-native run-android
```

---

## Android Build Configuration (`android/app/build.gradle`)

`llama.rn` requires native C++ compilation. Add these changes:

```groovy
android {
    // ...
    defaultConfig {
        // ...
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++17"
                abiFilters "arm64-v8a", "x86_64"
            }
        }
    }

    externalNativeBuild {
        cmake {
            path "../../node_modules/llama.rn/android/CMakeLists.txt"
        }
    }

    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }
}
```

Also ensure NDK is configured in `local.properties`:
```
ndk.dir=/path/to/android/sdk/ndk/26.x.x
```

---

## Project Structure

```
src/
├── ai/
│   ├── types.ts              ← All shared TypeScript interfaces
│   ├── ModelRegistry.ts      ← Reads models.json manifest
│   ├── ModelManager.ts       ← ⚠️ Critical: model lifecycle (load/unload)
│   ├── ChatInference.ts      ← ⚠️ ONLY file that imports llama.rn
│   └── utils/
│       ├── promptBuilder.ts  ← ChatML prompt formatting + context trimming
│       └── tokenStream.ts    ← Debounced token batching (80ms)
│
├── db/
│   ├── client.ts             ← SQLite singleton + migration runner
│   ├── schema.ts             ← All CREATE TABLE SQL + app_state keys
│   └── repositories/
│       ├── conversations.repo.ts
│       ├── messages.repo.ts
│       ├── models.repo.ts
│       └── attachments.repo.ts
│
├── services/
│   ├── chat.service.ts       ← Orchestrates chat flow
│   ├── model.service.ts      ← Model download/activation facade
│   └── storage.service.ts    ← File download, SHA256, path helpers
│
├── hooks/
│   ├── useChat.ts            ← Chat state + send/stop for UI
│   └── useModel.ts           ← Model state + download progress for UI
│
├── screens/
│   ├── Chat/ChatScreen.tsx
│   └── ModelSelect/ModelSelectScreen.tsx
│
├── components/
│   ├── Chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageList.tsx
│   │   ├── InputBar.tsx
│   │   └── StopButton.tsx
│   └── Common/
│       ├── ProgressBar.tsx
│       └── Badge.tsx
│
└── config/
    └── models.json           ← Model manifest (edit to add new models)
```

---

## How to Add a New Model to `models.json`

Edit `src/config/models.json` and add an entry to the `"models"` array:

```json
{
  "id": "your-unique-model-id",
  "name": "Human Readable Name",
  "description": "Short description of the model",
  "sizeBytes": 4100000000,
  "url": "https://your-cdn.com/models/model.Q4_K_M.gguf",
  "sha256": "the-real-sha256-hash-of-the-file",
  "filename": "model.Q4_K_M.gguf",
  "capabilities": { "vision": false },
  "inferenceDefaults": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 1024,
    "context_length": 2048
  }
}
```

**Rules:**
- `id` must be unique across all models
- `filename` is used as the local file name on device
- `sha256` must match the actual file (set to `"PLACEHOLDER_..."` only during development)
- `vision: true` enables the attach button in the chat UI
- Larger `context_length` values use more RAM

---

## Where Files Are Stored On Device

```
Android:
/data/data/com.pocketai/files/
├── models/
│   └── tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
├── attachments/
│   └── {messageId}/
│       └── image.jpg
└── pocketai.db   ← SQLite database
```

---

## Architecture Laws (Never Break)

```
ChatScreen.tsx     → hooks only
useChat.ts         → services only  
chat.service.ts    → ChatInference, DB repos, StorageService
ChatInference.ts   → llama.rn   ← ONLY FILE ALLOWED
ModelManager.ts    → llama.rn, StorageService, DB repos
```

**Verify compliance any time:**
```bash
grep -r "llama" src/screens src/hooks src/components
# Should return ZERO results
```

---

## Running Tests

```bash
# Unit tests (no device needed)
npm test

# Run specific test suites
npx jest --testPathPattern="promptBuilder|tokenStream|ModelRegistry"
```

---

## Running on Android

```bash
# Start Metro bundler
npx react-native start

# In another terminal — launch on connected device/emulator
npx react-native run-android
```

---

## Device RAM Guidelines

| Device RAM | Recommended Models |
|---|---|
| 2–3 GB | TinyLLaMA 1.1B Q4 |
| 4–6 GB | Phi-2 2.7B Q4 |
| 8 GB+ | Mistral 7B Q4 |

---

## V1 Checklist

- [ ] App opens and shows splash screen
- [ ] Model selection screen appears when no model is active
- [ ] Model downloads with progress bar
- [ ] SHA256 integrity check passes after download
- [ ] Chat screen loads with active model badge
- [ ] Message sends and response streams token by token
- [ ] Stop button cancels generation mid-stream
- [ ] App works in airplane mode (offline inference only)
- [ ] Stable on 4GB RAM Android device
- [ ] `grep -r "llama" src/screens src/hooks src/components` → zero results
