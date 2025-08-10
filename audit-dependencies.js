#!/usr/bin/env node
/**
 * BMAD Dependencies Audit Script
 * Checks for missing dependencies and suggests additions
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

// Check if package.json exists and read it
function readPackageJson() {
  const packagePath = path.join(__dirname, 'bmad-web', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log(`${colors.red}❌ package.json not found at: ${packagePath}${colors.reset}`);
    return null;
  }

  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    return JSON.parse(packageContent);
  } catch (error) {
    console.log(`${colors.red}❌ Error reading package.json: ${error.message}${colors.reset}`);
    return null;
  }
}

// Scan code files for import statements
function scanForImports() {
  const imports = new Set();
  const requires = new Set();
  
  function scanDirectory(dir, basePath = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath, `${basePath}/${item}`);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
        scanFile(fullPath);
      }
    }
  }
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find import statements
      const importMatches = content.match(/import.*from ['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const packageMatch = match.match(/from ['"]([^'"]+)['"]/);
          if (packageMatch && packageMatch[1]) {
            const packageName = packageMatch[1];
            // Only capture external packages (not relative imports)
            if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
              const basePackage = packageName.split('/')[0];
              imports.add(basePackage);
            }
          }
        });
      }
      
      // Find require statements
      const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
      if (requireMatches) {
        requireMatches.forEach(match => {
          const packageMatch = match.match(/require\(['"]([^'"]+)['"]\)/);
          if (packageMatch && packageMatch[1]) {
            const packageName = packageMatch[1];
            if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
              const basePackage = packageName.split('/')[0];
              requires.add(basePackage);
            }
          }
        });
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  scanDirectory(path.join(__dirname, 'bmad-web'));
  
  return { imports: Array.from(imports), requires: Array.from(requires) };
}

// Known dependencies that might be missing based on typical Next.js + BMAD setup
const suggestedDependencies = {
  // File upload handling
  'formidable': '^3.5.1',
  'multiparty': '^4.2.3',
  
  // Audio processing
  'node-wav': '^0.0.2',
  'audio-buffer-utils': '^5.1.2',
  
  // Utility libraries
  'uuid': '^9.0.0',
  'lodash': '^4.17.21',
  'date-fns': '^2.30.0',
  
  // Better error handling
  'joi': '^17.9.0',
  'yup': '^1.2.0'
};

const suggestedDevDependencies = {
  // Additional testing
  'supertest': '^6.3.0',
  'msw': '^1.2.0',
  
  // TypeScript helpers
  '@types/formidable': '^3.4.0',
  '@types/uuid': '^9.0.0',
  '@types/lodash': '^4.14.0'
};

// Main audit function
function auditDependencies() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}BMAD Dependencies Audit${colors.reset}`);
  console.log('='.repeat(60));

  // Read current package.json
  const packageJson = readPackageJson();
  if (!packageJson) return;

  console.log(`${colors.green}✅ Found package.json${colors.reset}\n`);

  // Scan for imports
  console.log('📁 Scanning code for import/require statements...');
  const { imports, requires } = scanForImports();
  
  console.log(`Found ${imports.length} import packages and ${requires.length} require packages\n`);

  // Current dependencies
  const currentDeps = Object.keys(packageJson.dependencies || {});
  const currentDevDeps = Object.keys(packageJson.devDependencies || {});
  const allCurrentDeps = [...currentDeps, ...currentDevDeps];

  console.log('📦 Current Dependencies:');
  console.log('-'.repeat(30));
  console.log(`Production: ${currentDeps.length} packages`);
  console.log(`Development: ${currentDevDeps.length} packages`);
  console.log(`Total: ${allCurrentDeps.length} packages\n`);

  // Find used but missing dependencies
  const allUsedPackages = [...new Set([...imports, ...requires])];
  const missingDeps = allUsedPackages.filter(pkg => 
    !allCurrentDeps.includes(pkg) && 
    !['react', 'next', 'typescript'].includes(pkg) // Built-in packages
  );

  if (missingDeps.length > 0) {
    console.log(`${colors.red}⚠️  Potentially Missing Dependencies:${colors.reset}`);
    missingDeps.forEach(dep => {
      console.log(`   • ${dep} (used in code but not in package.json)`);
    });
    console.log('');
  }

  // Suggest dependencies based on BMAD functionality
  console.log(`${colors.yellow}💡 Suggested Dependencies for BMAD:${colors.reset}`);
  console.log('For file upload handling:');
  Object.entries(suggestedDependencies).forEach(([pkg, version]) => {
    const status = allCurrentDeps.includes(pkg) ? 
      `${colors.green}✅ installed${colors.reset}` : 
      `${colors.yellow}📦 suggested${colors.reset}`;
    console.log(`   • ${pkg}@${version} - ${status}`);
  });

  console.log('\nFor development:');
  Object.entries(suggestedDevDependencies).forEach(([pkg, version]) => {
    const status = allCurrentDeps.includes(pkg) ? 
      `${colors.green}✅ installed${colors.reset}` : 
      `${colors.yellow}📦 suggested${colors.reset}`;
    console.log(`   • ${pkg}@${version} - ${status}`);
  });

  // Generate install commands
  const missingProd = Object.keys(suggestedDependencies).filter(pkg => 
    !allCurrentDeps.includes(pkg)
  );
  const missingDev = Object.keys(suggestedDevDependencies).filter(pkg => 
    !allCurrentDeps.includes(pkg)
  );

  if (missingProd.length > 0 || missingDev.length > 0) {
    console.log('\n' + colors.blue + 'INSTALLATION COMMANDS:' + colors.reset);
    
    if (missingProd.length > 0) {
      console.log('\nProduction dependencies:');
      console.log(`npm install ${missingProd.join(' ')}`);
    }
    
    if (missingDev.length > 0) {
      console.log('\nDevelopment dependencies:');
      console.log(`npm install -D ${missingDev.join(' ')}`);
    }
  }

  // Check for potential issues
  console.log('\n' + colors.yellow + 'POTENTIAL ISSUES:' + colors.reset);
  
  // Check for formidable specifically (needed for file uploads)
  if (!allCurrentDeps.includes('formidable') && !allCurrentDeps.includes('multiparty')) {
    console.log('⚠️  No file upload library detected - needed for audio upload');
  }
  
  // Check for TypeScript support
  if (fs.existsSync(path.join(__dirname, 'bmad-web', 'tsconfig.json')) && 
      !allCurrentDeps.includes('typescript')) {
    console.log('⚠️  TypeScript config found but typescript not in dependencies');
  }

  console.log('\n' + colors.green + 'RECOMMENDATIONS:' + colors.reset);
  console.log('1. Install formidable for file upload handling');
  console.log('2. Add @types packages for better TypeScript support');
  console.log('3. Consider uuid for generating unique IDs');
  console.log('4. Review and remove unused dependencies periodically');

  return {
    current: allCurrentDeps,
    missing: missingDeps,
    suggested: { ...suggestedDependencies, ...suggestedDevDependencies }
  };
}

// Run audit
if (require.main === module) {
  auditDependencies();
}

module.exports = { auditDependencies };