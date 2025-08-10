#!/usr/bin/env node
/**
 * BMAD API Audit Script
 * Tests which API endpoints are working vs broken
 * 
 * Run: node audit-apis.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// API endpoints to audit
const apiEndpoints = [
  // Working endpoints (from our earlier test)
  {
    name: 'Smart Suggestions Test',
    path: '/api/test/smart-suggestions',
    method: 'POST',
    testData: { text: 'delivery at 30 and safe farming' },
    expectedWorking: true,
    purpose: 'Generate smart suggestions for text'
  },

  // Processing endpoints (likely broken)
  {
    name: 'Context-Aware Processing',
    path: '/api/processing/context-aware',
    method: 'POST',
    testData: { transcription: 'test', submission_id: 'test-123', user_id: 'test-user' },
    expectedWorking: false,
    purpose: 'GPT-5 context processing'
  },
  {
    name: 'Processing Transcribe',
    path: '/api/processing/transcribe',
    method: 'POST',
    testData: { audio: 'test-data', submissionId: 'test-123' },
    expectedWorking: false,
    purpose: 'Audio transcription'
  },
  {
    name: 'Processing Transcription',
    path: '/api/processing/transcription',
    method: 'POST',
    testData: { fileUrl: 'test-url', userId: 'test-user', submissionId: 'test-123' },
    expectedWorking: false,
    purpose: 'Enhanced transcription service'
  },

  // Validation endpoints
  {
    name: 'Validation Session',
    path: '/api/validation/session/mock-123',
    method: 'GET',
    testData: null,
    expectedWorking: false,
    purpose: 'Fetch validation session data'
  },

  // Evidence endpoints (unknown status)
  {
    name: 'Evidence Generate',
    path: '/api/evidence/generate',
    method: 'POST',
    testData: { submissionId: 'test-123' },
    expectedWorking: false,
    purpose: 'Generate evidence packages'
  },

  // Test endpoints
  {
    name: 'Speech Engine Battle',
    path: '/api/test/speech-engine-battle',
    method: 'POST',
    testData: { testMode: 'full', maxSamples: 1 },
    expectedWorking: false,
    purpose: 'Compare speech engines'
  }
];

// Test single endpoint
async function testEndpoint(endpoint, baseUrl = 'http://localhost:3000') {
  const url = `${baseUrl}${endpoint.path}`;
  
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: endpoint.testData ? JSON.stringify(endpoint.testData) : undefined
    });

    const data = await response.json().catch(() => null);
    
    return {
      ...endpoint,
      status: response.status,
      working: response.ok,
      response: data,
      error: null
    };
  } catch (error) {
    return {
      ...endpoint,
      status: 0,
      working: false,
      response: null,
      error: error.message
    };
  }
}

// Scan API directory for all endpoints
function scanApiDirectory() {
  const apiDir = path.join(__dirname, 'bmad-web', 'pages', 'api');
  const endpoints = [];

  function scanDir(dir, basePath = '') {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath, `${basePath}/${item}`);
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        const filename = item.replace(/\.(ts|js)$/, '');
        let apiPath = `${basePath}/${filename}`.replace(/\[([^\]]+)\]/g, 'test-$1');
        
        endpoints.push({
          file: fullPath.replace(__dirname + '/', ''),
          apiPath: `/api${apiPath}`,
          isDynamic: item.includes('[') && item.includes(']')
        });
      }
    }
  }

  scanDir(apiDir);
  return endpoints;
}

// Main audit function
async function auditAPIs() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.blue}BMAD API Endpoint Audit${colors.reset}`);
  console.log('='.repeat(70));

  // Check if server is running
  try {
    await fetch('http://localhost:3000/api/test');
  } catch (error) {
    console.log(`${colors.red}❌ Server not running!${colors.reset}`);
    console.log('Please start your Next.js server first: npm run dev');
    return;
  }

  console.log(`${colors.green}✅ Server is running${colors.reset}\n`);

  // Scan for all API files
  console.log('📁 Scanning API directory...');
  const discoveredEndpoints = scanApiDirectory();
  console.log(`Found ${discoveredEndpoints.length} API files:\n`);

  discoveredEndpoints.forEach(endpoint => {
    console.log(`  ${endpoint.isDynamic ? '🔀' : '📄'} ${endpoint.apiPath} (${endpoint.file})`);
  });

  // Test known endpoints
  console.log('\n' + '-'.repeat(70));
  console.log('Testing Known Endpoints:');
  console.log('-'.repeat(70));

  const results = [];
  
  for (const endpoint of apiEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.path}`);
    
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.working) {
      console.log(`   ${colors.green}✅ WORKING${colors.reset} (${result.status})`);
    } else {
      console.log(`   ${colors.red}❌ BROKEN${colors.reset} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else if (result.response?.error || result.response?.detail) {
        console.log(`   API Error: ${result.response.error || result.response.detail}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(70));

  const working = results.filter(r => r.working);
  const broken = results.filter(r => !r.working);

  console.log(`${colors.green}✅ Working endpoints: ${working.length}${colors.reset}`);
  working.forEach(r => {
    console.log(`   • ${r.name} - ${r.purpose}`);
  });

  console.log(`\n${colors.red}❌ Broken endpoints: ${broken.length}${colors.reset}`);
  broken.forEach(r => {
    console.log(`   • ${r.name} - ${r.purpose}`);
  });

  console.log(`\n${colors.blue}📁 Total API files found: ${discoveredEndpoints.length}${colors.reset}`);
  
  // Recommendations
  console.log('\n' + colors.yellow + 'RECOMMENDATIONS FOR STORY 1A.3:' + colors.reset);
  console.log('1. Keep working endpoints:', working.map(r => r.path).join(', '));
  console.log('2. Archive/remove broken endpoints');
  console.log('3. Focus on ValidationTool + working smart suggestions');
  console.log('4. Create simple new endpoints rather than fixing complex ones');

  return { working, broken, discovered: discoveredEndpoints };
}

// Run audit
if (require.main === module) {
  auditAPIs().catch(console.error);
}

module.exports = { auditAPIs, testEndpoint };