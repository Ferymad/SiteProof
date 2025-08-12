/**
 * Input validation and sanitization utilities
 * Story 1.3 - Critical Security Fix for SQL injection and XSS prevention
 */

/**
 * Sanitize text input to prevent XSS and SQL injection
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove SQL injection patterns
    .replace(/[';\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
    .replace(/(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi, '')
    // Remove XSS patterns
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove HTML tags but allow basic formatting
    .replace(/<(?!\/?(b|i|u|strong|em)\s*\/?>)[^>]*>/g, '')
    .substring(0, 1000) // Limit length
}

/**
 * Validate project name
 */
export function validateProjectName(name: string | null | undefined): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  const sanitized = sanitizeText(name)
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Project name is required' }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Project name must be at least 2 characters long' }
  }
  
  if (sanitized.length > 255) {
    return { isValid: false, sanitized, error: 'Project name must be less than 255 characters' }
  }
  
  // Check for valid characters only
  if (!/^[a-zA-Z0-9\s\-_.,()]+$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Project name contains invalid characters' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate location
 */
export function validateLocation(location: string | null | undefined): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  const sanitized = sanitizeText(location)
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Location is required' }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Location must be at least 2 characters long' }
  }
  
  if (sanitized.length > 255) {
    return { isValid: false, sanitized, error: 'Location must be less than 255 characters' }
  }
  
  // Allow more characters for location (addresses can have various symbols)
  if (!/^[a-zA-Z0-9\s\-_.,()#\/]+$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Location contains invalid characters' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate date
 */
export function validateDate(date: string | null | undefined): {
  isValid: boolean
  date?: Date
  error?: string
} {
  if (!date) {
    return { isValid: false, error: 'Date is required' }
  }
  
  const parsedDate = new Date(date)
  
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  // Check if date is reasonable (not too far in past or future)
  const now = new Date()
  const minDate = new Date(now.getFullYear() - 50, 0, 1)
  const maxDate = new Date(now.getFullYear() + 50, 11, 31)
  
  if (parsedDate < minDate || parsedDate > maxDate) {
    return { isValid: false, error: 'Date must be within reasonable range' }
  }
  
  return { isValid: true, date: parsedDate }
}

/**
 * Validate project metadata
 */
export function validateMetadata(metadata: unknown): {
  isValid: boolean
  sanitized: Record<string, unknown>
  error?: string
} {
  if (!metadata) {
    return { isValid: true, sanitized: {} }
  }
  
  if (typeof metadata !== 'object') {
    return { isValid: false, sanitized: {}, error: 'Metadata must be an object' }
  }
  
  const sanitized: Record<string, unknown> = {}
  const metadataObj = metadata as Record<string, unknown>
  
  // Sanitize known metadata fields
  if (metadataObj.contractValue && typeof metadataObj.contractValue === 'number') {
    if (metadataObj.contractValue >= 0 && metadataObj.contractValue <= 999999999) {
      sanitized.contractValue = metadataObj.contractValue
    }
  }
  
  if (metadataObj.mainContractor && typeof metadataObj.mainContractor === 'string') {
    const contractorValidation = sanitizeText(metadataObj.mainContractor as string)
    if (contractorValidation && contractorValidation.length <= 255) {
      sanitized.mainContractor = contractorValidation
    }
  }
  
  if (metadataObj.projectCode && typeof metadataObj.projectCode === 'string') {
    const codeValidation = sanitizeText(metadataObj.projectCode as string)
    if (codeValidation && /^[a-zA-Z0-9\-_]+$/.test(codeValidation) && codeValidation.length <= 50) {
      sanitized.projectCode = codeValidation
    }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate WhatsApp text content
 */
export function validateWhatsAppText(text: string | null | undefined): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  if (!text || typeof text !== 'string') {
    return { isValid: true, sanitized: '' } // WhatsApp text is optional
  }
  
  // For WhatsApp content, we need to be less restrictive but still safe
  const sanitized = text
    .trim()
    // Remove dangerous SQL patterns but keep most text intact
    .replace(/(\bUNION\s+SELECT\b|\bDROP\s+TABLE\b|\bDELETE\s+FROM\b)/gi, '[REMOVED]')
    // Remove script tags but keep other content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
    .substring(0, 10000) // Reasonable limit for WhatsApp content
  
  if (sanitized.length > 10000) {
    return { isValid: false, sanitized, error: 'WhatsApp content is too long' }
  }
  
  return { isValid: true, sanitized }
}