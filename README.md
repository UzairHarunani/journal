# AI-Powered Personal Journal

## Overview
The AI-Powered Personal Journal is a private journaling application that leverages AI to provide users with smart suggestions, sentiment analysis, and mood entries. The application aims to enhance personal reflection and productivity through intelligent prompts and positive reinforcement.

## Features
- **Private Journal**: Users can securely write and store their thoughts.
- **AI Suggestions**: Get smart prompts based on your entries, including therapy-like questions and productivity tips.
- **Sentiment Analysis**: The app analyzes your mood and provides feedback, such as "You sound stressed, want to talk about it?"
- **GPT-Generated Mood Entries**: Receive AI-generated entries that reflect your mood and thoughts.

## Project Structure
```
ai-personal-journal
├── backend
│   ├── server.js          # Entry point for the backend application
│   ├── routes
│   │   └── api.js         # API routes for handling journal entries and AI suggestions
│   └── package.json       # Backend dependencies and scripts
├── frontend
│   ├── index.html         # Main HTML document for the frontend application
│   ├── styles
│   │   └── main.css       # Styles for the frontend application
│   ├── scripts
│   │   └── app.js         # JavaScript code for user interactions and API calls
│   └── README.md          # Documentation for the frontend application
└── README.md              # Overview of the entire project
```

## Installation Instructions
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-personal-journal.git
   ```
2. Navigate to the backend directory and install dependencies:
   ```
   cd ai-personal-journal/backend
   npm install
   ```
3. Start the backend server:
   ```
   node server.js
   ```

4. Navigate to the frontend directory and open `index.html` in your browser to access the application.

## Usage
- Write your thoughts in the journal section.
- Receive AI-generated suggestions and prompts based on your entries.
- Use the sentiment analysis feature to reflect on your mood and feelings.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.