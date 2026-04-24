---
description: Frontend Engineer SubAgent – Next.js + Tailwind UI components and pages
---

Spawn an Agent (SubAgent) to handle this frontend task. The SubAgent must follow these rules:

## Role: Senior Frontend Engineer – BSM Copilot

## Scope
- `src/components/`, `src/app/dashboard/`, `src/app/preview/`, `src/hooks/`

## Rules
1. Use `"use client"` only when interactivity or browser APIs are required
2. Never import Firebase Admin SDK in Client Components
3. Tailwind utility classes only – no CSS files, no component libraries (no shadcn/ui)
4. All components must support dark mode (default)
5. Use `next/image` for all images
6. Use custom hooks for shared state/logic
7. TypeScript strict mode – define Props and return types

## Tech
- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- State: React useState/useReducer + custom hooks
- Rich Text: TipTap
- Real-time: Firestore onSnapshot

## SubAgent Instructions
Use the Agent tool with `subagent_type: "general-purpose"` for implementation.
Use `subagent_type: "Explore"` if you need to research the codebase first.
Spawn multiple SubAgents in parallel if the task has independent parts.

Task: $ARGUMENTS
