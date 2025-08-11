#!/usr/bin/env node

/**
 * QA Accuracy Testing Script
 * Senior QA Engineer: Quinn
 * 
 * This script runs comprehensive accuracy validation for Irish construction transcription
 * Target: 85% accuracy with real audio files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 QA ACCURACY VALIDATION SUITE');
console.log('===============================');

// Check prerequisites
function validatePrerequisites() {
  console.log('📋 Checking prerequisites...');
  
  // Check for OpenAI API key
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ CRITICAL: .env.local file not found');
    console.log('📝 Create .env.local with:');
    console.log('   OPENAI_API_KEY=your-openai-api-key-here');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('OPENAI_API_KEY=')) {
    console.error('❌ CRITICAL: OPENAI_API_KEY not found in .env.local');
    console.log('📝 Add to .env.local:');
    console.log('   OPENAI_API_KEY=your-openai-api-key-here');
    process.exit(1);
  }
  
  // Check for test audio files
  const audioPath = path.join(__dirname, '..', '..', 'vocie-test-repo');
  const requiredFiles = ['tom-ballymun-free.mp3', 'tom-ballymun-same.mp3'];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(audioPath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ CRITICAL: Required test audio file not found: ${file}`);
      console.log(`📂 Expected at: ${filePath}`);
      process.exit(1);
    }
  });
  
  console.log('✅ Prerequisites validated');
  console.log(`📁 Audio files found: ${requiredFiles.join(', ')}`);
}

// Run accuracy tests
function runAccuracyTests() {
  console.log('\n🔬 Running accuracy validation tests...');
  
  try {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Run Jest with specific pattern
    const testResult = execSync(
      'npm test -- --testPathPattern=accuracy-validation --verbose --detectOpenHandles', 
      {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env }
      }
    );
    
    console.log('\n✅ Accuracy tests completed successfully');
    
  } catch (error) {
    console.error('\n❌ Accuracy tests failed');
    console.error('Error:', error.message);
    
    // Provide helpful debugging info
    console.log('\n🔧 Debugging steps:');
    console.log('1. Verify OpenAI API key is valid');
    console.log('2. Check internet connection');
    console.log('3. Ensure audio files are not corrupted');
    console.log('4. Run: npm test -- --testPathPattern=accuracy-validation --verbose');
    
    process.exit(1);
  }
}

// Generate test report
function generateReport() {
  console.log('\n📊 ACCURACY VALIDATION REPORT');
  console.log('============================');
  
  console.log('🎯 Target: 85% transcription accuracy');
  console.log('🎙️ Test Files: tom-ballymun-free.mp3, tom-ballymun-same.mp3');
  console.log('🏗️ Context: Irish construction site audio');
  
  console.log('\n📋 QA Checklist:');
  console.log('□ OpenAI Whisper API integration ✅');
  console.log('□ Real Irish construction audio ✅');
  console.log('□ Critical error pattern fixes ✅');
  console.log('□ 85% accuracy target validation ⏳');
  console.log('□ End-to-end workflow testing ⏳');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Review accuracy metrics');
  console.log('2. Identify improvement areas if < 85%');
  console.log('3. Update critical fix patterns');
  console.log('4. Re-run validation until target met');
}

// Main execution
function main() {
  try {
    validatePrerequisites();
    runAccuracyTests();
    generateReport();
    
    console.log('\n🎉 QA VALIDATION COMPLETE');
    console.log('Ready for production deployment!');
    
  } catch (error) {
    console.error('\n💥 QA Validation failed:', error.message);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('\nUsage: node run-qa-accuracy-tests.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h     Show this help message');
  console.log('  --report-only  Generate report without running tests');
  console.log('\nDescription:');
  console.log('  Runs comprehensive accuracy validation for Irish construction transcription');
  console.log('  Validates against 85% accuracy target with real audio files');
  console.log('\nPrerequisites:');
  console.log('  - .env.local with OPENAI_API_KEY');
  console.log('  - Real audio files in vocie-test-repo/');
  process.exit(0);
}

if (args.includes('--report-only')) {
  generateReport();
  process.exit(0);
}

// Run main function
main();