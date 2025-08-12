/**
 * Brutal QA Enhancement Final Test Suite
 * Validates core QA pattern functionality with proper async handling
 */

const StoryEnhancementEngine = require('../utils/story-enhancement-engine');
const fs = require('fs');
const path = require('path');

// Test Suite: Brutal QA Enhancement
console.log('BRUTAL QA ENHANCEMENT FINAL TEST SUITE');
console.log('============================================');

const engine = new StoryEnhancementEngine();

// Test Data
const testStoryAuth = `
As a user, I want to register my company and create secure user accounts with Supabase authentication,
so that my team's evidence data is properly protected and organized by company.

The system should support user login, registration, session management, and role-based access.
`;

const testStorySimple = `
As a user, I want to view a dashboard showing basic statistics,
so that I can see an overview of my data.

The dashboard should display charts and summary information.
`;

let totalTests = 0;
let passedTests = 0;
let completedTests = 0;

// Test Helper for sync tests
function testSync(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result === true) {
      console.log(`PASS ${name}`);
      passedTests++;
    } else {
      console.log(`FAIL ${name} - ${result}`);
    }
  } catch (error) {
    console.log(`ERROR ${name} - ${error.message}`);
  }
  completedTests++;
  checkCompletion();
}

// Test Helper for async tests
function testAsync(name, testFn) {
  totalTests++;
  testFn()
    .then(result => {
      if (result === true) {
        console.log(`PASS ${name}`);
        passedTests++;
      } else {
        console.log(`FAIL ${name} - ${result}`);
      }
    })
    .catch(error => {
      console.log(`ERROR ${name} - ${error.message}`);
    })
    .finally(() => {
      completedTests++;
      checkCompletion();
    });
}

