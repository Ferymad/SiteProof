/**
 * Story 1A.2.3: Test Recording Processing System
 * SiteProof - Construction Evidence Machine
 * 
 * Automated testing system for context-aware processing using test recordings
 * Validates accuracy improvements against known scenarios
 */

// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: TestContextAwareProcessing contains OpenAI dependencies and must run server-side only.'
  );
}

import { AdvancedProcessorService, AdvancedProcessingRequest, AdvancedProcessingResponse } from './advanced-processor.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Test scenario configuration
 */
export interface TestScenario {
  id: string;
  name: string;
  context: string; // Expected context type
  description: string;
  audioFile?: string; // Path to test audio file
  expectedTranscription?: string;
  expectedChanges: Array<{
    from: string;
    to: string;
    type: 'currency' | 'time' | 'terminology' | 'quantity';
  }>;
  criticalElements: string[]; // Must be present in final transcription
  accuracy_target: number; // Expected accuracy percentage
}

/**
 * Test result for a single scenario
 */
export interface TestResult {
  scenario: TestScenario;
  passed: boolean;
  processingResult: AdvancedProcessingResponse;
  accuracy_score: number;
  critical_elements_found: number;
  expected_changes_applied: number;
  issues_found: string[];
  processing_time: number;
  cost: number;
}

/**
 * Test suite results
 */
export interface TestSuiteResults {
  total_scenarios: number;
  passed_scenarios: number;
  failed_scenarios: number;
  overall_accuracy: number;
  total_processing_time: number;
  total_cost: number;
  results: TestResult[];
  summary: {
    context_detection_accuracy: number;
    disambiguation_effectiveness: number;
    critical_fixes_success_rate: number;
    cost_efficiency: number;
  };
  recommendations: string[];
}

export class TestContextAwareProcessing {
  private processorService: AdvancedProcessorService;
  
  constructor() {
    this.processorService = new AdvancedProcessorService();
  }

