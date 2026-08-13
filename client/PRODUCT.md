# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want a personal place to gather sources, learn from them by chatting, and send useful outputs into tools they already use. Exact primary persona (student vs researcher vs professional) is still open.

## Product Purpose

ShelfLM is a workspace-based learning product. A user creates workspaces, feeds them sources, and chats with that material to understand it. Beyond Q&A, the product is meant to help them act on what they learn by connecting to external tools — for example saving notes to Notion, generating diagrams in Eraser, and more integrations over time.

Success means a user can go from raw sources → clear understanding via chat → useful artifacts and exports in the tools they already work in.

## Positioning

Not only “chat with your PDFs.” ShelfLM is a personal knowledge workspace with source ingestion and grounded chat, plus an integration layer that pushes learning outputs into the user’s existing stack (Notion, Eraser, and expanding).

## Operating Context

- Users organize work in **workspaces**
- Each workspace holds **sources** (PDF, website, YouTube, text/markdown) that are processed for retrieval
- Users **chat** with workspace sources (streaming, optional web search, conversation history)
- Users can generate **learning artifacts** (summary, takeaways, flashcards, quiz, mindmap, report)
- Users may manage **memories** that personalize ongoing chat
- Planned / product-intent **integrations** send results outward (Notion notes, Eraser diagrams, and more)

## Capabilities and Constraints

**Shipped in backend today**
- Auth via better-auth (Google)
- Workspace CRUD
- Source add/list/delete: PDF upload, website import, YouTube import, text/markdown
- Async source processing (extract → chunk → embed/index) with status PENDING / PROCESSING / READY / FAILED
- Conversations + streaming RAG chat
- Learning artifact generation (async)
- User memory CRUD (Mem0)

**Product direction (confirmed, not yet in codebase)**
- Notion: save notes
- Eraser: generate diagrams
- Additional integrations (“and so many things”) — specific set still open

**Undecided**
- Primary audience persona
- Full integration catalog and priority order
- Whether integrations are first-class workspace actions, chat tools, or both

**Terminology to preserve:** ShelfLM, workspace, source, conversation, artifact, memory, integration

## Brand Commitments

- Product name: **ShelfLM**
- No other binding voice, logo, or identity constraints confirmed yet

## Evidence on Hand

- Backend API and domain model under `../server` (workspaces, sources, chat, artifacts, memory)
- Client is early Next.js shell with shadcn/ui primitives; no product UI flows yet
- Do not fabricate testimonials, customer logos, benchmarks, or shipped-integration demos

## Product Principles

1. **Workspace is the unit of learning** — sources, chat, and outputs belong to a focused space.
2. **Sources first, then talk** — grounded chat over material the user actually fed in.
3. **Understanding should become action** — artifacts and integrations turn learning into notes, diagrams, and other lasting work.
4. **Be honest about readiness** — processing/generation states and failures are part of the product, not edge cases.
5. **Extend outward carefully** — integrations amplify ShelfLM; they should not blur what the product itself owns.
