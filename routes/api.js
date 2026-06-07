const express = require('express');
const router = express.Router();
const axios = require('axios');

// Use the same env variable name as your working project
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.MPC_KEY; // support both names

// Health endpoint so frontend /curl can verify reachability
router.get('/health', (req, res) => {
    return res.json({ status: 'ok' });
});

router.post('/submit', async (req, res) => {
    // Log headers/body to help debug bad requests (remove or reduce logging in production)
    console.log('[/api/submit] headers:', req.headers);
    console.log('[/api/submit] body:', req.body);

    const { entry, mood } = req.body || {};

    if (!entry || typeof entry !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "entry" in request body' });
    }

    if (!OPENROUTER_API_KEY) {
        console.error('Missing OPENROUTER_API_KEY env var');
        return res.status(500).json({ error: 'Server misconfigured: missing OPENROUTER_API_KEY' });
    }

    // You can customize the system prompt for journaling
    const systemPrompt = "You are a helpful AI journal assistant. Give suggestions, prompts, or positive feedback based on the user's journal entry.";

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "openai/gpt-5",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: entry }
                ],
                max_tokens: 512,        // limit tokens to avoid exceeding quota
                temperature: 0.7,
                n: 1
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            }
        );

        const aiReply = response.data?.choices?.[0]?.message?.content || String(response.data);
        return res.json({ suggestions: [aiReply] });
    } catch (error) {
        console.error('Error contacting AI:', error.response ? error.response.data : error.message);
        const respData = error.response ? error.response.data : null;
        // If provider reports insufficient credits / payment required, return 402-like info
        if (respData && respData.error && respData.error.code === 402) {
            return res.status(402).json({
                error: 'Insufficient credits for AI request',
                details: respData.error.message || respData
            });
        }
        const details = respData || error.message;
        return res.status(502).json({ error: 'Failed to get AI suggestions', details });
    }
});

module.exports = router;