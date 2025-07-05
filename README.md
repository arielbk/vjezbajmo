# Vježbajmo Hrvatski

A web application for practicing Croatian grammar with dynamic exercises at A2.2 CEFR level.

## Features

- **Static-first approach**: Complete set of pre-written exercises available offline
- **Smart caching system**: Intelligent exercise caching and user progress tracking
- **Optional AI generation**: Generate new exercise sets with your OpenAI or Anthropic API key
- **Four exercise types**:
  - Verb Tenses in Text (paragraph completion)
  - Noun & Adjective Declension (paragraph completion)
  - Verb Aspect (isolated sentences)
  - Relative Pronouns (isolated sentences)
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

### Optional: Add API Keys

To generate new exercise sets, provide your OpenAI or Anthropic API key through the interface. This enables:

- Custom themed exercises
- Fresh content for repeated practice
- Variety in difficulty and topics

The app will automatically serve from cached exercises when possible to minimize API usage.

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Site-wide API keys (optional - for providing free tier access)
SITE_API_KEY=your_openai_or_anthropic_api_key
SITE_API_PROVIDER=openai # or anthropic

# Vercel KV Configuration (optional - will fallback to in-memory cache)
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
```

## Caching System

The app implements a sophisticated multi-tier caching system:

### Server-Side Exercise Pool

- Generated exercises are cached in Vercel KV (with in-memory fallback)
- Organized by exercise type, CEFR level, and theme
- 7-day expiration for exercise cache

### User Progress Tracking

- Tracks completed exercises in localStorage
- Prevents serving the same exercise repeatedly
- Automatic cleanup of old progress data (30 days)

### Smart Exercise Selection

1. **Static First**: New users get pre-written exercises
2. **Cache Lookup**: Check for suitable cached exercises user hasn't completed
3. **Generate Only When Needed**: Create new exercises only when cache is exhausted
4. **Cache Replenishment**: New exercises are added to shared cache

### Cache Management

- Clear progress: Reset your completion history via Settings
- Automatic cleanup: Old cache entries are automatically removed
- Fallback: System gracefully falls back to in-memory cache if KV is unavailable

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI** components
- **OpenAI & Anthropic APIs** (optional)
- **Vercel KV** for caching (optional, with in-memory fallback)
- **Zod** for validation

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── VjezbajmoApp.tsx  # Main application
│   ├── ExerciseSelection.tsx
│   ├── ParagraphExercise.tsx
│   ├── SentenceExercise.tsx
│   └── SettingsModal.tsx
├── contexts/             # React Context providers
├── data/                 # Static exercise data
├── lib/                  # Utility functions
│   ├── cache-provider.ts     # Cache abstraction layer
│   ├── user-progress.ts      # User progress tracking
│   ├── exercise-cache.ts     # Legacy cache (now using new system)
│   └── exercise-utils.ts
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
