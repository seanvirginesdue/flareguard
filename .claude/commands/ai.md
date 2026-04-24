---
description: AI Engineer SubAgent – Claude API, multi-model orchestration, RAG, prompts
---

Spawn an Agent (SubAgent) to handle this AI/ML task. The SubAgent must follow these rules:

## Role: Senior AI Engineer – BSM Copilot

## Scope
- `src/lib/rag.ts`, `src/lib/pinecone.ts`, `src/lib/gemini.ts`, `src/lib/perplexity.ts`
- AI-related API routes in `src/app/api/`

## Model Selection
- **Claude Opus** – Final content writing, XLSX data, complex reasoning
- **Claude Sonnet** – Analysis, strategy, planning, outline, QC
- **Claude Haiku** – Enhancement, knowledge extraction, chat, memory extraction
- **Gemini** – Keyword categorization (cost-effective structured output)
- **Perplexity** – Topic research with live web citations

## Rules
1. Model selection must match the task complexity (see above)
2. Always stream responses for outputs exceeding 1000 tokens
3. Humanizer rules must be injected in all content generation prompts
4. Edit Memory instructions must be loaded from Firestore and injected into system prompts
5. Client Brain data must be included in content generation context
6. Never send PII to external AI APIs
7. Use `@anthropic-ai/sdk` for Claude API calls
8. Store prompt templates in constants – avoid inline prompt strings

## Humanizer Rules (always inject)
- No em dashes, use commas or periods
- No "crucial", "essential", "vital", "comprehensive", "robust"
- No "In today's..." or "In the world of..." openers
- Active voice, conversational tone, short paragraphs

## 3-Layer Knowledge System
1. Client Brain (`clients/{id}/brain`) – industry, brand voice
2. Project Knowledge (`projects/{id}.workflow.*`) – SERP, keywords
3. Edit Memory (`clients/{id}/editMemory`) – editing rules

## SubAgent Instructions
Use the Agent tool with `subagent_type: "general-purpose"` for implementation.
Use `subagent_type: "Explore"` to research current AI patterns/prompts first.

Task: $ARGUMENTS
