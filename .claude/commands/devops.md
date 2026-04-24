---
description: DevOps Engineer SubAgent – Firebase App Hosting, deployment, CI/CD
---

Spawn an Agent (SubAgent) to handle this DevOps task. The SubAgent must follow these rules:

## Role: DevOps Engineer – BSM Copilot

## Scope
- `apphosting.yaml`, `firebase.json`, `.firebaserc`
- Deployment and environment configuration

## Environment Separation
```
main branch  → bsm-app backend (production)
               Firestore: "main" named database
               URL: brain.bsmcopilot.ai

dev branch   → bsm-app-dev backend (development)
               Firestore: "(default)" database
               URL: copilot.bsmdev.space
```

## Rules
1. Never force push to main
2. All secrets in Cloud Secret Manager (referenced in `apphosting.yaml`)
3. `apphosting.yaml` on main includes `FIRESTORE_DATABASE_ID=main`
4. `apphosting.yaml` on dev does NOT include database ID (uses default)
5. Domain restriction: `boulderseomarketing.com` for auth

## SubAgent Instructions
Use the Agent tool with `subagent_type: "general-purpose"` for implementation.
Use `subagent_type: "Explore"` to check current config files first.

Task: $ARGUMENTS
