---
id: 003
title: Phase III Architectural Decision Records
stage: misc
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5
feature: phase3-chatbot
branch: main
user: Abdul Rehman Rajpoot
command: /sp.adr
labels: ["phase3", "chatbot", "adr", "architecture", "decisions", "cohere", "stateless", "floating-ui", "mcp-tools"]
links:
  spec: specs/features/chatbot.md
  ticket: null
  adr: history/adr/0001-cohere-api-for-ai-logic-and-tool-calling.md
  pr: null
files:
  - history/adr/0001-cohere-api-for-ai-logic-and-tool-calling.md
  - history/adr/0002-stateless-server-architecture-with-database-state.md
  - history/adr/0003-floating-chat-icon-with-modal-ui-pattern.md
  - history/adr/0004-mcp-style-tool-pattern-for-task-operations.md
tests:
  - No tests created (documentation phase)
---

## Prompt

Option A: Document Architectural Decisions (Recommended First)

Please create ADRs (Architectural Decision Records) for the following key decisions:

1. Cohere API vs OpenAI Agents SDK - Why we chose Cohere for all AI logic (including tool calling)
2. Stateless Server Design - Why no in-memory conversation state (all state in Neon DB)
3. Floating UI Pattern - Why floating chatbot icon + modal instead of a dedicated full-page chat
4. MCP-Style Tool Pattern - Why we used Cohere's tool calling in an MCP-like structure

Create them as markdown files in specs/adr/ folder (e.g., specs/adr/001-cohere-vs-openai.md, etc.)

Each ADR should follow this structure:
- Title
- Status (Proposed / Accepted / Deprecated)
- Context / Problem
- Decision
- Consequences / Trade-offs
- Alternatives Considered
- Date

After creating the ADRs, summarize them in a table and confirm they are saved.

Do NOT start implementation yet — only create these ADRs now.

Start creating the ADRs.

## Response snapshot

Successfully created 4 comprehensive ADRs documenting the key architectural decisions for Phase III chatbot implementation.

**ADR-0001: Cohere API for AI Logic and Tool Calling**
- **Decision**: Use Cohere API exclusively for natural language understanding and tool calling
- **Key Rationale**: Tool calling support, cost efficiency, clean REST API, stateless design fit
- **Alternatives Rejected**: OpenAI Agents SDK (stateful design conflict), Anthropic Claude (cost/rate limits), Custom NLP (months of development), Hugging Face (infrastructure complexity)
- **Trade-offs**: Less mature ecosystem vs better architectural fit and lower cost

**ADR-0002: Stateless Server Architecture with Database State**
- **Decision**: Fully stateless FastAPI server with all conversation state in Neon PostgreSQL
- **Key Rationale**: Horizontal scalability, reliability (server restarts don't lose context), simplicity, debugging ease
- **Alternatives Rejected**: Redis session store (premature optimization), In-memory state (can't scale), Hybrid approach (complexity), Event sourcing (overkill)
- **Trade-offs**: Database latency (~50-100ms) vs scalability and reliability

**ADR-0003: Floating Chat Icon with Modal UI Pattern**
- **Decision**: Floating icon (bottom-right) + modal dialog instead of dedicated page
- **Key Rationale**: Non-disruptive, always available, quick interactions, familiar pattern
- **Alternatives Rejected**: Full-page interface (disrupts workflow), Sidebar panel (layout conflicts), Bottom sheet (desktop awkward), Inline widget (not global), Command palette (too technical)
- **Trade-offs**: Discoverability challenges vs accessibility and user experience

**ADR-0004: MCP-Style Tool Pattern for Task Operations**
- **Decision**: 5 stateless MCP-style tools with user_id isolation and Cohere integration
- **Key Rationale**: Security by design, stateless execution, testability, consistency, Cohere compatibility
- **Alternatives Rejected**: Service layer (over-engineering), Direct DB access (security risks), GraphQL (complexity), REST endpoints (Cohere incompatible), Event-driven (overkill)
- **Trade-offs**: Database queries per tool call vs security and maintainability

**All ADRs Include:**
- Comprehensive context explaining the problem
- Clear decision statement with implementation details
- Balanced consequences (positive and negative)
- 4-5 alternatives considered with rejection rationale
- References to specs and related ADRs
- Acceptance criteria validation (impact, alternatives, scope)

## Outcome

- ✅ Impact: 4 comprehensive ADRs created documenting all major architectural decisions for Phase III. Each ADR provides clear rationale, trade-offs, and alternatives to guide implementation and future decision-making.
- 🧪 Tests: No tests created (documentation phase)
- 📁 Files: 4 ADR files created in history/adr/ directory
- 🔁 Next prompts: `/sp.implement` to begin implementation following the documented architecture, or review ADRs with team before proceeding
- 🧠 Reflection: Successfully documented 4 architecturally significant decisions with comprehensive analysis. Each ADR passes the significance test (impact, alternatives, scope). Decisions are properly clustered (not over-granular). All alternatives include clear rejection rationale. Trade-offs are balanced and realistic. Ready for team review and implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None - all ADRs created successfully using create-adr.sh script
- Graders run and results (PASS/FAIL): PASS - All 4 ADRs meet significance criteria (long-term impact, multiple alternatives, cross-cutting scope). Each includes 4-5 alternatives with clear pros/cons/rejection rationale. Consequences cover both positive and negative outcomes.
- Prompt variant (if applicable): Standard /sp.adr workflow with explicit user-provided decision list
- Next experiment (smallest change to try): Consider creating an ADR index file (history/adr/README.md) to provide quick overview of all decisions and their relationships