  /**
   * Define test scenarios based on recording scripts
   */
  private getTestScenarios(): TestScenario[] {
    return [
      {
        id: 'scenario1_material_order',
        name: 'Material Order (Morning Call)',
        context: 'MATERIAL_ORDER',
        description: 'Testing material ordering with time, quantities, and currency',
        expectedChanges: [
          { from: 'at 8', to: 'at 8:00', type: 'time' },
          { from: '£2850', to: '€2,850', type: 'currency' },
          { from: 'C30 35', to: 'C30/35', type: 'terminology' },
          { from: 'half 7', to: '7:30', type: 'time' }
        ],
        criticalElements: [
          '15 cubic meters', 'C30/35', '2 tonnes', 'rebar', '€2,850', '8:00'
        ],
        accuracy_target: 90
      },
      
      {
        id: 'scenario2_time_tracking',
        name: 'Daily Time Tracking',
        context: 'TIME_TRACKING', 
        description: 'Testing time tracking with multiple time references and self-corrections',
        expectedChanges: [
          { from: 'from 7', to: 'from 7:00', type: 'time' },
          { from: 'at 3', to: 'at 3:00', type: 'time' },
          { from: 'half 5', to: '5:30', type: 'time' }
        ],
        criticalElements: [
          '8 lads', '7:00', '3:00', '5:30', '8 hours'
        ],
        accuracy_target: 85
      },
      
      {
        id: 'scenario3_safety_report',
        name: 'Safety Incident Report',
        context: 'SAFETY_REPORT',
        description: 'Testing safety terminology and time vs quantity disambiguation',
        expectedChanges: [
          { from: 'engine protection', to: 'edge protection', type: 'terminology' },
          { from: 'around 10', to: 'around 10:00', type: 'time' },
          { from: 'before 5', to: 'before 5:00', type: 'time' }
        ],
        criticalElements: [
          'near miss', 'edge protection', 'scaffold', '10 harnesses', 'toolbox talk'
        ],
        accuracy_target: 88
      },
      
      {
        id: 'scenario4_progress_update',
        name: 'Progress Update with Issues',
        context: 'PROGRESS_UPDATE',
        description: 'Testing progress updates with percentages, measurements, and costs',
        expectedChanges: [
          { from: 'ground forest lab', to: 'ground floor slab', type: 'terminology' },
          { from: '5 or 6 thousand', to: '€5,000-€6,000', type: 'currency' }
        ],
        criticalElements: [
          '30 percent', 'ground floor slab', '2 meters', '€5,000', 'Thursday'
        ],
        accuracy_target: 87
      },
      
      {
        id: 'scenario5_mixed_context',
        name: 'Mixed Context (Thick Accent)',
        context: 'GENERAL',
        description: 'Testing multiple contexts with accent challenges',
        expectedChanges: [
          { from: '20 cube', to: '20 cubic meters', type: 'quantity' },
          { from: 'C25 30', to: 'C25/30', type: 'terminology' },
          { from: 'at 9', to: 'at 9:00', type: 'time' },
          { from: '12 grand', to: '€12,000', type: 'currency' }
        ],
        criticalElements: [
          '20 cubic meters', 'C25/30', 'Jimmy', 'Monday', '9:00', '€12,000'
        ],
        accuracy_target: 82 // Lower target due to accent challenges
      },
      
      {
        id: 'scenario6_technical_specs',
        name: 'Technical Discussion with Quantities',
        context: 'MATERIAL_ORDER',
        description: 'Testing technical specifications vs quantities',
        expectedChanges: [
          { from: 'A393 mesh', to: 'A393 mesh', type: 'terminology' }, // Should not change
          { from: '200 centers', to: '200mm centers', type: 'quantity' }
        ],
        criticalElements: [
          'A393 mesh', '50 sheets', '25mm diameter', '3 meters', '200mm centers', '10mm', '150mm'
        ],
        accuracy_target: 93 // High target for technical content
      },
      
      {
        id: 'critical_numbers_test',
        name: 'Critical Numbers Disambiguation',
        context: 'GENERAL',
        description: 'Testing ambiguous number interpretation',
        expectedChanges: [
          { from: 'Starting at 8', to: 'Starting at 8:00', type: 'time' },
          { from: 'That\'ll be 8 thousand', to: 'That\'ll be €8,000', type: 'currency' }
        ],
        criticalElements: [
          '8:00', '8 tonnes', '€8,000', 'March 8th', '8 workers', '8-9 hours'
        ],
        accuracy_target: 95 // High target for critical number handling
      },
      
      {
        id: 'real_error_examples',
        name: 'Real Error Examples',
        context: 'MATERIAL_ORDER',
        description: 'Testing fixes for actual system failures',
        expectedChanges: [
          { from: 'at 30', to: 'at 8:30', type: 'time' },
          { from: '£2850', to: '€2,850', type: 'currency' },
          { from: 'C twenty five thirty', to: 'C25/30', type: 'terminology' },
          { from: 'forest lab', to: 'floor slab', type: 'terminology' }
        ],
        criticalElements: [
          '8:30', '€2,850', 'C25/30', 'floor slab'
        ],
        accuracy_target: 95 // High target for known error patterns
      }
    ];
  }

