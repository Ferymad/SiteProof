#!/usr/bin/env node
/**
 * API Endpoint Testing Script
 * Run: node test-api-endpoints.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testEndpoint(name, url, options = {}) {
  console.log(`\n${colors.yellow}Testing: ${name}${colors.reset}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => null);
    
    if (response.ok) {
      console.log(`${colors.green}✓ SUCCESS (${response.status})${colors.reset}`);
      if (data) {
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
      return { success: true, status: response.status, data };
    } else {
      console.log(`${colors.red}✗ FAILED (${response.status})${colors.reset}`);
      if (data) {
        console.log('Error:', data.error || data.detail || data.message || JSON.stringify(data));
      }
      return { success: false, status: response.status, error: data };
    }
  } catch (error) {
    console.log(`${colors.red}✗ NETWORK ERROR${colors.reset}`);
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('BMAD API ENDPOINT TESTING');
  console.log('='.repeat(60));

  const results = [];

  // Test 1: Validation Session Endpoint (GET)
  results.push(await testEndpoint(
    'Validation Session (mock ID)',
    `${BASE_URL}/validation/session/mock-submission-123`
  ));

  // Test 2: Processing Transcribe Endpoint (POST)
  results.push(await testEndpoint(
    'Processing Transcribe',
    `${BASE_URL}/processing/transcribe`,
    {
      method: 'POST',
      body: {
        audio: 'mock-audio-data',
        submissionId: 'test-123'
      }
    }
  ));

  // Test 3: Context-Aware Processing (POST)
  results.push(await testEndpoint(
    'Context-Aware Processing',
    `${BASE_URL}/processing/context-aware`,
    {
      method: 'POST',
      body: {
        transcription: 'Morning lads, concrete delivery at 30. Safe farming required.',
        submission_id: 'test-123'
      }
    }
  ));

  // Test 4: Smart Suggestions Test Endpoint
  results.push(await testEndpoint(
    'Smart Suggestions Test',
    `${BASE_URL}/test/smart-suggestions`,
    {
      method: 'POST',
      body: {
        text: 'delivery at 30 and safe farming'
      }
    }
  ));

  // Test 5: Validation Submit (POST)
  results.push(await testEndpoint(
    'Validation Submit',
    `${BASE_URL}/validation/submit`,
    {
      method: 'POST',
      body: {
        submissionId: 'test-123',
        decisions: [
          { cardIndex: 0, decision: 'approve' }
        ]
      }
    }
  ));

  // Test 6: WhatsApp Voice Upload (POST) 
  results.push(await testEndpoint(
    'WhatsApp Voice Upload',
    `${BASE_URL}/whatsapp/voice`,
    {
      method: 'POST',
      body: {
        audio: 'base64-mock-audio',
        userId: 'test-user'
      }
    }
  ));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.success).length;
  const failed = results.length - working;
  
  console.log(`${colors.green}Working: ${working}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${results.length}`);

  console.log('\n💡 TIP: Make sure your Next.js dev server is running on port 3000');
  console.log('Run: npm run dev (in bmad-web folder)');
}

// Run the tests
runTests().catch(console.error);