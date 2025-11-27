# RAG Plugin Multilingual Setup (English & Bahasa Indonesia)

## Constitution Compliance
✅ Plugin-First Architecture  
✅ Headless Design  
✅ Performance Optimized (<2s response)  
✅ Observability Enabled

## Overview

The RAG (Retrieval-Augmented Generation) plugin supports multilingual document processing and chat interactions with automatic provider fallback:

**Fallback Chain**: Ollama (local) → OpenAI (cloud) → Gemini (backup)

### Supported Languages
- 🇬🇧 **English** - Full support
- 🇮🇩 **Bahasa Indonesia** - Native support
- 🌍 **100+ languages** - Through Ollama models

---

## Quick Start

### 1. Setup Environment

```bash
cd /var/www/cas

# Copy environment template
cp .env.template .env

# Edit configuration (optional: add OpenAI/Gemini keys)
nano .env
```

### 2. Start Services

```bash
# Start all services including Ollama
docker-compose up -d

# Check services
docker-compose ps
```

### 3. Setup Ollama Models

```bash
# Pull multilingual models
docker exec cas_ollama ollama pull llama3.2        # Chat model
docker exec cas_ollama ollama pull nomic-embed-text # Embedding model
docker exec cas_ollama ollama pull mistral          # Better Indonesian support

# Or run setup script
docker exec -it cas_ollama bash
chmod +x /root/setup-models.sh
./setup-models.sh
```

### 4. Verify Installation

```bash
# Check Ollama
curl http://localhost:11434/api/version

# Check RAG plugin
curl http://localhost:4000/api/plugins/rag/status

# Check AI providers
curl http://localhost:4000/api/plugins/rag/ai/status
```

---

## Configuration

### Environment Variables

```env
# Ollama (Primary - Free, Local)
OLLAMA_BASE_URL=http://ollama:11434

# OpenAI (Fallback - Requires API Key)
OPENAI_API_KEY=sk-...

# Gemini (Backup - Requires API Key)
GEMINI_API_KEY=...
```

### Provider Priority

The system automatically tries providers in this order:
1. **Ollama** - Always tried first (free, local)
2. **OpenAI** - If Ollama fails (requires API key)
3. **Gemini** - Last resort (requires API key)

---

## Usage Examples

### English Examples

#### 1. Create Collection
```bash
curl -X POST http://localhost:4000/api/plugins/rag/collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Documentation",
    "description": "Technical docs in English",
    "embeddingModel": "nomic-embed-text"
  }'
```

#### 2. Upload English Document
```bash
curl -X POST http://localhost:4000/api/plugins/rag/collections/{collectionId}/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to AI",
    "content": "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines. It has become an essential part of the technology industry.",
    "source": "Manual Upload",
    "contentType": "text/plain"
  }'
```

#### 3. Chat in English
```bash
curl -X POST http://localhost:4000/api/plugins/rag/sessions/{sessionId}/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?"
  }'
```

---

### Bahasa Indonesia Examples

#### 1. Buat Koleksi (Create Collection)
```bash
curl -X POST http://localhost:4000/api/plugins/rag/collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dokumentasi Teknis",
    "description": "Dokumentasi teknis dalam Bahasa Indonesia",
    "embeddingModel": "nomic-embed-text"
  }'
```

#### 2. Upload Dokumen Indonesia
```bash
curl -X POST http://localhost:4000/api/plugins/rag/collections/{collectionId}/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pengenalan Kecerdasan Buatan",
    "content": "Kecerdasan Buatan (AI) adalah cabang ilmu komputer yang bertujuan menciptakan mesin cerdas. AI telah menjadi bagian penting dari industri teknologi modern dan digunakan dalam berbagai aplikasi seperti asisten virtual, analisis data, dan sistem rekomendasi.",
    "source": "Upload Manual",
    "contentType": "text/plain"
  }'
```

#### 3. Obrolan dalam Bahasa Indonesia (Chat)
```bash
curl -X POST http://localhost:4000/api/plugins/rag/sessions/{sessionId}/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa itu kecerdasan buatan?"
  }'
```

#### 4. Pertanyaan Campuran (Mixed Language)
```bash
curl -X POST http://localhost:4000/api/plugins/rag/sessions/{sessionId}/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Jelaskan tentang machine learning dalam bahasa Indonesia"
  }'
```

---

## Advanced Usage

### Custom Model Selection

#### For Better Indonesian Support
```bash
curl -X POST http://localhost:4000/api/plugins/rag/configure \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatModel": "mistral",
    "embeddingModel": "nomic-embed-text",
    "temperature": 0.7
  }'
```

### Test Specific Provider

```bash
# Test Ollama
curl -X POST http://localhost:4000/api/plugins/rag/ai/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ollamaUrl": "http://ollama:11434"
  }'

# Test OpenAI
curl -X POST http://localhost:4000/api/plugins/rag/ai/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-..."
  }'
```

---

## Model Recommendations

### For English Content
- **Chat**: `llama3.2` or `llama3.2:1b` (faster)
- **Embeddings**: `nomic-embed-text`

### For Indonesian Content
- **Chat**: `mistral` (best) or `llama3.2`
- **Embeddings**: `nomic-embed-text` (multilingual)

### For Mixed Content
- **Chat**: `llama3.2` (balanced)
- **Embeddings**: `nomic-embed-text`

---

## Performance Tuning

### Ollama Configuration

