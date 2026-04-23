# 🧠 Offline AI Chat App — Master Architecture (V1)

## 🎯 Vision

Build a **PocketPal-style offline AI app** that:

* Runs LLMs fully on-device
* Supports chat first (V1)
* Expands to **vision (image + text)**, multi-model, and tools later

---

# 🧱 Core Principles

### 1. Offline-first

* No inference requires internet
* Only model download uses network

### 2. Strict Layer Separation

* UI must NEVER directly call llama.rn
* All AI logic goes through abstraction layers

### 3. Streaming-first UX

* Token-by-token output (no blocking)
* Cancelable inference

### 4. Multimodal-ready from Day 1

* Messages support attachments even if unused initially

---

# 🏗️ System Architecture

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

---

# 📦 Tech Stack

## Core

* React Native CLI
* TypeScript

## Navigation

* @react-navigation/native
* @react-navigation/native-stack

## UI Infra

* react-native-gesture-handler
* react-native-reanimated
* react-native-screens
* react-native-safe-area-context

---

# 📁 Project Structure

```
/root
│
├── android/
├── ios/
│
├── src/
│   ├── ai/
│   │   ├── ModelRegistry.ts
│   │   ├── ModelManager.ts
│   │   ├── ChatInference.ts
│   │   ├── types.ts
│   │   └── utils/
│   │       ├── promptBuilder.ts
│   │       └── tokenStream.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── repositories/
│   │
│   ├── services/
│   │   ├── chat.service.ts
│   │   ├── model.service.ts
│   │   └── storage.service.ts
│   │
│   ├── screens/
│   │   └── Chat/
│   │       └── ChatScreen.tsx
│   │
│   ├── components/
│   │   ├── Chat/
│   │   └── Common/
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useModel.ts
│   │
│   ├── store/
│   │   └── slices/
│   │
│   ├── navigation/
│   ├── utils/
│   ├── types/
│   └── config/
│       └── models.json
│
├── assets/
├── tests/
└── README.md
```

---

# 🤖 AI Layer Design

## 1. ModelRegistry

```ts
type Model = {
  id: string
  name: string
  sizeMB: number
  url: string
  sha256: string
  capabilities: {
    vision: boolean
  }
}
```

Responsibilities:

* Fetch remote manifest
* Provide available models list

---

## 2. ModelManager ⚠️ (Critical Component)

Responsibilities:

* Download models
* Verify SHA256
* Load/unload models
* Track active model

Constraints:

* Only ONE model loaded at a time
* Must prevent memory crashes

---

## 3. ChatInference (Brain Layer)

```ts
type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  attachments?: Attachment[]
}
```

Responsibilities:

* Prompt construction
* Multimodal handling
* Streaming tokens
* Cancellation

---

# 💬 Chat System

## Message Format

```ts
type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachments?: {
    type: 'image'
    uri: string
  }[]
  createdAt: number
}
```

---

## Streaming Pattern

* Async generators
* Token-by-token UI updates
* Interruptible responses

---

# 🖼️ Multimodal Design (Future)

## Input

* react-native-image-picker
* Stored via react-native-fs

## Behavior

| Model Type     | Behavior              |
| -------------- | --------------------- |
| Text-only      | Ignore / block images |
| Vision-enabled | Send image + text     |

---

# 💾 Storage Layer

## File Storage

* react-native-fs
* Stores:

  * Models
  * Attachments

## Database (SQLite)

Tables:

```
conversations(id, createdAt)
messages(id, conversationId, role, text, createdAt, modelId)
attachments(id, messageId, type, localPath)
```

---

# 📥 Model Management

## Manifest Example

```json
{
  "models": [
    {
      "id": "tiny-llama-q4",
      "name": "Tiny LLaMA",
      "sizeMB": 1200,
      "url": "...",
      "sha256": "...",
      "capabilities": {
        "vision": false
      }
    }
  ]
}
```

---

## Download Flow

1. Fetch manifest
2. Select model
3. Download (RNFS)
4. Verify SHA256
5. Mark installed

---

# ⚙️ Constraints (Reality)

## Memory

* Android WILL kill app if unmanaged
* Always unload previous model

## Model Size Guidelines

| Device Tier | Safe Range |
| ----------- | ---------- |
| Low-end     | 1B–2B      |
| Mid-range   | 2B–4B      |
| High-end    | Up to 7B   |

---

# 🚀 MVP Scope (V1)

### Included

* Chat UI
* Single model (hardcoded)
* Streaming responses
* Offline inference

### Excluded

* Database
* Image input
* Model switching

---

# 📈 Roadmap

## Phase 2

* Model download system
* Model switching
* SQLite storage

## Phase 3

* Image attachments
* Vision models (VLM)

## Phase 4

* Performance optimization
* Advanced UX

---

# ⚠️ Risks

### 1. Memory crashes

* Improper model lifecycle

### 2. Slow performance

* Low-end devices struggle

### 3. Load latency

* 3–10s model load time

---

# 🧪 Testing Strategy

* Jest (unit)
* React Native Testing Library
* Real device testing (low RAM priority)

---

# 🔥 Critical Rules (Do Not Break)

### ❌ NEVER

* Call llama.rn from UI
* Load multiple models
* Block UI thread

### ✅ ALWAYS

* Use streaming
* Isolate AI layer
* Handle cancellation

---

# 🧭 Build Plan

## Step 1

* Setup RN project
* Install dependencies

## Step 2

* Integrate llama.rn
* Load single model

## Step 3

* Build Chat UI

## Step 4

* Implement streaming inference

---

# ✅ Definition of Done (V1)

* User can:

  * Open app
  * Send message
  * Receive streamed response
* Works fully offline
* Stable on mid-range Android

---

# 🧠 Final Note

This is not just a “chat app”.

You are building:

> a **local AI runtime system inside a mobile app**

If you get:

* `ModelManager`
* `ChatInference`

right → everything else becomes easy.

If you get them wrong → you rebuild later.

---
