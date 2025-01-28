const sheetsService = require('../services/sheets.service');
const wordpressService = require('../services/wordpress.service');
const contentService = require('../services/content.service');

class ContentController {
  async processContent(req, res) {
    try {
      const posts = await sheetsService.getPostsToProcess();
      const processed = [];
      const failed = [];
      
      for (const post of posts) {
        console.log(`[CONTENT] Processing post ${post.postId} with keyword "${post.keyword}"`);
        
        try {
          // 1. Get WordPress content
          const wpContent = await wordpressService.getPost(post.postId);
          if (!wpContent) {
            failed.push({ postId: post.postId, error: 'Failed to fetch WordPress content' });
            continue;
          }

          // 2. Enhance content
          const enhancedPost = await contentService.enhanceContent(wpContent, post.keyword);
          
          // 3. Update WordPress post
          await wordpressService.updatePost(post.postId, {
            content: enhancedPost.content
          });
          
          processed.push({
            postId: post.postId,
            status: 'success',
            enhancedAt: enhancedPost.enhanced_at
          });

          console.log(`[CONTENT] Successfully processed post ${post.postId}`);
        } catch (error) {
          console.error(`[CONTENT] Error processing post ${post.postId}:`, error);
          failed.push({ 
            postId: post.postId, 
            error: error.message 
          });
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
      console.error('[CONTENT] Error processing content:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new ContentController();