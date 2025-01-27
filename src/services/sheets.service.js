const { GoogleSpreadsheet } = require('google-spreadsheet');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class SheetsService {
  constructor() {
    this.isConnected = false;
  }

  async initialize() {
    try {
      const spreadsheetId = await getSecret(secretNames.sheetsId);
      this.doc = new GoogleSpreadsheet(spreadsheetId);
      
      await this.doc.useServiceAccountAuth({
        // Empty config uses application default credentials
      });
      
      await this.doc.loadInfo();
      this.isConnected = true;
      console.log('[SHEETS] Successfully initialized');
    } catch (error) {
      console.error('[SHEETS] Initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async getPostsToProcess() {
    if (!this.isConnected) {
      throw new Error('Google Sheets connection not initialized');
    }

    const sheet = this.doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map(row => ({
      keyword: row['KWs'],
      seoTitle: row['SEO Title'],
      postId: row['Post ID']
    }));
  }
}

module.exports = new SheetsService();