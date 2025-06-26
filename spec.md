# **Technical Specification: "Vježbajmo" Croatian Practice App**

### **1. Overview**

**"Vježbajmo"** is a web application designed to provide dynamic, repeatable grammar exercises for Croatian language learners. The app's core architecture is built on a **static-first principle**, providing a complete set of pre-written exercises for immediate, offline use. This core experience is optionally enhanced by an LLM, allowing users to generate new, unique exercise sets on demand.

The app supports multiple LLM providers (**OpenAI** or **Anthropic**) and offers **configurable CEFR levels** (defaulting to A2.2) to tailor the difficulty. Users can use a site-wide API key for free access or provide their own for unlimited use.

### **2. UI/UX Design Philosophy**

- **Minimal & Practical:** A clean, uncluttered design focused on the learning task.
- **Responsive:** A flawless experience on all devices, using a mobile-first approach.
- **Clean & Modern Aesthetics:** A professional look utilizing an accessible color palette, generous whitespace, and modern iconography (e.g., from `lucide-react`).
- **Interactive Feedback:** The UI will include loading spinners, progress bars, and clear visual cues (e.g., inline icons for correct/incorrect answers).
- **Accessibility (A11y):** Developed to meet WCAG 2.1 guidelines, ensuring full keyboard navigability and sufficient color contrast.
- **Centralized Configuration:** User-specific settings like API keys, provider choice, and CEFR level are managed in a dedicated settings panel.

### **3. System Architecture & Data Flow**

The application is a monolithic **Next.js** application.

**Core Principles:**

1.  **Static Fallback:** The application is bundled with a complete set of static JSON exercises. It is fully functional on initial load.
2.  **Flexible Generation:** Users can generate new exercises in two ways:
    - **Globally:** A "Regenerate All Exercises" button in the settings panel.
    - **Locally:** A "Regenerate" button on each individual exercise page.
3.  **Tiered API Access:**
    - **Default (Site Key):** If a user does not provide their own API key, the app will use a site-wide key configured via server-side environment variables (`SITE_API_KEY`, `SITE_API_PROVIDER`). This provides a free-to-try experience.
    - **User Key:** Users can enter their own API key to bypass any potential limits on the site key.
4.  **Multi-Tier Caching System:**
    - **Server-Side Exercise Pool:** Generated exercises are cached in a persistent store (Vercel KV initially, designed for easy provider switching) organized by exercise type, CEFR level, and theme.
    - **User Progress Tracking:** Individual user's completed exercises are tracked in localStorage. **Manual Completion:** Users explicitly mark exercises as completed after reviewing results, preventing premature completion tracking that causes cache filtering issues.
    - **Smart Exercise Selection:** When users request exercises without specifying a theme, the system first attempts to serve from the cached pool of exercises they haven't marked as completed yet.
    - **Cache Replenishment:** Only when users have exhausted available cached exercises does the system generate new ones, which are then added to the shared cache.
    - **Review Completed Exercises:** Users can access and review previously completed exercises through a dedicated interface, enabling spaced repetition and progress review.
5.  **Client-Side Session Caching:** Once exercises are served, they are cached in the client's state to minimize redundant API calls during the current session.
6.  **Secure Answer Validation:** Solutions for **API-generated** exercises are cached on the server for secure validation. Solutions for **static** exercises are handled on the client for speed.
7.  **Diacritic Tolerance:** The system recognizes that users may not have proper Croatian keyboard layouts. If an answer is correct except for diacritics (č, ć, đ, š, ž), it's marked as correct with a helpful warning reminder about proper Croatian spelling.
8.  **Multiple Correct Answers:** The system supports exercises where multiple answers are acceptable (e.g., perfective/imperfective aspect variations depending on context).

### **4. Core Features & Exercise Types**

1.  **Verb Tenses in Text (Paragraph Completion)**
2.  **Noun & Adjective Declension (Paragraph Completion)**
3.  **Verb Aspect (Isolated Sentences)**
4.  **Interrogative Pronouns (Mid-sentence Fill-ins)** - Focus on koji/koja/koje forms in context

### **5. Technology Stack**

