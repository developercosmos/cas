#!/bin/bash

# Constitution: Ollama Model Setup Script for CAS RAG Plugin
# Supports multilingual models for English and Bahasa Indonesia

echo "🤖 Setting up Ollama models for RAG..."

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama service..."
until curl -f http://localhost:11434/api/version > /dev/null 2>&1; do
  echo "Waiting for Ollama to start..."
  sleep 5
done

echo "✅ Ollama is ready!"

# Pull embedding model (supports multilingual including Indonesian)
echo "📥 Pulling embedding model: nomic-embed-text..."
ollama pull nomic-embed-text

# Pull chat models supporting multilingual (including Bahasa Indonesia)
echo "📥 Pulling chat model: llama3.2 (supports multilingual)..."
ollama pull llama3.2

# Optional: Pull smaller model for faster inference
echo "📥 Pulling lightweight model: llama3.2:1b..."
ollama pull llama3.2:1b

# Optional: Pull Mistral for better Indonesian support
echo "📥 Pulling Mistral model (good for Indonesian)..."
ollama pull mistral

echo "✅ All models downloaded successfully!"

# List available models
echo "📋 Available models:"
ollama list

echo "🎉 Ollama setup complete! Models ready for RAG plugin."
echo "📝 Supported languages: English, Bahasa Indonesia, and more"
