#!/usr/bin/env node
/**
 * Test Enhancement Integration
 * 
 * Simple test to verify BMAD enhancement integration works correctly
 * Tests the story enhancement engine and completeness gate
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');
const fs = require('fs').promises;
const path = require('path');

async function testEnhancementIntegration() {
  console.log('🧪 Testing BMAD Enhancement Integration...\n');
  
  let allTestsPass = true;
  
  // Test 1: Story Enhancement Engine
  console.log('1. Testing Story Enhancement Engine...');
  try {
    const engine = new StoryEnhancementEngine();
    
    // Test with authentication story
    const authStory = "As a user, I want to register with Supabase authentication so that I can access protected features";
    const analysis = engine.analyzeStory(authStory);
    
    if (analysis.hasExternalIntegrations && analysis.integrationTypes.includes('authentication')) {
      console.log('   ✅ Correctly detected authentication integration');
    } else {
      console.log('   ❌ Failed to detect authentication integration');
      allTestsPass = false;
    }
    
    if (analysis.suggestions.length > 0) {
      console.log('   ✅ Generated enhancement suggestions');
    } else {
      console.log('   ❌ No enhancement suggestions generated');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Story Enhancement Engine error:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Files Exist and Are Readable
  console.log('\n2. Testing Required Files...');
  const requiredFiles = [
    '.bmad-core/utils/story-enhancement-engine.js',
    '.bmad-core/data/integration-patterns.yaml',
    '.bmad-core/checklists/story-completeness-gate.md',
    'docs/decisions.md'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`   ✅ ${file} exists`);
    } catch (error) {
      console.log(`   ❌ ${file} missing or unreadable`);
      allTestsPass = false;
    }
  }
  
  // Test 3: BMAD Integration Points
  console.log('\n3. Testing BMAD Integration Points...');
  try {
    // Check if create-next-story.md has enhancement point
    const storyTaskContent = await fs.readFile('.bmad-core/tasks/create-next-story.md', 'utf-8');
    if (storyTaskContent.includes('Smart Story Enhancement')) {
      console.log('   ✅ Story creation task enhanced');
    } else {
      console.log('   ❌ Story creation task not enhanced');
      allTestsPass = false;
    }
    
    // Check if dev agent has completeness gate
    const devAgentContent = await fs.readFile('.bmad-core/agents/dev.md', 'utf-8');
    if (devAgentContent.includes('story-completeness-gate')) {
      console.log('   ✅ Dev agent has completeness gate');
    } else {
      console.log('   ❌ Dev agent missing completeness gate');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Error checking BMAD integration:', error.message);
    allTestsPass = false;
  }
  
  // Test 4: Simple Story Enhancement
  console.log('\n4. Testing Story Enhancement Generation...');
  try {
    const engine = new StoryEnhancementEngine();
    const testStory = "Implement user login with Auth0 and dashboard access";
    const analysis = engine.analyzeStory(testStory);
    const enhancement = engine.generateDevNotesEnhancement(analysis);
    
    if (enhancement.includes('Phased Implementation') && enhancement.includes('Authentication Completeness')) {
      console.log('   ✅ Generated appropriate enhancement content');
    } else {
      console.log('   ❌ Enhancement content incomplete');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Enhancement generation error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\n' + '='.repeat(50));
  if (allTestsPass) {
    console.log('🎉 ALL TESTS PASSED - Enhancement Integration Working!');
    console.log('\nNext Steps:');
    console.log('1. Test with SM agent: @sm *draft');
    console.log('2. Create a story with external services');
    console.log('3. Verify enhancement guidance appears');
    console.log('4. Test dev agent completion with completeness gate');
    return 0;
  } else {
    console.log('❌ SOME TESTS FAILED - Check Issues Above');
    console.log('\nTroubleshooting:');
    console.log('1. Verify all files were created correctly');
    console.log('2. Check file permissions');
    console.log('3. Review error messages above');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testEnhancementIntegration().then(process.exit).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = testEnhancementIntegration;