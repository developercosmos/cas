# Ollama Setup for CAS RAG Plugin

## Overview

This directory contains configuration and setup scripts for Ollama integration with the CAS RAG Plugin. Ollama provides local LLM inference with multilingual support including English and Bahasa Indonesia.

## Constitution Compliance

- **Plugin-First Architecture**: Ollama is integrated as the primary provider in the RAG plugin
- **Headless Design**: Runs in Docker container, accessible via REST API
- **Observability**: Health checks and logging enabled
- **Performance**: Local inference for <2s response times

## Features

### Multilingual Support
- **English**: Primary language support
- **Bahasa Indonesia**: Native Indonesian language support
- **Other Languages**: 100+ languages supported by underlying models

### Models Included

1. **nomic-embed-text** (Embedding Model)
   - Dimension: 768
   - Multilingual support
   - Optimized for semantic search
   - Size: ~274MB

2. **llama3.2** (Chat Model)
   - Parameters: 3B
   - Multilingual including Indonesian
   - Context window: 128K tokens
   - Size: ~2GB

3. **llama3.2:1b** (Lightweight Chat)
   - Parameters: 1B
   - Faster inference
   - Good for simple queries
   - Size: ~1.3GB

4. **mistral** (Advanced Chat)
   - Parameters: 7B
   - Excellent Indonesian support
   - High quality responses
   - Size: ~4.1GB

## Quick Start

### 1. Start Ollama with Docker Compose

```bash
cd /var/www/cas
docker-compose up -d ollama
```

### 2. Setup Models

```bash
# From host machine
docker exec -it cas_ollama bash
cd /root
./setup-models.sh
```

Or download models manually:
```bash
docker exec cas_ollama ollama pull nomic-embed-text
docker exec cas_ollama ollama pull llama3.2
docker exec cas_ollama ollama pull mistral
```

### 3. Verify Installation

```bash
# Check Ollama status
curl http://localhost:11434/api/version

# List available models
docker exec cas_ollama ollama list

# Test chat (English)
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, how are you?",
  "stream": false
}'

# Test chat (Bahasa Indonesia)
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Halo, apa kabar?",
  "stream": false
}'
```

## Environment Variables

Configure in `.env` or `docker-compose.yml`:

```env
OLLAMA_BASE_URL=http://ollama:11434
OPENAI_API_KEY=sk-...          # Fallback provider
GEMINI_API_KEY=...              # Fallback provider
```

## Fallback Chain

The RAG plugin implements automatic fallback:

1. **Ollama** (Primary) - Local, fast, free
2. **OpenAI** (Fallback) - High quality, requires API key
3. **Gemini** (Backup) - Alternative cloud provider

If Ollama fails or is unavailable, requests automatically fallback to OpenAI, then Gemini.

## API Endpoints

### Ollama Service
- Base URL: `http://localhost:11434`
- Health: `GET /api/version`
- Models: `GET /api/tags`
- Generate: `POST /api/generate`
- Embeddings: `POST /api/embed`

### RAG Plugin Endpoints
- Status: `GET /api/plugins/rag/status`
- AI Providers: `GET /api/plugins/rag/ai/status`
- Configure: `POST /api/plugins/rag/configure`
- Test Providers: `POST /api/plugins/rag/ai/test`

## Performance Optimization

### Memory Requirements
- Minimum: 4GB RAM
- Recommended: 8GB+ RAM
- GPU: Optional (NVIDIA CUDA for faster inference)

### Model Selection
- **Small queries**: Use `llama3.2:1b` (faster)
- **Complex queries**: Use `llama3.2` or `mistral`
- **Indonesian focus**: Use `mistral` (better Indonesian)

### Concurrent Requests
Ollama can handle multiple requests:
```bash
# Configure in Ollama
docker exec cas_ollama ollama serve --parallel 4
```

## Multilingual Examples

### English
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "What is the capital of Indonesia?",
  "stream": false
}'
```

### Bahasa Indonesia
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Apa ibukota Indonesia?",
  "stream": false
}'
```

### Mixed Language (Code-switching)
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Explain tentang artificial intelligence dalam bahasa Indonesia",
  "stream": false
}'
```

## Troubleshooting

### Ollama Not Starting
```bash
# Check logs
docker logs cas_ollama

# Restart service
docker-compose restart ollama

# Check health
docker exec cas_ollama curl http://localhost:11434/api/version
```

### Out of Memory
```bash
# Use smaller model
docker exec cas_ollama ollama pull llama3.2:1b

# Or increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory
```

### Slow Performance
```bash
# Pull smaller model
docker exec cas_ollama ollama pull llama3.2:1b

# Or use GPU acceleration
# Requires NVIDIA GPU and nvidia-docker
```

### Models Not Available
```bash
# Re-run setup script
docker exec -it cas_ollama bash
./setup-models.sh

# Or manually pull
docker exec cas_ollama ollama pull nomic-embed-text
```

## Advanced Configuration

### Custom Ollama Settings

Create `ollama/Dockerfile.custom`:
```dockerfile
FROM ollama/ollama:latest

# Set environment variables
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_ORIGINS=*
ENV OLLAMA_NUM_PARALLEL=4
ENV OLLAMA_MAX_LOADED_MODELS=3

# Copy setup script
COPY setup-models.sh /root/setup-models.sh
RUN chmod +x /root/setup-models.sh
```

### GPU Support

Update `docker-compose.yml`:
```yaml
ollama:
  image: ollama/ollama:latest
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## Monitoring

### Check Model Usage
```bash
# View running models
docker exec cas_ollama ps aux | grep ollama

# Monitor resource usage
docker stats cas_ollama
```

### Performance Metrics
```bash
# Test response time
time curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Test",
  "stream": false
}'
```

## References

- [Ollama Documentation](https://ollama.ai/docs)
- [Ollama Models](https://ollama.ai/library)
- [Docker Documentation](https://docs.docker.com)
- [CAS Constitution](../constitution.md)

## Support

For issues or questions:
1. Check logs: `docker logs cas_ollama`
2. Review health: `curl http://localhost:11434/api/version`
3. Test fallback: Ensure OpenAI/Gemini keys are configured
4. Restart service: `docker-compose restart ollama`
