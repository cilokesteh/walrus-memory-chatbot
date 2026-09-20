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

// Pre-seed memories from verified simulation so the live server remembers immediately!
const simFile = path.join(__dirname, '../simulation_results.json');
if (fs.existsSync(simFile)) {
  const simData = JSON.parse(fs.readFileSync(simFile, 'utf-8'));
  for (const user of simData) {
    const namespace = `user_${user.userId}`;
    memoryClient.localStore.set(namespace, user.memories || []);
  }
  console.log(`[Memory] Pre-loaded memories for ${simData.length} users into live memory store.`);
}

const bot = new ChatbotEngine(memoryClient);

// Simulation history endpoint
app.get('/api/simulation', (req, res) => {
  if (fs.existsSync(simFile)) {
    const data = JSON.parse(fs.readFileSync(simFile, 'utf-8'));
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

// User memory inspection endpoint
app.get('/api/memories/:userId', async (req, res) => {
  const memories = await memoryClient.listMemories(req.params.userId);
  res.json({ userId: req.params.userId, count: memories.length, memories });
});

app.listen(PORT, () => {
  console.log(`Walrus Memory Chatbot Showcase running at http://localhost:${PORT}`);
});
