// Test RAG Plugin Loading
import 'dotenv/config.js';

console.log('🧪 Testing RAG Plugin Loading...');

try {
  // Mock DatabaseService for testing
  global.DatabaseService = {
    query: async () => [],
    queryOne: async () => null,
    execute: async () => {},
    healthCheck: async () => ({ status: 'ok' })
  };

  // Test RAG plugin import and initialization
  console.log('📦 Importing RAG plugin...');
  const { plugin } = await import('./src/plugins/rag/index.js');
  
  console.log('✅ RAG Plugin loaded successfully:');
  console.log(`   - ID: ${plugin.id}`);
  console.log(`   - Name: ${plugin.name}`);
  console.log(`   - Version: ${plugin.version}`);
  console.log(`   - Description: ${plugin.description}`);
  console.log(`   - Capabilities:`, Object.keys(plugin.capabilities || {}));
  
  if (plugin.routes) {
    console.log('✅ RAG Plugin routes available');
  }
  
  if (plugin.healthCheck) {
    const health = await plugin.healthCheck();
    console.log('✅ RAG Plugin health check:', health);
  }
  
  console.log('🎉 RAG Plugin test completed successfully!');
  
} catch (error) {
  console.error('❌ RAG Plugin test failed:', error.message);
  process.exit(1);
}
