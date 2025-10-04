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

### Configure the Gemini API key

The UI generates questions via the Google Gemini Generative Language API. Provide your API key in a `.env` file before attempting to generate questions:

```text
cp .env.example .env
# edit .env and set VITE_GEMINI_API_KEY=AIzaSy...
```

> ⚠️ Never commit your real API key. The `.env` file is already listed in `.gitignore`.
> New Gemini API keys are available at <https://aistudio.google.com/app/apikey>.

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
  App.tsx         Main UI and Gemini integration
  main.tsx        React entry point
  index.css       Tailwind entry stylesheet
  components/     Reusable UI building blocks (e.g., header, cards)
  pages/          Top-level route views (Home page seeded by default)
  utils/          Helper logic such as question templates and Gemini helper
  assets/         Static assets bundled by Vite
```

## API usage

- Interview generation lives in `src/utils/gemini.ts` and targets `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`.
- The helper auto-formats prompts, trims Gemini responses, and falls back to curated questions if the API is unavailable.
- The `App` component consumes this helper and uses `import.meta.env.VITE_GEMINI_API_KEY` at runtime while surfacing clipboard and error feedback.

## Next steps

- Replace the sample question generator with your preferred AI provider or prompt chain.
- Add routing and additional pages inside `src/pages/` as needed.
- Extend the component library under `src/components/` for reusable UI primitives.

Happy building! 
