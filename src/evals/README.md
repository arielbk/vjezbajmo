# Croatian Grammar AI Model Evaluation System

This directory contains a comprehensive evaluation system for testing AI models on Croatian grammar exercises. The system allows you to compare different AI providers (OpenAI, Anthropic) and models to determine which performs best for Croatian language tasks.

## Features

- **Multiple AI Provider Support**: Test both OpenAI and Anthropic models
- **Dynamic Model Discovery**: Automatically fetches available models from each provider's API including Claude 4 models
- **Real-time Progress Updates**: Live progress tracking for individual test cases during evaluation
- **Comprehensive Test Cases**: High-quality test cases covering all exercise types with multiple difficulty levels
- **Multiple Correct Answers**: Support for alternative answers (e.g., Croatian vs Serbian variants)
- **Development-Only Access**: Web UI is only accessible in development mode for security
- **CLI and Web Interface**: Run evaluations from command line or browser
- **Detailed Performance Metrics**: Accuracy scores and explanation quality assessment
- **Separated API Keys**: Independent configuration for OpenAI and Anthropic API keys

## Environment Setup

### Recommended Setup (Separated API Keys)

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_key_here

# Anthropic API Key  
ANTHROPIC_API_KEY=your_anthropic_key_here

# Default provider selection
SITE_API_PROVIDER=openai  # or 'anthropic'
```

### Legacy Support (Backward Compatibility)

```bash
# Legacy: Single API key (still supported as fallback)
SITE_API_KEY=your_api_key_here
SITE_API_PROVIDER=openai
```

See [ENVIRONMENT_SETUP.md](../../ENVIRONMENT_SETUP.md) for detailed configuration instructions.

## Supported Models

### OpenAI Models
- **GPT-4o** - Latest and most capable
- **GPT-4o Mini** - Faster, cost-effective
- **GPT-4 Turbo** - High performance
- **O1 Pro** - Advanced reasoning (latest)
- **O1** - Reasoning model
- **O1 Mini** - Compact reasoning
- **GPT-3.5 Turbo** - Legacy support

### Anthropic Models  
- **Claude 4 Opus** - Most capable (latest)
- **Claude 4 Sonnet** - High performance (latest)
- **Claude 3.7 Sonnet** - Extended thinking
- **Claude 3.5 Sonnet** - Balanced performance
- **Claude 3.5 Haiku** - Fastest
- **Claude 3 Opus** - Previous generation
- **Claude 3 Haiku** - Legacy fast model

*Models are dynamically fetched from provider APIs with automatic fallback to hardcoded lists.*

## File Structure

```
src/evals/
├── README.md                 # This documentation
├── test-cases.ts            # Test cases for all exercise types
├── model-configs.ts         # Dynamic model configuration and fetching
├── evaluation-runner.ts     # Core evaluation logic
├── cli.ts                   # Command-line interface
└── index.ts                 # Module exports

src/app/
├── evals/page.tsx           # Web UI (development-only)
└── api/evaluate-answer/route.ts  # AI evaluation API endpoint
```

## Test Cases

The evaluation system includes comprehensive test cases for all Croatian grammar exercise types:

### Coverage by Exercise Type
- **Verb Tenses**: 6 test cases (present, past, future, temporal clauses)
- **Noun Declension**: 8 test cases (all major cases: nominative, accusative, genitive, dative, locative, instrumental)
- **Verb Aspect**: 6 test cases (perfective vs imperfective distinctions)
- **Interrogative Pronouns**: 6 test cases (koji/koja/koje in different cases)

### Test Case Features
- **Multiple Correct Answers**: Support for Croatian/Serbian variants and alternative forms
- **Difficulty Levels**: Easy, medium, and hard categorization
- **Expected Explanations**: Quality benchmarks for AI explanations
- **Edge Cases**: Tricky grammar scenarios that often confuse learners
- **Notes**: Additional context for complex cases

### Example Test Case Structure
```typescript
{
  id: 'vt_05',
  exerciseType: 'verbTenses',
  question: 'Ona _____ (pjevati) u zboru od malena.',
  userAnswer: 'pjeva',
  expectedCorrect: true,
  alternativeCorrectAnswers: ['peva'], // Serbian variant
  expectedExplanation: 'Present tense for ongoing activity. Both "pjeva" (Croatian) and "peva" (Serbian) are acceptable.',
  difficultyLevel: 'medium',
}
```

## Dynamic Model Discovery

The system automatically fetches available models from each provider:

### OpenAI Models
- Fetches models via OpenAI API
- Filters for relevant chat completion models
- Falls back to hardcoded models if API fails
- Currently includes: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo

### Anthropic Models
- Uses hardcoded models (no public API for model listing)
- Validates API key with test request
- Currently includes: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

## Usage

### Command Line Interface

Run all available models:
```bash
npm run eval
```

The CLI will:
1. Check for required API keys
2. Fetch available models from both providers
3. Run evaluations on all models
4. Display comprehensive results including:
   - Overall accuracy and explanation quality
   - Breakdown by exercise type
   - Failed test cases with explanations

### Web Interface (Development Only)

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the main page and click "Model Evaluations" (only visible in development)

3. Or go directly to: `http://localhost:3000/evals`

