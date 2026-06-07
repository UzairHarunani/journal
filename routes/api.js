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

        // First check known response shapes (OpenRouter / chat completions / outputs)
        let aiReply = null;

        // 1) choices.message.content (chat-completions)
        const choice = resp?.choices?.[0];
        if (choice) {
            const msg = choice.message ?? choice;
            if (typeof msg === 'string') aiReply = msg;
            else if (typeof msg?.content === 'string') aiReply = msg.content;
            else if (Array.isArray(msg?.content?.parts)) aiReply = msg.content.parts.join(' ');
            else if (typeof choice.text === 'string') aiReply = choice.text;
        }

        // 2) output -> content -> text (other OpenRouter shapes)
        if (!aiReply && Array.isArray(resp?.output)) {
            const c0 = resp.output[0];
            aiReply = c0?.content?.[0]?.text ?? aiReply;
        }
        if (!aiReply && Array.isArray(resp?.outputs)) {
            const o0 = resp.outputs[0];
            aiReply = o0?.data?.[0]?.text ?? aiReply;
        }

        // 3) fallback common fields
        if (!aiReply && typeof resp?.data?.[0]?.text === 'string') aiReply = resp.data[0].text;
        if (!aiReply && typeof resp?.generated_text === 'string') aiReply = resp.generated_text;

        // 4) deep scan but prefer non-id and multi-word strings
        if (!aiReply) {
            function isIdLike(s) { return typeof s === 'string' && /^gen-[\w-]{6,}/i.test(s.trim()); }
            function deepFind(obj, depth = 0) {
                if (depth > 12 || obj == null) return null;
                if (typeof obj === 'string') return obj;
                if (Array.isArray(obj)) {
                    for (const it of obj) {
                        const r = deepFind(it, depth + 1);
                        if (r && !isIdLike(r) && (r.includes(' ') || r.length > 30)) return r;
                    }
                    for (const it of obj) {
                        const r = deepFind(it, depth + 1);
                        if (r && !isIdLike(r)) return r;
                    }
                    return null;
                }
                if (typeof obj === 'object') {
                    for (const v of Object.values(obj)) {
                        const r = deepFind(v, depth + 1);
                        if (r && !isIdLike(r) && (r.includes(' ') || r.length > 30)) return r;
                    }
                    for (const v of Object.values(obj)) {
                        const r = deepFind(v, depth + 1);
                        if (r) return r;
                    }
                }
                return null;
            }
            aiReply = deepFind(resp) || null;
        }

        // Final fallback: first non-empty string candidate or JSON
        if (!aiReply) {
            function collect(obj, arr, d = 0) {
                if (d > 12 || obj == null) return;
                if (typeof obj === 'string') { arr.push(obj); return; }
                if (Array.isArray(obj)) { for (const it of obj) collect(it, arr, d + 1); return; }
                if (typeof obj === 'object') { for (const v of Object.values(obj)) collect(v, arr, d + 1); }
            }
            const cand = [];
            collect(resp, cand);
            aiReply = cand.find(s => !/^gen-/.test(s)) || cand[0] || JSON.stringify(resp);
        }

        aiReply = String(aiReply).replace(/\s+/g, ' ').trim().slice(0, 4000);
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