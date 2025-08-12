#!/usr/bin/env node
/**
 * Test Role-Separated Enhancement System
 * 
 * Validates that the corrected enhancement system respects BMAD role boundaries:
 * - SM Agent: Identifies patterns, provides instructions (NO CODE)
 * - Dev Agent: Fetches patterns, implements code (YES CODE)
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');

async function testRoleSeparatedEnhancement() {
  console.log('🎭 Testing Role-Separated Enhancement System...\n');
  
  let allTestsPass = true;
  
  // Test 1: SM Agent Role Compliance (Pattern Identification Only)
  console.log('1. Testing SM Agent Role Compliance...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const supabaseStory = `
      As a user, I want to implement Supabase authentication with SSR
      so that I can access protected routes securely in my Next.js app.
    `;
    
    const analysis = engine.analyzeStory(supabaseStory);
    const selectedPatterns = engine.selectCriticalPatterns(analysis, supabaseStory);
    const patternData = await engine.fetchCriticalPatterns(selectedPatterns);
    const formatted = engine.formatCriticalPatterns(patternData);
    
    // Verify SM agent gets instructions only, not code
    if (formatted.includes('INSTRUCTIONS FOR DEV AGENT')) {
      console.log('   ✅ SM provides instructions for Dev Agent (not code)');
    } else {
      console.log('   ❌ SM role violation: trying to provide code instead of instructions');
      allTestsPass = false;
    }
    
    if (formatted.includes('Role Separation: SM identifies patterns needed, Dev fetches and implements')) {
      console.log('   ✅ Role separation explicitly documented');
    } else {
      console.log('   ❌ Role separation not documented');
      allTestsPass = false;
    }
    
    // Verify no actual code snippets (which would violate SM role)
    if (!formatted.includes('```') && !formatted.includes('function') && !formatted.includes('import')) {
      console.log('   ✅ SM agent provides no code snippets (role compliant)');
    } else {
      console.log('   ❌ SM agent role violation: contains code snippets');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ SM role compliance test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 2: Dev Agent Instructions Quality
  console.log('\n2. Testing Dev Agent Instructions Quality...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const authStory = `
      As a user, I want to implement Supabase authentication with SSR client initialization
      and proper middleware setup so that I can access protected routes securely without
      infinite auth loops or circular dependency errors in my Next.js application.
    `;
    const analysis = engine.analyzeStory(authStory);
    const mockDocInsights = { 
      timestamp: new Date().toISOString(), 
      services: {}, 
      hasValidationWarnings: false 
    };
    
    const enhanced = await engine.generateRefMcpEnhancedDevNotes(analysis, mockDocInsights, authStory);
    
    // Verify Dev Agent gets actionable REF-MCP queries (check for markdown formatted version)
    if (enhanced.includes('**REF-MCP Query**:')) {
      console.log('   ✅ Dev Agent gets specific REF-MCP queries');
    } else {
      console.log('   ❌ Dev Agent missing REF-MCP queries');
      allTestsPass = false;
    }
    
    if (enhanced.includes('**DEV AGENT WORKFLOW**:')) {
      console.log('   ✅ Dev Agent gets clear workflow instructions');
    } else {
      console.log('   ❌ Dev Agent missing workflow instructions');
      allTestsPass = false;
    }
    
    if (enhanced.includes('mcp__ref-tools__ref_search_documentation')) {
      console.log('   ✅ Dev Agent gets correct REF-MCP tool instructions');
    } else {
      console.log('   ❌ Dev Agent missing REF-MCP tool instructions');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Dev Agent instructions test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 3: Prevention of Story 1.2 Issues (Without Role Violation)
  console.log('\n3. Testing Story 1.2 Issue Prevention...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const supabaseStory = `Implement Supabase authentication for user login`;
    const analysis = engine.analyzeStory(supabaseStory);
    const selectedPatterns = engine.selectCriticalPatterns(analysis, supabaseStory);
    
    // Check if Supabase SSR pattern is selected (prevents auth-helpers issue)
    const hasSSRPattern = selectedPatterns.some(p => 
      p.name.includes('SSR') && p.prevents.includes('auth-helpers')
    );
    
    if (hasSSRPattern) {
      console.log('   ✅ Story 1.2 issue prevention: SSR pattern identified');
    } else {
      console.log('   ❌ Story 1.2 issue not prevented: missing SSR pattern');
      allTestsPass = false;
    }
    
    // Check if middleware pattern is included (prevents circular dependency)
    const hasMiddlewarePattern = selectedPatterns.some(p => 
      p.name.includes('Middleware') && p.prevents.includes('Circular')
    );
    
    if (hasMiddlewarePattern) {
      console.log('   ✅ Middleware circular dependency prevention pattern identified');
    } else {
      console.log('   ❌ Missing middleware pattern for circular dependency prevention');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Story 1.2 prevention test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 4: Sweet Spot Maintenance (Role-Separated)
  console.log('\n4. Testing Sweet Spot Maintenance...');
  try {
    const engine = new StoryEnhancementEngine();
    
    const complexStory = `
      Implement Supabase authentication, Stripe payments, file storage, 
      and real-time subscriptions with proper error handling
    `;
    
    const analysis = engine.analyzeStory(complexStory);
    const selectedPatterns = engine.selectCriticalPatterns(analysis, complexStory);
    
    // Verify sweet spot limits are maintained
    const maxPatterns = 3;
    if (selectedPatterns.length <= maxPatterns) {
      console.log(`   ✅ Sweet spot maintained: ${selectedPatterns.length} <= ${maxPatterns} patterns`);
    } else {
      console.log(`   ❌ Sweet spot violated: ${selectedPatterns.length} > ${maxPatterns} patterns`);
      allTestsPass = false;
    }
    
    // Verify patterns are prioritized correctly  
    const priorities = selectedPatterns.map(p => p.priority || 999);
    const isSorted = priorities.every((val, i) => i === 0 || priorities[i-1] <= val);
    
    if (isSorted) {
      console.log('   ✅ Patterns prioritized correctly (highest priority first)');
    } else {
      console.log(`   ❌ Pattern prioritization incorrect: priorities ${priorities.join(', ')} not sorted`);
      console.log(`   DEBUG: Selected pattern priorities:`, selectedPatterns.map(p => ({name: p.name, priority: p.priority})));
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Sweet spot test error:', error.message);
    allTestsPass = false;
  }
  
  // Test 5: Role-Separated Workflow Integration
  console.log('\n5. Testing Role-Separated Workflow Integration...');
  try {
    const fs = require('fs').promises;
    
    // Check SM agent task updates
    const createStoryContent = await fs.readFile('.bmad-core/tasks/create-next-story.md', 'utf-8');
    if (createStoryContent.includes('ROLE SEPARATION') && createStoryContent.includes('SM identifies patterns')) {
      console.log('   ✅ Story creation task respects role separation');
    } else {
      console.log('   ❌ Story creation task missing role separation');
      allTestsPass = false;
    }
    
    // Check Dev agent configuration updates
    const devAgentContent = await fs.readFile('.bmad-core/agents/dev.md', 'utf-8');
    if (devAgentContent.includes('REF-MCP PATTERN FETCHING') && devAgentContent.includes('execute REF-MCP queries')) {
      console.log('   ✅ Dev agent configured for REF-MCP pattern fetching');
    } else {
      console.log('   ❌ Dev agent missing REF-MCP pattern fetching capability');
      allTestsPass = false;
    }
    
    // Check checklist updates
    const checklistContent = await fs.readFile('.bmad-core/checklists/story-draft-checklist.md', 'utf-8');
    if (checklistContent.includes('Role boundaries respected')) {
      console.log('   ✅ Story checklist validates role boundaries');
    } else {
      console.log('   ❌ Story checklist missing role boundary validation');
      allTestsPass = false;
    }
    
  } catch (error) {
    console.log('   ❌ Workflow integration test error:', error.message);
    allTestsPass = false;
  }
  
  // Final Results
  console.log('\n' + '='.repeat(70));
  if (allTestsPass) {
    console.log('🎉 ALL ROLE-SEPARATED ENHANCEMENT TESTS PASSED!');
    console.log('\n✅ Role Separation Working Correctly:');
    console.log('   • SM Agent: Identifies patterns, provides REF-MCP instructions (NO CODE)');
    console.log('   • Dev Agent: Executes REF-MCP, fetches patterns, implements (YES CODE)');
    console.log('   • Sweet spot maintained: Max 3 prioritized patterns');
    console.log('   • Story 1.2 issues prevented without role violations');
    console.log('   • BMAD principles preserved: clear agent boundaries');
    console.log('\n🎭 Expected Behavior:');
    console.log('   SM: "Dev Agent should use REF-MCP query: Supabase SSR client initialization"');
    console.log('   Dev: "Got it, fetching current Supabase SSR patterns and implementing..."');
    console.log('\n🎯 Result: One-shot dev success with proper role separation!');
    console.log('\n🚀 BMAD enhancement system now respects agent boundaries!');
    return 0;
  } else {
    console.log('❌ SOME ROLE-SEPARATED TESTS FAILED');
    console.log('\nCheck failed tests above for role boundary violations.');
    return 1;
  }
}

// Run tests if called directly
if (require.main === module) {
  testRoleSeparatedEnhancement().then(process.exit).catch(error => {
    console.error('Role-separated test runner error:', error);
    process.exit(1);
  });
}

module.exports = testRoleSeparatedEnhancement;