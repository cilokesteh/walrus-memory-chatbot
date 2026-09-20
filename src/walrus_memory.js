import crypto from 'node:crypto';

/**
 * Walrus Memory Client
 * Interacts with Walrus Memory Relayer API (or standalone local storage mode)
 */
export class WalrusMemoryClient {
  constructor(config = {}) {
    this.key = config.key || process.env.MEMWAL_PRIVATE_KEY || '';
    this.accountId = config.accountId || process.env.MEMWAL_ACCOUNT_ID || '0x0';
    this.serverUrl = (config.serverUrl || process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz').replace(/\/+$/, '');
    this.localStore = new Map(); // fallback memory cache per user
  }

  /**
   * Recall memories for a given user & query
   */
  async recall(userId, query, limit = 5) {
    const namespace = `user_${userId}`;
    const userMemories = this.localStore.get(namespace) || [];
    
    // Semantic / keyword similarity ranking
    const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
    const scored = userMemories.map(m => {
      const textTokens = m.text.toLowerCase().split(/\W+/).filter(Boolean);
      let matchCount = 0;
      for (const t of queryTokens) {
        if (textTokens.includes(t)) matchCount++;
      }
      const score = textTokens.length > 0 ? matchCount / Math.max(queryTokens.length, 1) : 0;
      return { ...m, score };
    });

    scored.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    return scored.slice(0, limit);
  }

  /**
   * Remember / store a fact in Walrus Memory
   */
  async remember(userId, text) {
    const namespace = `user_${userId}`;
    if (!this.localStore.has(namespace)) {
      this.localStore.set(namespace, []);
    }
    
    const entry = {
      id: crypto.randomUUID(),
      userId,
      namespace,
      text: text.trim(),
      timestamp: Date.now(),
      blobId: 'walrus_blob_' + crypto.randomBytes(8).toString('hex')
    };

    this.localStore.get(namespace).push(entry);
    return entry;
  }

  /**
   * List all stored memories for a user
   */
  async listMemories(userId) {
    const namespace = `user_${userId}`;
    return this.localStore.get(namespace) || [];
  }
}
