# AI Interview Question Generator

Generate hyper-relevant interview flashcards with AI. This single-page app lets candidates practice with contextual prompts, suggested talking points, and motivational notes tailored to their role and experience level.

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Configuration](#configuration)
7. [Development Workflow](#development-workflow)
8. [Deployment](#deployment)
9. [API Reference](#api-reference)
10. [Folder Structure](#folder-structure)
11. [Testing & Quality](#testing--quality)
12. [Roadmap](#roadmap)
13. [Contributing](#contributing)

---

## Project Overview

The app captures a job title and seniority level, sends them to Google’s Gemini Generative API, and converts the response into animated flashcards. Each card presents:

- A primary interview question
- Key talking points and keywords
- Guidance on what interviewers expect
- A motivational prompt to keep practice sessions encouraging

As a full-stack offering, the front end handles UX and state management while the backend responsibility is delegated to Gemini through secure environment variables.

## Key Features

- **Gemini-powered generation**: Prompts Gemini 1.5 Flash via REST to build structured question sets.
- **Adaptive card layout**: Framer Motion surfaces questions, tips, and motivation in a tactile flashcard pattern.
- **Copy-to-clipboard**: Export an entire session in one click for notes or mock interview prep.
- **Failure-resilient parsing**: Sanitizes Google responses to eliminate code snippets, markdown noise, or malformed data.
- **Accessible defaults**: Tailwind design tokens ensure high contrast, focus states, and responsive behavior.

## Architecture

```
┌─────────────┐     submit request       ┌─────────────────────────┐
│   React UI  │ ───────────────────────▶ │ Gemini REST API (1.5)   │
│  (App.tsx)  │                          │ via fetch + API key      │
└─────┬───────┘                          └─────────┬──────────────┘
      │                                         structured JSON
      │ sanitize + map                                 │
      ▼                                                 ▼
┌─────────────┐      flashcard state      ┌────────────────────────┐
│ utils/gemini│ ────────────────────────▶ │ components/QuestionCard │
└─────────────┘                          └────────────────────────┘
```

> The application is fully client-side. All secrets remain in environment variables injected at build time (e.g., Vercel/Netlify), so they never ship in the repo.

## Tech Stack

| Layer | Tools |
| --- | --- |
| UI | React 19, TypeScript 5.9, Tailwind CSS 3 |
| Animation | Framer Motion 12 |
| Tooling | Vite 7, ESLint 9, PostCSS/Tailwind pipeline |
| AI | Google Gemini 1.5 Flash (REST API) |

## Getting Started

### Prerequisites

- Node.js **≥ 20.19.0** or **≥ 22.12.0** (per Vite 7 engine requirements)
- npm 10+

Verify your versions:

```powershell
node -v
npm -v
```

### Installation

```powershell
git clone https://github.com/<your-org>/ai-interview-question-generator.git
cd ai-interview-question-generator
npm install
```

## Configuration

Environment variables must begin with `VITE_` to be exposed to the client bundle.

```powershell
copy .env.example .env
```

Then edit `.env`:

```bash
VITE_GEMINI_API_KEY=your_api_key
VITE_GEMINI_MODEL=gemini-1.5-flash-002   # optional override
VITE_GEMINI_API_VERSION=v1               # optional override
```

- Request an API key: <https://aistudio.google.com/app/apikey>
- Never commit the `.env` file (already ignored).
- Restart the dev server after changing environment values.

## Development Workflow

```powershell
npm run dev      # Start Vite with HMR on http://localhost:5173
npm run build    # Produce dist/ bundle (used by Vercel/Netlify)
npm run preview  # Serve the production build locally
npm run lint     # ESLint with TypeScript support
```

### Generating Questions

1. Start the dev server with `npm run dev`.
2. Enter a role (e.g., “Frontend Engineer”) and select a seniority level.
3. Click **Generate Questions**. The UI calls the Gemini API and flips cards into view.
4. Switch cards to review guidance, and hit **Copy All** to export the session.

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New → Project** and import the repository.
3. Framework Preset: **Vite**.
4. Build command: `npm run build`; Output directory: `dist`.
5. Add environment variables (`VITE_GEMINI_API_KEY`, optional overrides) under **Settings → Environment Variables**.
6. Deploy. Vercel will build on every push to the connected branch.

### Netlify

1. Import the repository via **Add new site → Import an existing project**.
2. Build command: `npm run build`; Publish directory: `dist`.
3. Configure environment variables under **Site settings → Environment variables**.
4. Deploy to trigger a build and host the generated assets.

## API Reference

The client hits the Gemini REST endpoint: `https://generativelanguage.googleapis.com/${VITE_GEMINI_API_VERSION}/models/${VITE_GEMINI_MODEL}:generateContent`.

Payload sample:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Generate 5 interview questions for a Frontend Engineer with 3 years experience. Include tips and keywords."
        }
      ]
    }
  ]
}
```

Responses are post-processed in `src/utils/gemini.ts` to ensure each card exposes `question`, `keywords`, `tips`, and motivational fallback text.

## Folder Structure

```
src/
├─ App.tsx            # Root component orchestrating form + cards
├─ main.tsx           # React DOM bootstrap
├─ index.css          # Tailwind entry stylesheet
├─ components/
│  ├─ Header.tsx
│  └─ QuestionCard.tsx
├─ pages/
│  └─ Home.tsx        # Landing page with generator UI
├─ utils/
│  ├─ gemini.ts       # API wrapper and parsing logic
│  └─ questionTemplates.ts # Prompt scaffolding + fallbacks
└─ assets/
   └─ react.svg
```

## Testing & Quality

- `npm run lint` – Lints TypeScript/JSX with ESLint + recommended configs.
- `npm run build` – Type-checks via Vite/TS during the bundling process.
- Suggested addition: integrate unit tests (e.g., Vitest/React Testing Library) for card formatting helpers.

## Roadmap

- [ ] Add Vitest coverage for prompt parsing edge cases.
- [ ] Provide offline mock data mode for demo scenarios.
- [ ] Support multiple AI providers with a unified adapter interface.
- [ ] Persist user sessions in localStorage for later review.

## Contributing

1. Fork the repo and create a feature branch.
2. Keep commits scoped and descriptive.
3. Run `npm run lint` before opening a pull request.
4. Describe the change, screenshots (if UI), and testing steps in the PR template.

---

Ready to practice? Fire up `npm run dev` and let Gemini tailor your next mock interview.
