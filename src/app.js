const express = require('express');
const routes = require('./routes');
const sheetsService = require('./services/sheets.service');
const openaiService = require('./services/openai.service');

const app = express();

app.use(express.json());
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    sheetsConnected: sheetsService.isConnected
  });
});

module.exports = app;