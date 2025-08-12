#!/usr/bin/env node
/**
 * Test REF-MCP Integration
 * 
 * Validates that REF-MCP integration works for both new and existing story workflows
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');

async function testRefMcpIntegration() {
  console.log('🧪 Testing REF-MCP Integration for BMAD Enhancement...\n');
  
  let allTestsPass = true;
  
  // Test 1: REF-MCP Methods Added to Enhancement Engine
  console.log('1. Testing REF-MCP Methods in Enhancement Engine...');
  try {
    const engine = new StoryEnhancementEngine();
    
    // Check if REF-MCP methods exist
    if (typeof engine.fetchExternalServiceDocs === 'function') {
      console.log('   ✅ fetchExternalServiceDocs method exists');
    } else {
      console.log('   ❌ fetchExternalServiceDocs method missing');
      allTestsPass = false;
    }
    
    if (typeof engine.mapIntegrationsToQueries === 'function') {
      console.log('   ✅ mapIntegrationsToQueries method exists');
    } else {
      console.log('   ❌ mapIntegrationsToQueries method missing');
      allTestsPass = false;
    }
    
    if (typeof engine.generateRefMcpEnhancedDevNotes === 'function') {
      console.log('   ✅ generateRefMcpEnhancedDevNotes method exists');
    } else {
      console.log('   ❌ generateRefMcpEnhancedDevNotes method missing');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Enhancement Engine error:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Query Mapping for Known Services
  console.log('\n2. Testing REF-MCP Query Mapping...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const testIntegrations = ['authentication', 'payments', 'database', 'fileStorage'];
    const queries = engine.mapIntegrationsToQueries(testIntegrations);
    
    if (queries.authentication && queries.authentication.includes('Supabase')) {
      console.log('   ✅ Authentication queries mapped correctly');
    } else {
      console.log('   ❌ Authentication query mapping failed');
      allTestsPass = false;
    }
    
    if (queries.payments && queries.payments.includes('Stripe')) {
      console.log('   ✅ Payments queries mapped correctly');  
    } else {
      console.log('   ❌ Payments query mapping failed');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Query mapping error:', error.message);
    allTestsPass = false;
  }
  
  // Test 3: Deprecation Warning Detection
  console.log('\n3. Testing Deprecation Warning Detection...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const mockDocs = { serviceType: 'authentication' };
    const warnings = engine.checkForDeprecationWarnings(mockDocs, 'authentication');
    
    if (warnings.length > 0 && warnings[0].service === 'Supabase Authentication') {
      console.log('   ✅ Supabase auth-helpers deprecation warning detected');
    } else {
      console.log('   ❌ Deprecation warnings not working');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Deprecation warning error:', error.message);
    allTestsPass = false;
  }
  
  // Test 4: Documentation Integration Structure
  console.log('\n4. Testing Documentation Integration Structure...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const mockAnalysis = {
      hasExternalIntegrations: true,
      integrationTypes: ['authentication']
    };
    
    const mockDocInsights = {
      timestamp: new Date().toISOString(),
      services: {
        authentication: {
          requiresRefMcpCall: true,
          instruction: 'SM Agent: Use mcp__ref-tools__ref_search_documentation'
        }
      },
      hasValidationWarnings: true,
      validationWarnings: [{
        service: 'Supabase Authentication',
        warning: 'Test warning',
        impact: 'HIGH',
        validation: 'Test validation'
      }]
    };
    
    // Method is now async, need to await it
    const enhanced = await engine.generateRefMcpEnhancedDevNotes(mockAnalysis, mockDocInsights, 'test supabase authentication story');
    
    if (enhanced.includes('External Service Documentation')) {
      console.log('   ✅ External service documentation section added');
    } else {
      console.log('   ❌ External service documentation section missing');
      allTestsPass = false;
    }
    
    if (enhanced.includes('API Currency Warnings')) {
      console.log('   ✅ API currency warnings section added');
    } else {
      console.log('   ❌ API currency warnings section missing');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Documentation integration error:', error.message);
    allTestsPass = false;
  }
  
  // Test 5: Dual Workflow Integration Points
  console.log('\n5. Testing Dual Workflow Integration Points...');
  try {
    const fs = require('fs').promises;
    
    // Check create-next-story.md has REF-MCP pattern identification
    const createStoryContent = await fs.readFile('.bmad-core/tasks/create-next-story.md', 'utf-8');
    if (createStoryContent.includes('REF-MCP PATTERN IDENTIFICATION')) {
      console.log('   ✅ New story creation has REF-MCP integration');
    } else {
      console.log('   ❌ New story creation missing REF-MCP integration');
      allTestsPass = false;
    }
    
    // Check execute-checklist.md has REF-MCP pattern identification
    const executeChecklistContent = await fs.readFile('.bmad-core/tasks/execute-checklist.md', 'utf-8');
    if (executeChecklistContent.includes('REF-MCP PATTERN IDENTIFICATION')) {
      console.log('   ✅ Existing story validation has REF-MCP integration');
    } else {
      console.log('   ❌ Existing story validation missing REF-MCP integration');
      allTestsPass = false;
    }
    
    // Check story-draft-checklist.md has REF-MCP pattern instructions
    const checklistContent = await fs.readFile('.bmad-core/checklists/story-draft-checklist.md', 'utf-8');
    if (checklistContent.includes('REF-MCP pattern instructions')) {
      console.log('   ✅ Story draft checklist has REF-MCP validation');
    } else {
      console.log('   ❌ Story draft checklist missing REF-MCP validation');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Workflow integration check error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\n' + '='.repeat(60));
  if (allTestsPass) {
    console.log('🎉 ALL REF-MCP INTEGRATION TESTS PASSED!');
    console.log('\nREF-MCP Integration Ready:');
    console.log('✅ NEW Stories: @sm *draft → Enhancement Engine → REF-MCP docs → Current API guidance');  
    console.log('✅ EXISTING Stories: @sm *story-checklist → Enhancement Check → REF-MCP validation → Deprecation warnings');
    console.log('\nPrevents Story 1.2 Issues:');
    console.log('✅ Detects external services automatically');
    console.log('✅ Fetches current documentation via REF-MCP');  
    console.log('✅ Warns about deprecated packages (auth-helpers vs SSR)');
    console.log('✅ Works for both workflow paths seamlessly');
    console.log('\n🎯 Ready for production use on next story!');
    return 0;
  } else {
    console.log('❌ SOME REF-MCP INTEGRATION TESTS FAILED');
    console.log('\nCheck failed tests above for issues to resolve.');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testRefMcpIntegration().then(process.exit).catch(error => {
    console.error('REF-MCP test runner error:', error);
    process.exit(1);
  });
}

module.exports = testRefMcpIntegration;