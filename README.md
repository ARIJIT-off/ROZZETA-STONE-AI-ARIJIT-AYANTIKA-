# ROZZETA-STONE-AI-ARIJIT-AYANTIKA-
AI Language Decipherment Engine

Answer questions in Bangla and watch AI decipher your grammar patterns in real time.

## Quick Start

### 1. Add your Anthropic API Key

Inside the project root folder, create a file called `.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 2. Install dependencies & start the server

```bash
npm install
node server.js
```

The server starts at **http://localhost:3012**

### 3. Open the frontend

Open the app in your browser at:
**http://localhost:3012/Rozzeta Stone.html**

---

## Project Structure

```
ROZZETA STONE APP/
├── Rozzeta Stone.html   ← Frontend (React, no build needed)
├── server.js            ← Express backend
├── package.json
└── .env                 ← Your API key (create this, never commit)
```

## How It Works

1. You answer 10 questions in Bangla
2. The backend sends all responses to Claude for grammar analysis
3. The dashboard shows word order, morphology, tense system, and language similarity
