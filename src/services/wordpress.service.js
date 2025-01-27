const apiFetch = require('@wordpress/api-fetch');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class WordPressService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Get WordPress credentials from Secret Manager
      const [apiUrl, username, password] = await Promise.all([
        getSecret(secretNames.wpApiUrl),
        getSecret(secretNames.wpUsername),
        getSecret(secretNames.wpPassword)
      ]);

      // Configure apiFetch with the WordPress credentials
      apiFetch.use(apiFetch.createRootURLMiddleware(apiUrl));
      apiFetch.use(apiFetch.createNonceMiddleware(''));
      apiFetch.use(apiFetch.createBasicAuthMiddleware(username, password));

      this.isInitialized = true;
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
      const post = await apiFetch({
        path: `/wp/v2/posts/${postId}`,
        method: 'GET'
      });

      return {
        title: post.title.rendered,
        content: post.content.rendered
      };
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
        path: `/wp/v2/posts/${postId}`,
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