// Check if all tests completed
function checkCompletion() {
  if (completedTests === totalTests) {
    setTimeout(() => {
      console.log('\\n============================================');
      console.log(`BRUTAL QA ENHANCEMENT TEST RESULTS`);
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${totalTests - passedTests}`);
      
      if (passedTests === totalTests) {
        console.log('\\nALL BRUTAL QA ENHANCEMENT TESTS PASSED!');
        console.log('\\nEnhancement System Validation:');
        console.log('- QA Pattern Selection Working');
        console.log('- Playwright MCP Integration Ready');
        console.log('- Role Boundary Preservation Verified');
        console.log('- Story 1.2 Prevention Validation Active');
        console.log('- Sweet Spot Limits Maintained');
        console.log('- Integration with REF-MCP System Confirmed');
      } else {
        console.log(`\\n${totalTests - passedTests} tests failed. Please review implementation.`);
      }
    }, 100);
  }
}

// TEST 1: QA Pattern Selection for Authentication Stories
testSync('QA Pattern Selection - Authentication Story', () => {
  const analysis = engine.analyzeStory(testStoryAuth);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, testStoryAuth);
  
  if (qaPatterns.length === 0) return 'No QA patterns selected for auth story';
  
  const authPattern = qaPatterns.find(p => p.name.includes('Authentication'));
  if (!authPattern) return 'No authentication QA pattern found';
  
  if (!authPattern.playwright_required) return 'Authentication pattern should require Playwright';
  
  if (authPattern.scenarios.length < 2) return 'Should have multiple auth test scenarios';
  
  return true;
});

// TEST 2: QA Pattern Selection - Simple Story (No Patterns)
testSync('QA Pattern Selection - Simple Story (No External Services)', () => {
  const analysis = engine.analyzeStory(testStorySimple);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, testStorySimple);
  
  if (qaPatterns.length > 0) return 'Simple story should not generate QA patterns';
  
  return true;
});

// TEST 3: QA Testing Requirements Formatting
testSync('QA Testing Requirements Formatting', () => {
  const analysis = engine.analyzeStory(testStoryAuth);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, testStoryAuth);
  const formatted = engine.formatQATestingRequirements(qaPatterns);
  
  if (!formatted.includes('Critical QA Testing Requirements')) return 'Missing QA requirements header';
  if (!formatted.includes('INSTRUCTIONS FOR QA AGENT')) return 'Missing QA agent instructions';
  if (!formatted.includes('Playwright MCP')) return 'Missing Playwright MCP reference';
  if (!formatted.includes('Role Separation')) return 'Missing role separation note';
  
  return true;
});

// TEST 4: Sweet Spot Maintenance (Max 3 QA Patterns)
testSync('Sweet Spot Maintenance - QA Pattern Limit', () => {
  // Create complex story with multiple services
  const complexStory = `
  As a user, I want to authenticate with Supabase, process payments with Stripe, 
  upload files to storage, and manage data in MongoDB, so that I have a complete platform.
  `;
  
  const analysis = engine.analyzeStory(complexStory);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, complexStory);
  
  if (qaPatterns.length > 3) return `Too many QA patterns: ${qaPatterns.length} (should be max 3)`;
  
  return true;
});

// TEST 5: Integration with REF-MCP System (ASYNC)
testAsync('Integration with REF-MCP System - Atomic Deployment', async () => {
  try {
    const analysis = engine.analyzeStory(testStoryAuth);
    const docInsights = { timestamp: new Date().toISOString(), services: {}, hasValidationWarnings: false };
    
    const sections = await engine.generateBrutalEnhancementSections(analysis, docInsights, testStoryAuth);
    
    if (!sections.devNotes) return 'Missing devNotes section';
    if (!sections.qaRequirements) return 'Missing qaRequirements section';
    if (!sections.deploymentData) return 'Missing deploymentData';
    
    if (!sections.deploymentData.hasRefMcpPatterns) return 'Should detect REF-MCP patterns needed';
    if (!sections.deploymentData.hasQAPatterns) return 'Should detect QA patterns needed';
    if (!sections.deploymentData.requiresPlaywrightTesting) return 'Should require Playwright testing';
    
    return true;
  } catch (error) {
    return `Error: ${error.message}`;
  }
});

// TEST 6: Configuration Loading
testSync('Configuration Loading - QA Agent Enhancement', () => {
  const qaAgentPath = path.join(__dirname, '../agents/qa.md');
  if (!fs.existsSync(qaAgentPath)) return 'QA agent config file missing';
  
  const qaConfig = fs.readFileSync(qaAgentPath, 'utf-8');
  
  if (!qaConfig.includes('BRUTAL_QA_ENHANCED')) return 'Missing BRUTAL_QA_ENHANCED workflow version marker';
  if (!qaConfig.includes('Playwright MCP')) return 'Missing Playwright MCP integration';
  if (!qaConfig.includes('brutal-test')) return 'Missing brutal-test command';
  
  return true;
});

// TEST 7: Story 1.2 Prevention Validation
testSync('Story 1.2 Prevention Validation', () => {
  const analysis = engine.analyzeStory(testStoryAuth);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, testStoryAuth);
  
  const authPattern = qaPatterns.find(p => p.name.includes('Authentication'));
  if (!authPattern) return 'No authentication pattern for Story 1.2 prevention';
  
  if (!authPattern.prevents.includes('Story 1.2')) {
    return 'Authentication pattern should prevent Story 1.2 scenarios';
  }
  
  const loginScenario = authPattern.scenarios.find(s => s.expected.includes('NO infinite loops'));
  if (!loginScenario) return 'Should explicitly test for no infinite loops';
  
  return true;
});

// TEST 8: Role Boundary Preservation
testSync('Role Boundary Preservation', () => {
  const analysis = engine.analyzeStory(testStoryAuth);
  const qaPatterns = engine.selectCriticalQAPatterns(analysis, testStoryAuth);
  const formatted = engine.formatQATestingRequirements(qaPatterns);
  
  // QA Agent should execute tests, not implement code
  if (formatted.includes('implement') || formatted.includes('code')) {
    return 'QA requirements should not include implementation instructions';
  }
  
  // Should include proper role separation
  if (!formatted.includes('SM deploys requirements, QA executes brutal testing')) {
    return 'Missing role separation documentation';
  }
  
  return true;
});

module.exports = { passedTests, totalTests };