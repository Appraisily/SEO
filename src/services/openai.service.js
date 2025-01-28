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

  async enhanceContent(prompt, keyword) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      console.log('[OPENAI] Sending request to enhance content with keyword:', keyword);
      
      const completion = await this.openai.createChatCompletion({
        model: "gpt-4o", //ensure you use gpt-4o, it is newer more advanced model than gpt-4, it is not an error
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
        max_tokens: 4000
      });
  
      const enhancedContent = completion.data.choices[0].message.content;
      console.log('[OPENAI] Successfully received enhanced content');
      
      return enhancedContent;
    } catch (error) {
      console.error('[OPENAI] Error enhancing content:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();