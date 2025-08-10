#!/usr/bin/env node

/**
 * Speech Engine Battle Test Runner
 * Story 1A.2.10: Test AssemblyAI vs Deepgram vs Whisper
 * 
 * Usage: node test-speech-engines.js
 */

// Use Node.js built-in fetch (Node 18+) or fallback to node-fetch
const fetch = globalThis.fetch || require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_API_KEY || 'test-key-for-battle-test';

async function runBattleTest() {
  console.log('🎯 Starting Speech Engine Battle Test...');
  console.log('API Base:', API_BASE);
  
  try {
    const response = await fetch(`${API_BASE}/api/test/speech-engine-battle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`
      },
      body: JSON.stringify({
        testMode: 'full',
        maxSamples: 3,
        includeDeepgram: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n🏆 BATTLE TEST RESULTS');
      console.log('====================');
      console.log(`Winner: ${result.battleTest.winner}`);
      console.log(`Total Time: ${result.battleTest.totalTime}s`);
      console.log(`MVP Ready: ${result.mvpCriteria.met ? '✅ YES' : '❌ NO'}`);
      
      console.log('\n📊 Engine Performance:');
      result.battleTest.results.forEach(engine => {
        console.log(`\n${engine.engine}:`);
        console.log(`  Accuracy: ${engine.accuracy}%`);
        console.log(`  Cost: $${engine.cost.toFixed(5)}`);
        console.log(`  Speed: ${engine.processingTime}s`);
        console.log(`  Terms: ${engine.constructionTermsRecognized}`);
        console.log(`  Fixes: ${engine.criticalErrorsFixed}`);
      });
      
      console.log('\n💡 Recommendation:');
      console.log(result.battleTest.recommendation);
      
      console.log('\n🚀 Next Steps:');
      result.nextSteps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
      
      // Return winner for automated deployment decisions
      return result.battleTest.winner;
      
    } else {
      console.error('❌ Battle test failed:');
      console.error('Error:', result.error.message);
      console.error('Type:', result.error.type);
      
      console.log('\n🔧 Troubleshooting:');
      result.troubleshooting.forEach((tip, i) => {
        console.log(`${i + 1}. ${tip}`);
      });
      
      return null;
    }
    
  } catch (error) {
    console.error('❌ Network error running battle test:', error.message);
    console.error('Make sure the development server is running: npm run dev');
    return null;
  }
}

async function checkAPIKeys() {
  console.log('\n🔑 Checking API Keys...');
  
  const required = ['ASSEMBLYAI_API_KEY', 'DEEPGRAM_API_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('⚠️ Missing API keys:', missing.join(', '));
    console.log('Add them to your .env.local file');
    return false;
  }
  
  console.log('✅ All required API keys present');
  return true;
}

async function main() {
  console.log('🚀 BMAD Speech Engine Battle Test');
  console.log('Story 1A.2.10: Find the best engine for Irish construction sites\n');
  
  // Check prerequisites
  if (!(await checkAPIKeys())) {
    console.log('\n❌ Prerequisites not met. Please configure API keys.');
    process.exit(1);
  }
  
  // Run the battle test
  const winner = await runBattleTest();
  
  if (winner && winner !== 'NO_WINNER_MEETS_REQUIREMENTS') {
    console.log(`\n🎉 Success! ${winner} is ready for production deployment.`);
    process.exit(0);
  } else {
    console.log('\n❌ No engine meets MVP requirements. Review results and consider adjustments.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runBattleTest, checkAPIKeys };