const apiFetch = require('@wordpress/api-fetch');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');
const contentStorage = require('../utils/storage');

class WordPressService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Get WordPress credentials from Secret Manager
      const [baseURL, username, password] = await Promise.all([
        getSecret(secretNames.wpApiUrl),
        getSecret(secretNames.wpUsername),
        getSecret(secretNames.wpPassword)
      ]);

      // Configure apiFetch defaults
      apiFetch.defaults = {
        baseURL,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      };

      this.isInitialized = true;
      await contentStorage.initialize();
      console.log('[WORDPRESS] Successfully initialized');
    } catch (error) {
      console.error('[WORDPRESS] Initialization failed:', error);
      throw error;
    }
  }

  async getPost(postId) {
    if (!this.isInitialized) {
      throw new Error('WordPress service not initialized');
    }

    try {
      console.log(`[WORDPRESS] Fetching post ${postId}`);
      const post = await apiFetch({
        url: `/wp/v2/posts/${postId}`,
        method: 'GET'
      });

      const content = {
        id: post.id,
        title: post.title.rendered,
        content: post.content.rendered,
        excerpt: post.excerpt.rendered,
        modified: post.modified,
        status: post.status
      };

      // Store the original content
      await contentStorage.storeContent(postId, content, 'original');
      
      return content;
    } catch (error) {
      console.error(`[WORDPRESS] Failed to fetch post ${postId}:`, error);
      throw new Error(`Failed to fetch post ${postId}`);
    }
  }

  async updatePost(postId, data) {
    if (!this.isInitialized) {
      throw new Error('WordPress service not initialized');
    }

    try {
      const response = await apiFetch({
        url: `/wp/v2/posts/${postId}`,
        method: 'POST',
        data
      });

      return {
        success: true,
        postId: response.id
      };
    } catch (error) {
      console.error(`[WORDPRESS] Failed to update post ${postId}:`, error);
      throw new Error(`Failed to update post ${postId}`);
    }
  }
}

module.exports = new WordPressService();