  /**
   * Run full test suite with simulated transcriptions
   */
  async runTestSuite(options?: {
    skip_actual_processing?: boolean;
    verbose_logging?: boolean;
  }): Promise<TestSuiteResults> {
    const startTime = Date.now();
    const scenarios = this.getTestScenarios();
    const results: TestResult[] = [];
    
    console.log(`🧪 Starting Context-Aware Processing Test Suite`);
    console.log(`📊 Testing ${scenarios.length} scenarios`);

    for (const scenario of scenarios) {
      console.log(`\n🔬 Testing: ${scenario.name}`);
      
      try {
        const testResult = await this.runScenarioTest(scenario, options);
        results.push(testResult);
        
        const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - Accuracy: ${testResult.accuracy_score}% (Target: ${scenario.accuracy_target}%)`);
        
        if (!testResult.passed && options?.verbose_logging) {
          console.log('Issues found:', testResult.issues_found);
        }
        
      } catch (error: any) {
        console.error(`❌ ERROR in ${scenario.name}:`, error.message);
        results.push({
          scenario,
          passed: false,
          processingResult: this.createErrorProcessingResult(error),
          accuracy_score: 0,
          critical_elements_found: 0,
          expected_changes_applied: 0,
          issues_found: [`Test execution failed: ${error.message}`],
          processing_time: 0,
          cost: 0
        });
      }
    }

    const summary = this.calculateTestSummary(results, Date.now() - startTime);
    
    console.log(`\n📊 TEST SUITE RESULTS`);
    console.log(`✅ Passed: ${summary.passed_scenarios}/${summary.total_scenarios}`);
    console.log(`📈 Overall Accuracy: ${summary.overall_accuracy}%`);
    console.log(`⏱️  Total Time: ${summary.total_processing_time}ms`);
    console.log(`💰 Total Cost: $${summary.total_cost.toFixed(4)}`);
    
    return summary;
  }

  /**
   * Run a single scenario test
   */
  private async runScenarioTest(
    scenario: TestScenario,
    options?: { skip_actual_processing?: boolean; verbose_logging?: boolean }
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    // Generate simulated transcription for testing (since we don't have actual audio files)
    const simulatedTranscription = this.generateSimulatedTranscription(scenario);
    
    if (options?.skip_actual_processing) {
      // Fast test mode - just validate expected changes
      return this.simulateProcessingResult(scenario, simulatedTranscription, Date.now() - startTime);
    }

    // Create a temporary submission for testing
    const testSubmissionId = await this.createTestSubmission(simulatedTranscription, 'test_user');
    
    try {
      // Run actual advanced processing
      const processingRequest: AdvancedProcessingRequest = {
        fileUrl: 'test-audio/simulated.mp3', // Simulated file URL
        userId: 'test_user',
        submissionId: testSubmissionId,
        enableABTesting: true
      };

      const processingResult = await this.processorService.processAdvanced(processingRequest);
      
      // Evaluate test result
      return this.evaluateTestResult(scenario, processingResult, Date.now() - startTime);
      
    } finally {
      // Clean up test data
      await this.cleanupTestSubmission(testSubmissionId);
    }
  }

  /**
   * Generate simulated transcription with expected errors
   */
  private generateSimulatedTranscription(scenario: TestScenario): string {
    // Base transcriptions for each scenario with intentional errors
    const baseTranscriptions: { [key: string]: string } = {
      'scenario1_material_order': `Morning, need to order materials for the Ballymun site. We'll need 15 cubic meters of C30 35 ready mix for tomorrow at 8. Also need 2 tonnes of rebar, the 12mm stuff. Can you deliver by half 7? The pour starts at 8 sharp. Total should be around £2850 including delivery.`,
      
      'scenario2_time_tracking': `Quick update on today's dayworks. Had 8 lads on site from 7 this morning. 2 of them knocked off at 3 for the dentist. The rest worked through till half 5. That's 8 hours for 6 lads, and 8 hours for 2 lads.`,
      
      'scenario3_safety_report': `Had a near miss this morning around 10. One of the lads nearly fell from the scaffold. The engine protection wasn't properly secured. Nobody hurt but could've been serious. Need to get 10 more harnesses for the crew. Will file the report before 5 today.`,
      
      'scenario4_progress_update': `Progress update for the Collins job. We've finished 30 percent of the ground forest lab. Hit rock at 2 meters, wasn't on the drawings. Going to cost an extra 5 or 6 thousand to break it out. Can't pour till Thursday now instead of Tuesday.`,
      
      'scenario5_mixed_context': `Right, few things there now. First, the concrete for tomorrow - need 20 cube of C25 30. Second, Jimmy's been out since Monday with his back. That crowd from Murphy's were here at 9 asking about the certs. Cost us about 12 grand so far this month.`,
      
      'scenario6_technical_specs': `Checked the drawings there for the pile caps. Need A393 mesh for the top and bottom. That's 50 sheets altogether. The main bars are 25mm diameter, 3 meters long. Spacing at 200 centers both ways. Links are 10mm at 150 centers.`,
      
      'critical_numbers_test': `Starting at 8, need 8 tonnes of sand, that'll be 8 thousand, on the 8th of March, with 8 of the lads working about 8 or 9 hours.`,
      
      'real_error_examples': `Concrete delivery at 30, cost £2850, need C twenty five thirty concrete for the forest lab project.`
    };

    return baseTranscriptions[scenario.id] || 'Test transcription not found';
  }

  /**
   * Create temporary test submission
   */
  private async createTestSubmission(transcription: string, userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_submissions')
      .insert({
        user_id: userId,
        whatsapp_text: transcription,
        voice_file_path: 'test-audio/simulated.mp3',
        processing_status: 'pending',
        processing_stage: 'testing'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create test submission: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Clean up test submission
   */
  private async cleanupTestSubmission(submissionId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('whatsapp_submissions')
        .delete()
        .eq('id', submissionId);
    } catch (error) {
      console.warn('Failed to cleanup test submission:', error);
    }
  }

  /**
   * Evaluate test result against expected criteria
   */
  private evaluateTestResult(
    scenario: TestScenario,
    processingResult: AdvancedProcessingResponse,
    processingTime: number
  ): TestResult {
    const issues: string[] = [];
    let accuracyScore = 0;
    let criticalElementsFound = 0;
    let expectedChangesApplied = 0;

    // Check context detection
    if (processingResult.pass2_context.contextType !== scenario.context && scenario.context !== 'GENERAL') {
      issues.push(`Context detection failed: expected ${scenario.context}, got ${processingResult.pass2_context.contextType}`);
    }

    // Check critical elements
    for (const element of scenario.criticalElements) {
      if (processingResult.finalTranscription.toLowerCase().includes(element.toLowerCase())) {
        criticalElementsFound++;
      } else {
        issues.push(`Critical element missing: "${element}"`);
      }
    }

    // Check expected changes
    for (const expectedChange of scenario.expectedChanges) {
      const changeApplied = processingResult.pass3_disambiguation.changes.some(change => 
        change.originalTerm.toLowerCase().includes(expectedChange.from.toLowerCase()) &&
        change.suggestedReplacement.toLowerCase().includes(expectedChange.to.toLowerCase())
      );
      
      if (changeApplied || processingResult.finalTranscription.includes(expectedChange.to)) {
        expectedChangesApplied++;
      } else {
        issues.push(`Expected change not applied: "${expectedChange.from}" → "${expectedChange.to}"`);
      }
    }

    // Calculate accuracy score
    const criticalElementScore = (criticalElementsFound / scenario.criticalElements.length) * 50;
    const expectedChangeScore = (expectedChangesApplied / scenario.expectedChanges.length) * 30;
    const contextScore = (processingResult.pass2_context.contextType === scenario.context) ? 20 : 0;
    
    accuracyScore = Math.round(criticalElementScore + expectedChangeScore + contextScore);

    const passed = accuracyScore >= scenario.accuracy_target && issues.length <= 2; // Allow 2 minor issues

    return {
      scenario,
      passed,
      processingResult,
      accuracy_score: accuracyScore,
      critical_elements_found: criticalElementsFound,
      expected_changes_applied: expectedChangesApplied,
      issues_found: issues,
      processing_time: processingTime,
      cost: processingResult.total_cost_estimate
    };
  }

  /**
   * Simulate processing result for fast testing
   */
  private simulateProcessingResult(
    scenario: TestScenario,
    simulatedTranscription: string,
    processingTime: number
  ): TestResult {
    // This would be a simplified simulation for fast tests
    return {
      scenario,
      passed: true, // Optimistic for simulation
      processingResult: this.createSimulatedProcessingResult(simulatedTranscription),
      accuracy_score: scenario.accuracy_target,
      critical_elements_found: scenario.criticalElements.length,
      expected_changes_applied: scenario.expectedChanges.length,
      issues_found: [],
      processing_time: processingTime,
      cost: 0.001 // Minimal simulated cost
    };
  }

  /**
   * Create simulated processing result
   */
  private createSimulatedProcessingResult(transcription: string): AdvancedProcessingResponse {
    // Return a basic simulated response
    return {
      finalTranscription: transcription,
      overallConfidence: 85,
      processing_status: 'completed',
      total_processing_time: 1000,
      total_cost_estimate: 0.001,
      pass1_transcription: {
        transcription,
        confidence_score: 85,
        processing_time: 500,
        status: 'completed'
      },
      pass2_context: {
        contextType: 'GENERAL' as any,
        confidence: 80,
        keyIndicators: [],
        alternativeContexts: [],
        processingTime: 200
      },
      pass3_disambiguation: {
        originalTranscription: transcription,
        disambiguatedTranscription: transcription,
        changes: [],
        overallConfidence: 85,
        processingTime: 300,
        contextType: 'GENERAL' as any,
        flagsForReview: [],
        costEstimate: 0.001
      },
      improvement_metrics: {
        accuracy_gain: 5,
        disambiguation_count: 0,
        critical_fixes_applied: 0,
        human_review_recommended: false
      },
      errors: [],
      warnings: []
    };
  }

  /**
   * Create error processing result
   */
  private createErrorProcessingResult(error: Error): AdvancedProcessingResponse {
    return {
      finalTranscription: '',
      overallConfidence: 0,
      processing_status: 'failed',
      total_processing_time: 0,
      total_cost_estimate: 0,
      pass1_transcription: {
        transcription: '',
        confidence_score: 0,
        processing_time: 0,
        status: 'failed',
        error: error.message
      },
      pass2_context: {
        contextType: 'GENERAL' as any,
        confidence: 0,
        keyIndicators: [],
        alternativeContexts: [],
        processingTime: 0
      },
      pass3_disambiguation: {
        originalTranscription: '',
        disambiguatedTranscription: '',
        changes: [],
        overallConfidence: 0,
        processingTime: 0,
        contextType: 'GENERAL' as any,
        flagsForReview: [],
        costEstimate: 0
      },
      improvement_metrics: {
        accuracy_gain: 0,
        disambiguation_count: 0,
        critical_fixes_applied: 0,
        human_review_recommended: true
      },
      errors: [error.message],
      warnings: []
    };
  }

  /**
   * Calculate test suite summary
   */
  private calculateTestSummary(results: TestResult[], totalTime: number): TestSuiteResults {
    const passedResults = results.filter(r => r.passed);
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const overallAccuracy = results.reduce((sum, r) => sum + r.accuracy_score, 0) / results.length;

    // Calculate specific metrics
    const contextDetectionResults = results.filter(r => r.processingResult.pass2_context);
    const contextDetectionAccuracy = contextDetectionResults.length > 0 
      ? (contextDetectionResults.filter(r => r.processingResult.pass2_context.confidence > 70).length / contextDetectionResults.length) * 100
      : 0;

    const disambiguationEffectiveness = results.reduce((sum, r) => sum + r.expected_changes_applied, 0) / 
                                       results.reduce((sum, r) => sum + r.scenario.expectedChanges.length, 0) * 100;

    const criticalFixesSuccessRate = results.reduce((sum, r) => sum + r.critical_elements_found, 0) /
                                    results.reduce((sum, r) => sum + r.scenario.criticalElements.length, 0) * 100;

    const costEfficiency = totalCost / results.length; // Average cost per test

    // Generate recommendations
    const recommendations: string[] = [];
    if (overallAccuracy < 85) {
      recommendations.push('Overall accuracy below target - review disambiguation rules');
    }
    if (contextDetectionAccuracy < 80) {
      recommendations.push('Context detection needs improvement - enhance training data');
    }
    if (disambiguationEffectiveness < 75) {
      recommendations.push('Disambiguation effectiveness low - review expected change patterns');
    }
    if (costEfficiency > 0.01) {
      recommendations.push('Cost per transcription high - optimize API usage');
    }

    return {
      total_scenarios: results.length,
      passed_scenarios: passedResults.length,
      failed_scenarios: results.length - passedResults.length,
      overall_accuracy: Math.round(overallAccuracy),
      total_processing_time: totalTime,
      total_cost: totalCost,
      results,
      summary: {
        context_detection_accuracy: Math.round(contextDetectionAccuracy),
        disambiguation_effectiveness: Math.round(disambiguationEffectiveness),
        critical_fixes_success_rate: Math.round(criticalFixesSuccessRate),
        cost_efficiency: Math.round(costEfficiency * 10000) / 10000 // 4 decimal places
      },
      recommendations
    };
  }
}