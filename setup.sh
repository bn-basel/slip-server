#!/bin/bash

echo "🎮 Setting up Slip Game..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit https://nodejs.org or run: brew install node"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the game, run:"
echo "   npm run dev"
echo ""
echo "This will start:"
echo "   - Backend server on http://localhost:5001"
echo "   - Frontend client on http://localhost:3000"
echo ""
echo "🎯 Features:"
echo "   - Single Player: AI judge with philosophical consistency testing"
echo "   - Real-time consistency scoring and visual feedback"
echo "   - Mock AI responses (add OpenAI API key for real GPT integration)"
echo ""
echo "🔧 Optional: Add OpenAI API key to server/.env for real AI responses"
