const apiUrl = 'https://journal-fddb.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    const journalForm = document.getElementById('journal-form');
    const journalInput = document.getElementById('journal-input');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const moodSelect = document.getElementById('mood-select');

    journalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const entry = journalInput.value;
        const mood = moodSelect.value;

        if (entry) {
            try {
                const response = await fetch(`${apiUrl}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entry, mood }),
                });

                if (response.ok) {
                    const data = await response.json();
                    displaySuggestions(data.suggestions);
                    saveEntry(entry, data.suggestions[0], mood); // Only save here, with AI response and mood
                    loadEntries();
                    displayLatestEntry(entry);
                    journalInput.value = '';
                } else {
                    console.error('Error submitting journal entry:', response.statusText);
                }
            } catch (error) {
                console.error('Error submitting journal entry:', error);
            }
        }
    });

    function displayLatestEntry(entry) {
        const latestEntryContainer = document.getElementById('latest-entry-container');
        const latestEntry = document.getElementById('latest-entry');
        latestEntry.textContent = entry;
        latestEntryContainer.style.display = 'block';
    }

    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion';
            suggestionElement.textContent = suggestion;
            suggestionsContainer.appendChild(suggestionElement);
        });
        suggestionsContainer.style.display = 'block';
    }

    function saveEntry(entry, aiResponse, mood = "") {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.unshift({ text: entry, aiResponse, mood, date: new Date().toISOString() });
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            entries.forEach((e, idx) => {
                const div = document.createElement('div');
                div.className = 'history-entry';
                div.innerHTML = `
    <small>${new Date(e.date).toLocaleString()}${e.mood ? ` | Mood: ${e.mood}` : ''}</small>
    <div>${e.text}</div>
    <div style="margin-top: 0.5rem;">
        <button class="ai-response-btn" data-idx="${idx}">AI Response</button>
        <button class="delete-btn" data-idx="${idx}">Delete</button>
    </div>
    <div class="ai-response" style="display:none; margin-top:0.5rem; background:#eaf3ff; border-radius:6px; padding:0.5rem; color:#174bbd;"></div>
`;
                historyContainer.appendChild(div);
            });

            // Add event listeners for delete and AI response buttons
            historyContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = this.getAttribute('data-idx');
                    deleteEntry(idx);
                });
            });

            historyContainer.querySelectorAll('.ai-response-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = this.getAttribute('data-idx');
                    const aiDiv = this.parentElement.nextElementSibling;
                    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    aiDiv.textContent = entries[idx].aiResponse || "No AI response saved.";
                    aiDiv.style.display = aiDiv.style.display === 'block' ? 'none' : 'block';
                });
            });
        }
    }

    function deleteEntry(idx) {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.splice(idx, 1);
        localStorage.setItem('journalEntries', JSON.stringify(entries));
        loadEntries();
    }

    // Call loadEntries on page load:
    loadEntries();

    document.getElementById('export-btn').addEventListener('click', () => {
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        let text = entries.map(e => `${new Date(e.date).toLocaleString()}\n${e.text}\nAI: ${e.aiResponse}\n`).join('\n---\n');
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