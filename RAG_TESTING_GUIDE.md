# RAG Plugin - Comprehensive Testing Guide

## Overview

This guide provides step-by-step testing procedures for the RAG Document Intelligence plugin, including automated tests, manual testing, and multilingual verification.

---

## Prerequisites

### Before You Test

1. **Backend Running:**
   ```bash
   curl http://localhost:4000/health
   # Should return: {"status":"ok"}
   ```

2. **Authentication Token:**
   ```bash
   TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","password":"demo123"}' -s | jq -r '.token')
   echo $TOKEN  # Should show long JWT token
   ```

3. **Plugin Active:**
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" \
     http://localhost:4000/api/plugins/rag/status | jq '.plugin.active'
   # Should return: true
   ```

---

## Test Suite 1: Automated Tests

### Test 1.1: Ollama Multilingual Test

**Purpose:** Verify Ollama is working with multilingual support

```bash
cd /var/www/cas
./test-rag-ollama.sh
```

**Expected Output:**
```
🧪 Testing RAG Plugin with Ollama...

1️⃣ Testing Ollama availability...
✅ Ollama is running: {"version":"0.12.6"}

2️⃣ Listing available models...
{
  "name": "nomic-embed-text:latest",
  "size": 274302450
}
{
  "name": "llama3.2:1b",
  "size": 1321098329
}

3️⃣ Testing English chat...
English response:
Artificial intelligence (AI) refers to the development of computer systems...

4️⃣ Testing Indonesian (Bahasa Indonesia) chat...
Indonesian response:
Kecerdasan buatan adalah teknologi yang menggunakan algoritma...

5️⃣ Testing embedding model...
Embedding dimensions: 768

🎉 All tests completed!

📋 Summary:
  ✅ Ollama: Available
  ✅ Models: llama3.2:1b, nomic-embed-text
  ✅ English: Supported
  ✅ Indonesian: Supported
  ✅ Embeddings: 768 dimensions
```

**If Test Fails:**
- Check Ollama: `curl http://localhost:11434/api/version`
- Check models: `ollama list`
- Pull models if missing: `ollama pull llama3.2:1b && ollama pull nomic-embed-text`

### Test 1.2: Plugin Integration Test

**Purpose:** Verify backend API integration

```bash
./test-rag-plugin.sh
```

**Expected Output:**
```
🧪 Testing RAG Plugin Integration...

1️⃣ Checking backend status...
✅ Backend is running

2️⃣ Checking plugin list (requires auth)...
[Set TOKEN environment variable for full test]

3️⃣ Testing Ollama (host)...
✅ Ollama is available on host

🎯 Summary:
  ✅ Backend: Running
  ✅ RAG Plugin: Registered
  ✅ Ollama: Available on host
```

---

## Test Suite 2: API Endpoint Tests

### Test 2.1: Plugin Status

**Purpose:** Verify plugin is initialized and configured

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/status | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "plugin": {
    "name": "RAG Document Intelligence",
    "version": "1.0.0",
    "status": "initialized",
    "active": true,
    "configuration": {
      "statistics": {
        "totalCollections": 0,
        "totalDocuments": 0,
        "totalSessions": 0,
        "totalMessages": 0
      }
    }
  }
}
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ `active: true`
- ✅ `status: "initialized"`

### Test 2.2: AI Providers Status

**Purpose:** Verify AI providers are available

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/ai/status | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {"name": "Ollama (Local)", "available": true, "priority": 1}
    ],
    "available": ["Ollama (Local)"],
    "models": {
      "Ollama (Local)": ["llama3.2:1b", "nomic-embed-text"]
    }
  }
}
```

**Pass Criteria:**
- ✅ At least one provider available
- ✅ Models list not empty

---

## Test Suite 3: Collection Management

### Test 3.1: Create Collection

```bash
COLLECTION_ID=$(curl -X POST http://localhost:4000/api/plugins/rag/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Collection",
    "description": "Testing RAG plugin functionality",
    "embeddingModel": "nomic-embed-text",
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "maxRetrievalCount": 5
  }' -s | jq -r '.collectionId')

echo "Collection ID: $COLLECTION_ID"
```

**Expected Output:**
```
Collection ID: <uuid>
```

**Pass Criteria:**
- ✅ Returns valid UUID
- ✅ No error message

### Test 3.2: List Collections

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/collections | jq '.data[] | {id: .Id, name: .Name}'
```

**Expected Output:**
```json
{
  "id": "<uuid>",
  "name": "Test Collection"
}
```

**Pass Criteria:**
- ✅ Returns array with at least one collection
- ✅ Collection has id and name

---

## Test Suite 4: Document Processing

### Test 4.1: Upload English Document

