# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - link "Vježbajmo - Return to home page":
    - /url: /
    - heading "Vježbajmo" [level=1]
    - paragraph: Croatian Language Practice
  - button "Open settings to configure language level, AI provider, and API key": Settings
- main:
  - progressbar
  - text: Verb Tenses in Text
  - paragraph: Fill in verb blanks within a connected story to practice tense usage.
  - form "Verb Tenses in Text":
    - group "Exercise paragraph with fill-in-the-blank questions":
      - text: "Marko je student koji Question 1: Enter the correct form of ići"
      - 'textbox "Question 1: Enter the correct form of ići"'
      - text: "(ići) na sveučilište svaki dan. Jučer je Question 2: Enter the correct form of učiti"
      - 'textbox "Question 2: Enter the correct form of učiti"'
      - text: "(učiti) za ispit iz matematike tri sata. Obično Question 3: Enter the correct form of ustajati"
      - 'textbox "Question 3: Enter the correct form of ustajati"'
      - text: "(ustajati) u sedam ujutro, ali sutra će Question 4: Enter the correct form of ustati"
      - 'textbox "Question 4: Enter the correct form of ustati"'
      - text: "(ustati) ranije jer ima važan ispit. Kada Question 5: Enter the correct form of završiti"
      - 'textbox "Question 5: Enter the correct form of završiti"'
      - text: "(završiti) fakultet, planira Question 6: Enter the correct form of putovati"
      - 'textbox "Question 6: Enter the correct form of putovati"'
      - text: (putovati) po Europi.
    - button "Check My Work" [disabled]
    - text: Submit your answers to see the results. You need to fill in at least one answer before submitting.
  - paragraph: Want different questions?
  - textbox "Optional theme..."
  - button "Generate New Questions"
- alert
- button "Open Next.js Dev Tools":
  - img
```