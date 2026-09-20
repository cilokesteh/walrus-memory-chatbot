import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WalrusMemoryClient } from './walrus_memory.js';
import { ChatbotEngine } from './bot_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const memoryClient = new WalrusMemoryClient();
const bot = new ChatbotEngine(memoryClient);

// Load simulation data
app.get('/api/simulation', (req, res) => {
  const filePath = path.join(__dirname, '../simulation_results.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } else {
    res.json([]);
  }
});

// Interactive chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }
    const result = await bot.chat(userId, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Walrus Memory Chatbot Showcase running at http://localhost:${PORT}`);
});
