#!/usr/bin/env node
/**
 * Archive Old Code Script
 * Safely moves deprecated Story 1A.2 code to archive folder
 * Run: node archive-old-code.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Create archive directory structure
function createArchiveStructure() {
  const archiveBase = path.join(__dirname, 'archive', 'pre-mvp-story-1a2');
  const dirs = [
    archiveBase,
    path.join(archiveBase, 'services'),
    path.join(archiveBase, 'api'),
    path.join(archiveBase, 'components'),
    path.join(archiveBase, 'stories'),
    path.join(archiveBase, 'tests')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${colors.green}✓${colors.reset} Created: ${dir}`);
    }
  });

  return archiveBase;
}

// Files to archive based on Sprint Change Proposal
const filesToArchive = [
  // Broken/Complex Services
  {
    from: 'bmad-web/lib/services/advanced-processor.service.ts',
    to: 'services/advanced-processor.service.ts',
    reason: 'GPT-5 complex processing - replaced by simple transcription'
  },
  {
    from: 'bmad-web/lib/services/transcription-fixer.ts',
    to: 'services/transcription-fixer.ts',
    reason: 'Pattern matching layer - integrated into smart suggestions'
  },
  {
    from: 'bmad-web/lib/services/context-analyzer.service.ts',
    to: 'services/context-analyzer.service.ts',
    reason: 'Context detection - simplified in new approach'
  },

  // Broken API Endpoints
  {
    from: 'bmad-web/pages/api/processing/context-aware.ts',
    to: 'api/context-aware.ts',
    reason: 'Broken endpoint - 400 errors'
  },
  {
    from: 'bmad-web/pages/api/processing/transcribe.ts',
    to: 'api/transcribe.ts',
    reason: 'Broken endpoint - replaced with new /api/transcribe'
  },

  // Duplicate/Unused Components
  {
    from: 'bmad-web/components/SmartSuggestionReview.tsx',
    to: 'components/SmartSuggestionReview.tsx',
    reason: 'Duplicate of ValidationTool functionality'
  },
  {
    from: 'bmad-web/components/ProcessingStatus.tsx',
    to: 'components/ProcessingStatus.tsx',
    reason: 'Over-engineered status tracking'
  },

  // Old Story Documentation (keep for reference)
  {
    from: 'docs/stories/1A.2.ai-processing-pipeline/story-1a23-gpt-5-context-aware-processing-engine-completed.md',
    to: 'stories/story-1a23-gpt5-context.md',
    reason: 'GPT-5 implementation story'
  },
  {
    from: 'docs/stories/1A.2.ai-processing-pipeline/story-1a27-fix-gpt-5-results-display-api-parameters-drafted.md',
    to: 'stories/story-1a27-gpt5-fixes.md',
    reason: 'GPT-5 fix attempts'
  },
  {
    from: 'docs/stories/1A.2.ai-processing-pipeline/story-1a28-fix-critical-gpt-5-system-failures-drafted.md',
    to: 'stories/story-1a28-gpt5-failures.md',
    reason: 'GPT-5 critical failures'
  },

  // Test files for deprecated features
  {
    from: 'bmad-web/__tests__/context-aware-processing.test.ts',
    to: 'tests/context-aware-processing.test.ts',
    reason: 'Tests for GPT-5 context processing'
  },
  {
    from: 'bmad-web/__tests__/api/smart-suggestions.test.ts',
    to: 'tests/smart-suggestions.test.ts',
    reason: 'Duplicate smart suggestions tests'
  }
];

// Archive a single file
function archiveFile(fileInfo, archiveBase) {
  const sourcePath = path.join(__dirname, fileInfo.from);
  const destPath = path.join(archiveBase, fileInfo.to);

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

    // Copy file (safer than move for first run)
    fs.copyFileSync(sourcePath, destPath);
    console.log(`${colors.blue}→${colors.reset} Archived: ${fileInfo.from}`);
    console.log(`  ${colors.green}✓${colors.reset} To: archive/pre-mvp-story-1a2/${fileInfo.to}`);
    console.log(`  Reason: ${fileInfo.reason}`);
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error archiving ${fileInfo.from}: ${error.message}`);
    return false;
  }
}

// Create README for archive
function createArchiveReadme(archiveBase) {
  const readme = `# Archive: Pre-MVP Story 1A.2 Code

## Date Archived
${new Date().toISOString()}

## Reason
Story 1A.2 (AI Processing Pipeline) became overly complex with 11+ sub-stories.
This code is archived as part of the Clean MVP pivot (Story 1A.3).

## Contents

### Services
- advanced-processor.service.ts - GPT-5 complex processing
- transcription-fixer.ts - Pattern matching layer  
- context-analyzer.service.ts - Context detection

### API Endpoints
- context-aware.ts - Broken GPT-5 context endpoint
- transcribe.ts - Original transcribe endpoint

### Components
- SmartSuggestionReview.tsx - Duplicate validation UI
- ProcessingStatus.tsx - Over-engineered status

### Stories
- Various Story 1A.2.x documentation

## Status
These files are preserved for reference but should NOT be used in production.
The Clean MVP (Story 1A.3) replaces this functionality with simpler architecture.

## To Restore
If any of this code is needed, copy from archive back to original location.
However, the Clean MVP approach is recommended over restoring this complexity.
`;

  fs.writeFileSync(path.join(archiveBase, 'README.md'), readme);
  console.log(`\n${colors.green}✓${colors.reset} Created archive README`);
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}BMAD Code Archiving Tool${colors.reset}`);
  console.log('='.repeat(60));
  console.log('\nThis will archive deprecated Story 1A.2 code.');
  console.log('Files will be COPIED (not moved) for safety.\n');

  // Create archive structure
  const archiveBase = createArchiveStructure();

  // Archive each file
  let successCount = 0;
  let skipCount = 0;

  console.log('\n' + '-'.repeat(60));
  console.log('Archiving Files:');
  console.log('-'.repeat(60));

  for (const fileInfo of filesToArchive) {
    if (archiveFile(fileInfo, archiveBase)) {
      successCount++;
    } else {
      skipCount++;
    }
    console.log('');
  }

  // Create README
  createArchiveReadme(archiveBase);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('ARCHIVE COMPLETE');
  console.log('='.repeat(60));
  console.log(`${colors.green}✓ Archived:${colors.reset} ${successCount} files`);
  console.log(`${colors.yellow}⚠ Skipped:${colors.reset} ${skipCount} files (not found)`);
  console.log(`${colors.blue}📁 Location:${colors.reset} /archive/pre-mvp-story-1a2/`);

  console.log('\n' + colors.yellow + 'NEXT STEPS:' + colors.reset);
  console.log('1. Review archived files in /archive/pre-mvp-story-1a2/');
  console.log('2. Once verified, you can DELETE the original files');
  console.log('3. Start fresh with Story 1A.3 implementation');
  console.log('\nTo delete originals after verification:');
  console.log('   node archive-old-code.js --delete-originals');
}

// Check for delete flag
if (process.argv.includes('--delete-originals')) {
  console.log('\n' + colors.red + 'DELETE MODE: This would delete original files.' + colors.reset);
  console.log('Not implemented for safety. Manually delete after reviewing archive.');
} else {
  main().catch(console.error);
}