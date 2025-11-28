const http = require('http');
const { exec } = require('child_process');

// Test backend documentation API
function testDocumentationAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/plugins/rag-retrieval/docs',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📚 Documentation API Response:');
          console.log('- Success:', result.success);
          console.log('- Data count:', result.data ? result.data.length : 0);
          console.log('- Response:', JSON.stringify(result, null, 2));
          
          if (result.success && result.data && result.data.length > 0) {
            console.log('✅ Documentation data available');
            resolve(true);
          } else {
            console.log('❌ No documentation data found');
            resolve(false);
          }
        } catch (err) {
          console.log('❌ JSON parse error:', err);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err);
      resolve(false);
    });

    req.end();
  });
}

// Test database connection
function testDatabase() {
  return new Promise((resolve) => {
    exec('psql -U postgres -d cas -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \\'plugin\\' AND table_name LIKE \\'%document%\\';" 2>/dev/null', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Database test failed:', error.message);
        resolve(false);
      } else {
        console.log('🗄 Database tables:', stdout.trim());
        resolve(true);
      }
    });
  });
}

// Test plugin list API
function testPluginAPI() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/plugins',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            const ragPlugin = result.data.find(p => p.id === 'rag-retrieval');
            console.log('🔌 RAG Plugin Found:', !!ragPlugin);
            if (ragPlugin) {
              console.log('- ID:', ragPlugin.id);
              console.log('- Name:', ragPlugin.name);
              console.log('- Status:', ragPlugin.status);
            }
          }
          resolve(result.success);
        } catch (err) {
          console.log('❌ JSON parse error:', err);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err);
      resolve(false);
    });

    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('🧪 Documentation Button Test Suite');
  console.log('=====================================');
  
  console.log('\n1️⃣ Testing Backend API...');
  const apiWorks = await testPluginAPI();
  
  console.log('\n2️⃣ Testing Database...');
  const dbWorks = await testDatabase();
  
  console.log('\n3️⃣ Testing Documentation API...');
  const docWorks = await testDocumentationAPI();
  
  console.log('\n📊 Test Results:');
  console.log('=====================================');
  console.log(`Plugin API: ${apiWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`Database: ${dbWorks ? '✅ Working' : '❌ Failed'}`);
  console.log(`Documentation API: ${docWorks ? '✅ Working' : '❌ Failed'}`);
  
  if (apiWorks && dbWorks && docWorks) {
    console.log('\n🎉 All tests passed! Documentation button should work.');
  } else {
    console.log('\n🚨 Issues found! Documentation button may not work.');
    console.log('\n🔧 Fix Recommendations:');
    
    if (!apiWorks) console.log('- Fix backend plugin API');
    if (!dbWorks) console.log('- Check database connection and tables');
    if (!docWorks) console.log('- Create documentation table and populate with data');
  }
}

runTests().catch(console.error);
