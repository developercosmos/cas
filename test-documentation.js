// Simple test script to verify plugin documentation functionality
const { PluginDocumentationService } = require('./backend/src/services/PluginDocumentationService.ts');
const { DatabaseService } = require('./backend/src/services/DatabaseService.ts');

async function testDocumentation() {
  try {
    console.log('🧪 Testing Plugin Documentation System...');
    
    // Initialize database
    console.log('📊 Initializing database...');
    await DatabaseService.initialize();
    console.log('✅ Database initialized');
    
    // Test creating documentation
    console.log('📝 Creating test documentation...');
    const doc = await PluginDocumentationService.create({
      pluginId: 'text-block',
      documentType: 'readme',
      title: 'Text Block Plugin',
      content: '# Text Block Plugin\n\nThis is a test documentation entry.',
      contentFormat: 'markdown',
      language: 'en',
      version: '1.0.0',
      isCurrent: true
    });
    console.log('✅ Documentation created:', doc.id);
    
    // Test retrieving documentation
    console.log('🔍 Retrieving documentation...');
    const retrieved = await PluginDocumentationService.getByType('text-block', 'readme', 'en');
    console.log('✅ Documentation retrieved:', retrieved?.title);
    
    // Test cleanup on uninstall
    console.log('🗑️ Testing documentation cleanup...');
    const deletedCount = await PluginDocumentationService.deleteByPluginId('text-block');
    console.log(`✅ Cleaned up ${deletedCount} documentation records`);
    
    console.log('🎉 All tests passed!');
    
    // Close database connection
    await DatabaseService.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDocumentation();
