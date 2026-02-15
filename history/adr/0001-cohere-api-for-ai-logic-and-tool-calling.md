# ADR-0001: Cohere API for AI Logic and Tool Calling

> **Scope**: This ADR documents the decision to use Cohere API as the exclusive AI provider for natural language understanding and tool calling in the Phase III chatbot.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** phase3-chatbot
- **Context:** Phase III requires an AI-powered chatbot that can understand natural language commands and execute task management operations (add, list, complete, delete, update tasks). The system needs tool calling capabilities to map user intents to backend operations, personalized responses with user email, and conversation history management.

## Decision

Use Cohere API (cohere.chat endpoint) exclusively for all AI logic including:
- Natural language understanding and intent detection
- Tool calling with 5 MCP-style tools (add_task, list_tasks, complete_task, delete_task, update_task)
- Response generation with user personalization
- Conversation context management

**Implementation Details:**
- SDK: cohere>=4.0.0 (Python)
- Endpoint: POST https://api.cohere.ai/v1/chat
- Tool Format: Cohere's parameter_definitions schema
- Timeout: 10 seconds with exponential backoff retry
- Preamble: Custom system instructions for task management assistant

## Consequences

### Positive

- **Tool Calling Support**: Cohere provides native tool calling similar to OpenAI's function calling, enabling seamless integration with MCP-style tools
- **Cost Efficiency**: Cohere pricing is competitive compared to OpenAI, reducing operational costs for high-volume chat interactions
- **Clean REST API**: Simple HTTP-based API without complex SDK abstractions, easier to debug and monitor
- **Stateless Design Fit**: Cohere's API design aligns well with our stateless server architecture (no session management required)
- **Easy Adaptation**: Tool calling patterns are similar to OpenAI, making it easy to adapt existing knowledge and examples
- **Performance**: Fast response times suitable for real-time chat interactions (typically < 1 second)

### Negative

- **Less Mature Ecosystem**: Fewer community examples, tutorials, and third-party integrations compared to OpenAI
- **Smaller Model Selection**: Limited to Cohere's model lineup (Command, Command-R, etc.) vs OpenAI's diverse offerings
- **API Stability Risk**: Cohere is a younger company; potential for breaking API changes or service disruptions
- **Limited Advanced Features**: Lacks some advanced features like streaming responses, embeddings integration, or multi-modal capabilities
- **Vendor Lock-in**: Switching to another provider would require rewriting tool definitions and API integration code
- **Community Support**: Smaller developer community means fewer Stack Overflow answers and debugging resources

## Alternatives Considered

### Alternative 1: OpenAI Agents SDK
- **Pros**: Most mature ecosystem, extensive documentation, GPT-4 quality, streaming support, large community
- **Cons**: More expensive, complex SDK with stateful design (conflicts with our stateless architecture), requires more boilerplate code, heavier dependencies
- **Why Rejected**: The Agents SDK's stateful design conflicts with our stateless server requirement. Cohere's simpler API better fits our architecture.

### Alternative 2: Anthropic Claude API
- **Pros**: Excellent reasoning quality, strong safety features, good tool calling support, reliable API
- **Cons**: Higher cost per token, rate limits more restrictive, smaller model context window, less community adoption
- **Why Rejected**: Cost considerations and rate limits make it less suitable for a high-volume chatbot application.

### Alternative 3: Custom NLP Solution (spaCy + Rule-Based)
- **Pros**: Full control, no API costs, no vendor lock-in, works offline
- **Cons**: Requires extensive NLP expertise, months of development time, poor handling of edge cases, no natural conversation flow, high maintenance burden
- **Why Rejected**: Building custom NLP from scratch would delay Phase III by months and result in inferior user experience compared to LLM-based solutions.

### Alternative 4: Hugging Face Transformers (Self-Hosted)
- **Pros**: Open source, no per-request costs, full control, privacy
- **Cons**: Requires GPU infrastructure, high operational complexity, model fine-tuning needed, slower inference, DevOps overhead
- **Why Rejected**: Infrastructure and operational costs outweigh API costs. Team lacks ML Ops expertise for production deployment.

## References

- Feature Spec: specs/features/chatbot.md
- Implementation Plan: specs/phase3-implementation-plan.md
- Cohere Integration Spec: specs/integration/ai-cohere.md
- MCP Tools Spec: specs/api/mcp-tools.md
- Related ADRs: ADR-0004 (MCP-Style Tool Pattern)
- Evaluator Evidence: history/prompts/phase3-chatbot/001-phase3-implementation-plan.plan.prompt.md
