// Constitution: Unified AI Service with Fallback Chain (Ollama -> OpenAI -> Gemini)
import { DatabaseService } from './DatabaseService.js';

export interface AIProvider {
  name: string;
  type: 'local' | 'openai' | 'gemini';
  available: boolean;
  priority: number;
  embeddings?: boolean;
  chat?: boolean;
}

export interface ChatRequest {
  message: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatResponse {
  content: string;
  response?: string; // Alias for content
  model: string;
  provider: string;
  tokensUsed?: number;
  finishReason?: string;
  sources?: any[];
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
  dimension: number;
}

export interface AIConfig {
  ollama?: {
    baseUrl: string;
    availableModels: string[];
  };
  openai?: {
    apiKey: string;
    organization?: string;
  };
  gemini?: {
    apiKey: string;
  };
  preferences?: {
    primaryProvider: 'ollama' | 'openai' | 'gemini';
    fallbackChain: string[];
  };
}

export class AIService {
  private static instance: AIService;
  private config: AIConfig = {};
  private providers: AIProvider[] = [];
  private lastHealthCheck = new Map<string, Date>();

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Constitution: Initialize AI service with configuration
  async initialize(config: AIConfig): Promise<void> {
    this.config = config;

    // Constitution: Build provider list with priorities
    this.providers = [
      {
        name: 'Ollama (Local)',
        type: 'local',
        available: false,
        priority: 1,
        embeddings: true,
        chat: true
      },
      {
        name: 'OpenAI',
        type: 'openai',
        available: false,
        priority: 2,
        embeddings: true,
        chat: true
      },
      {
        name: 'Google Gemini',
        type: 'gemini',
        available: false,
        priority: 3,
        embeddings: true,
        chat: true
      }
    ];

    // Constitution: Check availability for each provider
    await this.checkAllProviders();

    console.log('🤖 AI Service: Initialized with fallback chain');
    console.log('📋 Available providers:', this.getAvailableProviders().map(p => p.name));
  }

  // Constitution: Check availability of all providers
  private async checkAllProviders(): Promise<void> {
    const checks = await Promise.allSettled([
      this.checkOllamaProvider(),
      this.checkOpenAIProvider(),
      this.checkGeminiProvider()
    ]);

    // Update provider availability
    if (checks[0].status === 'fulfilled') {
      this.providers[0].available = checks[0].value;
    }
    if (checks[1].status === 'fulfilled') {
      this.providers[1].available = checks[1].value;
    }
    if (checks[2].status === 'fulfilled') {
      this.providers[2].available = checks[2].value;
    }
  }

