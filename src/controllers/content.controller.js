const sheetsService = require('../services/sheets.service');
const wordpressService = require('../services/wordpress.service');
const openaiService = require('../services/openai.service');

class ContentController {
  async processContent(req, res) {
    try {
      const posts = await sheetsService.getPostsToProcess();
      const processed = [];
      const failed = [];
      
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        console.log(`[CONTENT] Processing post ${post.postId} with keyword "${post.keyword}"`);
        
        // 1. Get WordPress content
        try {
          const wpContent = await wordpressService.getPost(post.postId);
          if (!wpContent) {
            failed.push({ postId: post.postId, error: 'Failed to fetch WordPress content' });
            continue;
          }
        
          // 2. Enhance content with OpenAI
          const enhancedContent = await openaiService.enhanceContent(
            wpContent.content,
            post.keyword
          );
          if (!enhancedContent) {
            failed.push({ postId: post.postId, error: 'Failed to enhance content' });
            continue;
          }
        
          // 3. Update WordPress post
          await wordpressService.updatePost(post.postId, {
            content: enhancedContent
          });
          
          // 4. Mark as processed in sheet
          await sheetsService.markPostAsProcessed(i);
          
          processed.push(post.postId);
          console.log(`[CONTENT] Successfully processed post ${post.postId}`);
        } catch (error) {
          console.error(`[CONTENT] Error processing post ${post.postId}:`, error);
          failed.push({ postId: post.postId, error: error.message });
        }
      }
      
      res.json({
        success: true,
        summary: {
          total: posts.length,
          processed: processed.length,
          failed: failed.length
        },
        processed,
        failed
      });
    } catch (error) {
      console.error('Error processing content:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ContentController();