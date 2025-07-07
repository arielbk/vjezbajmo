# Vježbajmo Hrvatski

A web application for practicing Croatian grammar with dynamic exercises and user accounts.

## Features

- **User Authentication**: Sign up/sign in with Clerk for progress sync across devices
- **Anonymous Usage**: Use the app without signing up - local progress is maintained
- **Static-first approach**: Complete set of pre-written exercises available offline
- **Smart caching system**: Intelligent exercise caching and user progress tracking
- **Authenticated AI generation**: Generate new exercises by signing in or providing your own API key
- **Four exercise types**:
  - Verb Tenses in Text (paragraph completion)
  - Noun & Adjective Declension (paragraph completion)
  - Verb Aspect (isolated sentences)
  - Relative Pronouns (isolated sentences)
- **Progress Migration**: Local progress automatically syncs when you sign up
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

### Setup Authentication

1. Create a [Clerk](https://clerk.com) account
2. Create a new application in your Clerk dashboard
3. Copy your Publishable Key and Secret Key
4. Add them to your `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Optional: Add API Keys for Exercise Generation

To enable server-side exercise generation for authenticated users, add your AI provider API keys:

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Redirect URLs (Optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Site-wide AI API keys (optional - enables server-side generation for authenticated users)
SITE_API_KEY=your_openai_or_anthropic_api_key
SITE_API_PROVIDER=openai # or anthropic

# Vercel KV Configuration (optional - will fallback to in-memory cache)
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token

# Webhook signing secret (optional - for Clerk webhooks)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

## Authentication & User Progress

### Anonymous Usage
- Use the app immediately without signing up
- Static exercises work offline
- Progress stored in browser's local storage
- Generate exercises by providing your own API key

### Authenticated Usage  
- Sign up for free to unlock server-side exercise generation
- Progress syncs across all your devices
- Local progress automatically migrates when you sign up
- Generate unlimited exercises using site API keys

### Exercise Generation Access
- **Anonymous + Own API Key**: Full access with your OpenAI/Anthropic key
- **Authenticated**: Full access using site API keys  
- **Anonymous + No API Key**: Static exercises only

## Caching System

The app implements a sophisticated multi-tier caching system:

### Server-Side Exercise Pool

- Generated exercises are cached in Vercel KV (with in-memory fallback)
- Organized by exercise type, CEFR level, and theme
- 7-day expiration for exercise cache

### User Progress Tracking

- **Anonymous Users**: Progress stored in localStorage with automatic cleanup
- **Authenticated Users**: Progress stored in Clerk user metadata for cross-device sync
- **Migration**: Local progress automatically syncs to user account on sign-up
- **Privacy**: User progress is stored securely and only accessible by the user

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
