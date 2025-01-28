const { Configuration, OpenAIApi } = require('openai');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class OpenAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      const configuration = new Configuration({ apiKey });
      this.openai = new OpenAIApi(configuration);
      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async enhanceContent(prompt, keyword, version = 'v1') {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      console.log(`[OPENAI] Sending request to enhance content (${version}) with keyword:`, keyword);
      
      // Use o1-mini for v3, gpt-4o for others
      const model = version === 'v3' ? 'o1-mini' : 'gpt-4o';
      
      const completion = await this.openai.createChatCompletion({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert content enhancer specializing in antiques and art valuation. Your task is to enhance WordPress content while maintaining HTML structure and adding compelling CTAs. Return only the enhanced content with HTML formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        // Only set max_tokens for v1 and v2
        ...(version !== 'v3' && { max_tokens: 4000 })
      });

      const enhancedContent = completion.data.choices[0].message.content;
      
      // Check for truncation
      if (completion.data.choices[0].finish_reason === 'length') {
        console.error(`[OPENAI] Response was truncated (${version})`);
        throw new Error(`Response truncated - content too long (${version})`);
      }

      console.log(`[OPENAI] Successfully received enhanced content (${version})`);
      
      return enhancedContent;
    } catch (error) {
      // Check for specific OpenAI errors
      if (error.response?.data?.error?.code === 'context_length_exceeded') {
        console.error(`[OPENAI] Context length exceeded (${version}):`, error.response.data.error);
        throw new Error(`Content too long for processing (${version})`);
      }
      
      console.error(`[OPENAI] Error enhancing content (${version}):`, error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();