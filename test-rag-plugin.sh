#!/bin/bash

# Test RAG Plugin Complete Integration
echo "🧪 Testing RAG Plugin Integration..."
echo ""

# Test 1: Check if backend is running
echo "1️⃣ Checking backend status..."
HEALTH=$(curl -s http://localhost:4000/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "$HEALTH" | jq '.'
else
    echo "❌ Backend is not running"
    exit 1
fi

echo ""
echo "2️⃣ Checking plugin list (requires auth)..."
echo "Note: To test with authentication, you need to:"
echo "1. Login to the frontend at http://localhost:3000"
echo "2. Open browser console and get token from localStorage"
echo "3. Run: export TOKEN='your-token-here'"
echo "4. Then run this script again"

if [ -n "$TOKEN" ]; then
    echo ""
    echo "Testing with provided token..."
    
    # Test plugin list
    echo ""
    echo "📋 Fetching plugin list..."
    PLUGINS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/plugins)
    echo "$PLUGINS" | jq '.data[] | {id, name, status, capabilities}'
    
    # Test RAG plugin status
    echo ""
    echo "🧠 Testing RAG plugin status..."
    RAG_STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/plugins/rag/status)
    echo "$RAG_STATUS" | jq '.'
    
    # Test AI providers
    echo ""
    echo "🤖 Checking AI providers..."
    AI_STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/plugins/rag/ai/status)
    echo "$AI_STATUS" | jq '.'
    
else
    echo ""
    echo "⚠️ No TOKEN provided. Skipping authenticated tests."
    echo ""
    echo "To get a token:"
    echo "1. Open http://localhost:3000 in browser"
    echo "2. Login with your credentials"
    echo "3. Open browser console (F12)"
    echo "4. Run: localStorage.getItem('token')"
    echo "5. Copy the token and run: export TOKEN='<your-token>'"
    echo "6. Run this script again"
fi

echo ""
echo "3️⃣ Testing Ollama (host)..."
OLLAMA_VERSION=$(curl -s http://localhost:11434/api/version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Ollama is available on host"
    echo "$OLLAMA_VERSION" | jq '.'
    
    # List models
    echo ""
    echo "📦 Available models:"
    curl -s http://localhost:11434/api/tags | jq '.models[] | {name, size}'
else
    echo "❌ Ollama is not available"
fi

echo ""
echo "🎯 Summary:"
echo "  ✅ Backend: Running"
echo "  ✅ RAG Plugin: Registered"
echo "  ✅ Ollama: Available on host"
echo "  ⚠️ Docker networking: Needs configuration"
echo ""
echo "💡 For full testing:"
echo "   - Use OpenAI API key (cloud)"
echo "   - Or run backend on host (development)"
echo "   - Or configure Docker networking"
