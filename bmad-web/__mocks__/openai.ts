// Mock OpenAI for testing
export const GPT_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.1,
  max_tokens: 2000
}

const mockOpenAI = {
  audio: {
    transcriptions: {
      create: jest.fn().mockResolvedValue({
        text: 'Mock transcription result'
      })
    }
  },
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Mock chat response'
          }
        }]
      })
    }
  }
}

export default mockOpenAI