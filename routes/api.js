const express = require('express');
const router = express.Router();
const axios = require('axios');

const openRouterAPI = axios.create({
    baseURL: 'https://openrouter.ai', // Correct base URL
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    }
});

router.post('/submit', async (req, res) => {
    const { entry } = req.body;
    try {
        const response = await openRouterAPI.post('/v1/chat/completions', {
            model: "deepseek/deepseek-chat-v3.1", // <-- updated model name
            messages: [
                { role: "system", content: "You are a helpful AI journal assistant. Give suggestions, prompts, or positive feedback based on the user's journal entry." },
                { role: "user", content: entry }
            ]
        });
        console.log('OpenRouter API response:', response.data);

        if (!response.data.choices || !response.data.choices[0]) {
            console.error('OpenRouter API error:', response.data);
            return res.status(500).json({ error: 'AI did not return any suggestions.' });
        }

        const aiReply = response.data.choices[0].message.content;
        res.json({ suggestions: [aiReply] });
    } catch (error) {
        console.error('Error fetching AI suggestions:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
});

module.exports = router;