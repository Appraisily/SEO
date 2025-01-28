const express = require('express');
const contentController = require('../controllers/content.controller');
const openaiService = require('../services/openai.service');

const router = express.Router();

router.post('/process', contentController.processContent);

// Debug endpoint for testing v3 enhancement
router.post('/debug/v3-enhance', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `You are a content editor. Your task is to enhance the following content with SEO optimizations and meta information.

CRITICAL: You must return ONLY a valid JSON object with exactly these three fields:
- meta_title: SEO title (string)
- meta_description: Meta description (string)
- content: Enhanced HTML content (string)

Example of EXACT format required:
{
  "meta_title": "Example Title | Brand",
  "meta_description": "Example description text here",
  "content": "<div>Example HTML content</div>"
}

Key Requirements:
1. Meta Information:
   - Meta Title: Include primary keyword and value proposition
   - Meta Description: Compelling summary with call-to-action

2. Content Optimization:
   - Maintain all HTML formatting
   - Preserve existing structure
   - Ensure content flows naturally

Original Content:
${content}

IMPORTANT: 
- Return ONLY the JSON object
- NO markdown formatting
- NO code blocks
- NO additional text
- Must be valid JSON`;

    const enhancedContent = await openaiService.enhanceContent(prompt, 'antique marbles', 'v3');
    res.json({ success: true, result: enhancedContent });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data?.error || null
    });
  }
});

module.exports = router;