The web interface provides:
- Interactive model selection
- Real-time progress tracking
- Detailed results with tabs for summary and detailed views
- Visual indicators for performance ranking

## Evaluation Metrics

### Accuracy
Percentage of test cases where the AI correctly identified whether the student's answer was right or wrong.

### Explanation Quality
Scored from 1-3 based on:
- **Good (3)**: Contains relevant grammar terms, detailed explanation, appropriate length
- **Acceptable (2)**: Detailed explanation, relevant to the question
- **Poor (1)**: Short, lacks detail, or irrelevant

Quality assessment considers:
- Use of Croatian grammar terminology
- Explanation length and detail
- Relevance to expected explanation
- Coverage of specific grammar rules

## API Endpoint

The evaluation system uses a dedicated API endpoint at `/api/evaluate-answer`:

```typescript
POST /api/evaluate-answer
{
  "exerciseType": "verbTenses",
  "question": "Marko _____ (ići) u školu svaki dan.",
  "userAnswer": "ide",
  "provider": "openai", // optional
  "model": "gpt-4o-mini", // optional
  "alternativeAnswers": ["alternative"], // optional
  "difficultyLevel": "easy" // optional
}
```

Response:
```typescript
{
  "isCorrect": true,
  "explanation": "Present tense, third person singular..."
}
```

## Development-Only Access

For security and user experience reasons:
- The `/evals` page returns a 404-style message in production
- The "Model Evaluations" button is hidden in production builds
- CLI evaluation tool is always available in any environment with proper API keys

## Contributing

When adding new test cases:

1. **Cover Edge Cases**: Include tricky scenarios that often confuse AI models
2. **Add Multiple Answers**: Use `alternativeCorrectAnswers` for variants
3. **Set Difficulty**: Assign appropriate difficulty levels
4. **Write Clear Explanations**: Provide model answers for explanation quality assessment
5. **Add Context**: Use `notes` field for additional important information

Example of a comprehensive test case:
```typescript
{
  id: 'nd_05',
  exerciseType: 'nounDeclension',
  question: 'Uživaju u _____ (bistar zrak).',
  userAnswer: 'bistar zrak',
  expectedCorrect: false,
  expectedExplanation: 'Incorrect case. Should be locative "bistrom zraku" (masculine singular locative), not nominative "bistar zrak".',
  notes: 'This was incorrectly marked as needing accusative "bistre zrake" in our testing - that was wrong.',
  difficultyLevel: 'hard',
}
```

## Performance Expectations

Typical evaluation run:
- **Time**: 1-2 minutes per model (with rate limiting delays)
- **API Calls**: 26 calls per model (one per test case)
- **Rate Limiting**: 1-second delay between requests to avoid API limits

Strong models typically achieve:
- **Accuracy**: 85-95% on correctly identifying right/wrong answers
- **Explanation Quality**: 2.5-3.0 average score
- **Best Performance**: Usually on easier cases (verb tenses, basic declensions)
- **Challenging Areas**: Complex aspect distinctions, irregular declensions
