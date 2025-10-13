const express = require('express');
const router = express.Router();
const axios = require('axios');

// Use the same env variable name as your working project
const OPENROUTER_API_KEY = process.env.MPC_KEY; // Or change to your actual key variable

router.post('/submit', async (req, res) => {
    const { entry, mood } = req.body;

    // You can customize the system prompt for journaling
    const systemPrompt = "You are a helpful AI journal assistant. Give suggestions, prompts, or positive feedback based on the user's journal entry.";

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "openai/gpt-5", // Updated to GPT-5
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: entry }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;
        res.json({ suggestions: [aiReply] });
    } catch (error) {
        console.error('Error contacting AI:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
});

module.exports = router;