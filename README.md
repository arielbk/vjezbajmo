# Vježbajmo Hrvatski

A web application for practicing Croatian grammar with dynamic exercises at A2.2 CEFR level.

## Features

- **Static-first approach**: Complete set of pre-written exercises available offline
- **Optional AI generation**: Generate new exercise sets with your OpenAI API key
- **Four exercise types**:
  - Verb Tenses in Text (paragraph completion)
  - Noun & Adjective Declension (paragraph completion)  
  - Verb Aspect (isolated sentences)
  - Interrogative Pronouns (isolated sentences)
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Accessibility**: Full keyboard navigation and WCAG 2.1 compliance
- **Secure validation**: Server-side answer checking for generated exercises

## Getting Started

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Optional: Add OpenAI API Key

To generate new exercise sets, provide your OpenAI API key through the interface. This enables:
- Custom themed exercises
- Fresh content for repeated practice
- Variety in difficulty and topics

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI** components
- **OpenAI API** (optional)
- **Zod** for validation

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── VjezbajmoApp.tsx  # Main application
│   ├── ExerciseSelection.tsx
│   ├── ParagraphExercise.tsx
│   └── SentenceExercise.tsx
├── contexts/             # React Context providers
├── data/                 # Static exercise data
├── lib/                  # Utility functions
└── types/               # TypeScript type definitions
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```