- **Framework:** **Next.js 15** (App Router)
- **Language:** **TypeScript**
- **Styling:** **Tailwind CSS**
- **UI Primitives/Icons:** **Shadcn/UI**, `lucide-react`
- **State Management:** React State & Context
- **Testing:** **Vitest** (Unit/Integration), **Playwright** (End-to-End)
- **Schema Validation:** **Zod**
- **LLM Providers:** **OpenAI API**, **Anthropic API**
- **Server-Side Cache:** **Vercel KV** (initially, designed for easy provider switching)
- **Client-Side Storage:** **localStorage** for user progress and settings

### **6. Data Models & API Design**

```typescript
// For isolated sentences
interface SentenceExercise {
  id: number | string;
  text: string;
  correctAnswer: string | string[]; // Support multiple correct answers
  explanation: string;
}

// For paragraph exercises
interface ParagraphExerciseSet {
  id: string;
  paragraph: string;
  questions: {
    id: string;
    blankNumber: number;
    baseForm: string;
    correctAnswer: string | string[]; // Support multiple correct answers
    explanation: string;
  }[];
}

// Enhanced answer validation response
interface CheckAnswerResponse {
  correct: boolean;
  explanation: string;
  correctAnswer?: string | string[];
  diacriticWarning?: boolean; // True if correct except for diacritics
  matchedAnswer?: string; // The specific correct answer that was matched
}
```

#### **6.1. `POST /api/generate-exercise-set`**

- **Logic:** Called by both the global and local "Regenerate" buttons. Implements intelligent caching to serve pre-generated exercises when possible.
- **Request Body:**
  ```json
  {
    "exerciseType": "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns",
    "cefrLevel": "A1" | "A2.1" | "A2.2" | "B1.1",
    "provider"?: "openai" | "anthropic", // Optional. If absent, backend uses site provider.
    "apiKey"?: "string",               // Optional. If absent, backend uses site key.
    "theme"?: "string",                 // Optional. For generating themed content.
    "userCompletedExercises"?: "string[]" // Optional. Array of exercise IDs user has completed.
  }
  ```
- **Backend Caching Logic:**
  1. **Cache Key Construction:** `${exerciseType}:${cefrLevel}:${theme || 'default'}`
  2. **Cache Lookup:** Check if cached exercises exist for the given parameters
  3. **User Progress Filtering:** Filter out exercises the user has already completed (based on `userCompletedExercises`)
  4. **Intelligent Serving:**
     - If suitable cached exercises exist and user hasn't completed them all, serve from cache
     - If no suitable cached exercises or user has completed all available ones, generate new exercises
     - New exercises are added to the cache for future users
  5. **Fallback Handling:** If cache is unavailable, fall back to direct generation
- **Backend Logic:**
  1.  When a request is received, the backend checks if `apiKey` and `provider` are present.
  2.  If they are, it uses the user-provided credentials for the outbound LLM call. The user's key is **never stored**.
  3.  If they are absent, the backend falls back to using the `SITE_API_KEY` and `SITE_API_PROVIDER` from its environment variables.
- **Success Response (200):** Returns the full exercise object with UUIDs. The server caches solutions keyed by these UUIDs.

#### **6.2. Answer Checking Logic**

- **Distinguishing Questions:** The `id` field will be used to route the check. If `typeof id === 'number'`, it's a static question checked on the client. If `typeof id === 'string'`, it's a generated question that requires a call to the `POST /api/check-answer` endpoint.
- **`POST /api/check-answer`:** This backend route validates the `userAnswer` against the solution stored in the server-side cache, keyed by the question's UUID. Returns enhanced feedback including diacritic warnings and the specific matched answer.
- **Answer Normalization & Diacritic Handling:** Before any comparison (client or server), answers are normalized (lowercase, trim whitespace). The system performs two-pass validation:
  1. **Exact Match**: Checks for perfect answers with proper diacritics
  2. **Diacritic-Tolerant Match**: Checks answers with diacritics removed (č→c, ć→c, đ→d, š→s, ž→z)
- **Multiple Answer Support:** Both client-side and server-side validation handle arrays of correct answers, checking user input against all possibilities.
- **Visual Feedback Enhancement:**
  - Correct answers with proper diacritics: Green highlighting
  - Correct answers with diacritic issues: Yellow highlighting with helpful reminder
  - Incorrect answers: Red highlighting with explanations

### **7. Frontend Architecture & State Management**

