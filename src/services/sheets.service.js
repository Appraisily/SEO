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

  async getNextUnprocessedPost() {
    if (!this.isConnected) {
      throw new Error('Google Sheets connection not initialized');
    }
    
    try {
      // Get all rows from the KWs sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'KWs!A:D', // Columns: KWs, SEO Title, Post ID, Processed Date
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) { // Only headers or empty
        console.log('[SHEETS] No posts found in sheet');
        return null;
      }

      // Skip header row and find first unprocessed row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[3]) { // Column D (index 3) is empty - not processed
          console.log('[SHEETS] Found unprocessed post in row:', i + 1);
          return {
            keyword: row[0]?.trim() || '',
            seoTitle: row[1]?.trim() || '',
            postId: row[2]?.trim() || '',
            rowNumber: i + 1 // Actual spreadsheet row number (1-based)
          };
        }
      }

      console.log('[SHEETS] No unprocessed posts found');
      return null;
    } catch (error) {
      console.error('[SHEETS] Error getting next unprocessed post:', error);
      throw error;
    }
  }

  async markPostAsProcessed(post) {
    if (!this.isConnected) {
      throw new Error('Google Sheets connection not initialized');
    }
    
    try {
      const rowNumber = post.rowNumber;
      if (!rowNumber) {
        throw new Error('Row number not provided for post update');
      }

      // Update the Processed column (column D) for the specific row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsId,
        range: `KWs!D${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[new Date().toISOString()]]
        }
      });
      
      console.log(`[SHEETS] Marked row ${rowNumber} as processed`);
    } catch (error) {
      console.error(`[SHEETS] Error marking row as processed:`, error);
      throw error;
    }
  }
}

module.exports = new SheetsService();