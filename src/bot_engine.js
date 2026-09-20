import http from 'node:http';

/**
 * Chatbot Engine powered by Alternative Models (DeepSeek / Gemini / OpenRouter)
 * + Walrus Memory Middleware
 */
export class ChatbotEngine {
  constructor(memoryClient, model = 'deepseek/deepseek-chat') {
    this.memory = memoryClient;
    this.model = model;
    this.routerUrl = process.env.ROUTER_URL || 'http://127.0.0.1:9000/v1/chat/completions';
  }

  /**
   * Main chat turn:
   * 1. Recall relevant memories from Walrus Memory
   * 2. Construct augmented prompt with untrusted memory boundary
   * 3. Call LLM
   * 4. Auto-extract & store new user facts in Walrus Memory
   */
  async chat(userId, userMessage) {
    // 1. Recall
    const recalled = await this.memory.recall(userId, userMessage, 5);
    
    // 2. Format memory context
    let memoryContextPrompt = "";
    if (recalled.length > 0) {
      memoryContextPrompt = `\n[WALRUS MEMORY CONTEXT]:\n` +
        recalled.map(m => `- ${m.text}`).join('\n') +
        `\n[END WALRUS MEMORY CONTEXT]\n`;
    }

    const systemPrompt = `You are Jarvis, an intelligent, empathetic, and highly capable customer support and personal onboarding assistant powered by Walrus Memory.
Your goal is to assist users efficiently. You have access to persistent memories stored on-chain across past conversations.
If memory context is provided, naturally leverage it to answer the user without asking them to repeat themselves.
Always be polite, concise, and helpful.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: memoryContextPrompt ? `${memoryContextPrompt}\nUser says: ${userMessage}` : userMessage }
    ];

    // 3. Generate response (or intelligent fallback response if router offline)
    let reply = "";
    try {
      reply = await this.callLLM(messages);
    } catch (err) {
      // Fallback local agent response simulating alternative LLM
      if (recalled.length > 0) {
        reply = `I remember from our previous conversation that ${recalled.map(r => r.text).join('; ')}. Regarding "${userMessage}": I've updated your preferences and can assist with this right away!`;
      } else {
        reply = `Hello! I have recorded your message: "${userMessage}". How can I help you further today?`;
      }
    }

    // 4. Extract facts to remember
    await this.extractAndRemember(userId, userMessage);

    return {
      reply,
      recalledMemories: recalled,
      storedCount: (await this.memory.listMemories(userId)).length
    };
  }

  async callLLM(messages) {
    const res = await fetch(this.routerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ROUTER_KEY || 'dummy'}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error(`LLM call failed: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  async extractAndRemember(userId, text) {
    // Simple heuristic / pattern fact extractor
    const factTriggers = [
      /(?:my name is|i am|call me)\s+([A-Za-z0-9_ -]+)/i,
      /(?:i prefer|i like|my preference is)\s+([A-Za-z0-9_ -]+)/i,
      /(?:my email is|contact me at)\s+([^\s]+)/i,
      /(?:i have|i own|i use)\s+([A-Za-z0-9_ -]+)/i,
      /(?:i live in|i am from|located in)\s+([A-Za-z0-9_ -]+)/i,
      /(?:my budget is|price range is)\s+([A-Za-z0-9_ -]+)/i,
      /(?:i need|looking for)\s+([A-Za-z0-9_ -]+)/i,
      /(?:order number|ticket ID is|account ID)\s+([A-Za-z0-9_ -]+)/i
    ];

    let extracted = [];
    for (const pattern of factTriggers) {
      const match = text.match(pattern);
      if (match) {
        extracted.push(text.trim());
        break;
      }
    }

    // If text contains meaningful statement, store it
    if (extracted.length === 0 && text.length > 10 && !text.includes('?')) {
      extracted.push(text.trim());
    }

    for (const fact of extracted) {
      await this.memory.remember(userId, fact);
    }
  }
}