```yaml
# docker-compose.yml
ollama:
  environment:
    - OLLAMA_NUM_PARALLEL=4        # Concurrent requests
    - OLLAMA_MAX_LOADED_MODELS=3   # Models in memory
  deploy:
    resources:
      limits:
        memory: 8G  # Increase for larger models
```

### RAG Configuration

```env
# Chunk size for document processing
RAG_MAX_CHUNKS=1000
RAG_CHUNK_OVERLAP=200

# Context window for chat
RAG_MAX_CONTEXT_LENGTH=4000

# Temperature for responses (0.0 = deterministic, 1.0 = creative)
RAG_DEFAULT_TEMPERATURE=0.7

# Number of relevant documents to retrieve
RAG_DEFAULT_RETRIEVAL_COUNT=5
```

---

## Troubleshooting

### Ollama Not Available

```bash
# Check if running
docker ps | grep ollama

# Check logs
docker logs cas_ollama

# Restart
docker-compose restart ollama

# Test manually
curl http://localhost:11434/api/version
```

### No Models Available

```bash
# List models
docker exec cas_ollama ollama list

# Pull missing models
docker exec cas_ollama ollama pull llama3.2
docker exec cas_ollama ollama pull nomic-embed-text
```

### Slow Response in Indonesian

```bash
# Use Mistral model (better for Indonesian)
docker exec cas_ollama ollama pull mistral

# Or use smaller model for faster responses
docker exec cas_ollama ollama pull llama3.2:1b
```

### Fallback to OpenAI

If Ollama is unavailable, the system automatically falls back to OpenAI:

```bash
# Check fallback chain status
curl http://localhost:4000/api/plugins/rag/ai/status

# Response shows:
{
  "providers": [
    {"name": "Ollama", "available": false},
    {"name": "OpenAI", "available": true},  # Currently used
    {"name": "Gemini", "available": true}
  ]
}
```

---

## Integration Examples

### Python Client

```python
import requests

# Configuration
API_URL = "http://localhost:4000"
TOKEN = "your-jwt-token"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Upload dokumen Indonesia
def upload_indonesian_doc(collection_id, title, content):
    response = requests.post(
        f"{API_URL}/api/plugins/rag/collections/{collection_id}/documents",
        headers=headers,
        json={
            "title": title,
            "content": content,
            "contentType": "text/plain"
        }
    )
    return response.json()

# Chat dalam bahasa Indonesia
def chat_indonesian(session_id, message):
    response = requests.post(
        f"{API_URL}/api/plugins/rag/sessions/{session_id}/chat",
        headers=headers,
        json={"message": message}
    )
    return response.json()

# Example usage
doc = upload_indonesian_doc(
    "collection-id",
    "Panduan AI",
    "Kecerdasan Buatan adalah teknologi masa depan..."
)

answer = chat_indonesian(
    "session-id",
    "Apa itu kecerdasan buatan?"
)
print(answer["response"])
```

### JavaScript/TypeScript Client

```typescript
const API_URL = "http://localhost:4000";
const TOKEN = "your-jwt-token";

async function chatInIndonesian(sessionId: string, message: string) {
  const response = await fetch(
    `${API_URL}/api/plugins/rag/sessions/${sessionId}/chat`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );
  return await response.json();
}

// Example: Chat dalam bahasa Indonesia
const answer = await chatInIndonesian(
  "session-id",
  "Jelaskan tentang machine learning"
);
console.log(answer.response);
```

---

## Best Practices

### 1. Document Preparation
- **English**: Standard UTF-8 text
- **Indonesian**: Use proper Indonesian spelling and diacritics
- **Mixed**: Separate sections by language for better chunking

### 2. Query Formulation
- **Clear questions**: "What is AI?" vs "Tell me about AI stuff"
- **Use native language**: Ask in the same language as your documents
- **Context**: Provide context for better results

### 3. Model Selection
- **English-only**: Use `llama3.2:1b` for speed
- **Indonesian-heavy**: Use `mistral` for quality
- **Mixed**: Use `llama3.2` for balance

### 4. Performance
- Keep documents under 10,000 characters
- Use appropriate chunk size (1000 characters recommended)
- Limit retrieval count (5 documents recommended)

---

## API Reference

### RAG Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plugins/rag/status` | Plugin status |
| GET | `/api/plugins/rag/ai/status` | AI providers status |
| POST | `/api/plugins/rag/configure` | Configure plugin |
| POST | `/api/plugins/rag/ai/test` | Test providers |
| GET | `/api/plugins/rag/collections` | List collections |
| POST | `/api/plugins/rag/collections` | Create collection |
| POST | `/api/plugins/rag/collections/:id/documents` | Upload document |
| POST | `/api/plugins/rag/sessions` | Create chat session |
| POST | `/api/plugins/rag/sessions/:id/chat` | Send message |
| GET | `/api/plugins/rag/sessions/:id/history` | Get chat history |

---

## Support

### Resources
- [Ollama Documentation](https://ollama.ai/docs)
- [CAS Constitution](./constitution.md)
- [Plugin Development Guide](./spec/spec.md)

### Getting Help
1. Check logs: `docker logs cas_ollama`
2. Test providers: `curl http://localhost:4000/api/plugins/rag/ai/status`
3. Verify models: `docker exec cas_ollama ollama list`
4. Review configuration: Check `.env` file

---

## License

This RAG plugin follows the CAS platform constitution and is designed for multilingual enterprise use.

**Version**: 1.0.0  
**Last Updated**: 2025-11-26  
**Languages**: English, Bahasa Indonesia, and 100+ more
