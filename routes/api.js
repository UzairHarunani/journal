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
        // Lower max tokens to a safe default to avoid quota errors.
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "openai/gpt-5",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: entry }
                ],
                max_tokens: 256,
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

        const resp = response.data;
        console.log('AI raw response:', resp);

        // New robust extractor: collect strings, ignore gen-* ids, pick best candidate
        function collectStrings(obj, out = [], depth = 0) {
            if (depth > 12 || obj == null) return out;
            if (typeof obj === 'string') { out.push(obj); return out; }
            if (typeof obj === 'number' || typeof obj === 'boolean') { out.push(String(obj)); return out; }
            if (Array.isArray(obj)) { for (const it of obj) collectStrings(it, out, depth + 1); return out; }
            if (typeof obj === 'object') {
                // Prefer common fields first
                const keys = ['content','message','text','generated_text','output','outputs','data','response','body','result'];
                for (const k of keys) if (k in obj) collectStrings(obj[k], out, depth + 1);
                for (const v of Object.values(obj)) collectStrings(v, out, depth + 1);
            }
            return out;
        }

        const all = collectStrings(resp, []);
        // remove empty and whitespace-only
        const cleaned = all.map(s => String(s).replace(/\s+/g, ' ').trim()).filter(Boolean);
        // prefer multi-word or long strings that are not gen- ids
        const isGenId = s => /^gen-[\w-]+$/i.test(s);
        let aiReply = cleaned.find(s => !isGenId(s) && (s.includes(' ') || s.length > 30));
        if (!aiReply) aiReply = cleaned.find(s => !isGenId(s));
        if (!aiReply) aiReply = cleaned[0] || null;
        if (!aiReply) aiReply = JSON.stringify(resp);

        aiReply = String(aiReply).slice(0, 4000);
        console.log('AI extracted reply:', aiReply);
        return res.json({ suggestions: [aiReply] });
    } catch (error) {
        console.error('Error contacting AI:', error.response ? error.response.data : error.message);
        const respData = error.response ? error.response.data : null;

        // If provider reports insufficient credits, return safe fallback suggestions so the app still works.
        if (respData && respData.error && respData.error.code === 402) {
            console.warn('AI provider returned insufficient credits. Returning fallback suggestions.');
            const fallback = [
                "Take a few deep breaths and describe one small thing that went well today.",
                "What made you feel grateful today? Write about it in one or two sentences.",
                "If you could change one small thing about today, what would it be and why?"
            ];
            return res.json({
                suggestions: fallback,
                warning: 'Insufficient AI credits — served local fallback suggestions. Check your OpenRouter account.'
            });
        }

        const details = respData || error.message;
        return res.status(502).json({ error: 'Failed to get AI suggestions', details });
    }
});

module.exports = router;