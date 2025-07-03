Of course. Here is the fully revised technical specification, integrating all the feedback and clarifications we've discussed. This version is more robust, has clearer definitions for the MVP, and provides a more precise roadmap.

---

# **Technical Specification: "Vježbajmo" Croatian Practice App**

### **1. Overview**

**"Vježbajmo"** is a web application designed to provide dynamic, repeatable grammar exercises for Croatian language learners. The application requires an active internet connection for all its features. Its core architecture is built on a **static-first principle**, providing a complete set of pre-written exercises for initial use. This core experience is optionally enhanced by an LLM, allowing users to generate new, unique exercise sets on demand.

The app supports multiple LLM providers (**OpenAI** or **Anthropic**) and offers **configurable CEFR levels** (defaulting to A2.2) to tailor the difficulty. Users can use a site-wide API key for free access or provide their own for unlimited use.

### **2. UI/UX Design Philosophy**

- **Minimal & Practical:** A clean, uncluttered design focused on the learning task.
- **Responsive:** A flawless experience on all devices, using a mobile-first approach.
- **Clean & Modern Aesthetics:** A professional look utilizing an accessible color palette, generous whitespace, and modern iconography (e.g., from `lucide-react`).
- **Interactive Feedback:** The UI will include loading spinners, progress bars, and clear visual cues (e.g., inline icons for correct/incorrect answers).
- **Accessibility (A11y):** Developed to meet WCAG 2.1 guidelines, ensuring full keyboard navigability and sufficient color contrast.
- **Intuitive & Discoverable:** The initial user experience will be simple and focused. Exercises and core functionality will be clearly labeled, allowing new users to begin practicing immediately. Advanced features, such as API key configuration and themed generation, will be located in an easily accessible settings panel for organic discovery.
- **Centralized Configuration:** User-specific settings like API keys, provider choice, and CEFR level are managed in a dedicated settings panel.

### **3. System Architecture & Data Flow**

The application is a monolithic **Next.js** application.

**Core Principles:**

1.  **Static Fallback:** The application is bundled with a complete set of static JSON exercises. It is fully functional on initial load, provided the user is online.
2.  **Flexible Generation:** Users can generate new exercises in two ways:
    - **Globally:** A "Regenerate All Exercises" button in the settings panel.
    - **Locally:** A "Regenerate" button on each individual exercise page.
3.  **Phased User Management & API Access:**
    - **Phase 1 (MVP): Anonymous Access with Site Key**
      - **Default (Site Key):** All users are initially anonymous. The app uses a site-wide key (`SITE_API_KEY`) with global rate limits for a free-to-try experience.
      - **User Key Override:** Users can optionally enter their own API key in the settings panel. This key is validated immediately upon entry by making a test API call. It is stored only in the user's `localStorage` and is never sent to our server for storage.
    - **Phase 2 (Post-MVP): Clerk User Accounts**
      - **Authenticated Users:** Users can optionally sign up or log in via Clerk to unlock higher daily generation limits.
      - **Progress Sync:** Upon first login, any existing progress from `localStorage` will be migrated and synced to the user's account, ensuring a seamless transition and multi-device access.
      - **Server-Side Progress Tracking:** For logged-in users, completed exercise tracking will be handled on the server, eliminating the need to send large arrays of completed IDs from the client.
4.  **Robust Generation Fallback:** If an LLM-based exercise generation fails (due to an invalid API key, provider outage, or malformed response), the system will **not** fall back to a non-matching static exercise. Instead, it will display a clear, user-friendly error message explaining the issue.
5.  **Multi-Tier Caching System:**
    - **Server-Side Exercise Pool:** Generated exercises are cached in a persistent store (Vercel KV) organized by exercise type, CEFR level, and theme.
    - **User Progress Tracking:** An individual user's completed exercises are tracked in `localStorage` (MVP) or via their user account (Post-MVP).
    - **Automatic Completion:** Exercises are automatically marked as completed when a user reviews their results and proceeds to the next exercise or navigates away. This streamlines the user flow.
    - **Smart Exercise Selection:** When users request exercises, the system first serves from the cached pool, filtering out exercises they have already completed.
    - **Cache Replenishment:** Only when a user exhausts the available filtered cache does the system generate new exercises, which are then added to the shared cache.
