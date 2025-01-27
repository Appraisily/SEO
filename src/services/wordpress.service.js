const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');
const contentStorage = require('../utils/storage');

class WordPressService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
  }

  async initialize() {
    try {
      // Get WordPress credentials from Secret Manager
      const [baseURL, username, password] = await Promise.all([
        getSecret(secretNames.wpApiUrl),
        getSecret(secretNames.wpUsername),
        getSecret(secretNames.wpPassword)
      ]);

      // Remove /wp/v2 from baseURL since it's already included
      const cleanBaseURL = baseURL.replace('/wp/v2', '');

      // Create axios instance with auth and proper base URL
      this.client = axios.create({
        baseURL: cleanBaseURL,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      });

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
      const { data: post } = await this.client.get(`/posts/${postId}`);

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
      const { data: response } = await this.client.post(`/posts/${postId}`, data);

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