- **Initial State:** App is initialized with static A2.2 exercises.
- **Global Layout & Navigation:**

  - **Unified Header:** A consistent header appears on all pages containing the app logo (Croatian flag 🇭🇷), app name "Vježbajmo", tagline "Croatian Language Practice", and settings button.
  - **Navigation Pattern:** The entire header (logo, name, tagline) is clickable and navigates to the home page, eliminating the need for individual "Back to Selection" buttons throughout the app.
  - **Clean UI:** This creates a cleaner, more intuitive navigation experience where users always know how to return to the main exercise selection.

- **Settings & Configuration (`SettingsModal.tsx`)**

  - A **Settings Modal** (or drawer), accessible via a gear icon in the header, is the central configuration hub.
  - **CEFR Level:** A dropdown to select the desired CEFR level. Saved to `localStorage`.
  - **Provider Selection:** A dropdown to select "OpenAI" or "Anthropic". Saved to `localStorage`.
  - **API Key Input:** An input for the user's personal API key. Saved to `localStorage`.
  - **Global Regeneration:** A "Regenerate All Exercises" button, accompanied by a text input for an optional **theme**. This button uses the currently selected settings (CEFR level, provider, key) to fetch new content for all exercise types.

- **Component Structure:**
  - **`ParagraphExercise.tsx` & `SentenceExercise.tsx`**:
    - These components are responsible for displaying the exercise and handling answers.
    - **Automatic Completion Workflow:** After checking answers and reviewing results, exercises are automatically marked as "completed" when users click "Next Exercise". This streamlines the learning flow.
    - Each component features its own **"Regenerate" button** (e.g., a refresh icon) that generates new exercises from the pool of uncompleted exercises.
    - A small text input field allows users to specify an optional **theme** for regeneration.
    - Clicking the regenerate button calls `/api/generate-exercise-set` for only that `exerciseType`.
  - **`SentenceExercise.tsx` UX Update:** This component renders a **list of all sentence exercises** on a single page, not one at a time. A single **"Check My Work"** button validates all answers at once, creating a unified workflow consistent with paragraph exercises.
  - **`ResultsDisplay.tsx`:** Handles showing feedback for multiple questions simultaneously with improved completion flow.
  - **`CompletedExercisesView.tsx` (New):** Displays a list of previously completed exercises, allowing users to review their past work and practice spaced repetition.

### **8. LLM Integration Strategy**

- **Models:**
  - **OpenAI:** **`gpt-4o-mini`** (The latest cost-effective and highly capable model).
  - **Anthropic:** **`claude-3-5-sonnet-20240620`** (The latest and most intelligent Sonnet model, offering top-tier performance).
- **Provider Abstraction:** The backend (`/api/generate-exercise-set`) will contain an abstraction layer to route requests to the correct provider function (`generateWithOpenAI` or `generateWithAnthropic`).
- **Dynamic Prompts:** Prompts sent to the LLM will be dynamically constructed to include the specified **`cefrLevel`** and the optional **`theme`**, ensuring the generated content is tailored, relevant, and at the appropriate difficulty level.
- **Error Handling:** If an API call fails, the app will show a user-friendly error and revert to the static version of the exercise.

### **9. Enhancements for Learning Experience**

- **Unified Exercise Workflow:** Both paragraph and sentence exercises feature a "fill-in-multiple-blanks" and "check-all-at-once" workflow, providing a consistent and efficient user experience. This includes full `Tab`/`Shift+Tab` keyboard navigation between all input fields on the page.
- **Streamlined Completion Flow:** Exercises are automatically marked as completed when users proceed to the next exercise, creating a more natural learning progression without manual intervention.
- **Enhanced Review System:**
  - **"Review Mistakes" Mode:** After checking a set, users can review mistakes in a focused mode where only incorrectly answered questions are shown.
  - **Answer Pre-filling:** When reviewing mistakes, the system preserves user's previous answers for context and allows modification without starting completely fresh.
  - **Smart Reset Options:** "Try Again" functionality marks exercises as incomplete for retry while preserving performance history for progress tracking.
- **Completed Exercise Review:** Users can access a dedicated view to review previously completed exercises, enabling spaced repetition and progress assessment.
- **"Hint" System (Future Enhancement):** A "Hint" button could make a targeted API call for a clue.
- **Thematic Content:** Core feature allowing users to provide themes during regeneration to receive contextually rich exercises.
- **Diacritic Learning Support:**
  - Answers that are correct except for diacritics are marked as correct to avoid frustration
  - Yellow warning badges and inline reminders help users learn proper Croatian spelling
  - Separate "Diacritic Reminders" section in results shows proper spelling for educational purposes
