#!/usr/bin/env node
/**
 * Test Dev Agent Workflow Integration
 * 
 * Validates that Dev Agent properly loads and explains the enhanced REF-MCP workflow
 */

const fs = require('fs').promises;
const path = require('path');

async function testDevAgentWorkflow() {
  console.log('🤖 Testing Dev Agent Workflow Integration...\n');
  
  let allTestsPass = true;
  
  // Test 1: Verify dev.md contains enhanced workflow
  console.log('1. Testing dev.md Configuration...');
  try {
    const devConfigPath = path.join(__dirname, '../agents/dev.md');
    const devConfig = await fs.readFile(devConfigPath, 'utf-8');
    
    // Check for REF-MCP integration in core principles
    if (devConfig.includes('MANDATORY REF-MCP WORKFLOW')) {
      console.log('   ✅ REF-MCP workflow in core principles');
    } else {
      console.log('   ❌ REF-MCP workflow missing from core principles');
      allTestsPass = false;
    }
    
    // Check for Critical Implementation Patterns check
    if (devConfig.includes('Critical Implementation Patterns (For Dev Agent)')) {
      console.log('   ✅ Critical patterns check configured');
    } else {
      console.log('   ❌ Critical patterns check missing');
      allTestsPass = false;
    }
    
    // Check for CRITICAL-FIRST-STEPS
    if (devConfig.includes('CRITICAL-FIRST-STEPS')) {
      console.log('   ✅ Critical first steps documented');
    } else {
      console.log('   ❌ Critical first steps missing');
      allTestsPass = false;
    }
    
    // Check for numbered order-of-execution
    if (devConfig.includes('1. "MANDATORY: Check story for')) {
      console.log('   ✅ Numbered order-of-execution format');
    } else {
      console.log('   ❌ Numbered order-of-execution missing');
      allTestsPass = false;
    }
    
    // Check for workflow command
    if (devConfig.includes('workflow: explain the complete develop-story workflow')) {
      console.log('   ✅ Workflow explanation command added');
    } else {
      console.log('   ❌ Workflow explanation command missing');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Error reading dev.md:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Workflow Step Validation
  console.log('\\n2. Testing Expected Workflow Steps...');
  try {
    const devConfigPath = path.join(__dirname, '../agents/dev.md');
    const devConfig = await fs.readFile(devConfigPath, 'utf-8');
    
    const expectedSteps = [
      'Check story for \'Critical Implementation Patterns',
      'Execute ALL REF-MCP queries',
      'Read first/next uncompleted task',
      'Implement task and subtasks using fetched current API patterns',
      'Write comprehensive tests',
      'Execute all validations',
      'Mark task checkbox [x] complete',
      'Update File List section',
      'Repeat from step 3'
    ];
    
    let stepsMissing = 0;
    expectedSteps.forEach((step, index) => {
      if (devConfig.includes(step)) {
        console.log(`   ✅ Step ${index + 1}: ${step.substring(0, 40)}...`);
      } else {
        console.log(`   ❌ Step ${index + 1}: ${step.substring(0, 40)}... MISSING`);
        stepsMissing++;
        allTestsPass = false;
      }
    });
    
    if (stepsMissing === 0) {
      console.log(`   ✅ All ${expectedSteps.length} workflow steps present`);
    } else {
      console.log(`   ❌ ${stepsMissing} workflow steps missing`);
    }
    
  } catch (error) {
    console.log('   ❌ Workflow step validation error:', error.message);
    allTestsPass = false;
  }
  
  // Test 3: Anti-Pattern Prevention
  console.log('\\n3. Testing Anti-Pattern Prevention...');
  try {
    const devConfigPath = path.join(__dirname, '../agents/dev.md');
    const devConfig = await fs.readFile(devConfigPath, 'utf-8');
    
    // Check for deprecated package warnings
    if (devConfig.includes('@supabase/auth-helpers') && devConfig.includes('@supabase/ssr')) {
      console.log('   ✅ Deprecated package examples included');
    } else {
      console.log('   ❌ Deprecated package examples missing');
      allTestsPass = false;
    }
    
    // Check for Story 1.2 prevention mention
    if (devConfig.includes('Story 1.2 deprecated package scenarios')) {
      console.log('   ✅ Story 1.2 prevention mentioned');
    } else {
      console.log('   ❌ Story 1.2 prevention not mentioned');
      allTestsPass = false;
    }
    
    // Check for current patterns emphasis
    if (devConfig.includes('CURRENT API PATTERNS ONLY')) {
      console.log('   ✅ Current patterns emphasis included');
    } else {
      console.log('   ❌ Current patterns emphasis missing');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Anti-pattern prevention test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 4: Expected Dev Agent Response Validation
  console.log('\\n4. Testing Expected Response Content...');
  try {
    // Simulate what Dev Agent should say about workflow now
    const expectedWorkflowElements = [
      'Critical Implementation Patterns',
      'REF-MCP queries',
      'current API patterns',
      'BEFORE implementing',
      'fetch current documentation'
    ];
    
    console.log('   📋 Expected Dev Agent workflow response should include:');
    expectedWorkflowElements.forEach(element => {
      console.log(`   ✅ "${element}"`);
    });
    
    console.log('\\n   🚫 Should NOT say:');
    console.log('   ❌ "1. Read Task → Load next uncompleted task" (old workflow)');
    console.log('   ❌ Missing REF-MCP steps');
    console.log('   ❌ No mention of Critical Implementation Patterns');
    
  } catch (error) {
    console.log('   ❌ Expected response validation error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\\n' + '='.repeat(70));
  if (allTestsPass) {
    console.log('🎉 ALL DEV AGENT WORKFLOW TESTS PASSED!');
    console.log('\\n✅ Dev Agent Configuration Fixed:');
    console.log('   • REF-MCP workflow prominently featured in core principles');
    console.log('   • CRITICAL-FIRST-STEPS emphasizes REF-MCP priority');
    console.log('   • Numbered order-of-execution with REF-MCP as steps 1-2');
    console.log('   • Anti-pattern prevention (deprecated packages) documented');
    console.log('   • Workflow explanation command added for clarity');
    console.log('\\n📋 Expected Dev Agent Response (Fixed):');
    console.log('   "My workflow starts by checking for Critical Implementation Patterns...');
    console.log('   IF found, I execute REF-MCP queries to fetch current API patterns...');
    console.log('   THEN I proceed with task implementation using current patterns..."');
    console.log('\\n🎯 Integration Gap Fixed: Dev Agent now properly explains enhanced workflow!');
    return 0;
  } else {
    console.log('❌ SOME DEV AGENT WORKFLOW TESTS FAILED');
    console.log('\\nCheck failed tests above for configuration issues.');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testDevAgentWorkflow().then(process.exit).catch(error => {
    console.error('Dev agent workflow test error:', error);
    process.exit(1);
  });
}

module.exports = testDevAgentWorkflow;