const apiUrl = 'https://journal-fddb.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    const journalForm = document.getElementById('journal-form');
    const journalInput = document.getElementById('journal-input');
    const suggestionsContainer = document.getElementById('suggestions-container');

    journalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const entry = journalInput.value;

        if (entry) {
            await submitJournalEntry(entry);
            displayLatestEntry(entry); // <-- Show the user's entry
            saveEntry(entry); // <-- Save to local storage
            loadEntries();    // <-- Refresh history
            journalInput.value = '';
        }
    });

    function displayLatestEntry(entry) {
        const latestEntryContainer = document.getElementById('latest-entry-container');
        const latestEntry = document.getElementById('latest-entry');
        latestEntry.textContent = entry;
        latestEntryContainer.style.display = 'block';
    }

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
            const errorData = await error.response?.json?.();
            console.error('Error submitting journal entry:', errorData || error);
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
        document.getElementById('suggestions-container').style.display = 'block';
    }

    function saveEntry(entry) {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.unshift({ text: entry, date: new Date().toISOString() });
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            entries.forEach(e => {
                const div = document.createElement('div');
                div.className = 'history-entry';
                div.innerHTML = `<div>${e.text}</div><small>${new Date(e.date).toLocaleString()}</small>`;
                historyContainer.appendChild(div);
            });
        }
    }

    // Call loadEntries on page load:
    loadEntries();

    document.getElementById('export-btn').addEventListener('click', () => {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        let text = entries.map(e => `${new Date(e.date).toLocaleString()}\n${e.text}\n`).join('\n---\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Daily prompt logic
    const prompts = [
        "What was one thing you learned today?",
        "Describe a moment that made you smile.",
        "What challenge did you overcome today?",
        "How are you feeling right now?"
    ];
    document.getElementById('daily-prompt').textContent =
        prompts[new Date().getDate() % prompts.length];

});