- **Multiple Answer Recognition:** The system intelligently handles cases where multiple forms might be correct (e.g., perfect vs. imperfect aspect based on context), providing a more realistic learning experience.

### **10. Progress Tracking & User Experience**

- **Dynamic Progress Bar:** For all exercise types, the progress bar reflects the completion status of input fields on the current page. Progress is calculated as: (filled fields / total fields) × 100.
- **Real-time Updates:** Progress updates as users fill in answers, providing immediate visual feedback.
- **Field Validation:** Empty or whitespace-only fields are not considered "filled" for progress calculation.

### **11. Completion Tracking & Exercise Review System**

- **Enhanced Automatic Completion Workflow:**

  1. User fills in answers and clicks "Check My Work"
  2. Results are displayed with explanations and feedback
  3. User reviews results and can click "Next Exercise" to proceed
  4. Exercise is automatically marked as "completed" when proceeding to next exercise
  5. Completion is tracked in localStorage with comprehensive performance data:
     - Exercise ID and type
     - Timestamp of completion
     - Detailed score data (correct answers, total questions, percentage)
     - Time spent on exercise (optional future enhancement)
     - CEFR level and theme (if applicable)

- **Enhanced Review & Retry System:**

  - **Answer Preservation:** When reviewing mistakes or retrying exercises, user's previous answers are pre-filled to provide context and avoid complete restart.
  - **Smart Try Again:** "Try Again" functionality marks exercises as incomplete for retry while preserving best performance score in history.
  - **Focused Mistake Review:** "Review Mistakes" mode shows only incorrectly answered questions with previous answers pre-filled for easy correction.

- **Enhanced Completed Exercise Management:**

  - **Exercise History View:** Dedicated interface showing completed exercises with:
    - Exercise type and title
    - Completion date
    - Performance score (e.g., "8/10 - 80%")
    - Quick retry button to re-attempt the same exercise
    - Filtering by exercise type, date range, and performance score
  - **Performance Analytics:**
    - Average scores by exercise type
    - Progress trends over time
    - Identification of challenging exercise types
    - Overall completion statistics
  - **Re-attempt System:**
    - Users can revisit completed exercises for practice
    - Re-attempts don't overwrite original completion records
    - Option to track improvement between attempts
  - **Spaced Repetition Support:**
    - Highlight exercises where user scored below 80% for review
    - Suggest re-attempting exercises after time intervals
    - Track performance improvement over multiple attempts

- **Enhanced Data Model:**

```typescript
interface CompletedExerciseRecord {
  exerciseId: string;
  exerciseType: ExerciseType;
  completedAt: number; // timestamp
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  cefrLevel: CefrLevel;
  theme?: string;
  attemptNumber: number; // Track multiple attempts at same exercise
  bestScore?: number; // Track highest percentage achieved
}

interface ExerciseSession {
  exerciseType: ExerciseType;
  results: ExerciseResult[];
  completed: boolean;
  mistakeQuestions: any[];
  previousAnswers?: Record<string, string>; // Store previous answers for review/retry
}
```

- **Cache Filtering Logic:**

  - Only automatically completed exercises (when users proceed to next exercise) are filtered out during regeneration requests
  - Streamlined completion tracking eliminates race conditions
  - Ensures reliable cache filtering based on natural user progression
  - Supports both paragraph exercises (tracked by `exerciseSet.id`) and sentence exercises (tracked by `sentenceExerciseSet.id`)
  - Enhanced filtering considers performance scores for intelligent exercise serving

- **Benefits:**
  - **Streamlined Flow:** Natural progression from exercise completion to next exercise without manual completion steps
  - **Answer Continuity:** Pre-filled answers in review modes prevent frustrating restarts and provide learning context
  - **Flexible Retry:** Easy re-attempts that preserve learning history while allowing improvement tracking
  - **Performance History:** Comprehensive tracking of best scores and attempt history for motivation
  - **Spaced Repetition:** Easy access to review previously completed work with performance context
  - **Progress Tracking:** Detailed performance metrics help users identify strengths and weaknesses
  - **Learning Analytics:** Comprehensive data helps users optimize their learning strategy