  // Constitution: Check Ollama provider availability
  private async checkOllamaProvider(): Promise<boolean> {
    try {
      if (!this.config.ollama?.baseUrl) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.ollama.baseUrl}/api/tags`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data: any = await response.json();
      this.config.ollama.availableModels = data.models?.map((m: any) => m.name) || [];
      return true;
    } catch (error) {
      console.log('🔍 Ollama not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Constitution: Check OpenAI provider availability
  private async checkOpenAIProvider(): Promise<boolean> {
    try {
      if (!this.config.openai?.apiKey) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.log('🔍 OpenAI not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Constitution: Check Gemini provider availability
  private async checkGeminiProvider(): Promise<boolean> {
    try {
      if (!this.config.gemini?.apiKey) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          'x-goog-api-key': this.config.gemini.apiKey
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.log('🔍 Gemini not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Constitution: Get available providers sorted by priority
  private getAvailableProviders(): AIProvider[] {
    return this.providers
      .filter(p => p.available)
      .sort((a, b) => a.priority - b.priority);
  }

  // Constitution: Get best available provider for specified capability
  private getBestProvider(capability: 'chat' | 'embeddings'): AIProvider | null {
    const available = this.getAvailableProviders()
      .filter(p => p[capability]);
    
    return available.length > 0 ? available[0] : null;
  }

  // Constitution: Generate chat response with fallback
  async generateChat(request: ChatRequest): Promise<ChatResponse> {
    const errors: Error[] = [];
    
    for (const provider of this.getAvailableProviders()) {
      if (!provider.chat) continue;

      try {
        console.log(`🤖 AI Service: Trying ${provider.name} for chat...`);
        
        let result: ChatResponse;
        
        switch (provider.type) {
          case 'local':
            result = await this.chatWithOllama(request);
            break;
          case 'openai':
            result = await this.chatWithOpenAI(request);
            break;
          case 'gemini':
            result = await this.chatWithGemini(request);
            break;
          default:
            throw new Error(`Unknown provider type: ${provider.type}`);
        }

        result.provider = provider.name;
        console.log(`✅ AI Service: Success with ${provider.name}`);
        return result;

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        console.log(`❌ AI Service: ${provider.name} failed: ${err.message}`);
        
        // Try next provider
        continue;
      }
    }

    // If all providers failed
    const errorMessages = errors.map(e => e.message).join('; ');
    throw new Error(`All AI providers failed: ${errorMessages}`);
  }

  // Constitution: Generate embeddings with fallback
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const errors: Error[] = [];
    
    for (const provider of this.getAvailableProviders()) {
      if (!provider.embeddings) continue;

      try {
        console.log(`🤖 AI Service: Trying ${provider.name} for embeddings...`);
        
        let result: EmbeddingResponse;
        
        switch (provider.type) {
          case 'local':
            result = await this.embeddingsWithOllama(request);
            break;
          case 'openai':
            result = await this.embeddingsWithOpenAI(request);
            break;
          case 'gemini':
            result = await this.embeddingsWithGemini(request);
            break;
          default:
            throw new Error(`Unknown provider type: ${provider.type}`);
        }

        result.provider = provider.name;
        console.log(`✅ AI Service: Embeddings success with ${provider.name}`);
        return result;

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        console.log(`❌ AI Service: ${provider.name} embeddings failed: ${err.message}`);
        continue;
      }
    }

    const errorMessages = errors.map(e => e.message).join('; ');
    throw new Error(`All embedding providers failed: ${errorMessages}`);
  }

  // Constitution: Ollama implementations
  private async chatWithOllama(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = this.config.ollama!.baseUrl;
    const model = request.model || 'llama3.2:latest'; // Default to Llama 3.2

    const prompt = request.context ? 
      `Context:\n${request.context}\n\nQuestion:\n${request.message}` : 
      request.message;

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }

    return {
      content: data.response || '',
      model: data.model || model,
      provider: 'Ollama',
      tokensUsed: data.eval_count || 0,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  private async embeddingsWithOllama(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const baseUrl = this.config.ollama!.baseUrl;
    const model = request.model || 'nomic-embed-text:latest';

    const response = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: request.texts.join('\n'),
        options: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings error: ${response.statusText}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(`Ollama embeddings error: ${data.error}`);
    }

    return {
      embeddings: data.embeddings || [],
      model: data.model || model,
      provider: 'Ollama',
      dimension: data.dimensions || 768 // Default for most embedding models
    };
  }

  // Constitution: OpenAI implementations  
  private async chatWithOpenAI(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || 'gpt-3.5-turbo';

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...(request.context ? [{ role: 'system', content: `Context:\n${request.context}` }] : []),
      { role: 'user', content: request.message }
    ];

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.openai!.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.config.openai?.organization) {
      headers['OpenAI-Organization'] = this.config.openai.organization;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2048
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      content: data.choices[0].message.content,
      model: data.model,
      provider: 'OpenAI',
      tokensUsed: data.usage?.total_tokens || 0,
      finishReason: data.choices[0].finish_reason
    };
  }

  private async embeddingsWithOpenAI(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || 'text-embedding-3-small';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.openai!.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.config.openai?.organization) {
      headers['OpenAI-Organization'] = this.config.openai.organization;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input: request.texts
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      embeddings: data.data.map((d: any) => d.embedding),
      model: data.model,
      provider: 'OpenAI',
      dimension: data.usage?.prompt_tokens || 1536
    };
  }

  // Constitution: Gemini implementations
  private async chatWithGemini(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || 'gemini-1.5-flash';
    
    const prompt = request.context ? 
      `Context:\n${request.context}\n\nQuestion:\n${request.message}` : 
      request.message;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.gemini!.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: model,
      provider: 'Google Gemini',
      tokensUsed: data.usageMetadata?.totalTokenCount || 0
    };
  }

  private async embeddingsWithGemini(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = 'text-embedding-004';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:embedContent?key=${this.config.gemini!.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: request.texts.join('\n') }] }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini embeddings error: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      embeddings: [data.embedding?.values || []],
      model: model,
      provider: 'Google Gemini',
      dimension: data.embedding?.values?.length || 768
    };
  }

  // Constitution: Get provider statistics
  async getStatistics(): Promise<any> {
    return {
      providers: this.providers,
      available: this.getAvailableProviders().map(p => p.name),
      totalProviders: this.providers.length,
      ollamaModels: this.config.ollama?.availableModels || [],
      lastHealthCheck: Array.from(this.lastHealthCheck.entries())
    };
  }

  // Constitution: Health check for all providers
  async healthCheck(): Promise<{ healthy: boolean; providers: AIProvider[] }> {
    await this.checkAllProviders();
    
    return {
      healthy: this.getAvailableProviders().length > 0,
      providers: this.providers
    };
  }

  // Constitution: Get available models per provider
  async getModels(): Promise<Record<string, string[]>> {
    const models: Record<string, string[]> = {};

    for (const provider of this.getAvailableProviders()) {
      switch (provider.type) {
        case 'local':
          models[provider.name] = this.config.ollama?.availableModels || [];
          break;
        case 'openai':
          models[provider.name] = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
          break;
        case 'gemini':
          models[provider.name] = ['gemini-1.5-flash', 'gemini-1.5-pro', 'text-embedding-004'];
          break;
      }
    }

    return models;
  }

  // Constitution: Configure service
  async updateConfig(config: Partial<AIConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.checkAllProviders();
  }

  // Constitution: Get fallback order
  getFallbackOrder(): string[] {
    const preferences = this.config.preferences?.fallbackChain || 
      ['ollama', 'openai', 'gemini'];
    
    return preferences.filter(providerName => 
      this.providers.find(p => p.name.toLowerCase().includes(providerName.toLowerCase()))?.available
    );
  }
}

// Singleton export
export const aiService = AIService.getInstance();
