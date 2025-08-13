/**
 * Story Enhancement Engine
 * 
 * BMAD Method Enhancement - Detects story complexity and suggests improvements
 * Integrates seamlessly with existing BMAD workflow without breaking changes
 * 
 * Usage: Called automatically during story creation to add smart guidance
 * REF-MCP Integration: Fetches up-to-date external service documentation
 */

class StoryEnhancementEngine {
  constructor() {
    this.integrationPatterns = {
      // Common external service patterns
      authentication: ['auth', 'login', 'register', 'supabase', 'auth0', 'clerk'],
      payments: ['stripe', 'payment', 'checkout', 'billing', 'paypal'],
      database: ['prisma', 'mongodb', 'postgres', 'mysql', 'supabase'],
      apis: ['api', 'rest', 'graphql', 'fetch', 'axios'],
      fileStorage: ['upload', 'storage', 's3', 'cloudinary', 'supabase']
    };
    
    // Load critical patterns library for code snippet extraction
    this.criticalPatterns = null;
    this.loadCriticalPatterns();
  }

  /**
   * Load critical patterns library for REF-MCP code snippet extraction
   * @private
   */
  loadCriticalPatterns() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const patternsPath = path.join(__dirname, '../data/critical-patterns.yaml');
      
      // Check if file exists before attempting to read
      if (!fs.existsSync(patternsPath)) {
        this.criticalPatterns = null;
        return;
      }
      
      const patternsContent = fs.readFileSync(patternsPath, 'utf-8');
      