```bash
DOC_ID_EN=$(curl -X POST "http://localhost:4000/api/plugins/rag/collections/$COLLECTION_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Introduction (English)",
    "content": "Artificial Intelligence (AI) is the simulation of human intelligence by machines. AI systems can learn from experience, adjust to new inputs, and perform human-like tasks. Key areas of AI include machine learning, natural language processing, computer vision, and robotics. Modern AI applications range from virtual assistants to autonomous vehicles.",
    "source": "Test Upload",
    "contentType": "text/plain",
    "metadata": {
      "language": "en",
      "category": "technical",
      "test": true
    }
  }' -s | jq -r '.documentId')

echo "English Document ID: $DOC_ID_EN"
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Document processed successfully",
  "documentId": "<uuid>",
  "chunks": 3,
  "embeddings": 3
}
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ Valid documentId returned
- ✅ chunks > 0
- ✅ embeddings > 0

### Test 4.2: Upload Indonesian Document

```bash
DOC_ID_ID=$(curl -X POST "http://localhost:4000/api/plugins/rag/collections/$COLLECTION_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pengenalan AI (Bahasa Indonesia)",
    "content": "Kecerdasan Buatan (AI) adalah simulasi kecerdasan manusia oleh mesin. Sistem AI dapat belajar dari pengalaman, menyesuaikan dengan input baru, dan melakukan tugas-tugas seperti manusia. Area utama AI meliputi pembelajaran mesin, pemrosesan bahasa alami, visi komputer, dan robotika. Aplikasi AI modern berkisar dari asisten virtual hingga kendaraan otonom.",
    "source": "Upload Test",
    "contentType": "text/plain",
    "metadata": {
      "language": "id",
      "category": "technical",
      "test": true
    }
  }' -s | jq -r '.documentId')

echo "Indonesian Document ID: $DOC_ID_ID"
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ Valid documentId returned
- ✅ Processes Indonesian text correctly

### Test 4.3: List Documents

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/plugins/rag/collections/$COLLECTION_ID/documents" \
  | jq '.data[] | {title: .Title, status: .ProcessingStatus}'
```

**Expected Output:**
```json
{
  "title": "AI Introduction (English)",
  "status": "completed"
}
{
  "title": "Pengenalan AI (Bahasa Indonesia)",
  "status": "completed"
}
```

**Pass Criteria:**
- ✅ Both documents listed
- ✅ Both have status "completed"

---

## Test Suite 5: Chat Functionality

### Test 5.1: Create Chat Session

```bash
SESSION_ID=$(curl -X POST http://localhost:4000/api/plugins/rag/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"collectionId\": \"$COLLECTION_ID\",
    \"title\": \"Test Chat Session\",
    \"contextWindow\": 4000,
    \"temperature\": 0.7,
    \"model\": \"llama3.2:1b\",
    \"maxRetrievalCount\": 5
  }" -s | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"
```

**Pass Criteria:**
- ✅ Returns valid session ID
- ✅ No error message

### Test 5.2: Chat in English

```bash
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?"
  }' -s | jq '{
    success,
    response: .response[:100],
    sourcesCount: (.sources | length),
    model,
    provider
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "response": "Artificial Intelligence (AI) is the simulation of human intelligence by machines. AI systems...",
  "sourcesCount": 1,
  "model": "llama3.2:1b",
  "provider": "Ollama (Local)"
}
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ Response mentions "AI" or "artificial intelligence"
- ✅ sourcesCount >= 1 (retrieved relevant documents)
- ✅ Provider is "Ollama (Local)" or other configured provider

### Test 5.3: Chat in Indonesian

```bash
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa itu kecerdasan buatan?"
  }' -s | jq '{
    success,
    response: .response[:100],
    sourcesCount: (.sources | length),
    model
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "response": "Kecerdasan Buatan (AI) adalah simulasi kecerdasan manusia oleh mesin. Sistem AI dapat...",
  "sourcesCount": 1,
  "model": "llama3.2:1b"
}
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ Response is in Indonesian
- ✅ Response mentions "AI" or "kecerdasan buatan"
- ✅ sourcesCount >= 1

### Test 5.4: Get Chat History

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/history" \
  | jq '.data[] | {role: .Role, message: .Content[:50]}'
```

**Expected Output:**
```json
{
  "role": "user",
  "message": "What is artificial intelligence?"
}
{
  "role": "assistant",
  "message": "Artificial Intelligence (AI) is the simulation..."
}
{
  "role": "user",
  "message": "Apa itu kecerdasan buatan?"
}
{
  "role": "assistant",
  "message": "Kecerdasan Buatan (AI) adalah simulasi..."
}
```

**Pass Criteria:**
- ✅ All messages present
- ✅ Correct role assignments (user/assistant)
- ✅ Messages in chronological order

---

## Test Suite 6: Multilingual Validation

### Test 6.1: Mixed Language Query

```bash
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain tentang machine learning dalam bahasa Indonesia"
  }' -s | jq '{success, response: .response[:150]}'
```

