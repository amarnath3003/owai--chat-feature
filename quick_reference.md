# ⚡ Quick Reference — Offline AI Chat App

## Layer Rules (print this out)

```
ALLOWED IMPORTS PER LAYER:

ChatScreen.tsx        → hooks only
useChat.ts            → services only
chat.service.ts       → ChatInference, DB repos, StorageService
ChatInference.ts      → llama.rn ← ONLY FILE ALLOWED
ModelManager.ts       → llama.rn, StorageService, DB repos
```

---

## models.json Template

```json
{
  "models": [
    {
      "id": "tiny-llama-1b-q4",
      "name": "Tiny LLaMA 1B",
      "description": "Fast, low-RAM model for basic chat",
      "sizeBytes": 669000000,
      "url": "https://your-cdn.com/models/tiny-llama-q4.gguf",
      "sha256": "abc123...",
      "filename": "tiny-llama-q4.gguf",
      "capabilities": { "vision": false },
      "inferenceDefaults": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 512,
        "context_length": 2048
      }
    }
  ]
}
```

---

## File Paths on Device

```
Android DocumentDirectory:
/data/data/{package}/files/

Models:   /data/data/{package}/files/models/{filename}.gguf
Images:   /data/data/{package}/files/attachments/{messageId}/image.jpg
DB:       /data/data/{package}/files/app.db
```

---

## Critical Code Snippets

### Model switch (safe pattern)
```typescript
await modelManager.unloadCurrentModel()   // ALWAYS first
await modelManager.loadModel(newModelId)  // THEN load
```

### Streaming pattern
```typescript
const stream = createTokenStream((buffered) => {
  setMessages(prev => updateLastMessage(prev, buffered))
}, 80) // 80ms debounce

chatInference.start(request,
  (token) => stream.push(token),
  (full)  => { stream.flush(); finalizeMessage(full) },
  (err)   => handleError(err)
)
```

### SHA256 verify pattern
```typescript
const ok = await storage.verifySHA256(filePath, model.sha256)
if (!ok) {
  await storage.deleteFile(filePath)
  throw new Error('Download corrupted — please retry')
}
```

---

## V1 Checklist

- [ ] App opens
- [ ] Message sends
- [ ] Response streams token by token
- [ ] Stop button works mid-generation
- [ ] Works in airplane mode
- [ ] Stable on 4GB RAM Android
- [ ] No llama.rn in UI layer (grep check: `grep -r "llama" src/screens src/hooks src/components`)
