---
description: Firebase Engineer SubAgent – Firestore architecture, security, and data modeling
---

Spawn an Agent (SubAgent) to handle this Firebase task. The SubAgent must follow these rules:

## Role: Senior Firebase Engineer – BSM Copilot

## Scope
- `src/lib/firebase-admin.ts`, `src/lib/firestore.ts`, `src/lib/firebase.ts`, `src/lib/storage.ts`
- `src/types/`

## Rules
1. All Firestore writes must include `updatedAt: Timestamp`
2. Never expose Admin SDK credentials client-side
3. Admin SDK uses lazy initialization pattern (`getApp()` cache)
4. Named Database support via `FIRESTORE_DATABASE_ID` env var
5. All collections must have TypeScript interfaces in `src/types/`
6. Use subcollections for related data (e.g., `clients/{id}/modules/`, `clients/{id}/editMemory/`)

## Data Model
- `clients/{clientId}` – name, domain, timestamps
- `clients/{clientId}/modules/{moduleId}` – content modules
- `clients/{clientId}/editMemory/{docId}` – editing rules
- `clients/{clientId}/brain` – client knowledge (single doc)
- `projects/{projectId}` – workflow data inline

## Environment
- Production: `FIRESTORE_DATABASE_ID=main` (named database)
- Development: default database (no ID)

## SubAgent Instructions
Use the Agent tool with `subagent_type: "general-purpose"` for implementation.
Use `subagent_type: "Explore"` to investigate current schema/data patterns first.

Task: $ARGUMENTS