**Pass Criteria:**
- ✅ Response is primarily in Indonesian
- ✅ Mentions "machine learning" or "pembelajaran mesin"

### Test 6.2: Document Retrieval Accuracy

```bash
# Test if system retrieves correct language document
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about AI applications"
  }' -s | jq '.sources[] | {title: .Title, score: .Score}'
```

**Pass Criteria:**
- ✅ Sources returned
- ✅ Relevance score > 0.5
- ✅ English document retrieved for English query

---

## Test Suite 7: Edge Cases

### Test 7.1: Empty Query

```bash
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": ""}' -s | jq '.'
```

**Expected:** Error message about empty query

### Test 7.2: Very Long Query

```bash
LONG_TEXT=$(python3 -c "print('test ' * 1000)")
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$LONG_TEXT\"}" -s | jq '.success'
```

**Expected:** Should handle gracefully or return appropriate error

### Test 7.3: Special Characters

```bash
curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about AI? 🤖 Can it handle émojis & spëcial çharacters?"
  }' -s | jq '.success'
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ Response generated without errors

---

## Test Suite 8: Performance Tests

### Test 8.1: Response Time

```bash
time curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}' -s > /dev/null
```

**Pass Criteria:**
- ✅ Response time < 5 seconds (with Ollama)
- ✅ Response time < 3 seconds (with OpenAI)

### Test 8.2: Concurrent Requests

```bash
# Send 3 requests in parallel
for i in {1..3}; do
  curl -X POST "http://localhost:4000/api/plugins/rag/sessions/$SESSION_ID/chat" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Test query $i\"}" -s &
done
wait
```

**Pass Criteria:**
- ✅ All requests complete successfully
- ✅ No server errors

---

## Test Suite 9: Cleanup

### Test 9.1: List Resources

```bash
echo "Collections:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/collections | jq '.data | length'

echo "Sessions:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/sessions | jq '.data | length'
```

### Test 9.2: Verify Database

```bash
docker exec dashboard_postgres psql -U dashboard_user -d dashboard_db \
  -c "SELECT 
    (SELECT COUNT(*) FROM plugin.rag_md_collections) as collections,
    (SELECT COUNT(*) FROM plugin.rag_tx_documents) as documents,
    (SELECT COUNT(*) FROM plugin.rag_tx_embeddings) as embeddings,
    (SELECT COUNT(*) FROM plugin.rag_tx_sessions) as sessions,
    (SELECT COUNT(*) FROM plugin.rag_tx_messages) as messages;"
```

**Expected Output:**
```
 collections | documents | embeddings | sessions | messages
-------------+-----------+------------+----------+----------
           1 |         2 |          6 |        1 |        4
```

---

## Test Results Checklist

### Core Functionality
- [ ] Plugin status returns active
- [ ] AI providers available
- [ ] Collections can be created
- [ ] Documents can be uploaded
- [ ] Embeddings generated successfully
- [ ] Chat sessions work
- [ ] Chat responses generated

### Multilingual Support
- [ ] English documents processed
- [ ] Indonesian documents processed
- [ ] English queries answered
- [ ] Indonesian queries answered
- [ ] Mixed language queries handled
- [ ] Correct language documents retrieved

### Performance
- [ ] Response time < 5 seconds
- [ ] Concurrent requests handled
- [ ] No memory leaks observed
- [ ] Database queries optimized

### Error Handling
- [ ] Empty queries rejected
- [ ] Invalid collection IDs handled
- [ ] Missing authentication handled
- [ ] AI provider failures handled
- [ ] Appropriate error messages

---

## Troubleshooting Failed Tests

### If Ollama Tests Fail:

```bash
# Check Ollama status
curl http://localhost:11434/api/version

# Check models
ollama list

# Pull models if missing
ollama pull llama3.2:1b
ollama pull nomic-embed-text
```

### If Document Processing Fails:

```bash
# Check pgvector
docker exec dashboard_postgres psql -U dashboard_user -d dashboard_db \
  -c "SELECT * FROM pg_extension WHERE extname='vector';"

# Check embeddings table
docker exec dashboard_postgres psql -U dashboard_user -d dashboard_db \
  -c "SELECT COUNT(*) FROM plugin.rag_tx_embeddings;"
```

### If Chat Fails:

```bash
# Check AI provider status
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/plugins/rag/ai/status | jq '.'

# Check backend logs
docker logs cas_backend_1 | grep -i "rag\|error"
```

---

## Success Criteria Summary

**All tests pass if:**
- ✅ Plugin status returns active
- ✅ At least one AI provider available
- ✅ Documents process successfully (EN & ID)
- ✅ Chat generates relevant responses
- ✅ Sources are retrieved and cited
- ✅ Multilingual queries work correctly
- ✅ Performance meets targets
- ✅ Error handling is appropriate

---

**Last Updated**: 2025-11-27  
**Version**: 1.0.0  
**Status**: Complete ✅
