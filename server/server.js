const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve the HTML frontend from the parent folder
app.use(express.static(path.join(__dirname, '..')));

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = {};

// ── Question sequence ────────────────────────────────────────────────────────
const QUESTION_SEQUENCE = [
    { id: 1, english: "Hello! I'm going to ask you some simple questions. Please answer in Bangla. Let's start: What is your name?", concept: 'greeting/identity' },
    { id: 2, english: "Where do you live? Tell me about your home.", concept: 'location/place' },
    { id: 3, english: "What did you eat today? Describe your meal.", concept: 'past tense/food' },
    { id: 4, english: "Do you have a brother or sister? Tell me about them.", concept: 'family/relationships' },
    { id: 5, english: "What will you do tomorrow? Tell me your plans.", concept: 'future tense/planning' },
    { id: 6, english: "Describe this to me: A big red ball is on the table.", concept: 'adjective placement' },
    { id: 7, english: "Tell me: I gave the book to my friend.", concept: 'object-verb ordering' },
    { id: 8, english: "How do you feel right now? Are you happy or tired?", concept: 'emotion/state verbs' },
    { id: 9, english: "Tell me something that happened yesterday using 'because'.", concept: 'conjunctions/causality' },
    { id: 10, english: "Finally, can you say: 'If it rains, I will not go out'?", concept: 'conditional sentences' }
];

// ── Claude helper ─────────────────────────────────────────────────────────────
async function callClaude(messages, maxTokens = 1500) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in environment');

    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            messages
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// ── Full grammar analysis ─────────────────────────────────────────────────────
async function analyzeWithClaude(responses) {
    const conversationData = responses.map((r, i) =>
        `Q${i + 1} [Testing: ${r.concept}]\nEnglish Question: "${r.question}"\nBangla Answer: "${r.answer}"`
    ).join('\n\n');

    const prompt = `You are a computational linguistics expert specializing in Bangla (Bengali) grammar analysis.

Analyze these Bangla responses and extract grammar patterns:

${conversationData}

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "wordOrder": {
    "pattern": "SOV or SVO or VSO",
    "confidence": 0-100,
    "evidence": "brief explanation with example from responses"
  },
  "morphology": {
    "type": "Agglutinative or Fusional or Isolating",
    "confidence": 0-100,
    "evidence": "brief explanation"
  },
  "verbSystem": {
    "conjugationDetected": true,
    "tenses": ["list of tenses found"],
    "confidence": 0-100,
    "evidence": "brief explanation"
  },
  "nounSystem": {
    "casesDetected": ["nominative","accusative","dative"],
    "postpositionsUsed": true,
    "confidence": 0-100,
    "evidence": "brief explanation"
  },
  "honorifics": {
    "detected": true,
    "levels": ["intimate (তুই)","familiar (তুমি)","formal (আপনি)"],
    "confidence": 0-100
  },
  "similarLanguages": [
    {"language": "Assamese",  "similarity": 85, "reason": "Closest living relative"},
    {"language": "Hindi",     "similarity": 72, "reason": "Shared Indo-Aryan SOV structure"},
    {"language": "Sanskrit",  "similarity": 68, "reason": "Common morphological roots"},
    {"language": "Odia",      "similarity": 70, "reason": "Eastern Indo-Aryan family"},
    {"language": "Turkish",   "similarity": 45, "reason": "Shared agglutinative typology"}
  ],
  "languageFamily": "Eastern Indo-Aryan (Indo-European)",
  "overallConfidence": 0-100,
  "grammarSummary": "2-3 sentence summary of the grammar structure discovered",
  "uniqueFeatures": ["feature 1","feature 2","feature 3","feature 4"]
}`;

    const text = await callClaude([{ role: 'user', content: prompt }], 1500);
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}') + 1;
    return JSON.parse(clean.slice(start, end));
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Start a new session
app.post('/api/start', (req, res) => {
    const sessionId = Date.now().toString() + Math.random().toString(36).slice(2);
    sessions[sessionId] = { responses: [], currentQ: 0 };
    res.json({
        sessionId,
        question: QUESTION_SEQUENCE[0],
        total: QUESTION_SEQUENCE.length
    });
});

// Submit an answer
app.post('/api/respond', async (req, res) => {
    const { sessionId, answer } = req.body;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const currentQuestion = QUESTION_SEQUENCE[session.currentQ];
    session.responses.push({
        question: currentQuestion.english,
        answer,
        concept: currentQuestion.concept
    });
    session.currentQ++;

    if (session.currentQ < QUESTION_SEQUENCE.length) {
        return res.json({
            status: 'continue',
            question: QUESTION_SEQUENCE[session.currentQ],
            progress: session.currentQ,
            total: QUESTION_SEQUENCE.length
        });
    }

    // All questions answered — run analysis
    try {
        const analysis = await analyzeWithClaude(session.responses);
        delete sessions[sessionId]; // clean up
        res.json({ status: 'complete', analysis, responses: session.responses });
    } catch (err) {
        console.error('Analysis error:', err);
        res.status(500).json({ error: 'Analysis failed', details: err.message });
    }
});

// Quick snippet analyzer
app.post('/api/quick-analyze', async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'No text provided' });

    const prompt = `Analyze this Bangla text linguistically: "${text}"
Return ONLY JSON (no markdown):
{
  "wordCount": 5,
  "detectedScript": "Bengali Unicode",
  "probableWordOrder": "SOV",
  "verbsDetected": ["খেয়েছি"],
  "nounsDetected": ["বাড়ি"],
  "suffixesSpotted": ["-এ","-কে"],
  "quickInsight": "one sentence linguistic insight about the grammar structure"
}`;

    try {
        const raw = await callClaude([{ role: 'user', content: prompt }], 500);
        const clean = raw.replace(/```json|```/g, '').trim();
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}') + 1;
        res.json(JSON.parse(clean.slice(start, end)));
    } catch (err) {
        console.error('Quick analyze error:', err);
        res.status(500).json({ error: 'Analysis failed', details: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3012;
app.listen(PORT, () => {
    console.log(`\n✦ Rozzeta Stone server running at http://localhost:${PORT}`);
    console.log(`  Open Rozzeta Stone.html in your browser\n`);
});
