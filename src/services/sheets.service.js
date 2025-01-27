const { GoogleSpreadsheet } = require('google-spreadsheet');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');
const { findSheetByTitle } = require('../utils/sheets');

class SheetsService {
  constructor() {
    this.isConnected = false;
    this.sheet = null;
  }

  async initialize() {
    try {
      const spreadsheetId = await getSecret(secretNames.sheetsId);
      this.doc = new GoogleSpreadsheet(spreadsheetId);

      // Use application default credentials
      await this.doc.useEnvAuth();
      await this.doc.loadInfo();
      
      // Find the KWs sheet
      this.sheet = findSheetByTitle(this.doc, 'KWs');
      if (!this.sheet) {
        throw new Error('Sheet "KWs" not found in the spreadsheet');
      }
      
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
    
    try {
      const rows = await this.sheet.getRows();
      // Get row 9 for testing
      const testRow = rows[8]; // 0-based index, so 8 is row 9
      if (!testRow) {
        throw new Error('Test row (row 9) not found');
      }
      
      console.log('[SHEETS] Testing with row 9:', {
        postId: testRow['Post ID'],
        keyword: testRow['KWs'],
        seoTitle: testRow['SEO Title']
      });
      
      return [{
        postId: testRow['Post ID'].trim(),
        keyword: testRow['KWs'].trim(),
        seoTitle: testRow['SEO Title']?.trim() || ''
      }];
    } catch (error) {
      console.error('[SHEETS] Error getting posts to process:', error);
      throw error;
    }
  }

  async markPostAsProcessed(rowIndex) {
    if (!this.isConnected) {
      throw new Error('Google Sheets connection not initialized');
    }
    
    try {
      const rows = await this.sheet.getRows();
      if (rowIndex >= 0 && rowIndex < rows.length) {
        rows[rowIndex].Processed = new Date().toISOString();
        await rows[rowIndex].save();
        console.log(`[SHEETS] Marked row ${rowIndex + 1} as processed`);
      }
    } catch (error) {
      console.error(`[SHEETS] Error marking row ${rowIndex + 1} as processed:`, error);
      // Don't throw error to prevent process interruption
    }
  }
}

module.exports = new SheetsService();