const sheetsService = require('../services/sheets.service');
const wordpressService = require('../services/wordpress.service');
const openaiService = require('../services/openai.service');

class ContentController {
  async processContent(req, res) {
    try {
      const posts = await sheetsService.getPostsToProcess();
      
      for (const post of posts) {
        // 1. Get WordPress content
        const wpContent = await wordpressService.getPost(post.postId);
        if (!wpContent) continue;
        
        // 2. Enhance content with OpenAI
        const enhancedContent = await openaiService.enhanceContent(
          wpContent.content,
          post.keyword
        );
        if (!enhancedContent) continue;
        
        // 3. Update WordPress post
        await wordpressService.updatePost(post.postId, {
          content: enhancedContent
        });
      }
      
      res.json({ success: true, processed: posts.length });
    } catch (error) {
      console.error('Error processing content:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ContentController();