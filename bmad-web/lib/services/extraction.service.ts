/**
 * Story 1A.2: Data Extraction Service
 * SiteProof - Construction Evidence Machine
 * 
 * Business logic for extracting structured data from transcriptions
 * Using GPT-4 with construction-specific prompting
 * Designed to be easily portable to Django
 * 
 * Future Django equivalent: apps/processing/extraction.py
 */

import openai, { GPT_CONFIG, CONSTRUCTION_SYSTEM_PROMPT, AI_ERROR_MESSAGES } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

export interface ExtractionRequest {
  transcription: string;
  whatsappText?: string;
  userId: string;
  submissionId: string;
}

export interface ExtractedData {
  amounts: string[];
  materials: string[];
  dates: string[];
  safety_concerns: string[];
  work_status: string | null;
}

export interface ExtractionResponse {
  extracted_data: ExtractedData;
  confidence_score: number;
  processing_time: number;
  status: 'completed' | 'failed';
  error?: string;
}

export class ExtractionService {
  /**
   * Extract structured data using GPT-4
   * Implements Story 1A.2 requirements
   */
  async extractData(request: ExtractionRequest): Promise<ExtractionResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Prepare construction-specific prompt
      const prompt = this.buildConstructionPrompt(request.transcription, request.whatsappText);
      
      // 2. Call GPT-4 API
      const gptResponse = await this.callGPT4API(prompt);
      
      // 3. Parse structured response
      const extractedData = this.parseGPTResponse(gptResponse);
      
      // 4. Calculate confidence scores
      const confidence = this.calculateConfidence(extractedData, gptResponse);
      
      // 5. Store in database
      await this.saveExtractedData(request.submissionId, extractedData, confidence);
      
      // 6. Return extracted data
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        extracted_data: extractedData,
        confidence_score: confidence,
        processing_time: processingTime,
        status: 'completed'
      };
      
    } catch (error: any) {
      console.error('Extraction error:', error);
      
      // Save failed status
      await this.updateSubmissionStatus(request.submissionId, 'extraction_failed', error.message);
      
      return {
        extracted_data: {
          amounts: [],
          materials: [],
          dates: [],
          safety_concerns: [],
          work_status: null
        },
        confidence_score: 0,
        processing_time: (Date.now() - startTime) / 1000,
        status: 'failed',
        error: this.getUserFriendlyError(error)
      };
    }
  }

  /**
   * Build construction-specific prompt
   */
  private buildConstructionPrompt(transcription: string, whatsappText?: string): string {
    let contentToAnalyze = '';
    
    if (transcription) {
      contentToAnalyze += `VOICE NOTE TRANSCRIPTION:\n${transcription}\n\n`;
    }
    
    if (whatsappText) {
      contentToAnalyze += `WHATSAPP MESSAGES:\n${whatsappText}\n\n`;
    }
    
    const userPrompt = `Please extract structured information from the following construction site communication:

${contentToAnalyze}

Remember to:
1. Extract ALL monetary amounts with currency symbols
2. Identify ALL construction materials mentioned
3. Extract ALL dates, deadlines, or timeframes
4. Note ANY safety concerns or incidents
5. Summarize the overall work status

Return the data in the specified JSON format.`;
    
    return userPrompt;
  }

  /**
   * Call OpenAI GPT-4 API
   */
  private async callGPT4API(prompt: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: CONSTRUCTION_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: GPT_CONFIG.temperature,
        max_tokens: GPT_CONFIG.max_tokens,
        response_format: { type: 'json_object' }
      });
      
      return response;
    } catch (error: any) {
      console.error('GPT-4 API error:', error);
      throw new Error(`Extraction API error: ${error.message}`);
    }
  }

  /**
   * Parse GPT-4 response into structured data
   */
  private parseGPTResponse(response: any): ExtractedData {
    try {
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in GPT response');
      }
      
      // Parse JSON response
      const parsed = JSON.parse(content);
      
      // Validate and normalize the extracted data
      return {
        amounts: Array.isArray(parsed.amounts) ? parsed.amounts : [],
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        dates: Array.isArray(parsed.dates) ? parsed.dates : [],
        safety_concerns: Array.isArray(parsed.safety_concerns) ? parsed.safety_concerns : [],
        work_status: parsed.work_status || null
      };
      
    } catch (error: any) {
      console.error('Parse error:', error);
      // Return empty structure if parsing fails
      return {
        amounts: [],
        materials: [],
        dates: [],
        safety_concerns: [],
        work_status: null
      };
    }
  }

  /**
   * Calculate confidence score based on extraction quality
   */
  private calculateConfidence(data: ExtractedData, response: any): number {
    let confidence = 70; // Base confidence for successful extraction
    
    // Check if we extracted meaningful data
    const hasAmounts = data.amounts.length > 0;
    const hasMaterials = data.materials.length > 0;
    const hasDates = data.dates.length > 0;
    const hasWorkStatus = data.work_status !== null;
    
    // Increase confidence based on data completeness
    if (hasAmounts) confidence += 10;
    if (hasMaterials) confidence += 10;
    if (hasDates) confidence += 5;
    if (hasWorkStatus) confidence += 5;
    
    // Check response quality indicators
    const finishReason = response.choices[0]?.finish_reason;
    if (finishReason === 'stop') {
      confidence += 5; // Complete response
    } else if (finishReason === 'length') {
      confidence -= 10; // Truncated response
    }
    
    // Ensure confidence is within bounds
    confidence = Math.max(0, Math.min(100, confidence));
    
    return Math.round(confidence);
  }

  /**
   * Save extracted data to database
   */
  private async saveExtractedData(
    submissionId: string,
    extractedData: ExtractedData,
    confidence: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_submissions')
        .update({
          extracted_data: extractedData,
          extraction_confidence: confidence,
          processing_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Database save error:', error);
      throw new Error(`Failed to save extracted data: ${error.message}`);
    }
  }

  /**
   * Update submission status in case of failure
   */
  private async updateSubmissionStatus(
    submissionId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('whatsapp_submissions')
        .update({
          processing_status: status,
          processing_error: errorMessage,
          processed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
    } catch (error) {
      console.error('Status update error:', error);
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error: any): string {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('api key')) {
      return AI_ERROR_MESSAGES.API_ERROR;
    }
    if (message.includes('extraction') || message.includes('parse')) {
      return AI_ERROR_MESSAGES.EXTRACTION_FAILED;
    }
    
    return AI_ERROR_MESSAGES.API_ERROR;
  }
}