6.  **Secure Answer Validation:** Solutions for **API-generated** exercises are cached on the server for secure validation. Solutions for **static** exercises are bundled with the client for speed; reverse-engineering them is considered an acceptable trade-off.
7.  **Diacritic Tolerance:** The system recognizes that users may not have proper Croatian keyboard layouts. If an answer is correct except for diacritics (č, ć, đ, š, ž), it's marked as correct with a helpful warning.
8.  **Multiple Correct Answers:** The system supports exercises where multiple answers are acceptable.
9.  **Comprehensive Logging:** The application uses **Pino** for structured logging with environment-specific configurations and Sentry integration for error monitoring.

### **4. Core Features & Exercise Types**

1.  **Verb Tenses in Text (Paragraph Completion)**
2.  **Noun & Adjective Declension (Paragraph Completion)**
3.  **Verb Aspect (Radio Button Selection)**
4.  **Interrogative Pronouns (Mid-sentence Fill-ins)**

**Architectural Note on Extensibility:** The system will be designed so that adding a new exercise type (e.g., "Preposition Usage") is a streamlined process. This involves creating a new Zod schema, a new prompt template, and a new React component, without requiring significant changes to the core caching or API generation logic.

### **5. Technology Stack**

- **Framework:** **Next.js 15** (App Router)
- **Language:** **TypeScript**
- **Styling:** **Tailwind CSS**
- **UI Primitives/Icons:** **Shadcn/UI**, `lucide-react`
- **State Management:** React State & Context
- **Package Manager:** **pnpm**
- **Testing:** **Vitest** (Unit/Integration), **Playwright** (End-to-End)
- **Schema Validation:** **Zod**
- **Logging:** **Pino**
- **Error Monitoring:** **Sentry**
- **LLM Providers:** **OpenAI API**, **Anthropic API**
- **Server-Side Cache:** **Vercel KV**
- **Client-Side Storage:** **localStorage**

### **6. Data Models & API Design**

```typescript
// For isolated sentences
interface SentenceExercise {
  id: string; // Unique ID for each question
  text: string;
  correctAnswer: string | string[];
  explanation: string;
}

// Specialized interface for verb aspect exercises
interface VerbAspectExercise extends SentenceExercise {
  exerciseSubType: "verb-aspect";
  options: { imperfective: string; perfective: string };
  correctAspect: "imperfective" | "perfective";
}

// A collection of sentence-based exercises, tracked as a single unit
interface SentenceExerciseSet {
  id: string; // UUID for the entire set
  exerciseType: "verbAspect" | "interrogativePronouns";
  cefrLevel: string;
  theme?: string;
  exercises: (SentenceExercise | VerbAspectExercise)[];
}

// For paragraph exercises, tracked as a single unit
interface ParagraphExerciseSet {
  id: string; // UUID for the entire set
  paragraph: string;
  questions: {
    id: string; // Unique ID for each blank
    blankNumber: number;
    baseForm: string;
    correctAnswer: string | string[];
    explanation: string;
  }[];
}

// Enhanced answer validation response
interface CheckAnswerResponse {
  correct: boolean;
  explanation: string;
  correctAnswer?: string | string[];
  diacriticWarning?: boolean;
  matchedAnswer?: string;
}
```

#### **6.1. `POST /api/generate-exercise-set`**

- **Logic:** Called by "Regenerate" buttons. Implements intelligent caching to serve pre-generated exercises when possible, filtering out completed exercises.
- **Request Body:**
  ```json
  {
    "exerciseType": "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns",
    "cefrLevel": "A1" | "A2.1" | "A2.2" | "B1.1",
    "provider"?: "openai" | "anthropic",
    "apiKey"?: "string",
    "theme"?: "string",
    "userCompletedExercises"?: "string[]" // For anonymous users
  }
  ```
- **Backend Logic:** Uses user-provided credentials if present; otherwise, falls back to the site key. For logged-in users (Post-MVP), `userCompletedExercises` will be fetched on the server.

#### **6.2. Answer Checking Logic**

- **Distinguishing Questions:** The `id` field of an exercise set is used to determine its origin. Static exercises (pre-bundled) will have numerical IDs, while generated exercises will have string UUIDs.
- **`POST /api/check-answer`:** This backend route validates the `userAnswer` against the solution stored in the server-side cache, keyed by the question's UUID, for generated exercises only.
- **Answer Normalization:** All answers (user input and correct answers) are normalized (lowercase, trimmed whitespace) before comparison. The system performs two checks: an exact match, and a diacritic-tolerant match.

### **7. Frontend Architecture & State Management**

