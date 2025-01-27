const express = require('express');
const contentController = require('../controllers/content.controller');

const router = express.Router();

router.post('/process', contentController.processContent);

module.exports = router;