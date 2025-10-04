# ai-interview-question-generator

Bootstrap project for an AI-assisted interview question generator built with **React**, **Vite**, and **TypeScript**. The starter layout includes ready-to-use folders for components, pages, utilities, and global styles so you can focus on building interactive interview workflows.

## Prerequisites

- Node.js **^20.19.0** or **>=22.12.0** (required by Vite 7)
- npm 10+

Validate your local toolchain before installing dependencies:

```powershell
node -v
npm -v
```

If your Node version is lower than 20.19.0, upgrade or switch using a version manager such as `nvm`.

## Getting started

```powershell
npm install
npm run dev
```

The dev server will print a local URL; open it in your browser to see the landing page with sample interview prompts.

## Available scripts

```powershell
npm run dev      # Start Vite in development mode with HMR
npm run build    # Type-check and generate the production build
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint against the codebase
```

## Project structure

```
src/
  components/   Reusable UI building blocks (e.g., header, cards)
  pages/        Top-level route views (Home page seeded by default)
  utils/        Helper logic such as question templates
  styles/       Global style sheets consumed by the app entry point
  assets/       Static assets bundled by Vite
```

`src/pages/Home.tsx` renders a hero section, highlights a generated question, and hooks up the utility helpers for sample prompts. `src/styles/global.css` defines the base theme consumed by `src/main.tsx`.

## Next steps

- Replace the sample question generator with your preferred AI provider or prompt chain.
- Add routing and additional pages inside `src/pages/` as needed.
- Extend the component library under `src/components/` for reusable UI primitives.

Happy building! 
