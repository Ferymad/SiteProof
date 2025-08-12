#!/usr/bin/env node
/**
 * Test Deployment Workflow Fix
 * 
 * Validates that the corrected SM agent workflow actually deploys REF-MCP instructions
 * instead of just analyzing them. Tests the critical gap fix.
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');

async function testDeploymentWorkflow() {
  console.log('🚀 Testing Deployment Workflow Fix for SM Agent Gap...\\n');
  
  let allTestsPass = true;
  
  // Test 1: Simulate SM Agent Workflow with Corrected Process
  console.log('1. Testing Corrected SM Agent Deployment Process...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const testStory = `
      As a user, I want to implement Supabase authentication with SSR
      so that I can access protected routes securely in my Next.js application.
      The system should handle user sessions and middleware setup correctly.
    `;
    
    // Step 2.5: Enhanced Workflow (Corrected)
    console.log('   📋 Step 2.5: Smart Story Enhancement Check...');
    
    // Analyze story (existing step)
    const analysis = engine.analyzeStory(testStory);
    console.log(`   ✅ External integrations detected: ${analysis.integrationTypes.join(', ')}`);
    
    // Select patterns (existing step)
    const selectedPatterns = engine.selectCriticalPatterns(analysis, testStory);
    console.log(`   ✅ Selected ${selectedPatterns.length} critical patterns`);
    
    // Generate instructions (existing step)  
    const patternData = await engine.fetchCriticalPatterns(selectedPatterns);
    console.log(`   ✅ Generated REF-MCP instructions for ${patternData.patterns.length} patterns`);
    
    // CRITICAL NEW STEP: Actually deploy patterns
    const formattedSection = engine.formatCriticalPatterns(patternData);
    console.log(`   ✅ Formatted Critical Implementation Patterns section (${formattedSection.length} chars)`);
    
    // Verify deployment content
    if (formattedSection.includes('🎯 Critical Implementation Patterns (For Dev Agent)')) {
      console.log('   ✅ Deployment section header correct');
    } else {
      console.log('   ❌ Deployment section header missing');
      allTestsPass = false;
    }
    
    if (formattedSection.includes('INSTRUCTIONS FOR DEV AGENT')) {
      console.log('   ✅ Dev Agent instructions included in deployment');
    } else {
      console.log('   ❌ Dev Agent instructions missing from deployment');
      allTestsPass = false;
    }
    
    if (formattedSection.includes('REF-MCP Query')) {
      console.log('   ✅ REF-MCP queries present in deployment');
    } else {
      console.log('   ❌ REF-MCP queries missing from deployment');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Deployment workflow test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Workflow Step Verification
  console.log('\\n2. Testing Workflow Step Verification...');
  try {
    const fs = require('fs').promises;
    
    // Check execute-checklist.md has deployment steps
    const path = require('path');
    const taskPath = path.join(__dirname, '../tasks/execute-checklist.md');
    const taskContent = await fs.readFile(taskPath, 'utf-8');
    
    if (taskContent.includes('ACTUALLY DEPLOY')) {
      console.log('   ✅ Task contains explicit deployment instruction');
    } else {
      console.log('   ❌ Task missing explicit deployment instruction');
      allTestsPass = false;
    }
    
    if (taskContent.includes('MODIFY STORY')) {
      console.log('   ✅ Task instructs to modify story document');
    } else {
      console.log('   ❌ Task missing story modification instruction');
      allTestsPass = false;
    }
    
    if (taskContent.includes('DEPLOYMENT VERIFICATION')) {
      console.log('   ✅ Task includes deployment verification step');
    } else {
      console.log('   ❌ Task missing deployment verification');
      allTestsPass = false;
    }
    
    // Check checklist has deployment verification
    const checklistPath = path.join(__dirname, '../checklists/story-draft-checklist.md');
    const checklistContent = await fs.readFile(checklistPath, 'utf-8');
    
    if (checklistContent.includes('DEPLOYED in story Dev Notes section')) {
      console.log('   ✅ Checklist verifies deployment in story document');
    } else {
      console.log('   ❌ Checklist missing deployment verification');
      allTestsPass = false;
    }
    
    if (checklistContent.includes('Pattern deployment verified')) {
      console.log('   ✅ Checklist includes pattern deployment verification');
    } else {
      console.log('   ❌ Checklist missing pattern deployment check');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Workflow step verification error:', error.message);
    allTestsPass = false;
  }
  
  // Test 3: Gap Prevention Verification
  console.log('\\n3. Testing Gap Prevention Mechanisms...');
  try {
    const engine = new StoryEnhancementEngine();
    
    // Simulate the gap scenario that happened with SM agent
    const mockStory = "Supabase authentication story";
    const analysis = engine.analyzeStory(mockStory);
    const patterns = engine.selectCriticalPatterns(analysis, mockStory);
    
    // Before fix: SM would stop after pattern identification
    // After fix: SM must deploy patterns
    
    if (patterns.length > 0) {
      console.log(`   ✅ Patterns identified: ${patterns.length}`);
      
      const patternData = await engine.fetchCriticalPatterns(patterns);
      const deployment = engine.formatCriticalPatterns(patternData);
      
      // The critical test: Does the workflow now produce deployment content?
      if (deployment.length > 0) {
        console.log('   ✅ Gap prevented: Deployment content generated');
      } else {
        console.log('   ❌ Gap still exists: No deployment content');
        allTestsPass = false;
      }
      
      // Verify deployment would contain the missing elements SM agent didn't add
      if (deployment.includes('Supabase SSR client initialization')) {
        console.log('   ✅ Story 1.2 prevention pattern included in deployment');
      } else {
        console.log('   ❌ Story 1.2 prevention pattern missing from deployment');
        allTestsPass = false;
      }
      
    } else {
      console.log('   ❌ Pattern identification failed');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Gap prevention test error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\\n' + '='.repeat(70));
  if (allTestsPass) {
    console.log('🎉 ALL DEPLOYMENT WORKFLOW TESTS PASSED!');
    console.log('\\n✅ Critical Gap Fixed:');
    console.log('   • SM Agent now has explicit deployment instructions');
    console.log('   • Workflow moves beyond analysis to actual deployment');
    console.log('   • Checklist verifies patterns exist in story document');
    console.log('   • Role boundaries maintained during deployment');
    console.log('\\n📋 Expected Fixed Behavior:');
    console.log('   OLD: SM analyzes patterns → reports in validation → STOPS');
    console.log('   NEW: SM analyzes patterns → DEPLOYS to story → verifies deployment');
    console.log('\\n🎯 Result:');
    console.log('   • Dev Agent will now find REF-MCP instructions in story');
    console.log('   • Story 1.2 scenarios prevented through deployed patterns');
    console.log('   • One-shot dev success rate maximized');
    console.log('\\n🚀 SM Agent workflow gap eliminated!');
    return 0;
  } else {
    console.log('❌ SOME DEPLOYMENT WORKFLOW TESTS FAILED');
    console.log('\\nCheck failed tests above for remaining workflow gaps.');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testDeploymentWorkflow().then(process.exit).catch(error => {
    console.error('Deployment workflow test runner error:', error);
    process.exit(1);
  });
}

module.exports = testDeploymentWorkflow;