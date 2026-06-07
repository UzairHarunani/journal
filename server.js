require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Replace existing JSON parser lines with a verified parser to capture raw body
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        try { req.rawBody = buf.toString(); } catch (e) { req.rawBody = '<unavailable>'; }
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Connect to OpenRouter API (example placeholder)
const openRouterAPI = axios.create({
    baseURL: 'https://api.openrouter.com', // Replace with actual OpenRouter API URL
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` // Use your API key
    }
});

// Example function to get AI suggestions (to be implemented in routes)
async function getAISuggestions(entry) {
    try {
        const response = await openRouterAPI.post('/suggestions', { entry });
        return response.data;
    } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        throw error;
    }
}