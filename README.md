# Walrus Memory AI Chatbot — "Chatbots That Remember" 🐋🧠

> **Hackathon Submission:** DeepSurge — Walrus Session 8: Chatbots That Remember  
> **Target Track:** Main Prizes ($900) & Beyond the Big Two: Open & Alternative Models ($300)  
> **LLM Model & Runtime:** DeepSeek-V3 / Google Gemini via Custom Router  
> **Memory Infrastructure:** [Walrus Memory](https://github.com/MystenLabs/MemWal) (`@mysten-incubation/memwal`) on Sui Network & Walrus Protocol

---

## 🌟 Overview & Problem Solved

Most chatbots suffer from **amnesia**: the moment a session closes or a user switches devices, all context vanishes.
* A DeFi trader has to re-explain their slippage preferences, risk thresholds, and active collateral pools on every interaction.
* A developer has to repeatedly specify their tech stack, preferred libraries, and deployment constraints.
* Enterprise customer support agents are asked for their ticket IDs, SLAs, and emergency webhooks repeatedly.

**Walrus Support & Onboarding Bot** solves this by integrating decentralized, verifiable, cross-session memory backed by **Walrus Storage** and Sui smart contracts. Facts, constraints, and preferences are automatically remembered, cryptographically bound, and selectively recalled.

---

## 🏗️ Architecture & Integration

```
+-------------------+        +-----------------------------------------+
|   User Client     | <----> |        Walrus Chatbot Engine            |
| (Web UI/Telegram) |        +-----------------------------------------+
+-------------------+                             |
                                                  v
                              +---------------------------------------+
                              |        Walrus Memory Middleware       |
                              |   (Untrusted Memory System Boundary)  |
                              +---------------------------------------+
                                        |                   ^
                         1. Recall facts|                   | 4. Auto-save
                                        v                   |    new facts
                              +---------------------------------------+
                              |         Walrus Relayer / TEE          |
                              |  (MystenLabs/MemWal Sui Account &     |
                              |   Walrus Blob Decentralized Storage)  |
                              +---------------------------------------+
```

### 🔑 Key Implementation Highlights:
1. **Dynamic Memory Recall:** Before querying the LLM, the engine queries Walrus Memory for memories relevant to the user query and injects them into an isolated boundary (`[WALRUS MEMORY CONTEXT]`), preventing prompt injection.
2. **Alternative Model Runtime:** Built with **DeepSeek-V3 / Gemini-1.5-Pro**, completely independent of OpenAI/Anthropic to target the *Beyond the Big Two* category.
3. **Automated Fact Extraction:** Detects stated preferences, SLAs, account IDs, and user constraints across conversation turns and persists them automatically.

---

## 📊 Verified Evidence: 3 Distinct Users, >= 10 Memories Each

As required by the official hackathon rules, this bot was tested across 3 distinct personas with full multi-turn memory persistence:

| User Persona | User ID | Stored Memories | Key Context Preserved Across Turns |
| :--- | :--- | :--- | :--- |
| **Alice (DeFi Trader)** | `alice_investor` | **10 memories** | Liquid staking tokens (`sSUI`), 0.5% max slippage, $25,000 lending size, Scallop/Navi protocols, Jakarta daylight-only notifications |
| **Bob (dApp Developer)** | `bob_developer` | **11 memories** | Next.js 15, Move on Sui, Solidity EVM, Drizzle ORM, DeepSeek-V3/Gemini coding stack, dark mode WCAG AA |
| **Charlie (Support Lead)** | `charlie_support` | **11 memories** | Enterprise ID `CS-9942-CORP`, 15-min Tier 1 SLA, weekly CSV digests, ops webhook, emergency email `charlie.ops@cloudscale.xyz` |

*Full turn-by-turn logs and verified payload data are captured in [`simulation_results.json`](./simulation_results.json).*

---

## 🚀 Quick Start & Reproduction

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/walrus-memory-chatbot.git
cd walrus-memory-chatbot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in MEMWAL_PRIVATE_KEY, MEMWAL_ACCOUNT_ID (from memory.walrus.xyz)
# and your alternative model ROUTER_URL / API key.

# 4. Run automated 3-user verification simulation
npm run simulate

# 5. Launch interactive web dashboard
npm start
# Open http://localhost:3333 in your browser
```

---

## 🐛 Bug Bounty & Friction Points Surfaced

During our integration with `MystenLabs/MemWal`, we identified:
- **Official GitHub Bug Report:** [MystenLabs/MemWal#943](https://github.com/MystenLabs/MemWal/issues/943)
1. **Premature Timeout in Python SDK `wait_for_remember_jobs`:** If the bulk status endpoint omits a pending job ID during polling, the SDK prematurely drops the unreturned job from the pending array, terminating the loop and marking the job as timed out within milliseconds instead of awaiting `timeout_ms`.
2. **Missing Request Timeout on SDK Base Client:** `fetch()` in Node.js has no default timeout, which could cause indefinitely hung requests if the relayer drops connection during heavy load.

---

## 📜 License
MIT License. Built for Walrus Hackathon Session 8.
