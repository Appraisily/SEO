const { Storage } = require('@google-cloud/storage');

class ContentStorage {
  constructor() {
    this.storage = new Storage();
    this.bucketName = 'images_free_reports';
  }

  async initialize() {
    try {
      const [bucket] = await this.storage.bucket(this.bucketName).get();
      this.bucket = bucket;
      console.log('[STORAGE] Successfully initialized');
      return true;
    } catch (error) {
      console.error('[STORAGE] Initialization failed:', error);
      throw error;
    }
  }

  async storeContent(postId, content, type = 'original') {
    const fileName = `seo_content/${postId}/${type}-${Date.now()}.json`;
    const file = this.bucket.file(fileName);
    
    const metadata = {
      contentType: 'application/json',
      metadata: {
        postId,
        type,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await file.save(JSON.stringify(content, null, 2), {
        metadata,
        resumable: false
      });
      
      console.log(`[STORAGE] Stored ${type} content for post ${postId}`);
      return fileName;
    } catch (error) {
      console.error(`[STORAGE] Failed to store ${type} content for post ${postId}:`, error);
      throw error;
    }
  }

  async getContent(fileName) {
    try {
      const file = this.bucket.file(fileName);
      const [content] = await file.download();
      return JSON.parse(content.toString());
    } catch (error) {
      console.error(`[STORAGE] Failed to retrieve content ${fileName}:`, error);
      throw error;
    }
  }
}

module.exports = new ContentStorage();