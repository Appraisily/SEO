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

  async enhanceContent(content, keyword) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const completion = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Enhance the following content for SEO using the keyword "${keyword}":\n\n${content}`,
        max_tokens: 2000,
        temperature: 0.7,
      });
  
      return completion.data.choices[0].text.trim();
    } catch (error) {
      console.error('[OPENAI] Error enhancing content:', error);
      return null;
    }
  }
}

module.exports = new OpenAIService();