const apiUrl = 'http://localhost:5000/api'; // Update with your backend API URL

document.addEventListener('DOMContentLoaded', () => {
    const journalForm = document.getElementById('journal-form');
    const journalInput = document.getElementById('journal-input');
    const suggestionsContainer = document.getElementById('suggestions-container');

    journalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const entry = journalInput.value;

        if (entry) {
            await submitJournalEntry(entry);
            journalInput.value = '';
        }
    });

    async function submitJournalEntry(entry) {
        try {
            const response = await fetch(`${apiUrl}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ entry }),
            });

            if (response.ok) {
                const data = await response.json();
                displaySuggestions(data.suggestions);
            } else {
                console.error('Error submitting journal entry:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion';
            suggestionElement.textContent = suggestion;
            suggestionsContainer.appendChild(suggestionElement);
        });
    }
});