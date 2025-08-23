const express = require('express');
const router = express.Router();
const { getSuggestions, submitEntry } = require('../controllers/journalController');

// Route to submit a journal entry
router.post('/entries', async (req, res) => {
    try {
        const entry = req.body.entry;
        const response = await submitEntry(entry);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting entry', error });
    }
});

// Route to get AI suggestions based on sentiment analysis
router.get('/suggestions', async (req, res) => {
    try {
        const { mood } = req.query;
        const suggestions = await getSuggestions(mood);
        res.status(200).json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving suggestions', error });
    }
});

module.exports = router;