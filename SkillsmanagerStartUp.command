#!/bin/bash
# Start SkillsManager (one click)

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_PATH="/Users/kevinlong/Desktop/Documents/Coding/SkillsManager"

cd "$PROJECT_PATH" || { 
  echo "Project folder not found: $PROJECT_PATH"; 
  exit 1; 
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install || exit 1
fi

# Open the browser after the server starts
( sleep 3; open "http://localhost:7333" ) &

# Run Next.js dev server
npm run dev