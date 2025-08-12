#!/usr/bin/env node
/**
 * Test Critical Pattern Integration
 * 
 * Validates that critical pattern extraction works to maximize dev agent one-shot success
 * Tests the sweet spot balance and REF-MCP integration for code snippets
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');

async function testCriticalPatterns() {
  console.log('🎯 Testing Critical Pattern Integration for Dev Agent One-Shot Success...\n');
  
  let allTestsPass = true;
  
  // Test 1: Critical Pattern Library Loading
  console.log('1. Testing Critical Pattern Library Loading...');
  try {
    const engine = new StoryEnhancementEngine();
    
    if (engine.criticalPatterns) {
      console.log('   ✅ Critical patterns library loaded');
      
      if (engine.criticalPatterns.authentication) {
        console.log('   ✅ Authentication patterns available');
      } else {
        console.log('   ❌ Authentication patterns missing');
        allTestsPass = false;
      }
      
      if (engine.criticalPatterns.payments) {
        console.log('   ✅ Payment patterns available');
      } else {
        console.log('   ❌ Payment patterns missing');
        allTestsPass = false;
      }
      
    } else {
      console.log('   ❌ Critical patterns library failed to load');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Pattern library loading error:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Pattern Selection Logic (Sweet Spot Test)
  console.log('\n2. Testing Pattern Selection Logic (Sweet Spot)...');
  try {
    const engine = new StoryEnhancementEngine();
    
    // Test Supabase authentication story
    const supabaseStory = `
      As a user, I want to register and login with Supabase authentication
      so that I can access my dashboard securely. The system should handle 
      user sessions, middleware setup, and protected routes.
    `;
    
    const analysis = engine.analyzeStory(supabaseStory);
    const selectedPatterns = engine.selectCriticalPatterns(analysis, supabaseStory);
    
    if (selectedPatterns.length > 0) {
      console.log(`   ✅ Selected ${selectedPatterns.length} patterns for Supabase auth story`);
    } else {
      console.log('   ❌ No patterns selected for Supabase auth story');
      allTestsPass = false;
    }
    
    // Verify sweet spot limits
    const maxPatterns = engine.criticalPatterns?.selection_rules?.limits?.max_patterns_per_story || 3;
    if (selectedPatterns.length <= maxPatterns) {
      console.log('   ✅ Sweet spot maintained: patterns within limit');
    } else {
      console.log(`   ❌ Sweet spot violated: ${selectedPatterns.length} > ${maxPatterns} patterns`);
      allTestsPass = false;
    }
    
    // Verify patterns are relevant
    const hasAuthPattern = selectedPatterns.some(p => p.serviceType === 'authentication');
    if (hasAuthPattern) {
      console.log('   ✅ Patterns contextually relevant to story requirements');
    } else {
      console.log('   ❌ Patterns not contextually relevant');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Pattern selection error:', error.message);
    allTestsPass = false;
  }
  
  // Test 3: REF-MCP Instruction Generation
  console.log('\n3. Testing REF-MCP Instruction Generation...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const mockPatterns = [{
      name: "SSR Client Initialization",
      priority: 1,
      prevents: "Infinite auth loops",
      ref_mcp_query: "Supabase SSR client initialization createClient",
      serviceType: "authentication",
      serviceName: "supabase"
    }];
    
    const patternData = await engine.fetchCriticalPatterns(mockPatterns);
    
    if (patternData.requiresRefMcpExecution) {
      console.log('   ✅ REF-MCP execution flagged for pattern fetching');
    } else {
      console.log('   ❌ REF-MCP execution not flagged');
      allTestsPass = false;
    }
    
    if (patternData.patterns.length > 0 && patternData.patterns[0].refMcpInstruction) {
      console.log('   ✅ REF-MCP instructions generated for SM agent');
    } else {
      console.log('   ❌ REF-MCP instructions not generated');
      allTestsPass = false;
    }
    
    // Verify instruction format
    const instruction = patternData.patterns[0].refMcpInstruction;
    if (instruction.includes('mcp__ref-tools__ref_search_documentation')) {
      console.log('   ✅ REF-MCP instruction format correct');
    } else {
      console.log('   ❌ REF-MCP instruction format incorrect');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ REF-MCP instruction generation error:', error.message);
    allTestsPass = false;
  }
  
  // Test 4: Critical Pattern Formatting
  console.log('\n4. Testing Critical Pattern Formatting for Dev Agent...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const mockPatternData = {
      timestamp: new Date().toISOString(),
      patterns: [{
        name: "SSR Client Initialization",
        prevents: "Infinite auth loops from deprecated auth-helpers",
        serviceName: "supabase",
        refMcpInstruction: "SM Agent: Use mcp__ref-tools__ref_search_documentation"
      }],
      requiresRefMcpExecution: true
    };
    
    const formatted = engine.formatCriticalPatterns(mockPatternData);
    
    if (formatted.includes('Critical Implementation Patterns')) {
      console.log('   ✅ Critical patterns section header created');
    } else {
      console.log('   ❌ Critical patterns section header missing');
      allTestsPass = false;
    }
    
    if (formatted.includes('Maximize One-Shot Success')) {
      console.log('   ✅ One-shot success messaging included');
    } else {
      console.log('   ❌ One-shot success messaging missing');
      allTestsPass = false;
    }
    
    if (formatted.includes('Why Critical') && formatted.includes('REF-MCP Query')) {
      console.log('   ✅ Pattern details formatted for dev agent consumption');
    } else {
      console.log('   ❌ Pattern details formatting incomplete');
      console.log('   DEBUG: Looking for "Why Critical" and "REF-MCP Query"');
      console.log('   DEBUG: Contains Why Critical:', formatted.includes('Why Critical'));
      console.log('   DEBUG: Contains REF-MCP Query:', formatted.includes('REF-MCP Query'));
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Pattern formatting error:', error.message);
    allTestsPass = false;
  }
  
  // Test 5: End-to-End Integration Test
  console.log('\n5. Testing End-to-End Pattern Enhancement...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const testStory = `
      As a user, I want to implement Stripe payment processing with webhook handling
      so that I can securely process payments and handle subscription events.
    `;
    
    const analysis = engine.analyzeStory(testStory);
    const mockDocInsights = { timestamp: new Date().toISOString(), services: {}, hasValidationWarnings: false };
    
    const enhanced = await engine.generateRefMcpEnhancedDevNotes(analysis, mockDocInsights, testStory);
    
    if (enhanced.includes('Critical Implementation Patterns')) {
      console.log('   ✅ End-to-end enhancement includes critical patterns');
    } else {
      console.log('   ❌ End-to-end enhancement missing critical patterns');
      allTestsPass = false;
    }
    
    if (enhanced.includes('Stripe')) {
      console.log('   ✅ Service-specific patterns detected and included');
    } else {
      console.log('   ❌ Service-specific patterns not detected');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ End-to-end integration error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\n' + '='.repeat(70));
  if (allTestsPass) {
    console.log('🎉 ALL CRITICAL PATTERN TESTS PASSED!');
    console.log('\n✅ Critical Pattern Integration Ready:');
    console.log('   • Sweet spot maintained: Max 3 patterns per story');
    console.log('   • Context-aware pattern selection based on story requirements');
    console.log('   • REF-MCP integration for fetching current code snippets');
    console.log('   • Formatted for maximum dev agent one-shot success');
    console.log('   • Prevents common failure modes (Story 1.2 issues)');
    console.log('\n🎯 Expected SM Agent Behavior:');
    console.log('   User: @sm *story-checklist supabase-auth-story');
    console.log('   SM: 🔍 Detected Supabase auth - selecting critical patterns...');
    console.log('   SM: 📋 Found 2 critical patterns: SSR Client + Middleware Setup');
    console.log('   SM: 📥 Fetching current code snippets via REF-MCP...');
    console.log('   SM: ✅ Story enhanced with patterns that maximize dev success!');
    console.log('\n🚀 Ready to maximize dev agent one-shot success!');
    return 0;
  } else {
    console.log('❌ SOME CRITICAL PATTERN TESTS FAILED');
    console.log('\nCheck failed tests above for issues to resolve.');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testCriticalPatterns().then(process.exit).catch(error => {
    console.error('Critical pattern test runner error:', error);
    process.exit(1);
  });
}

module.exports = testCriticalPatterns;