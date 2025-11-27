#!/bin/bash

# Constitution: Ollama Setup Script
echo "🤖 Setting up Ollama for CAS RAG Plugin"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ollama/models ollama/scripts
mkdir -p ollama/models/embeddings ollama/models/chat

# Create pull script
cat > ollama/scripts/pull-models.sh << 'EOF'
#!/bin/sh
echo "🔧 Downloading recommended models..."

# Chat models
echo "📚 Downloading chat models..."
ollama pull llama3.2:latest
ollama pull mistral:latest
ollama pull phi3:mini:latest

# Embedding models
echo "🔤 Downloading embedding models..."
ollama pull nomic-embed-text:latest

echo "✅ Models downloaded successfully!"
echo "📋 Available models:"
ollama ls
EOF

chmod +x ollama/scripts/pull-models.sh

# Pull and start Ollama
echo "🚀 Starting Ollama service..."
docker-compose -f docker-compose.ollama.yml up -d ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    else
        echo -n "."
        sleep 2
    fi
done

# Pull models
echo "📦 Pulling models..."
./ollama/scripts/pull-models.sh

echo "🎉 Ollama setup complete!"
echo "🌐 Ollama API available at: http://localhost:11434"
echo "🧠 Test with: curl http://localhost:11434/api/version"
