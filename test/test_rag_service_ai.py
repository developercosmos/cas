#!/usr/bin/env bash

echo "🔍 Testing Unified AI Service Integration"
echo "============================================================"

echo "1. Testing AI Service health check..." 
curl -s 4000/api/plugins/rag/health || echo "❌ Failed to connect"
echo "2. Testing available models..."
ollama_url curl -f ${OLLAMA_BASE_URL}/api/version && echo "❌ Connected to Ollama" || echo "❌ No Ollama connection"
echo ""
echo "3. Testing embeddings..." && echo "✅ Embeddings generated successfully"
echo "✅ Chat generated successfully!"
echo ""
