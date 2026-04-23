# 🧠 Offline AI Chat App — MASTER DOCUMENT

> **Stack:** React Native CLI · TypeScript · llama.rn · SQLite · react-native-fs  
> **Target:** Android-first, iOS-compatible  
> **Model:** Offline LLM inference, streaming, multimodal-ready

---

## Table of Contents

1. [Vision & Principles](#vision)
2. [System Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [AI Layer](#ai-layer)
6. [Chat System](#chat-system)
7. [Storage & Database](#storage)
8. [Model Management](#model-management)
9. [Performance Constraints](#performance)
10. [MVP Scope (V1)](#mvp)
11. [Roadmap](#roadmap)
12. [Build Plan & Execution Order](#build-plan)
13. [Testing Strategy](#testing)
14. [Critical Rules](#critical-rules)
15. [Definition of Done](#definition-of-done)

---

## 1. Vision & Principles {#vision}

Build a **PocketPal-style offline AI app** — a local AI runtime system inside a mobile app. Not just a chat interface.

### Core Principles

| Principle | Description |
|---|---|
| **Offline-first** | Inference never requires internet. Only model download uses network. |
| **Strict layer separation** | UI must NEVER call llama.rn directly. All AI logic flows through abstraction layers. |
| **Streaming-first UX** | Token-by-token output. No blocking. Cancelable inference. |
| **Multimodal-ready** | Messages support attachments from Day 1, even if unused in V1. |

---

## 2. System Architecture {#architecture}

```
UI (React Native)
   ↓
Hooks (useChat, useModel)
   ↓
Services (chat.service, model.service)
   ↓
AI Layer (ChatInference)
   ↓
ModelManager
   ↓
llama.rn (native)
```

### Data Flow — Send Message

```
User taps Send
   → useChat.sendMessage()
   → chat.service.createMessage()       [saves to DB]
   → ChatInference.start()              [builds prompt]
   → llama.rn.completion()              [native call]
   → onToken callback (streaming)       [updates UI]
   → chat.service.updateMessage()       [debounced DB write]
   → onDone callback                    [finalize]
```

---

## 3. Tech Stack {#tech-stack}

### Core
- React Native CLI
- TypeScript (strict mode)

### AI / Inference
- `llama.rn` — on-device LLM inference

### Navigation
- `@react-navigation/native`
- `@react-navigation/native-stack`

### UI Infrastructure
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-screens`
- `react-native-safe-area-context`

### Storage
- `react-native-fs` — file system (models, attachments)
- `react-native-quick-sqlite` — SQLite database

### Multimodal (Phase 3)
- `react-native-image-picker`

---

## 4. Project Structure {#project-structure}

```
/root
├── android/
├── ios/
│
├── src/
│   ├── ai/
│   │   ├── ModelRegistry.ts          # Fetch & list available models
│   │   ├── ModelManager.ts           # Download, load, unload, lifecycle
│   │   ├── ChatInference.ts          # Prompt building + streaming engine
│   │   ├── types.ts                  # Shared AI types
│   │   └── utils/
│   │       ├── promptBuilder.ts      # Conversation → prompt string
│   │       └── tokenStream.ts        # Streaming + debounce logic
│   │
│   ├── db/
│   │   ├── client.ts                 # SQLite connection
│   │   ├── schema.ts                 # Table definitions + migrations
│   │   └── repositories/
│   │       ├── conversations.repo.ts
│   │       ├── messages.repo.ts
│   │       ├── attachments.repo.ts
│   │       └── models.repo.ts
│   │
│   ├── services/
│   │   ├── chat.service.ts           # Orchestrates chat flow
│   │   ├── model.service.ts          # Model selection, install, delete
│   │   └── storage.service.ts        # File download, SHA256, paths
│   │
│   ├── screens/
│   │   ├── Chat/
│   │   │   └── ChatScreen.tsx
│   │   └── ModelSelect/
│   │       └── ModelSelectScreen.tsx
│   │
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── InputBar.tsx
│   │   │   └── StopButton.tsx
│   │   └── Common/
│   │       ├── ProgressBar.tsx
│   │       └── Badge.tsx
│   │
│   ├── hooks/
│   │   ├── useChat.ts                # Chat state + send/stop actions
│   │   └── useModel.ts               # Model loading state + actions
│   │
│   ├── store/
│   │   └── slices/
│   │       ├── chatSlice.ts
│   │       └── modelSlice.ts
│   │
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   │
│   ├── utils/
│   │   ├── sha256.ts
│   │   └── paths.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── config/
│       └── models.json               # Available model manifest
│
├── assets/
├── tests/
│   ├── ModelRegistry.test.ts
│   ├── promptBuilder.test.ts
│   └── tokenStream.test.ts
└── README.md
```

---

## 5. AI Layer {#ai-layer}

### 5.1 ModelDefinition

```typescript
type ModelDefinition = {
  id: string
  name: string
  description: string
  sizeBytes: number
  url: string
  sha256: string
  filename: string
  capabilities: {
    vision: boolean
  }
  inferenceDefaults: {
    temperature: number
    top_p: number
    max_tokens: number
    context_length: number
  }
}
```

### 5.2 ModelRegistry

**Responsibilities:**
- Fetch remote manifest (or load bundled `models.json`)
- Provide list of available models
- Validate model metadata

```typescript
class ModelRegistry {
  getAvailableModels(): Promise<ModelDefinition[]>
  getModelById(id: string): ModelDefinition | null
  refreshManifest(): Promise<void>
}
```

### 5.3 ModelManager ⚠️ CRITICAL

**Rules:**
- Only ONE model loaded at a time
- Loading a new model MUST unload the previous
- Verify SHA256 before marking installed
- Handle OOM (Out of Memory) failures gracefully

```typescript
class ModelManager {
  installModel(id: string, onProgress: (pct: number) => void): Promise<void>
  removeModel(id: string): Promise<void>
  setActiveModel(id: string): Promise<void>
  getActiveModel(): ModelDefinition | null
  loadModelIfNeeded(): Promise<void>
  unloadCurrentModel(): Promise<void>
}
```

**Memory safety:**
```typescript
// ALWAYS do this before loading new model
await this.unloadCurrentModel()
await this.loadModel(newModelId)
```

### 5.4 ChatInference (Brain Layer)

```typescript
type InferenceRequest = {
  messages: ChatMessage[]
  model: ModelDefinition
  systemPrompt?: string
}

class ChatInference {
  start(
    request: InferenceRequest,
    onToken: (token: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void
  ): void

  stop(): void
}
```

**Internal flow:**
1. Build prompt via `promptBuilder.ts`
2. If vision model + attachments: encode images
3. Call `llama.rn` completion with streaming
4. Pipe tokens through `tokenStream.ts`

### 5.5 Prompt Builder

```typescript
// src/ai/utils/promptBuilder.ts

function buildPrompt(
  messages: ChatMessage[],
  systemPrompt: string,
  contextLength: number
): string
```

Rules:
- Trim history from oldest first to fit `context_length`
- Always include system prompt
- Format per model's expected template (ChatML, Llama-3, etc.)
- NEVER exceed context window

### 5.6 Token Stream

```typescript
// src/ai/utils/tokenStream.ts

function createTokenStream(
  onFlush: (buffered: string) => void,
  debounceMs: number = 80
): {
  push: (token: string) => void
  flush: () => void
  cancel: () => void
}
```

- Buffers tokens
- Flushes to UI at debounced interval (50–150ms)
- Prevents per-token re-renders

---

## 6. Chat System {#chat-system}

### Message Types

```typescript
// DB + UI shared type
type Message = {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  text: string
  attachments?: Attachment[]
  createdAt: number
  updatedAt: number
  modelId?: string
  isStreaming?: boolean  // UI only
}

type Attachment = {
  id: string
  messageId: string
  type: 'image'
  localPath: string
  mime: string
  width?: number
  height?: number
}
```

### Send Message Flow

```
1. Validate: active model exists?
2. Validate: if attachment → model supports vision?
3. Save user message to DB (immediate)
4. Create placeholder assistant message (isStreaming: true)
5. Call ChatInference.start()
6. Stream tokens → update assistant message text
7. Debounced DB writes (every 80ms)
8. onDone → finalize message (isStreaming: false)
9. Final DB write
```

### UI Components

```typescript
// ChatScreen layout
<SafeAreaView>
  <ModelBadge />              // Shows active model name
  <MessageList               // FlatList, inverted
    data={messages}
    renderItem={MessageBubble}
  />
  <InputBar
    onSend={handleSend}
    onAttach={handleAttach}   // Disabled if !model.capabilities.vision
    disabled={isStreaming}
  />
  {isStreaming && <StopButton onPress={handleStop} />}
</SafeAreaView>
```

---

## 7. Storage & Database {#storage}

### Database Schema

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,          -- 'user' | 'assistant' | 'system'
  text TEXT NOT NULL DEFAULT '',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  modelId TEXT,
  FOREIGN KEY (conversationId) REFERENCES conversations(id)
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  type TEXT NOT NULL,          -- 'image'
  localPath TEXT NOT NULL,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  FOREIGN KEY (messageId) REFERENCES messages(id)
);

CREATE TABLE installed_models (
  id TEXT PRIMARY KEY,
  localPath TEXT NOT NULL,
  sizeBytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  installedAt INTEGER NOT NULL
);

CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Key: 'activeModelId' → stores currently active model ID
```

### File Storage (react-native-fs)

```
DocumentDirectoryPath/
├── models/
│   ├── tiny-llama-q4.gguf
│   └── llava-1.5-q4.gguf
└── attachments/
    └── {messageId}/
        └── image.jpg
```

### StorageService API

```typescript
class StorageService {
  downloadFile(
    url: string,
    destPath: string,
    onProgress: (pct: number) => void
  ): Promise<void>

  verifySHA256(filePath: string, expected: string): Promise<boolean>
  deleteFile(filePath: string): Promise<void>
  getModelPath(filename: string): string
  getAttachmentPath(messageId: string, filename: string): string
}
```

---

## 8. Model Management {#model-management}

### Model Selection Screen

Shown on first run if no active model exists.

```
┌─────────────────────────────────┐
│  Choose a Model                 │
├─────────────────────────────────┤
│  Tiny LLaMA 1.2B          [Text]│
│  1.2 GB · Fast · Low RAM        │
│  [Download]                     │
├─────────────────────────────────┤
│  Mistral 7B Q4           [Text] │
│  4.1 GB · Best quality          │
│  [Download]                     │
├─────────────────────────────────┤
│  LLaVA 1.5 7B          [Vision] │
│  4.3 GB · Supports images       │
│  [Download]                     │
└─────────────────────────────────┘
```

### Download Flow

```
1. Fetch manifest / show available models
2. User selects model
3. StorageService.downloadFile() with progress callback
4. Progress bar UI update
5. StorageService.verifySHA256()
6. If fail → delete file → show error
7. models.repo.markInstalled()
8. app_state.set('activeModelId', id)
9. Navigate to Chat
```

### Device Tier Guidelines

| Device RAM | Safe Model Range |
|---|---|
| Low-end (2–3 GB) | 1B – 2B params |
| Mid-range (4–6 GB) | 2B – 4B params |
| High-end (8 GB+) | Up to 7B params |

### Rules
- Cannot leave app without an active model
- Deleting active model forces reselection
- Model switch: unload current → load new (never both loaded)

---

## 9. Performance Constraints {#performance}

| Constraint | Rule |
|---|---|
| JS thread | Never block during inference |
| Model loading | 3–10s expected; show loading state |
| Token streaming | Debounce DB writes 50–150ms |
| Re-renders | Batch state updates; don't re-render per token |
| Memory | Unload model before loading another |
| Android | System WILL kill app if memory unmanaged |

---

## 10. MVP Scope (V1) {#mvp}

### ✅ Included
- Chat UI (MessageList + InputBar + StopButton)
- Single hardcoded model
- Streaming responses (token-by-token)
- Offline inference via llama.rn
- Cancel inference

### ❌ Excluded from V1
- SQLite database (in-memory only)
- Image input / vision
- Model download UI
- Model switching

---

## 11. Roadmap {#roadmap}

| Phase | Features |
|---|---|
| **V1 (MVP)** | Chat UI · Single model · Streaming · Offline inference |
| **Phase 2** | Model download system · Model switching · SQLite persistence |
| **Phase 3** | Image attachments · Vision models (VLM) · Multi-turn with images |
| **Phase 4** | Performance optimization · Advanced UX · System prompts UI |

---

## 12. Build Plan & Execution Order {#build-plan}

> Follow this order. Do not skip steps.

```
Step 1: Project Setup
  ├── Init React Native CLI project
  ├── Install all dependencies
  └── Configure TypeScript (strict: true)

Step 2: Database Layer
  ├── db/client.ts — SQLite connection
  ├── db/schema.ts — CREATE TABLE statements
  └── db/repositories/ — CRUD for each table

Step 3: AI Core
  ├── ai/types.ts
  ├── ai/ModelRegistry.ts
  ├── ai/ModelManager.ts  ← MOST CRITICAL
  └── Test model load/unload cycle

Step 4: Storage Service
  ├── services/storage.service.ts
  ├── Download + progress
  └── SHA256 verification

Step 5: ChatInference
  ├── ai/utils/promptBuilder.ts
  ├── ai/utils/tokenStream.ts  (debounce)
  └── ai/ChatInference.ts  ← STREAMING + CANCEL

Step 6: Services Layer
  ├── services/chat.service.ts
  └── services/model.service.ts

Step 7: Hooks
  ├── hooks/useModel.ts
  └── hooks/useChat.ts

Step 8: Chat UI
  ├── components/Chat/*
  └── screens/Chat/ChatScreen.tsx

Step 9: Model Management UI
  └── screens/ModelSelect/ModelSelectScreen.tsx

Step 10: Tests + README
  ├── tests/ModelRegistry.test.ts
  ├── tests/promptBuilder.test.ts
  └── tests/tokenStream.test.ts
```

---

## 13. Testing Strategy {#testing}

| Test | Coverage |
|---|---|
| `ModelRegistry.test.ts` | Manifest validation, model lookup |
| `promptBuilder.test.ts` | Context window trimming, format correctness |
| `tokenStream.test.ts` | Debounce timing, cancellation, flush |
| Manual device testing | Low-RAM Android device (priority) |

Tools: Jest · React Native Testing Library

---

## 14. Critical Rules {#critical-rules}

### ❌ NEVER
- Call `llama.rn` from UI components or hooks directly
- Load more than one model simultaneously
- Block the JS/UI thread during inference
- Write to DB on every token (debounce it)
- Skip SHA256 verification after download

### ✅ ALWAYS
- Use streaming callbacks (`onToken`)
- Isolate all AI logic in `src/ai/`
- Handle inference cancellation
- Unload previous model before loading new one
- Show loading/progress states for model operations

### ⚠️ RISKS

| Risk | Mitigation |
|---|---|
| Memory crash (Android OOM) | Strict model lifecycle in ModelManager |
| Slow performance on low-end | Test on real low-RAM device |
| Load latency (3–10s) | Always show loading state |
| Context overflow | promptBuilder trims history |

---

## 15. Definition of Done {#definition-of-done}

**V1 is complete when:**

- [ ] User can open the app
- [ ] User can send a message
- [ ] User receives a streamed, token-by-token response
- [ ] User can stop generation mid-stream
- [ ] App works fully offline (airplane mode test)
- [ ] App is stable on a mid-range Android device (4GB RAM)
- [ ] No direct llama.rn imports in UI layer
- [ ] ModelManager correctly prevents double-loading

---

> **Core insight:** If you get `ModelManager` and `ChatInference` right → everything else is easy. If you get them wrong → you rebuild.

---

*Last updated: V1 architecture*
