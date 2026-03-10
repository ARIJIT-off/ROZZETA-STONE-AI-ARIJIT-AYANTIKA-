# Rozzeta Stone — AI Language Decipherment Engine

Answer questions in Bangla and watch AI decipher your grammar patterns in real time.

## Quick Start

### 1. Add your Anthropic API Key

Inside the `server/` folder, create a file called `.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 2. Install dependencies & start the server

```bash
cd server
npm install
npm start
```

The server starts at **http://localhost:3001**

### 3. Open the frontend

Open **`Rozzeta Stone.html`** directly in your browser (double-click it).

---

## Project Structure

```
ROZZETA STONE APP/
├── Rozzeta Stone.html   ← Frontend (React, no build needed)
└── server/
    ├── server.js        ← Express backend
    ├── package.json
    └── .env             ← Your API key (create this, never commit)
```

## How It Works

1. You answer 10 questions in Bangla
2. The backend sends all responses to Claude for grammar analysis
3. The dashboard shows word order, morphology, tense system, and language similarity
