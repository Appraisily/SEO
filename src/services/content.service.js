const openaiService = require('./openai.service');
const contentStorage = require('../utils/storage');

class ContentService {
  async enhanceContent(post, keyword) {
    try {
      console.log(`[CONTENT] Enhancing content for post ${post.id} with keyword "${keyword}"`);
      
      // Store original content first
      await contentStorage.storeContent(post.id, post, 'original');

      // Create the prompt for GPT-4
      const prompt = this.createPrompt(post, keyword);
      
      // Enhance content with OpenAI
      const enhancedContent = await openaiService.enhanceContent(prompt, keyword);
      
      if (!enhancedContent) {
        throw new Error('Failed to enhance content');
      }

      // Create enhanced post object
      const enhancedPost = {
        ...post,
        content: enhancedContent,
        enhanced_at: new Date().toISOString()
      };

      // Store enhanced version
      await contentStorage.storeContent(post.id, enhancedPost, 'enhanced');

      return enhancedPost;
    } catch (error) {
      console.error(`[CONTENT] Error enhancing content for post ${post.id}:`, error);
      throw error;
    }
  }

  createPrompt(post, keyword) {
    return `You are an expert content enhancer. Your task is to enhance the following WordPress post by adding a section about our free screening tool. The post is about ${keyword}.

Key Requirements:
1. Maintain the existing HTML structure and formatting
2. Add a new section titled "Instant Antique & Art Valuation: Meet Our Free Screening Tool" after the introduction
3. Include clear CTAs directing to https://appraisily.com/screener
4. Keep the overall tone and style consistent with the original content
5. Ensure the new section flows naturally with the existing content

Specific Section Requirements:
- Highlight the tool's benefits: instant insights, free usage, no sign-up needed
- Mention photo upload capability and automatic detection of attributes
- Include preliminary valuation range feature
- Add email capture for detailed reports
- Make CTAs compelling but not overly promotional

Original Post JSON:
${JSON.stringify(post, null, 2)}

Please return the enhanced content in the same JSON format, maintaining all HTML formatting but including the new screener tool section. The new section should be placed after the introduction but before the main content sections.`;
  }

  stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
  }
}

module.exports = new ContentService();