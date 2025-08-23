const express = require('express');
const router = express.Router();
const axios = require('axios');

const openRouterAPI = axios.create({
    baseURL: 'https://api.openrouter.com', // Replace with actual OpenRouter API URL
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    }
});

router.post('/submit', async (req, res) => {
    const { entry } = req.body;
    try {
        // Call OpenRouter AI API with the journal entry
        const response = await openRouterAPI.post('/suggestions', { entry });
        res.json({ suggestions: response.data.suggestions || [] });
    } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
});

module.exports = router;