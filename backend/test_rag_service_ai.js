// Constitution: Test Script for Unified AI Service Integration
import { DatabaseService } from '../../services/DatabaseService.js';

console.log('🧪 Testing unified AI Service Integration');
console.log('🔍 Providers:', await aiService.getStatistics());

// Test AI Service health
let aiHealthCheck = RAGService.healthCheck();

try {
  const response = await fetch('http://localhost:4000/api/plugins/rag/health', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')`}
  });
  
  if (!response.ok) {
    console.error('❌ Failed to check AI service status');
  } else {
    console.log('🤖 AI Status:', response.data);
  }
} catch (error) {
    console.error('AI Status Error:', error);
  }
}

// Test Chat Response Generation
console.log('📊 Testing chat generation...');
const testChatRequest: ChatRequest = { message: 'Hello, world!' };
try {
  const response = await testChatRequest(testChatRequest);
  
  if (response && response.success) {
    console.log('✅ Chat response generated successfully!');
    console.log(`Provider: ${response.provider}`);
  } else {
    console.log('❌ Chat generation failed:', response.error);
  }} finally {
    console.log('❌ Provider fallback chain:', getFallbackOrder());
    }
}