- **Initial State:** App is initialized with static A2.2 exercises.
- **Global Layout & Navigation:** A unified, clickable header navigates users to the home page, creating a clean and intuitive experience.
- **Settings & Configuration (`SettingsModal.tsx`):** A central modal for managing CEFR level, provider, API key, and global regeneration with an optional theme.
- **Component Structure:**
  - **`ParagraphExercise.tsx` & `SentenceExercise.tsx`:** Display exercises and handle user input. Each features a local "Regenerate" button.
  - **`VerbAspectExercise.tsx`:** A specialized component using radio buttons for verb aspect selection.
  - **Unified Workflow:** Both `ParagraphExercise.tsx` and `SentenceExercise.tsx` render all their questions on a single page with a single "Check My Work" button for a consistent user experience.

### **8. LLM Integration Strategy**

- **Models:**
  - **OpenAI:** **`gpt-4o-mini`**
  - **Anthropic:** **`claude-3-5-sonnet-latest`**
- **Provider Abstraction:** A backend abstraction layer routes requests to the correct provider.
- **Dynamic Prompts:** Prompts are dynamically constructed to include the specified `cefrLevel` and optional `theme`.
- **Resilient Response Handling (MVP):** To ensure reliability, all LLM API calls will utilize the provider's native JSON mode (e.g., OpenAI's `response_format: { type: "json_object" }`). Upon receipt, all incoming data will be strictly validated against a Zod schema. If the response is malformed or fails validation, the generation will be treated as a failure.
- **Future Enhancement (Post-MVP):** A retry mechanism with exponential backoff will be implemented to handle transient network issues or intermittent API errors.

### **9. MVP: Enhancements for Learning Experience**

- **Unified Exercise Workflow:** All exercise types (paragraph, sentence, verb aspect) present a set of questions to be answered at once, with a single "Check My Work" button. Full keyboard navigation (`Tab`/`Shift+Tab`) is supported.
- **Streamlined Completion Flow:** Exercises are automatically marked as completed when users proceed to the next exercise after reviewing results, creating a natural learning progression.
- **Diacritic Learning Support:** Answers correct except for diacritics are accepted but highlighted with a warning, providing a gentle learning opportunity.
- **Multiple Answer Recognition:** The system handles cases where multiple forms (e.g., perfective/imperfective) are contextually correct.

### **10. Post-MVP: Advanced Progress Visualization**

- **Dynamic Progress Bar:** For all exercise types, a progress bar will reflect the completion status of input fields on the current page, calculated as (filled fields / total fields) × 100.
- **Real-time Updates:** Progress will update as users fill in answers, providing immediate visual feedback.
- **Field Validation:** Empty or whitespace-only fields will not be considered "filled."

### **11. Post-MVP: Enhanced Review & Analytics System**

- **Enhanced Review & Retry System:**
  - **"Review Mistakes" Mode:** A focused mode showing only incorrectly answered questions.
  - **Answer Pre-filling:** Preserves a user's previous answers when retrying for context.
  - **Smart Reset Options:** A "Try Again" button marks an exercise as incomplete for a retry, while preserving performance history.
- **Completed Exercise Management:**
  - **Exercise History View:** A dedicated interface to review completed exercises with performance scores, dates, and retry options.
  - **Performance Analytics:** Visualizations showing average scores by type, progress trends, and challenging areas.

### **12. Exercise Generation Evaluation System (Evals)**

The evaluation system is a development-only feature for testing and improving the quality of AI-generated exercises.

- **Core Architecture:** Supports both OpenAI and Anthropic models with dynamic discovery and API key validation. Tests the entire exercise generation pipeline.
- **Evaluation Runner & Scoring System:**
  - **Judge LLM for Quality Assessment:** To achieve objective evaluation, the system will employ a powerful "Judge LLM" (e.g., GPT-4o). After an exercise is generated, it is passed to the Judge LLM with a detailed rubric to score it on grammatical correctness, pedagogical value, theme adherence, and CEFR level appropriateness. This provides a robust and repeatable method for scoring content quality.
- **Command Line Interface:** A CLI tool to run the evaluation suite, discover models, and generate detailed reports on model performance.
- **Future Enhancements:**
  - **Prompt Evaluation:** The evals system will be extended to test multiple prompt variations for the same exercise request, allowing for A/B testing of prompt engineering strategies.
  - **Golden Dataset:** A small, human-validated set of exercises will be used to calibrate the Judge LLM's accuracy.
