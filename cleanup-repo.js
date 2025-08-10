#!/usr/bin/env node
/**
 * BMAD Repository Cleanup Script
 * Safely organizes loose files without damaging working functionality
 * 
 * Run: node cleanup-repo.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Create directory structure
function createCleanupStructure() {
  const dirs = [
    'scripts',
    'scripts/testing',
    'scripts/api-testing',
    'docs/emergency-fixes',
    'docs/development-notes'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${colors.green}✓${colors.reset} Created: ${dir}`);
    }
  });
}

// Files to move safely
const cleanupPlan = [
  // Test scripts -> scripts/testing/
  {
    from: 'bmad-web/test-api-endpoints.js',
    to: 'scripts/api-testing/test-api-endpoints.js',
    reason: 'API testing script'
  },
  {
    from: 'bmad-web/test-api-simple.sh',
    to: 'scripts/api-testing/test-api-simple.sh',
    reason: 'API testing script (bash)'
  },
  
  // GPT-5 test files -> scripts/testing/
  {
    from: 'bmad-web/test-gpt5-endpoint.js',
    to: 'scripts/testing/test-gpt5-endpoint.js',
    reason: 'GPT-5 endpoint testing'
  },
  {
    from: 'bmad-web/test-gpt5-extraction-fix.js',
    to: 'scripts/testing/test-gpt5-extraction-fix.js',
    reason: 'GPT-5 extraction testing'
  },
  {
    from: 'bmad-web/test-gpt5-ui-display.js',
    to: 'scripts/testing/test-gpt5-ui-display.js',
    reason: 'GPT-5 UI testing'
  },
  {
    from: 'bmad-web/test-speech-engines.js',
    to: 'scripts/testing/test-speech-engines.js',
    reason: 'Speech engine comparison testing'
  },
  {
    from: 'bmad-web/test-schema-fix.js',
    to: 'scripts/testing/test-schema-fix.js',
    reason: 'Database schema testing'
  },
  {
    from: 'bmad-web/test-security-guard.js',
    to: 'scripts/testing/test-security-guard.js',
    reason: 'Security testing'
  },

  // Emergency documentation -> docs/emergency-fixes/
  {
    from: 'bmad-web/EMERGENCY-OPENAI-FIX-SUMMARY.md',
    to: 'docs/emergency-fixes/EMERGENCY-OPENAI-FIX-SUMMARY.md',
    reason: 'Emergency fix documentation'
  }
];

// Move file safely
function moveFile(fileInfo) {
  const sourcePath = path.join(__dirname, fileInfo.from);
  const destPath = path.join(__dirname, fileInfo.to);

  if (!fs.existsSync(sourcePath)) {
    console.log(`${colors.yellow}⚠${colors.reset}  Not found: ${fileInfo.from}`);
    return false;
  }

  try {
    // Create destination directory if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Move file (rename)
    fs.renameSync(sourcePath, destPath);
    console.log(`${colors.blue}→${colors.reset} Moved: ${fileInfo.from}`);
    console.log(`  ${colors.green}✓${colors.reset} To: ${fileInfo.to}`);
    console.log(`  Reason: ${fileInfo.reason}\n`);
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error moving ${fileInfo.from}: ${error.message}`);
    return false;
  }
}

// Create README files for organized directories
function createReadmeFiles() {
  // API Testing README
  const apiTestingReadme = `# API Testing Scripts

## Contents
- \`test-api-endpoints.js\` - Comprehensive API endpoint testing
- \`test-api-simple.sh\` - Simple bash API tests

## Usage
\`\`\`bash
# From project root
node scripts/api-testing/test-api-endpoints.js

# Or bash version
bash scripts/api-testing/test-api-simple.sh
\`\`\`

## Note
These scripts test the various API endpoints to determine which ones are working.
`;

  // Testing README
  const testingReadme = `# Development Testing Scripts

## Contents
- GPT-5 related tests
- Speech engine comparison tests
- Security and schema tests

## Purpose
These are development and debugging scripts created during Story 1A.2 iterations.
Preserved for reference but not part of main application.

## Usage
Run from project root with proper environment variables set.
`;

  // Emergency Fixes README
  const emergencyReadme = `# Emergency Fixes Documentation

## Contents
Documentation of emergency fixes applied during development.

## Purpose
Historical record of critical issues and their resolutions.
Useful for understanding past problems and solutions.
`;

  fs.writeFileSync('scripts/api-testing/README.md', apiTestingReadme);
  fs.writeFileSync('scripts/testing/README.md', testingReadme);
  fs.writeFileSync('docs/emergency-fixes/README.md', emergencyReadme);

  console.log(`${colors.green}✓${colors.reset} Created README files for organized directories`);
}

// Main cleanup function
async function cleanupRepository() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}BMAD Repository Cleanup${colors.reset}`);
  console.log('='.repeat(60));
  console.log('\nSafely organizing loose files without damaging functionality...\n');

  // Create directory structure
  createCleanupStructure();

  // Move files
  let movedCount = 0;
  let skippedCount = 0;

  console.log('\n' + '-'.repeat(60));
  console.log('Moving Files:');
  console.log('-'.repeat(60));

  for (const fileInfo of cleanupPlan) {
    if (moveFile(fileInfo)) {
      movedCount++;
    } else {
      skippedCount++;
    }
  }

  // Create README files
  createReadmeFiles();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`${colors.green}✓ Moved:${colors.reset} ${movedCount} files`);
  console.log(`${colors.yellow}⚠ Skipped:${colors.reset} ${skippedCount} files (not found)`);

  console.log('\n' + colors.blue + 'NEW STRUCTURE:' + colors.reset);
  console.log('scripts/');
  console.log('  ├── api-testing/     (API test scripts)');
  console.log('  └── testing/         (Development test scripts)');
  console.log('docs/');
  console.log('  └── emergency-fixes/ (Emergency documentation)');

  console.log('\n' + colors.green + 'PRESERVED FUNCTIONALITY:' + colors.reset);
  console.log('✅ All API endpoints untouched');
  console.log('✅ All components untouched');  
  console.log('✅ All working services untouched');
  console.log('✅ Package.json untouched');
  console.log('✅ Next.js config untouched');

  console.log('\n' + colors.yellow + 'NEXT STEPS:' + colors.reset);
  console.log('1. Verify application still runs: npm run dev');
  console.log('2. Test working features (ValidationTool, etc.)');
  console.log('3. Begin Story 1A.3 implementation');
}

// Run cleanup
cleanupRepository().catch(console.error);