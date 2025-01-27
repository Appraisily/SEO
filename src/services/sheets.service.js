const { google } = require('googleapis');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class SheetsService {
  constructor() {
    this.isConnected = false;
    this.sheetsId = null;
    this.sheets = null;
    this.auth = null;
  }

  async initialize() {
    try {
      const credentials = JSON.parse(await getSecret(secretNames.serviceAccountJson));
      this.sheetsId = await getSecret(secretNames.sheetsId);

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ 
        version: 'v4', 
        auth: this.auth 
      });

      // Verify access by trying to get sheet properties
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.sheetsId,
        ranges: ['KWs!A1:B1'],
        fields: 'sheets.properties.title'
      });

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
      // Get values from the KWs sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'KWs!A:D', // Assuming columns are: Post ID, KWs, SEO Title, Processed
      });

      const rows = response.data.values || [];
      // Get row 9 for testing (array is 0-based, so index 8)
      const testRow = rows[8];
      if (!testRow) {
        throw new Error('Test row (row 9) not found');
      }

      console.log('[SHEETS] Testing with row 9:', {
        postId: testRow[0], // Post ID
        keyword: testRow[1], // KWs
        seoTitle: testRow[2] // SEO Title
      });

      return [{
        postId: testRow[0].trim(),
        keyword: testRow[1].trim(),
        seoTitle: testRow[2]?.trim() || ''
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
      // Update the Processed column (assumed to be column D)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsId,
        range: `KWs!D${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[new Date().toISOString()]]
        }
      });
      
      console.log(`[SHEETS] Marked row ${rowIndex + 1} as processed`);
    } catch (error) {
      console.error(`[SHEETS] Error marking row ${rowIndex + 1} as processed:`, error);
      // Don't throw error to prevent process interruption
    }
  }
}

module.exports = new SheetsService();