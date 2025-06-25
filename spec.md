# **Technical Specification: "Vježbajmo" Croatian Practice App**

### **1. Overview**

**"Vježbajmo"** is a web application designed to provide dynamic, repeatable grammar exercises for Croatian language learners at the **A2.2 CEFR level**. The app's core architecture is built on a **static-first principle**, providing a complete set of pre-written exercises for immediate, offline use. This core experience is optionally enhanced by an LLM, allowing users to generate new, unique exercise sets on demand by providing their own API key.

### **2. UI/UX Design Philosophy**

- **Minimal & Practical:** A clean, uncluttered design focused on the learning task.
- **Responsive:** A flawless experience on all devices, using a mobile-first approach.
- **Clean & Modern Aesthetics:** A professional look utilizing an accessible color palette, generous whitespace, and modern iconography (e.g., from `lucide-react`).
- **Interactive Feedback:** The UI will include loading spinners, progress bars, and clear visual cues (e.g., inline icons for correct/incorrect answers) to create an engaging and informative experience.
- **Accessibility (A11y):** Developed to meet WCAG 2.1 guidelines, ensuring full keyboard navigability (especially `Tab` navigation between input fields in paragraphs) and sufficient color contrast.

### **3. System Architecture & Data Flow**

The application is a monolithic **Next.js** application.

**Core Principles:**

1.  **Static Fallback:** The application is bundled with a complete set of static JSON exercises. It is fully functional on initial load without requiring an internet connection or API keys.
2.  **Optional Generation:** Users can provide an API key to generate new exercise sets. This action is user-initiated via a "Regenerate" button.
3.  **Client-Side Session Caching:** Once a new set is generated, it is cached in the client's state. Navigating between different exercise types uses the cached or static content, minimizing API calls.
4.  **Secure Answer Validation:** Solutions for **API-generated** exercises are cached on the server for secure validation. Solutions for **static** exercises are handled on the client for speed.

### **4. Core Features & Exercise Types**

1.  **Verb Tenses in Text (Paragraph Completion):** Users fill in verb blanks within a connected story.
2.  **Noun & Adjective Declension (Paragraph Completion):** Users fill in blanks with correctly declined noun-adjective pairs.
3.  **Verb Aspect (Isolated Sentences):** Users choose between perfective and imperfective verb forms.
4.  **Interrogative Pronouns (Isolated Sentences):** Users fill in blanks with the correct form of `koji`, `koja`, `koje`, etc.

### **5. Technology Stack**

- **Framework:** **Next.js 15** (App Router)
- **Language:** **TypeScript**
- **Styling:** **Tailwind CSS**
- **UI Primitives/Icons:** **Shadcn/UI**, **lucide-react**
- **State Management:** React State & Context
- **Testing:** **Vitest** (Unit/Integration), **Playwright** (End-to-End)
- **Schema Validation:** **Zod**
- **LLM Provider:** **OpenAI API**
- **Server-Side Cache:** A short-lived, key-value store (e.g., Redis, Upstash)

### **6. Data Models & API Design**

```typescript
// For isolated sentences
interface SentenceExercise {
  id: number | string; // number for static, string (UUID) for generated
  text: string;
  correctAnswer: string;
  explanation: string;
}

// For paragraph exercises
interface ParagraphExerciseSet {
  id: string; // Unique ID (UUID) for the entire generated set
  paragraph: string; // The template with blanks
  questions: {
    id: string; // Unique ID (UUID) for each blank
    blankNumber: number;
    baseForm: string;
    correctAnswer: string;
    explanation: string;
  }[];
}
```

#### **6.1. `POST /api/generate-exercise-set`**

- **Logic:** Called only when a user with a valid API key clicks "Regenerate".
- **Request Body:** `{ "exerciseType": string, "theme"?: string }` (e.g., "planning a vacation").
- **Success Response (200):** Returns the full exercise object, now populated with UUIDs for all `id` fields. The server caches solutions keyed by these UUIDs.

#### **6.2. Answer Checking Logic**

- **Distinguishing Questions:** The `id` field will be used to route the check. If `typeof id === 'number'`, it's a static question checked on the client. If `typeof id === 'string'`, it's a generated question that requires a call to the `POST /api/check-answer` endpoint.
- **`POST /api/check-answer`:** This backend route validates the `userAnswer` against the solution stored in the server-side cache, keyed by the question's UUID.
- **Normalization:** Before any comparison (client or server), answers are normalized (lowercase, trim whitespace). Diacritics are strictly enforced.

### **7. Frontend Architecture & State Management**

- **Initial State:** The app state is initialized with static exercises loaded from local JSON files. These will use simple numeric IDs.
- **API Key Management:** The key is stored in `localStorage`. UI elements that require a key (e.g., "Regenerate") are disabled and visually indicate that a key is needed.
- **Component Structure:**
  - `ParagraphExercise.tsx`: Will implement `Tab`/`Shift+Tab` for keyboard navigation and auto-focus on the first input blank on load. It will feature a single "Check My Work" button to validate all answers at once.
  - `SentenceExercise.tsx`: Will render lists of individual questions.
  - `ResultsDisplay.tsx`: Will show feedback with inline icons and offer access to explanations.

### **8. LLM Integration Strategy**

- **Model:** `gpt-3.5-turbo` or similar cost-effective model.
- **Prompts:** Prompts will request JSON matching the defined data structures and can include an optional `theme` parameter to increase content variety and engagement.
- **Error Handling:** If an API call fails, the app will show a user-friendly error and revert to the static version of the exercise, ensuring a seamless experience.

### **9. Enhancements for Learning Experience**

These features should be considered during or after the initial MVP build to significantly improve the tool's effectiveness.

- **Enhanced Paragraph UX:** Implement `Tab` navigation, auto-focus, and a single "Check My Work" button for paragraph exercises to create a smoother, more intuitive workflow.
- **"Review Mistakes" Mode:** After a set is checked, incorrectly answered questions are collected. A "Review Mistakes" button will launch a new, temporary exercise set composed only of these questions, allowing for targeted reinforcement.
- **"Hint" System (Future Enhancement):** A "Hint" button next to a difficult question could make a targeted API call to the LLM for a helpful clue that doesn't reveal the answer.
- **Thematic Content (Future Enhancement):** Allow the user to select a theme (e.g., "At the Market," "Travel") which is then passed to the LLM prompt to generate more engaging and contextually rich exercises.
