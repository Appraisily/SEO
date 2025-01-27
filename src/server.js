const app = require('./app');
const { port } = require('./config');
const sheetsService = require('./services/sheets.service');
const wordpressService = require('./services/wordpress.service');
const openaiService = require('./services/openai.service');
const contentStorage = require('./utils/storage');

async function initializeService(service, name) {
  try {
    await service.initialize();
    console.log(`[SERVER] ${name} service initialized successfully`);
    return true;
  } catch (error) {
    console.error(`[SERVER] ${name} service failed to initialize:`, error);
    return false;
  }
}

async function initialize() {
  console.log('[SERVER] Starting initialization...');
  
  // Initialize each service independently
  const sheetsInitialized = await initializeService(sheetsService, 'Google Sheets');
  const wordpressInitialized = await initializeService(wordpressService, 'WordPress');
  const openaiInitialized = await initializeService(openaiService, 'OpenAI');
  const storageInitialized = await initializeService(contentStorage, 'Storage');
  
  app.listen(port, () => {
    console.log(`[SERVER] Running on port ${port}`);
    console.log('[SERVER] Service Status:');
    console.log(`[SERVER] Sheets:    ${sheetsInitialized ? 'Connected' : 'Failed'}`);
    console.log(`[SERVER] WordPress: ${wordpressInitialized ? 'Connected' : 'Failed'}`);
    console.log(`[SERVER] OpenAI:    ${openaiInitialized ? 'Connected' : 'Failed'}`);
    console.log(`[SERVER] Storage:   ${storageInitialized ? 'Connected' : 'Failed'}`);
    
    if (!sheetsInitialized || !wordpressInitialized || !openaiInitialized || !storageInitialized) {
      console.warn('[SERVER] Warning: Some services failed to initialize');
    }
  });
}

initialize();