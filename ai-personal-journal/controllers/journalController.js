const axios = require('axios');

const openRouterAPI = axios.create({
    baseURL: 'https://api.openrouter.com', // Replace with actual OpenRouter API URL
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    }
});

// Example: Submit a journal entry and get AI suggestions
async function submitEntry(entry) {
    try {
        // Replace '/suggestions' with the actual OpenRouter endpoint
        const response = await openRouterAPI.post('/suggestions', { entry });
        return { suggestions: response.data.suggestions || [] };
    } catch (error) {
        console.error('Error submitting entry:', error);
        throw error;
    }
}

// Example: Get suggestions based on mood (stub)
async function getSuggestions(mood) {
    // You can implement mood-based suggestions here
    return { suggestions: [`You seem ${mood}. Would you like to talk about it?`] };
}

module.exports = {
    submitEntry,
    getSuggestions
};