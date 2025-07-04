**Technical Specification: "Vježbajmo" Croatian Practice App (MVP Revision)**

### **1. Overview**

**"Vježbajmo"** is a web application designed to provide high-quality grammar exercises for Croatian language learners. The MVP requires an active internet connection for initial load and for on-demand exercise generation.

The core architecture is **static-first**. The application is bundled with a comprehensive set of pre-written, manually verified static exercises. This provides a robust, zero-cost initial experience. This core experience is enhanced by an LLM, allowing users to generate new, unique exercise sets once they have completed the static content, or at any time they choose.

### **2. UI/UX Design Philosophy**

- **Minimal & Practical:** A clean, uncluttered design focused on the learning task.
- **Responsive:** A flawless experience on all devices, using a mobile-first approach.
- **Clean & Modern Aesthetics:** A professional look utilizing an accessible color palette, generous whitespace, and modern iconography (e.g., from `lucide-react`).
- **Clear User Journey:** The UI will clearly distinguish between pre-loaded static exercises and newly generated ones. For example, a message could state, "Loading static exercise 3 of 10," or "Generating a new exercise for you..."
- **Accessibility (A11y):** Developed to meet WCAG 2.1 guidelines, ensuring full keyboard navigability and sufficient color contrast.
- **Simple Footer:** A footer will be present on all pages containing a link to the project's GitHub repository.

### **3. System Architecture & Data Flow (MVP)**

The application is a monolithic **Next.js** application.

**Core Principles:**

1.  **Static Content is Primary:** The app is bundled with a rich set of static JSON exercises (~10 worksheets per exercise type). The application's primary mode is serving this content.
2.  **Client-Side State:** User progress through the static exercises is tracked in `localStorage`. The app reads this data to determine which static exercise to serve next.
3.  **On-Demand Generation:** LLM-based generation is a secondary feature. Users can trigger it in two scenarios:
    - **Automatically:** After completing all available static exercises for a specific category.
    - **Manually:** At any time, via a "Generate a new one" button available on exercise pages.
4.  **No Server-Side Caching (MVP):** For the MVP, generated exercises are not cached on the server. Each generation request is a direct, new call to the LLM provider. This simplifies the architecture significantly.
5.  **Anonymous Access:** All users are anonymous. The app will use a site-wide API key (`SITE_API_KEY`) for generation by default. Users can optionally provide their own API key in a settings panel, which is stored only in their `localStorage`.
6.  **Robust Generation Fallback:** If an LLM-based exercise generation fails, the system will display a clear, user-friendly error message. It will **not** fall back to a static exercise, to avoid user confusion.
7.  **Secure Answer Validation:**
    - **Static Exercises:** Solutions are bundled with the client-side JSON. Since this content is static, this is a low-risk trade-off for speed.
    - **Generated Exercises:** To check an answer for a generated exercise, the client sends the user's answer to a server-side API endpoint. The correct answers (received from the LLM during generation) are temporarily held by the server to perform the check securely.
8.  **Diacritic Tolerance:** The system marks answers as correct even if they are missing diacritics (č, ć, đ, š, ž), but provides a helpful warning to the user.

### **4. Core Features & Exercise Types (MVP)**

1.  **Verb Tenses in Text (Paragraph Completion)**
2.  **Noun & Adjective Declension (Paragraph Completion)**
3.  **Verb Aspect (Radio Button Selection)**
4.  **Interrogative Pronouns (Mid-sentence Fill-ins)**

**Architectural Note on Extensibility:** The system will be designed so that adding a new exercise type is a streamlined process, involving a new Zod schema, a new prompt template, and a new React component.

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
- **Client-Side Storage:** **localStorage**

### **6. Data Models & API Design**

