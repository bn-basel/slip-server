# Slip Game

A philosophical consistency game where an AI Judge tests your internal coherence. Your consistency score starts at 100% and decreases when you contradict yourself.

## 🎮 Game Overview

- **Single-player mode** with AI Judge powered by GPT
- **Consistency scoring** that decreases when you contradict previous answers
- **Philosophical questions** that test your internal coherence
- **Real-time feedback** from the AI Judge

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on http://localhost:5001
   - Frontend React app on http://localhost:3000

3. **Open the game:**
   Visit http://localhost:3000 in your browser

### Optional: OpenAI API Integration

To use real GPT responses instead of mock responses:

1. Create a `.env` file in the `server` directory:
   ```bash
   cd server
   echo "OPENAI_API_KEY=sk-your-openai-api-key-here" > .env
   ```

2. Restart the server:
   ```bash
   cd server && npm run dev
   ```

## 🎯 How to Play

1. **Start the game** by clicking "Start Game" on the homepage
2. **Answer questions** thoughtfully - the AI Judge will analyze your responses
3. **Maintain consistency** - your score decreases when you contradict yourself
4. **Survive as long as possible** - the game ends when your consistency score reaches 0%

## 🛠️ Technical Details

### Backend (Node.js + Express)
- REST API endpoint: `/api/ai`
- OpenAI GPT integration with fallback to mock responses
- Session management for conversation history
- CORS enabled for frontend communication

### Frontend (React + TypeScript + Tailwind)
- Modern React components with TypeScript
- Tailwind CSS for styling
- REST API integration (no Socket.io)
- Responsive design

### API Endpoints

- `GET /api/health` - Server health check
- `POST /api/ai` - Submit conversation for AI analysis

## 🎨 Game Features

- **Beautiful UI** with Tailwind CSS
- **Real-time scoring** with visual progress bars
- **AI Judge feedback** explaining contradictions
- **Game over detection** when consistency reaches 0%
- **Restart functionality** to play again

## 🔧 Development

### Project Structure
```
slip-game/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json with dev scripts
└── README.md
```

### Available Scripts
- `npm run dev` - Start both frontend and backend
- `npm run client` - Start only frontend
- `npm run server` - Start only backend

## 🎭 Game Philosophy

Slip is designed to test your philosophical consistency through a series of thought-provoking questions. The AI Judge analyzes your responses for contradictions and adjusts your consistency score accordingly. Can you maintain your beliefs under pressure?

---

**Note:** The game works with mock AI responses by default. For the full experience with real GPT analysis, add your OpenAI API key to the server configuration.