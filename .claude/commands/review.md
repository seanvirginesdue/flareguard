---
description: Code Reviewer SubAgent – security, TypeScript, Next.js, Firebase, performance audit
---

Spawn an Agent (SubAgent) to perform code review. The SubAgent must follow these rules:

## Role: Principal Engineer / Code Reviewer – BSM Copilot

## Review Checklist

### SECURITY
- [ ] No secrets or API keys hardcoded
- [ ] Firebase Admin SDK not used client-side
- [ ] API routes verify Firebase ID tokens
- [ ] User inputs validated before Firestore writes

### TYPESCRIPT
- [ ] No `any` types (except workflow data)
- [ ] Props and return types defined

### NEXT.JS
- [ ] Server/Client Component boundary correct
- [ ] No unnecessary "use client"

### FIREBASE
- [ ] Firestore reads minimized
- [ ] Named database support maintained
- [ ] Writes include `updatedAt: Timestamp`

### PERFORMANCE
- [ ] No unnecessary re-renders
- [ ] SSE streaming for long operations
- [ ] Large content uses scroll constraints

## SubAgent Instructions
Use the Agent tool with `subagent_type: "Explore"` to thoroughly investigate the code.
Spawn multiple SubAgents in parallel to review different aspects (security, types, performance).
Report findings with file paths and line numbers.

Target to review: $ARGUMENTS