      // Simple YAML parsing fallback for critical patterns
      this.criticalPatterns = this.parseSimpleYaml(patternsContent);
    } catch (error) {
      // Graceful degradation - enhancement works without critical patterns
      this.criticalPatterns = null;
      console.warn('Critical patterns library not available:', error.message);
    }
  }
  
  /**
   * Simple YAML parser for critical patterns (fallback)
   * @private
   */
  parseSimpleYaml(content) {
    // For now, return a simplified structure that works without yaml dependency
    // This is a fallback - in production, SM agent would have yaml parsing capability
    return {
      authentication: {
        supabase: {
          patterns: [
            {
              name: "SSR Client Initialization",
              priority: 1,
              prevents: "Infinite auth loops from deprecated auth-helpers",
              ref_mcp_query: "Supabase SSR client initialization createClient @supabase/ssr middleware",
              context: "initialization"
            },
            {
              name: "Middleware Setup", 
              priority: 2,
              prevents: "Circular dependency errors in Next.js middleware",
              ref_mcp_query: "Supabase middleware Next.js authentication updateSession",
              context: "middleware"
            }
          ]
        }
      },
      payments: {
        stripe: {
          patterns: [
            {
              name: "Client-side Payment Intent",
              priority: 1,
              prevents: "Payment processing failures and security issues",
              ref_mcp_query: "Stripe payment intent client side Next.js",
              context: "payment_processing"
            }
          ]
        }
      },
      selection_rules: {
        limits: {
          max_patterns_per_story: 3,
          max_lines_per_pattern: 15,
          max_total_code_lines: 45
        }
      }
    };
  }

  /**
   * Analyze story content and suggest enhancements
   * @param {string} storyContent - The story requirements text
   * @returns {object} Enhancement suggestions
   */
  analyzeStory(storyContent) {
    const analysis = {
      hasExternalIntegrations: false,
      integrationTypes: [],
      complexity: 'simple',
      suggestions: []
    };

    const content = storyContent.toLowerCase();

    // Detect integration patterns
    for (const [type, patterns] of Object.entries(this.integrationPatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        analysis.hasExternalIntegrations = true;
        analysis.integrationTypes.push(type);
      }
    }

    // Determine complexity
    if (analysis.integrationTypes.length >= 2) {
      analysis.complexity = 'high';
    } else if (analysis.integrationTypes.length === 1) {
      analysis.complexity = 'medium';
    }

    // Generate suggestions based on analysis
    analysis.suggestions = this.generateSuggestions(analysis);

    return analysis;
  }

  /**
   * Generate specific suggestions based on story analysis
   * @param {object} analysis - Story analysis results
   * @returns {array} Array of suggestion objects
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    if (analysis.hasExternalIntegrations) {
      suggestions.push({
        type: 'PHASED_IMPLEMENTATION',
        title: 'Use Phased Implementation Approach',
        description: 'Break implementation into phases: Connect → Test → Build',
        tasks: [
          'Phase 1: Set up and verify external service connection',
          'Phase 2: Test basic operations (CRUD, auth flow, etc.)',
          'Phase 3: Build complete feature with error handling'
        ]
      });

      suggestions.push({
        type: 'INTEGRATION_CHECKPOINTS',
        title: 'Add Integration Validation Checkpoints',
        description: 'Validate each integration point before proceeding',
        checkpoints: [
          'Verify package installation and imports work',
          'Test basic service connection/authentication',
          'Validate data flow between services',
          'Confirm error handling works correctly'
        ]
      });
    }

    if (analysis.integrationTypes.includes('authentication')) {
      suggestions.push({
        type: 'AUTH_COMPLETENESS',
        title: 'Ensure Authentication Completeness',
        description: 'Verify complete authentication user journey',
        requirements: [
          'Login page exists and accessible',
          'Registration flow works end-to-end',
          'Protected routes actually protect content',
          'Logout functionality works correctly',
          'Session persistence across browser refresh'
        ]
      });
    }

    if (analysis.complexity === 'high') {
      suggestions.push({
        type: 'INCREMENTAL_VALIDATION',
        title: 'Use Incremental Validation',
        description: 'Validate functionality at each step instead of all at end',
        approach: 'Test each component individually, then integration, then full workflow'
      });
    }

    return suggestions;
  }

  /**
   * Generate enhanced Dev Notes section content
   * @param {object} analysis - Story analysis results
   * @returns {string} Formatted Dev Notes enhancement
   */
  generateDevNotesEnhancement(analysis) {
    if (!analysis.hasExternalIntegrations) {
      return ''; // No enhancement needed for simple stories
    }

    let enhancement = `\n### Smart Enhancement Guidance\n`;
    enhancement += `**Integration Complexity**: ${(analysis.complexity || 'medium').toUpperCase()}\n`;
    enhancement += `**Integration Types**: ${analysis.integrationTypes.join(', ')}\n\n`;

    (analysis.suggestions || []).forEach(suggestion => {
      enhancement += `#### ${suggestion.title}\n`;
      enhancement += `${suggestion.description}\n\n`;

      if (suggestion.tasks) {
        enhancement += `**Recommended Tasks:**\n`;
        suggestion.tasks.forEach(task => {
          enhancement += `- ${task}\n`;
        });
        enhancement += '\n';
      }

      if (suggestion.checkpoints) {
        enhancement += `**Validation Checkpoints:**\n`;
        suggestion.checkpoints.forEach(checkpoint => {
          enhancement += `- [ ] ${checkpoint}\n`;
        });
        enhancement += '\n';
      }

      if (suggestion.requirements) {
        enhancement += `**Requirements Validation:**\n`;
        suggestion.requirements.forEach(req => {
          enhancement += `- [ ] ${req}\n`;
        });
        enhancement += '\n';
      }
    });

    return enhancement;
  }

  /**
   * Generate enhanced task list with phased approach
   * @param {array} originalTasks - Original task list from epic
   * @param {object} analysis - Story analysis results
   * @returns {array} Enhanced task list
   */
  generateEnhancedTasks(originalTasks, analysis) {
    if (!analysis.hasExternalIntegrations) {
      return originalTasks; // Return original tasks for simple stories
    }

    const enhancedTasks = [];

    // Add phased implementation structure
    if (analysis.suggestions.some(s => s.type === 'PHASED_IMPLEMENTATION')) {
      enhancedTasks.push({
        title: 'Phase 1: Connection Setup',
        subtasks: [
          'Install and configure required packages',
          'Set up environment variables and configuration',
          'Verify basic imports and initialization work',
          'Create minimal connection test'
        ]
      });

      enhancedTasks.push({
        title: 'Phase 2: Integration Testing',
        subtasks: [
          'Test basic operations with external service',
          'Verify error handling for service failures',
          'Test authentication/authorization if applicable',
          'Validate data format and structure'
        ]
      });

      enhancedTasks.push({
        title: 'Phase 3: Full Implementation',
        subtasks: [
          'Implement complete feature functionality',
          'Add comprehensive error handling',
          'Create user interface components',
          'Add integration and end-to-end tests'
        ]
      });
    }

    // Add original tasks with validation checkpoints
    originalTasks.forEach(task => {
      enhancedTasks.push({
        ...task,
        validationRequired: true
      });
    });

    return enhancedTasks;
  }

  /**
   * Generate completion checklist based on story analysis
   * @param {object} analysis - Story analysis results
   * @returns {array} Completion checklist items
   */
  generateCompletionChecklist(analysis) {
    const checklist = [];

    // Standard completion items
    checklist.push('All tasks completed and marked done');
    checklist.push('Unit tests written and passing');
    checklist.push('Code builds successfully without errors');

    // Integration-specific items
    if (analysis.hasExternalIntegrations) {
      checklist.push('External service connections tested and working');
      checklist.push('Error handling tested for service failures');
      checklist.push('Integration points validated end-to-end');
    }

    // Authentication-specific items
    if (analysis.integrationTypes.includes('authentication')) {
      checklist.push('Login page exists and works correctly');
      checklist.push('User registration flow tested end-to-end');
      checklist.push('Protected routes actually protect content');
      checklist.push('Authentication state persists correctly');
    }

    // UI-specific items (if story mentions UI components)
    if (analysis.hasUIComponents) {
      checklist.push('All required pages/screens implemented');
      checklist.push('Navigation between pages works correctly');
      checklist.push('User journey tested end-to-end');
    }

    return checklist;
  }

  /**
   * Fetch up-to-date documentation for detected external services
   * Uses REF-MCP tools when available to prevent deprecated package usage
   * @param {object} analysis - Story analysis results
   * @returns {object} Documentation insights with current API guidance
   */
  async fetchExternalServiceDocs(analysis) {
    const docInsights = {
      timestamp: new Date().toISOString(),
      services: {},
      hasValidationWarnings: false,
      validationWarnings: []
    };

    if (!analysis.hasExternalIntegrations) {
      return docInsights;
    }

    // Map detected integrations to documentation searches
    const serviceQueries = this.mapIntegrationsToQueries(analysis.integrationTypes);
    
    for (const [serviceType, query] of Object.entries(serviceQueries)) {
      try {
        // Use REF-MCP to search for current documentation
        const docs = await this.searchServiceDocumentation(query, serviceType);
        docInsights.services[serviceType] = docs;
        
        // Check for known deprecation patterns
        const warnings = this.checkForDeprecationWarnings(docs, serviceType);
        if (warnings.length > 0) {
          docInsights.hasValidationWarnings = true;
          docInsights.validationWarnings.push(...warnings);
        }
        
      } catch (error) {
        // Graceful degradation - note what needs manual verification
        docInsights.services[serviceType] = {
          status: 'ref_mcp_unavailable',
          message: 'Unable to fetch current documentation - developer should verify API currency',
          manualVerificationRequired: true
        };
      }
    }

    return docInsights;
  }

  /**
   * Map detected integration types to REF-MCP search queries
   * @private
   */
  mapIntegrationsToQueries(integrationTypes) {
    const queries = {};
    
    if (integrationTypes.includes('authentication')) {
      queries.authentication = 'Supabase authentication SSR latest packages migration auth-helpers';
    }
    
    if (integrationTypes.includes('payments')) {
      queries.payments = 'Stripe payments integration latest API version Node.js';
    }
    
    if (integrationTypes.includes('database')) {
      queries.database = 'Supabase database client latest SDK migration patterns';
    }
    
    if (integrationTypes.includes('fileStorage')) {
      queries.fileStorage = 'Supabase storage upload latest API file management';
    }

    return queries;
  }

  /**
   * Search external service documentation using REF-MCP
   * @private
   */
  async searchServiceDocumentation(query, serviceType) {
    // This method will be called by SM agent with actual REF-MCP tools
    // For now, return structure that SM can populate
    return {
      query: query,
      serviceType: serviceType,
      requiresRefMcpCall: true,
      instruction: `SM Agent: Use mcp__ref-tools__ref_search_documentation with query: "${query}"`
    };
  }

  /**
   * Check for known deprecation patterns in documentation
   * @private
   */
  checkForDeprecationWarnings(docs, serviceType) {
    const warnings = [];
    
    if (serviceType === 'authentication') {
      // Check for Supabase auth-helpers deprecation (Story 1.2 issue)
      warnings.push({
        service: 'Supabase Authentication',
        warning: 'Verify using @supabase/ssr instead of deprecated @supabase/auth-helpers-nextjs',
        impact: 'HIGH - Deprecated package causes infinite authentication loops',
        validation: 'Check package.json and imports for auth-helpers usage'
      });
    }
    
    return warnings;
  }

  /**
   * Select critical implementation patterns based on story analysis
   * @param {object} analysis - Story analysis results
   * @param {string} storyContent - Original story content for context matching
   * @returns {array} Selected critical patterns for REF-MCP extraction
   */
  selectCriticalPatterns(analysis, storyContent) {
    if (!this.criticalPatterns || !analysis.hasExternalIntegrations) {
      return [];
    }

    const selectedPatterns = [];
    const storyLower = storyContent.toLowerCase();
    
    // Match story content to relevant patterns based on selection rules
    const rules = this.criticalPatterns.selection_rules?.context_matching || [];
    
    for (const integrationType of analysis.integrationTypes) {
      const servicePatterns = this.criticalPatterns[integrationType];
      if (!servicePatterns) continue;
      
      // Detect specific service (e.g., supabase, stripe, auth0)
      let detectedService = null;
      for (const service in servicePatterns) {
        if (storyLower.includes(service)) {
          detectedService = service;
          break;
        }
      }
      
      // Default to first available service if none specifically mentioned
      if (!detectedService) {
        detectedService = Object.keys(servicePatterns)[0];
      }
      
      const patterns = servicePatterns[detectedService]?.patterns || [];
      
      // Sort patterns by priority and add by priority, respecting limits
      const sortedPatterns = [...patterns].sort((a, b) => (a.priority || 999) - (b.priority || 999));
      
      for (const pattern of sortedPatterns) {
        if (selectedPatterns.length >= (this.criticalPatterns.selection_rules?.limits?.max_patterns_per_story || 3)) {
          break;
        }
        
        selectedPatterns.push({
          ...pattern,
          serviceType: integrationType,
          serviceName: detectedService
        });
      }
    }
    
    // Sort all selected patterns by priority across all services
    selectedPatterns.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    return selectedPatterns;
  }

  /**
   * Fetch critical code patterns using REF-MCP
   * @param {array} selectedPatterns - Patterns to fetch
   * @returns {object} Pattern extraction instructions for SM agent
   */
  async fetchCriticalPatterns(selectedPatterns) {
    const patternData = {
      timestamp: new Date().toISOString(),
      patterns: [],
      requiresRefMcpExecution: selectedPatterns.length > 0
    };
    
    if (selectedPatterns.length === 0) {
      return patternData;
    }
    
    // Generate REF-MCP instructions for SM agent to execute
    selectedPatterns.forEach(pattern => {
      patternData.patterns.push({
        name: pattern.name,
        priority: pattern.priority,
        prevents: pattern.prevents,
        context: pattern.context,
        serviceType: pattern.serviceType,
        serviceName: pattern.serviceName,
        ref_mcp_query: pattern.ref_mcp_query,
        refMcpInstruction: `SM Agent: Use mcp__ref-tools__ref_search_documentation with query: "${pattern.ref_mcp_query}"`
      });
    });
    
    return patternData;
  }

  /**
   * Format critical patterns for Dev Notes inclusion (Role-Separated)
   * SM Agent provides instructions, Dev Agent executes during implementation
   * @param {object} patternData - Pattern instruction data
   * @returns {string} Formatted critical patterns section for dev agent use
   */
  formatCriticalPatterns(patternData) {
    if (!patternData.requiresRefMcpExecution || patternData.patterns.length === 0) {
      return '';
    }
    
    let section = `\n### 🎯 Critical Implementation Patterns (For Dev Agent)\n`;
    section += `*Maximize One-Shot Success | Prevents common failure modes*\n\n`;
    section += `**INSTRUCTIONS FOR DEV AGENT**: Before implementing external service integration, fetch current patterns using REF-MCP queries below:\n\n`;
    
    patternData.patterns.forEach((pattern, index) => {
      section += `#### ${index + 1}. ${pattern.name} (${pattern.serviceName.toUpperCase()})\n`;
      section += `**Why Critical**: ${pattern.prevents}\n`;
      section += `**REF-MCP Query**: \`${pattern.ref_mcp_query}\`\n`;
      section += `**Implementation Context**: ${pattern.context}\n\n`;
    });
    
    section += `**DEV AGENT WORKFLOW**:\n`;
    section += `1. Use mcp__ref-tools__ref_search_documentation with each query above\n`;
    section += `2. Extract current code patterns from official documentation\n`;
    section += `3. Implement using fetched patterns to prevent failure modes\n`;
    section += `4. Validate implementation matches current best practices\n\n`;
    
    section += `*Role Separation: SM identifies patterns needed, Dev fetches and implements*\n`;
    
    return section;
  }

  /**
   * Generate REF-MCP enhanced Dev Notes section
   * @param {object} analysis - Story analysis results
   * @param {object} docInsights - Documentation fetching results
   * @param {string} storyContent - Original story content for pattern matching
   * @returns {string} Enhanced Dev Notes with current API guidance and critical patterns
   */
  async generateRefMcpEnhancedDevNotes(analysis, docInsights, storyContent = '') {
    let enhancement = this.generateDevNotesEnhancement(analysis);
    
    // Add critical implementation patterns for dev agent success
    if (storyContent) {
      const selectedPatterns = this.selectCriticalPatterns(analysis, storyContent);
      const patternData = await this.fetchCriticalPatterns(selectedPatterns);
      const patternsSection = this.formatCriticalPatterns(patternData);
      enhancement += patternsSection;
    }
    
    if (docInsights.timestamp) {
      enhancement += `\n\n### External Service Documentation (Verified ${docInsights.timestamp.split('T')[0]})\n`;
      
      Object.entries(docInsights.services).forEach(([serviceType, docs]) => {
        if (docs && docs.requiresRefMcpCall) {
          enhancement += `\n**${serviceType.toUpperCase()}**: ${docs.instruction}\n`;
        } else if (docs) {
          enhancement += `\n**${serviceType.toUpperCase()}**: Documentation current as of verification\n`;
        }
      });
    }
    
    if (docInsights.hasValidationWarnings && docInsights.validationWarnings) {
      enhancement += `\n### ⚠️ API Currency Warnings\n`;
      docInsights.validationWarnings.forEach(warning => {
        if (warning && warning.service) {
          enhancement += `- **${warning.service}**: ${warning.warning}\n`;
          enhancement += `  - Impact: ${warning.impact}\n`;
          enhancement += `  - Validation: ${warning.validation}\n\n`;
        }
      });
    }
    
    return enhancement;
  }

  /**
   * Select critical QA testing patterns based on story analysis
   * @param {object} analysis - Story analysis results  
   * @param {string} storyContent - Original story content for context matching
   * @returns {array} Selected critical QA patterns (max 3 per story)
   */
  selectCriticalQAPatterns(analysis, storyContent) {
    if (!analysis.hasExternalIntegrations) {
      return [];
    }

    const selectedPatterns = [];
    const storyLower = storyContent.toLowerCase();
    
    // Authentication Testing Patterns
    if (analysis.integrationTypes.includes('authentication')) {
      selectedPatterns.push({
        name: 'Authentication Flow Validation',
        priority: 1,
        type: 'RUNTIME_VALIDATION',
        critical: true,
        prevents: 'Infinite auth loops, session failures (Story 1.2 scenarios)',
        playwright_required: true,
        scenarios: [
          {
            name: 'Login Success Path',
            steps: 'Navigate to /login → Enter valid credentials → Submit form',
            expected: 'Redirect to dashboard/home page (NO infinite loops)',
            validates: 'SSR authentication system working correctly'
          },
          {
            name: 'Session Persistence',
            steps: 'Login → Close browser → Reopen → Visit protected page',
            expected: 'Still authenticated, no redirect to login',
            validates: 'Server-side session handling correct'
          },
          {
            name: 'Protected Route Access',
            steps: 'Without login → Try to access /dashboard or protected page',
            expected: 'Redirect to login page',
            validates: 'Route protection actually working'
          }
        ]
      });
    }

    // Payment Processing Testing Patterns  
    if (analysis.integrationTypes.includes('payments')) {
      selectedPatterns.push({
        name: 'Payment Integration Validation',
        priority: 2,
        type: 'EXTERNAL_SERVICE_VALIDATION',
        critical: true,
        prevents: 'Payment failures, webhook issues, security vulnerabilities',
        playwright_required: true,
        scenarios: [
          {
            name: 'Payment Flow End-to-End',
            steps: 'Select product → Add to cart → Checkout → Enter test payment info → Submit',
            expected: 'Payment succeeds, order confirmation displayed',
            validates: 'Stripe/payment provider integration working'
          },
          {
            name: 'Payment Error Handling',
            steps: 'Use declined test card number → Attempt payment',
            expected: 'Clear error message, no app crash',
            validates: 'Error handling prevents user confusion'
          }
        ]
      });
    }

    // Database/API Integration Testing
    if (analysis.integrationTypes.includes('database') || analysis.integrationTypes.includes('apis')) {
      selectedPatterns.push({
        name: 'Data Persistence Validation',
        priority: 3,
        type: 'DATA_VALIDATION',
        critical: false,
        prevents: 'Data loss, sync issues, API failures',
        playwright_required: true,
        scenarios: [
          {
            name: 'CRUD Operations',
            steps: 'Create data → Read/display data → Update data → Delete data',
            expected: 'All operations work, data persists correctly',
            validates: 'Database integration and error handling'
          },
          {
            name: 'API Error Handling',
            steps: 'Simulate network failure (disconnect internet) → Try to save data',
            expected: 'User sees clear error message, no data loss',
            validates: 'Offline/error state handling'
          }
        ]
      });
    }

    // Sort by priority and limit to max 3 patterns (Sweet Spot Rule)
    return selectedPatterns
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .slice(0, 3);
  }

  /**
   * Generate brutal QA testing requirements section for story
   * @param {array} qaPatterns - Selected QA patterns 
   * @returns {string} Formatted QA testing section for story deployment
   */
  formatQATestingRequirements(qaPatterns) {
    if (qaPatterns.length === 0) {
      return '';
    }

    let section = `\n### 🧪 Critical QA Testing Requirements (For QA Agent)\n`;
    section += `*Brutal validation prevents production failures | Story 1.2 prevention*\n\n`;
    section += `**INSTRUCTIONS FOR QA AGENT**: Execute these critical scenarios using Playwright MCP:\n\n`;

    qaPatterns.forEach((pattern, index) => {
      section += `#### ${index + 1}. ${pattern.name}\n`;
      section += `**Why Critical**: ${pattern.prevents}\n`;
      section += `**Requires Browser Testing**: ${pattern.playwright_required ? '✅ YES' : '❌ NO'}\n\n`;
      
      pattern.scenarios.forEach((scenario, scenarioIndex) => {
        section += `**${String.fromCharCode(65 + scenarioIndex)}. ${scenario.name}**\n`;
        section += `- **Steps**: ${scenario.steps}\n`;
        section += `- **Expected**: ${scenario.expected}\n`;
        section += `- **Validates**: ${scenario.validates}\n\n`;
      });
    });

    section += `**QA AGENT WORKFLOW**:\n`;
    section += `1. Use mcp__microsoft-playwright-mcp__browser_navigate to navigate to app\n`;
    section += `2. Execute each scenario step-by-step with appropriate MCP commands\n`;
    section += `3. Take screenshots of failures using browser_take_screenshot\n`;
    section += `4. Document EVERY flaw found with exact reproduction steps\n`;
    section += `5. Generate actionable bug list for Dev Agent to address\n\n`;
    
    section += `*Role Separation: SM deploys requirements, QA executes brutal testing*\n`;
    
    return section;
  }

  /**
   * Generate complete enhanced story sections (REF-MCP + Brutal QA)
   * @param {object} analysis - Story analysis results
   * @param {object} docInsights - Documentation fetching results  
   * @param {string} storyContent - Original story content
   * @returns {object} Enhanced sections for story deployment
   */
  async generateBrutalEnhancementSections(analysis, docInsights, storyContent = '') {
    const sections = {};
    
    // Generate REF-MCP enhanced Dev Notes (existing functionality)
    sections.devNotes = await this.generateRefMcpEnhancedDevNotes(analysis, docInsights, storyContent);
    
    // Generate Brutal QA Testing Requirements (new functionality)
    const qaPatterns = this.selectCriticalQAPatterns(analysis, storyContent);
    sections.qaRequirements = this.formatQATestingRequirements(qaPatterns);
    
    // Generate combined deployment data
    sections.deploymentData = {
      timestamp: new Date().toISOString(),
      hasRefMcpPatterns: storyContent && analysis.hasExternalIntegrations,
      hasQAPatterns: qaPatterns.length > 0,
      totalPatterns: qaPatterns.length,
      requiresPlaywrightTesting: qaPatterns.some(p => p.playwright_required),
      criticalValidations: qaPatterns.filter(p => p.critical).length
    };
    
    return sections;
  }

  /**
   * Generate Octomind AI-powered test requirements
   * Simple interface that leverages AI capabilities
   * @param {string} storyContent - The story requirements text
   * @returns {object} Octomind test configuration
   */
  generateOctomindTests(storyContent) {
    try {
      // Load Octomind AI engine config
      const fs = require('fs');
      const path = require('path');
      const enginePath = path.join(__dirname, '../data/octomind-ai-engine.yaml');
      
      if (!fs.existsSync(enginePath)) {
        return null; // Graceful fallback to existing system
      }
      
      // Extract acceptance criteria from story
      const criteria = this.extractAcceptanceCriteria(storyContent);
      const analysis = this.analyzeStory(storyContent);
      
      // Detect technical stack from story content
      const detectedStack = this.detectTechnicalStack(storyContent);
      
      // Generate intelligent prompt for AI
      const aiPrompt = this.buildOctomindPrompt(storyContent, criteria, detectedStack);
      
      return {
        engine: 'octomind',
        mode: 'discovery',
        prompt: aiPrompt,
        prerequisites: this.determinePrerequisites(analysis),
        test_scenarios: this.suggestTestScenarios(analysis),
        environments: ['production', 'staging', 'local']
      };
    } catch (error) {
      console.warn('Octomind test generation failed, falling back:', error.message);
      return null; // Graceful fallback
    }
  }
  
  /**
   * Extract acceptance criteria from story content
   * @private
   */
  extractAcceptanceCriteria(storyContent) {
    const lines = storyContent.split('\n');
    const criteria = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || 
          trimmed.includes('should') || trimmed.includes('must')) {
        criteria.push(trimmed);
      }
    }
    
    return criteria.join('\n');
  }
  
  /**
   * Detect technical stack from story content
   * @private
   */
  detectTechnicalStack(storyContent) {
    const content = storyContent.toLowerCase();
    const stack = [];
    
    // Framework detection
    if (content.includes('next.js') || content.includes('nextjs')) stack.push('Next.js');
    if (content.includes('react')) stack.push('React');
    if (content.includes('vue')) stack.push('Vue.js');
    
    // Database detection
    if (content.includes('supabase')) stack.push('Supabase');
    if (content.includes('postgres')) stack.push('PostgreSQL');
    if (content.includes('mongodb')) stack.push('MongoDB');
    
    // Auth detection
    if (content.includes('auth0')) stack.push('Auth0');
    if (content.includes('clerk')) stack.push('Clerk');
    
    return stack.length > 0 ? stack.join(', ') : 'Web Application';
  }
  
  /**
   * Build intelligent prompt for Octomind AI
   * @private
   */
  buildOctomindPrompt(storyContent, criteria, stack) {
    return `Story Context: ${storyContent}

Acceptance Criteria: ${criteria}
Technical Stack: ${stack}

INTENT: Test this story comprehensively

INSTRUCTIONS:
1. Discover and validate ALL acceptance criteria
2. Find edge cases and boundary conditions  
3. Test error handling and failure modes
4. Validate security vulnerabilities
5. Check performance under load
6. Test integration points thoroughly
7. Ensure mobile compatibility
8. Record evidence by checking for relevant UI elements

BE BRUTAL. FIND BUGS. BE THOROUGH.

EXPECTED RESULT:
All functionality works correctly with no failures or security issues.`;
  }
  
  /**
   * Determine prerequisites for complex tests
   * @private
   */
  determinePrerequisites(analysis) {
    const prerequisites = [];
    
    if (analysis.integrationTypes.includes('authentication')) {
      prerequisites.push('login_test');
    }
    
    // Add cookie banner if web application
    prerequisites.push('cookie_banner');
    
    return prerequisites;
  }
  
  /**
   * Suggest test scenarios based on analysis
   * @private  
   */
  suggestTestScenarios(analysis) {
    const scenarios = ['happy_path', 'error_handling'];
    
    if (analysis.integrationTypes.includes('authentication')) {
      scenarios.push('security');
    }
    
    if (analysis.integrationTypes.includes('payments')) {
      scenarios.push('security', 'edge_cases');
    }
    
    if (analysis.complexity === 'high') {
      scenarios.push('performance');
    }
    
    // Always add mobile for construction apps
    scenarios.push('mobile');
    
    return scenarios;
  }
}

module.exports = StoryEnhancementEngine;

// Example usage for testing
if (require.main === module) {
  const engine = new StoryEnhancementEngine();
  
  const testStory = `
    As a user, I want to register my company and create secure user accounts with Supabase,
    so that my team's evidence data is properly protected and organized by company.
    
    The system should support user authentication, company registration, and role-based access.
  `;
  
  const analysis = engine.analyzeStory(testStory);
  console.log('Story Analysis:', JSON.stringify(analysis, null, 2));
  
  const enhancement = engine.generateDevNotesEnhancement(analysis);
  console.log('\nDev Notes Enhancement:');
  console.log(enhancement);
  
  // Test Octomind integration
  const octomindTests = engine.generateOctomindTests(testStory);
  if (octomindTests) {
    console.log('\nOctomind AI Tests:');
    console.log(JSON.stringify(octomindTests, null, 2));
  }
}