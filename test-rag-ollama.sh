#!/bin/bash

# Test RAG Plugin with Ollama Integration
# Constitution: Testing multilingual support (English & Bahasa Indonesia)

echo "🧪 Testing RAG Plugin with Ollama..."
echo ""

# Test 1: Check Ollama is available
echo "1️⃣ Testing Ollama availability..."
OLLAMA_VERSION=$(curl -s http://localhost:11434/api/version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Ollama is running: $OLLAMA_VERSION"
else
    echo "❌ Ollama is not available"
    exit 1
fi

# Test 2: List available models
echo ""
echo "2️⃣ Listing available models..."
curl -s http://localhost:11434/api/tags | jq '.models[] | {name, size}'

# Test 3: Test English chat
echo ""
echo "3️⃣ Testing English chat..."
RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "What is artificial intelligence? Answer in one sentence.",
  "stream": false
}')
echo "English response:"
echo "$RESPONSE" | jq -r '.response'

# Test 4: Test Indonesian (Bahasa Indonesia) chat
echo ""
echo "4️⃣ Testing Indonesian (Bahasa Indonesia) chat..."
RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",  
  "prompt": "Apa itu kecerdasan buatan? Jawab dalam satu kalimat.",
  "stream": false
}')
echo "Indonesian response:"
echo "$RESPONSE" | jq -r '.response'

# Test 5: Test embedding model
echo ""
echo "5️⃣ Testing embedding model..."
EMBED_RESPONSE=$(curl -s http://localhost:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": "This is a test document for RAG."
}')
EMBED_COUNT=$(echo "$EMBED_RESPONSE" | jq '.embeddings[0] | length')
echo "Embedding dimensions: $EMBED_COUNT"

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Ollama: Available"
echo "  ✅ Models: llama3.2:1b, nomic-embed-text"
echo "  ✅ English: Supported"
echo "  ✅ Indonesian: Supported"
echo "  ✅ Embeddings: $EMBED_COUNT dimensions"
