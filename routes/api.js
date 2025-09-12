const express = require('express');
const router = express.Router();
const axios = require('axios');

const groqAPI = axios.create({
    baseURL: 'https://api.groq.com/openai',
    headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

router.post('/submit', async (req, res) => {
    const { entry } = req.body;
    try {
        const response = await groqAPI.post('/v1/chat/completions', {
            model: "llama3-70b-8192", // <--- updated model
            messages: [
                { role: "system", content: "You are a helpful AI journal assistant. Give suggestions, prompts, or positive feedback based on the user's journal entry." },
                { role: "user", content: entry }
            ]
        });
        console.log('Groq API response:', response.data);

        if (!response.data.choices || !response.data.choices[0]) {
            console.error('Groq API error:', response.data);
            return res.status(500).json({ error: 'AI did not return any suggestions.' });
        }

        const aiReply = response.data.choices[0].message.content;
        res.json({ suggestions: [aiReply] });
    } catch (error) {
        // Improved error logging
        if (error.response) {
            console.error('Groq API error response:', error.response.data);
        } else if (error.request) {
            console.error('Groq API no response:', error.request);
        } else {
            console.error('Groq API error:', error.message);
        }
        res.status(500).json({ error: 'Failed to get AI suggestions', details: error.response?.data || error.message });
    }
});

module.exports = router;