```typescript
// Shared interface for a single question
interface BaseExerciseQuestion {
  id: string; // Unique ID for each question
  correctAnswer: string | string[];
  explanation: string;
}

// A full exercise worksheet, which can be static or generated
interface ExerciseWorksheet {
  id: string; // Static: "verb-aspect-01", Generated: UUID
  source: "static" | "generated"; // To differentiate in the UI
  exerciseType: "verbAspect" | "interrogativePronouns" | "verbTenses" | "nounDeclension";
  cefrLevel: string;
  theme?: string;
  // Content will vary by exercise type
  content: ParagraphContent | SentenceContent[];
}

// Example content structures
interface ParagraphContent {
  paragraph: string;
  questions: (BaseExerciseQuestion & { blankNumber: number; baseForm: string })[];
}

interface SentenceContent extends BaseExerciseQuestion {
  text: string;
  options?: { imperfective: string; perfective: string }; // For verb aspect
}
```

#### **6.1. `POST /api/generate-exercise`**

- **Logic:** Called by "Generate new" buttons. Directly calls the selected LLM provider to generate a single new exercise worksheet.
- **Request Body:**
  ```json
  {
    "exerciseType": "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns",
    "cefrLevel": "A1" | "A2.1" | "A2.2" | "B1.1",
    "provider"?: "openai" | "anthropic",
    "apiKey"?: "string",
    "theme"?: "string"
  }
  ```
- **Response Body:** The generated `ExerciseWorksheet` object, including the correct answers.

#### **6.2. `POST /api/check-answer`**

- **Logic:** This endpoint is **only** for checking answers to `generated` exercises. Static exercises are checked on the client. The frontend will know not to call this API if the `ExerciseWorksheet.source` is `'static'`.
- **Request Body:**
  ```json
  {
    "worksheetId": "string", // UUID of the generated worksheet
    "questionId": "string", // ID of the specific question
    "userAnswer": "string"
  }
  ```
- **Response:**
  ```json
  {
    "correct": boolean,
    "diacriticWarning"?: boolean,
    "correctAnswer": string | string[]
  }
  ```

### **7. Frontend Architecture**

- **Initial State:** On load, the app determines the next available static exercise for each category by checking a list of completed exercise IDs in `localStorage`.
- **User Flow:**
  1.  User selects an exercise type (e.g., "Verb Aspect").
  2.  The app serves the first uncompleted static worksheet for that type. A UI element indicates it's a static exercise (e.g., "Static Exercise 1/10").
  3.  Upon completion, the worksheet's ID is added to `localStorage`. The user is taken to the next static exercise.
  4.  If all static exercises for a type are complete, the app prompts the user to generate a new one.
  5.  A "Generate with a theme" button is always visible, allowing users to bypass the static queue at any time.
- **Component Structure:**
  - **`ExerciseContainer.tsx`:** A wrapper component that fetches the correct exercise (static or generated) and displays UI elements indicating the source.
  - **`ParagraphExercise.tsx` / `SentenceExercise.tsx`:** Components for rendering the specific exercise types.

### **8. LLM Integration Strategy**

- **Models:**
  - **OpenAI**
  - **Anthropic**
- **Quality Assurance:**
  - **Strict Validation:** All LLM responses must be in JSON format and are validated against a Zod schema. Invalid responses result in a user-facing error.
  - **Focus on Prompts:** Development will prioritize creating high-quality, reliable prompts to minimize errors in generated content. The Evals system remains critical for this process.

### **9. Exercise Generation Evaluation System (Evals)**

The internal evaluation system remains a crucial part of the development process for the MVP. It will be used to:

- Verify the grammatical correctness and pedagogical value of generated exercises.
- Test and refine prompts to achieve the highest possible quality and consistency.
- Compare the output of different models (OpenAI vs. Anthropic) to ensure reliability.

### **10. Future Enhancements (Post-MVP)**

- **Server-Side Caching:** Re-introduce a server-side caching layer (e.g., Vercel KV) to store generated exercises, reducing API costs and improving load times as the user base grows.
- **User Accounts:** Implement user authentication (e.g., with Clerk) to sync progress across devices.
- **Progress Analytics:** Develop a dashboard for users to review their performance history, see trends, and identify weak spots.
- **Enhanced Review System:** Add a "Review Mistakes" mode and options to retry exercises.
