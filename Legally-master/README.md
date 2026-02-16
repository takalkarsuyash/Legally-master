# LegalEase – AI-Powered Legal Assistant For Common People

LegalEase provides an AI-driven system for document analysis, generation, consultation, and case management.
It integrates **ASI models** (Agentverse.ai), **MeTTa RAG**, and **Fetch.ai agents** for collaborative, context-aware legal solutions.

**Repository**: [https://github.com/ayuxy027/Legally](https://github.com/ayuxy027/Legally)

---

## Key Features

### 1. A2A Protocol Engine with ASI

* Agent collaboration: **David** (analysis), **Andrew** (formatting).
* Multi-ASI models:

  * `asi1-mini` (128K tokens, 85% acc)
  * `asi1-fast` (64K, 87%)
  * `asi1-extended` (64K, 89%)
  * `asi1-agentic` (64K, 85%)
  * `asi1-graph` (64K, 85%)
* Lawyer matching + real-time agent visualization.
* **Zeta Agent**: Deployed on Agentverse.ai ecosystem for live demonstration.

**A2A Flow (ASCII)**

```
[User Query] → [David (Analyze)] → [MeTTa RAG (Retrieve)]
                  ↓
[Andrew (Format)] ↔ [Collaborate] → [Response]
```

### 2. MeTTa RAG System

* Knowledge graphs + retrieval-augmented generation using MeTTa language.
* Precedent lookup, jurisdiction mapping, and pattern matching.
* Structured reasoning with legal knowledge graphs.

**RAG Flow (ASCII)**

```
[Query] → [Graph Traversal] → [Retrieve & Match] → [Generate Response]
```

### 3. Document Analysis & Summarization

* Upload PDFs/DOCs → summarization + interactive Q&A.
* Supports ASI/Gemini, streaming outputs, markdown export.
* Real-time processing with live visualization.

### 4. Document Generator

* Drafts: contracts, NDAs, wills, rent agreements.
* Templates + state-level customization.
* Streaming generation with Indian law compliance.
* Real-time document creation with immediate feedback.

### 5. Case Management Diary

* Case tracking, auto-notes (ASI), calendar/reminders.
* Integrated client communication tools.
* Document history and progress monitoring.

### 6. Legal Query Engine

* ASI-based query parsing with MeTTa reasoning.
* Lawyer ranking and recommendations.
* Verified lawyer database with confidence scoring.

### 7. Security & Collaboration

* OAuth + encryption.
* GDPR compliance.
* Real-time collaboration + version control.
* Multi-agent coordination via Fetch.ai and uAgents.

---

## ASI Models Overview

| Model         | Tokens | Accuracy | Speed  | Use Case                  |
| ------------- | ------ | -------- | ------ | ------------------------- |
| asi1-mini     | 128K   | 85%      | Medium | General-purpose tasks     |
| asi1-fast     | 64K    | 87%      | Fast   | Real-time responses       |
| asi1-extended | 64K    | 89%      | Slow   | Deep reasoning            |
| asi1-agentic  | 64K    | 85%      | Slow   | Agent orchestration       |
| asi1-graph    | 64K    | 85%      | Medium | Graph-based visualization |

---

## Technical Architecture

### Stacks

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, PWA.
* **AI/ML**: ASI models, MeTTa RAG, Google Gemini, Groq, Fetch.ai + uAgents, custom prompts, streaming.
* **Backend**: Supabase, Google OAuth, Flask + Python services, cloud APIs.

### Core Algorithms

1. **A2A Protocol** – agent comms, context passing.
2. **MeTTa RAG** – graph traversal + knowledge retrieval.
3. **ASI Selector** – query-based model optimization.
4. **Fetch.ai Multi-Agent** – coordinated task execution and knowledge sharing.

**System Architecture (ASCII)**

```
+----------+   +----------+   +----------+
| Frontend | ↔ | AI Layer | ↔ | Backend  |
| (React)  |   | (ASI,RAG)|   | (Supabase|
|          |   | MeTTa)   |   | Flask)   |
+----------+   +----------+   +----------+
                  ↑
             [External APIs]
```

---

## Advanced Tech Behind the Scenes

Legally integrates several layers of technology:

* **ASI:One models** for deep legal reasoning, real-time human–agent interaction, and problem-solving.
* **MeTTa language** by Hyperon for structured reasoning and legal knowledge graphs.
* **Fetch.ai and uAgents** for building cohesive multi-agent systems where agents coordinate tasks and share knowledge across environments.
* **Metta RAG system** for precedent lookup, jurisdiction mapping, and document requirements.

---

## Why Legally

* **Unique A2A protocol** with live agent collaboration and Zeta agent on Agentverse.ai.
* **Structured reasoning** with MeTTa knowledge graphs.
* **Cohesive multi-agent workflows** using Fetch.ai and uAgents.
* **ASI:One powered** human–agent interaction on Agentverse.ai.
* **RAG tuned** for India-specific legal datasets.
* **Multi-model selection** for performance trade-offs.
* **End-to-end suite** with enterprise-grade security.
* **Modern stack**, responsive UI/UX.

---

## Target Users

* **Lawyers** (independent or firm-based)
* **Corporate legal departments**
* **Law students and researchers**
* **General public** needing legal documents

---

## Getting Started

### Prerequisites

* Node.js v18+, npm/yarn.
* Python 3.10+, Flask framework.
* ASI API key, Supabase, Google OAuth credentials.

### Installation

```bash
git clone <repo-url>
cd Legally-master
## frontend server
cd frontend
npm run dev
## backend server
cd backend
npm run serve
# configure .env

```

### `.env` Example

```env
# Google AI (Gemini)
VITE_API_KEY=your_gemini_api_key
VITE_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

# Groq API
VITE_GROQ_API_KEY=your_groq_api_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ASI Configuration
VITE_ASI_KEY=your_asi_api_key

# Smart Contract
VITE_CONTRACT_ADDRESS=your_contract_address
```

---

## Project Structure

```
legally/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── ai/                 # ASI agents (David, Andrew)
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   ├── services/            # API services
│   │   ├── contexts/           # React contexts
│   │   └── types/              # TypeScript types
│   └── package.json
├── metta/                      # MeTTa RAG system (Python)
│   ├── legal_rag.py            # Legal RAG implementation
│   ├── knowledge.py            # Knowledge base
│   └── api_server.py           # Flask API server
├── server/                     # Node.js backend services
│   ├── legalMettaService.ts    # MeTTa integration service
│   └── server.ts               # Main server
└── README.md
```

---

## Impact & Vision

**Current Impact**: Legally reduces time, cost, and friction in legal work. It turns repetitive, document-heavy processes into smooth automated workflows, freeing professionals for strategy and client interaction.

**Long-term Vision**: Scaling from individual lawyers to global firms, making advanced human–agent interaction standard in the legal domain. This includes deeper integration into Agentverse.ai, more collaborative Fetch.ai ecosystems, and wider adoption of MeTTa reasoning.

**Performance**: Sub-second responses, cloud scaling, 99.9% uptime.

---

## ASI Alliance Ecosystem Integration

Legally demonstrates the power of the ASI Alliance ecosystem, showcasing how autonomous AI agents can discover each other, connect to services and APIs, reason over knowledge, and act across chains without needing niche domain expertise.

### Our ASI Alliance Implementation

**ASI:One Integration**
- Web3-native LLM and Chat Protocol for direct human-agent interaction
- Multi-model ASI architecture with specialized agents for different legal tasks
- Real-time agent collaboration with live visualization
- Zeta agent deployed on Agentverse ecosystem for live demonstration

**MeTTa Knowledge Integration**
- Structured reasoning and legal knowledge graphs using MeTTa language
- Precedent lookup, jurisdiction mapping, and pattern matching
- Legal concept recognition and document requirement analysis
- Context-aware response generation with legal expertise

**Multi-Agent Coordination**
- David and Andrew agents working together seamlessly
- Agent-to-Agent (A2A) protocol implementation
- Real-time context passing and collaboration
- Tool call tracking and progress monitoring

**Agentverse Deployment**
- Live agent listing and discoverability
- Clear demonstration of ASI capabilities
- Enhanced agent collaboration features
- Easy discovery via ASI:One

### Why This Matters

**Human-Agent Interaction**
- Intuitive interface for advanced human-agent interaction
- Clear value proposition for end users
- Smooth agent communication flow
- Real-time collaboration visualization

**Real-World Impact**
- Solves meaningful problems in the legal domain
- Reduces time, cost, and friction in legal work
- Automates repetitive, document-heavy processes
- Frees professionals for strategy and client interaction

**Technical Excellence**
- Agents properly communicating and reasoning in real time
- Effective use of ASI:One for human-agent interaction
- MeTTa-powered structured reasoning
- Cohesive multi-agent system with shared knowledge

---

## Acknowledgments

ASI (Agentverse.ai), MeTTa (Hyperon), Fetch.ai, Google Gemini, Groq, Supabase, OSS community.

---
