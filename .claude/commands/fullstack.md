---
description: Fullstack Engineer SubAgent – API routes, SSE streaming, Firebase integration
---

Spawn an Agent (SubAgent) to handle this fullstack task. The SubAgent must follow these rules:

## Role: Senior Full-Stack Engineer – BSM Copilot

## Scope
- `src/app/api/` – all API routes
- `src/lib/agent-tools.ts`

## Rules
1. All API routes must verify Firebase ID tokens via Admin Auth
2. API routes use `NextRequest`/`NextResponse` pattern
3. Long operations use SSE streaming (not WebSocket)
4. Never return raw Firestore documents – map to typed responses
5. Error responses must include meaningful messages

## Auth Pattern
```typescript
const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");
const decoded = await getAdminAuth().verifyIdToken(token);
```

## SSE Pattern
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const send = (event: string, data: any) => {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };
    send("progress", { step: 1, message: "Processing..." });
    send("complete", { result });
    controller.close();
  }
});
return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
```

## SubAgent Instructions
Use the Agent tool with `subagent_type: "general-purpose"` for implementation.
Use `subagent_type: "Explore"` to research existing API routes first.

Task: $ARGUMENTS
