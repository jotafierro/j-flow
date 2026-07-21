# Product Definition — {Name}

> Save this file as `PRODUCT.md` at the project root.
> Run `/j-flow-project --update` to sync the backlog after edits.

---

## Product

**Name:** {working name — can change later}
**Tagline:** {one sentence: what it does and for whom}
**Problem:** {what pain or need this solves, in 2-3 sentences}

## Audience

**Primary user:** {who uses this day to day}
**Secondary user:** {admin, manager, or org — if any}
**Scale:** {personal / team / multi-tenant SaaS / public}

## Monetization

**Model:** {free / freemium / subscription / one-time / B2B SaaS}
**Free tier:** {what's free, if applicable}
**Paid tier:** {what requires payment, if applicable}

## Core Features (Phase 1 — MVP)

> Must-haves. Without these, the product has no value.

- {feature}: {one-line description}

## Value-Add Features (Phase 2)

> Differentiators. Makes the product sticky.

- {feature}: {one-line description}

## Advanced (Phase 3+)

> Post-traction. Build after MVP is validated.

- {feature}: {one-line description}

## Out of Scope (v1)

> Explicit non-goals.

- {what we are NOT building in v1}

## Tech Stack

**Layers:** {comma list of: web, api, mobile, admin — layers this project needs. Omitted layers are not scaffolded. Default when this field is absent: all four.}
**Backend:** NestJS 11 + Mongoose (MongoDB)
**API Style:** {rest|graphql}
**Web:** React + Vite + React Query + Zustand + Tailwind CSS
**Mobile:** Flutter + Riverpod + GoRouter
**Auth:** JWT (access 15min cookie + refresh 30d cookie/header)
**Infra:** Railway (API) + Vercel (web/admin) + MongoDB Atlas

## Unique Angle

{What makes this different? One paragraph.}
