# Page snapshot

```yaml
- dialog "Settings":
  - heading "Settings" [level=2]
  - paragraph: Configure your learning preferences and optionally provide your own API key for unlimited exercise generation.
  - group "CEFR Level":
    - text: CEFR Level
    - radiogroup "Select your Croatian language level. This affects the difficulty of generated exercises.":
      - radio "A1"
      - radio "A2.1"
      - radio "A2.2" [checked]
      - radio "B1.1"
    - paragraph: Select your Croatian language level. This affects the difficulty of generated exercises.
  - group "AI Provider":
    - text: AI Provider
    - radiogroup "Get your API key from platform.openai.com":
      - radio "OpenAI" [checked]
      - radio "Anthropic"
    - paragraph: Get your API key from platform.openai.com
  - heading "OpenAI API Key (Optional)" [level=3]
  - alert: You can use the app without providing an API key. Providing your own key enables unlimited exercise generation.
  - textbox "Enter your OpenAI API Key"
  - button "Save" [disabled]
  - alert: Your API key is stored only in your browser and used exclusively to communicate with openai servers.
  - heading "Generate New Exercises" [level=3]
  - textbox "Optional theme for all exercises..."
  - button "Regenerate All Exercises"
  - paragraph: This will generate new exercises for all categories using your selected AI provider and CEFR level.
  - heading "Progress Management" [level=3]
  - button "Clear Completed Exercises"
  - paragraph: This will reset your progress and allow you to see exercises you've already completed.
  - button "Close"
```