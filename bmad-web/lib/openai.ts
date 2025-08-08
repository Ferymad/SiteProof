import OpenAI from 'openai';

/**
 * OpenAI Configuration for SiteProof
 * Handles Whisper transcription and GPT-4 extraction
 */

// Initialize OpenAI client
// Note: API key should be in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // Optional: Set custom timeout for longer audio files
  timeout: 60000, // 60 seconds
});

// Export configured client
export default openai;

// Configuration constants for consistent API usage
export const WHISPER_CONFIG = {
  model: (process.env.TRANSCRIPTION_MODEL || 'gpt-4o-mini') as string, // Using gpt-4o-mini for better accuracy and lower cost
  language: 'en', // English with Irish accent support
  temperature: 0.0, // Zero temperature for maximum consistency
  response_format: 'text' as const, // gpt-4o-mini doesn't support verbose_json yet
  // Enhanced Irish construction site prompt with domain-specific context
  prompt: `Irish construction site voice recording. 
CRITICAL CONTEXT:
- Currency: Always euros (€), never pounds (£)
- Concrete grades format: C25/30, C30/37, C20/25 (with forward slash)
- Time format: 24-hour or colloquial ("half eight" = 8:30, "quarter past" = :15)
- Common Irish construction phrases: "crack on", "safe working", "lads", "gear"
- Materials: 7N blocks, 12mm/16mm rebar, ready-mix concrete, shuttering, formwork
- Measurements: metres, millimetres, tonnes, cubic metres (never yards/feet)
- Weather terms: "soft day" (light rain), "lashing" (heavy rain)
- Equipment: teleporter, dumper, JCB, tower crane, pump truck
- Ballymun, Dublin site context with Irish accents and terminology`
};

export const GPT_CONFIG = {
  model: 'gpt-4-turbo-preview' as const,
  temperature: 0.3, // Low temperature for consistent extraction
  max_tokens: 2000,
};

// Construction-specific prompt template
export const CONSTRUCTION_SYSTEM_PROMPT = `You are an AI assistant specialized in Irish construction site communications. Your task is to extract structured information from transcribed voice notes and WhatsApp messages.

Focus on identifying:
1. AMOUNTS: Any monetary values (euros, pounds), quantities, measurements
2. MATERIALS: Construction materials (concrete, steel, timber, blocks, etc.)
3. DATES: Specific dates, deadlines, timeframes mentioned
4. SAFETY: Any safety concerns, incidents, or precautions
5. WORK STATUS: Completion status, delays, progress updates

Context:
- Irish/UK measurement units (metres, millimetres, tonnes)
- Common Irish construction terminology
- Weather-related impacts on construction
- Equipment and machinery names

Return extracted data in the following JSON format:
{
  "amounts": ["€1,250", "15 tonnes", "200 blocks"],
  "materials": ["concrete", "rebar", "timber"],
  "dates": ["next Friday", "15th January", "tomorrow"],
  "safety_concerns": ["scaffolding issue", "weather warning"],
  "work_status": "foundation complete, awaiting inspection"
}

If no information is found for a category, return an empty array or null for work_status.`;

// Error messages for user feedback
export const AI_ERROR_MESSAGES = {
  TRANSCRIPTION_FAILED: 'Unable to transcribe audio. Please ensure the voice note is clear and try again.',
  EXTRACTION_FAILED: 'Unable to extract construction data. The transcription may be unclear.',
  API_ERROR: 'Service temporarily unavailable. Please try again in a moment.',
  FILE_TOO_LARGE: 'Audio file is too large. Please keep voice notes under 25MB.',
  INVALID_FORMAT: 'Invalid audio format. Please use MP3, M4A, WAV, or OGG files.',
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 85,    // Green - auto-approve
  MEDIUM: 60,  // Yellow - suggest review
  LOW: 0,      // Red - require review
};