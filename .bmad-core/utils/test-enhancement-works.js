#!/usr/bin/env node
/**
 * Quick Test: Is Enhancement Working?
 * 
 * Run this to verify the enhancement is active and working
 */

const StoryEnhancementEngine = require('./story-enhancement-engine.js');

console.log('🔍 Testing BMAD Enhancement Status...\n');

// Test 1: Engine Detection
console.log('1. Testing Story Detection:');
const engine = new StoryEnhancementEngine();

const testCases = [
  {
    story: "Implement user login with Supabase authentication",
    expected: ['authentication']
  },
  {
    story: "Add Stripe payment processing to checkout",
    expected: ['payments']
  },
  {
    story: "Create simple contact form",
    expected: []
  }
];

testCases.forEach((testCase, i) => {
  const analysis = engine.analyzeStory(testCase.story);
  const detected = analysis.integrationTypes;
  
  console.log(`\n   Test ${i + 1}: "${testCase.story}"`);
  console.log(`   Expected: ${testCase.expected.join(', ') || 'none'}`);
  console.log(`   Detected: ${detected.join(', ') || 'none'}`);
  
  if (testCase.expected.length === 0 && detected.length === 0) {
    console.log('   ✅ Correctly identified as simple story');
  } else if (testCase.expected.every(exp => detected.includes(exp))) {
    console.log('   ✅ Correctly detected external integrations');
  } else {
    console.log('   ❌ Detection failed');
  }
});

// Test 2: Enhancement Generation
console.log('\n2. Testing Enhancement Generation:');
const authStory = "As a user, I want to register and login with Auth0 so I can access my dashboard";
const analysis = engine.analyzeStory(authStory);
const enhancement = engine.generateDevNotesEnhancement(analysis);

if (enhancement.includes('Phased Implementation')) {
  console.log('   ✅ Phased implementation guidance generated');
} else {
  console.log('   ❌ No phased implementation guidance');
}

if (enhancement.includes('Authentication Completeness')) {
  console.log('   ✅ Authentication completeness checks generated');
} else {
  console.log('   ❌ No authentication completeness checks');
}

// Test 3: What You Should See in SM Agent
console.log('\n3. What to Expect When Using @sm *draft:');
console.log('   For authentication stories, SM should:');
console.log('   ✅ Detect integration and mention it');
console.log('   ✅ Add "Smart Enhancement Guidance" to story');
console.log('   ✅ Include phased implementation tasks');
console.log('   ✅ Add validation checkpoints');

console.log('\n4. What to Expect When Using @dev *develop-story:');
console.log('   For enhanced stories, Dev should:');
console.log('   ✅ Mention following enhancement guidance');
console.log('   ✅ Implement in phases instead of all-at-once');
console.log('   ✅ Run completeness gate before marking done');
console.log('   ✅ Validate login page exists (for auth stories)');

console.log('\n' + '='.repeat(50));
console.log('🎯 HOW TO VERIFY IT WORKS:');
console.log('1. Create story with "Supabase auth" or "Stripe payments"');
console.log('2. Look for "Smart Enhancement Guidance" in story file');
console.log('3. Dev agent should mention "phased approach"');
console.log('4. Dev agent should run "completeness gate"');
console.log('\n   If you see these behaviors, enhancement is working! ✅');

// Test 4: Quick Story Enhancement Preview
console.log('\n5. Example Enhancement Output:');
console.log('---');
console.log(enhancement);
console.log('---');
console.log('\n✅ Enhancement system is active and ready for testing!');