# AI Model Evaluation System for Croatian Grammar Exercise Generation

This directory contains a comprehensive evaluation system to systematically test and compare AI models for generating Croatian grammar exercises, as specified in issue #36. The system helps with current decision making, future monitoring, quality assurance, and performance optimization.

## 🎯 Objective

Create a comprehensive evaluation system to:

1. **Current Decision Making**: Choose the best model for immediate use
2. **Future Monitoring**: Continuously evaluate new models as they become available
3. **Quality Assurance**: Ensure generated exercises maintain high standards
4. **Performance Optimization**: Balance quality, speed, and cost for our use case

## 🏗️ Core Features

- **Multiple AI Provider Support**: Test both OpenAI and Anthropic models with easy expansion for future providers
- **Dynamic Model Discovery**: Automatically fetches available models from each provider's API
- **Real-time Progress Updates**: Live progress tracking for individual test cases during evaluation
- **Comprehensive Test Cases**: High-quality test cases covering all exercise types with multiple difficulty levels
- **Weighted Scoring System**: Answer correctness (45%), explanation quality (15%), exercise design (15%), speed & reliability (15%), cost efficiency (10%)
- **Export Functionality**: Preserve evaluation results across sessions with JSON/CSV/Report formats
- **Development-Only Access**: Web UI is only accessible in development mode for security
- **CLI and Web Interface**: Run evaluations from command line or browser
- **Croatian Language Expertise**: All validation grounded in authentic Croatian language standards

## 📊 Evaluation Criteria (Weighted Priority)

The evaluation system uses the following weighted criteria based on issue #36:

### 🚨 Deal Breakers (Heavily Penalized)

- **Answer Correctness (45% weight)** - MOST CRITICAL
  - Generated correct answers are grammatically accurate in Croatian
  - All valid Croatian answers are included (comprehensive multiple correct answers)
  - Zero tolerance for incorrect answers marked as correct
  - Proper diacritic usage and declension forms
  - _Rationale_: User trust is fundamental - any incorrect "correct" answers immediately undermine system credibility

### ⚡ Performance Factors (15% weight)

- **Generation Speed & Reliability**
  - Response time measurement and comparison across models
  - Consistency of response times (avoid highly variable performance)
  - Error rate and timeout handling
  - _Rationale_: Important for user experience but not a deal-breaker

### 📚 Quality Factors (30% weight)

- **Explanation Quality (15% weight)**

  - Grammatically accurate explanations in Croatian
  - Pedagogically sound and helpful for language learners
  - Appropriate complexity for selected CEFR level
  - Clear reasoning for why answers are correct

- **Exercise Design & Guideline Adherence (15% weight)**
  - Vocabulary appropriate for selected CEFR level (A1, A2.1, A2.2, B1.1)
  - Strong theme adherence when theme is specified by user
  - Question variety and non-repetitive content
  - Proper exercise structure and format
  - Cultural relevance and authenticity for Croatian context

### 💰 Cost Analysis (10% weight + Bonus Features)

- **Cost Efficiency**
  - Input/output token count and associated costs
  - Cost per exercise generation comparison
  - Quality-to-cost ratio analysis
  - **Bonus**: Real-time pricing API integration
  - **Bonus**: Automatic cost tracking and optimization recommendations

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

_Models are dynamically fetched from provider APIs with automatic fallback to hardcoded lists._

## File Structure

```
src/evals/
├── README.md                 # This documentation
├── test-cases.ts            # Test cases for all exercise types
├── model-configs.ts         # Dynamic model configuration and fetching
├── evaluation-runner.ts     # Core evaluation logic
├── cli.ts                   # Command-line interface
├── test-structure.ts        # Structure validation tools
├── export-utils.ts          # Export functionality for results preservation
└── index.ts                 # Module exports

src/app/
└── evals/page.tsx           # Web UI (development-only)
```

## Test Cases

The evaluation system includes comprehensive test cases for all Croatian grammar exercise types:

### Coverage by Exercise Type

- **Verb Tenses**: 6 test cases (present, past, future, temporal clauses)
- **Noun Declension**: 8 test cases (all major cases: nominative, accusative, genitive, dative, locative, instrumental)
- **Verb Aspect**: 6 test cases (perfective vs imperfective distinctions)
- **Relative Pronouns**: 6 test cases (koji/koja/koje in different cases)

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

### Weighted Scoring System

Based on issue #36 requirements, the evaluation uses the following weights:

**Total Score = 100%**

- 🚨 **Answer Correctness: 45%** - CRITICAL (Deal breaker if poor)
- 📚 **Explanation Quality: 15%** - Important for pedagogy
- 🎯 **Exercise Design & Guidelines: 15%** - Important for CEFR compliance
- ⚡ **Speed & Reliability: 15%** - Important for user experience
- 💰 **Cost Efficiency: 10%** - Important for sustainability

### Answer Correctness (45% - Most Critical)

- Percentage of test cases where the AI correctly identified whether the student's answer was right or wrong
- **Zero tolerance** for incorrect answers marked as correct
- Support for multiple valid Croatian forms and regional variations
- Proper diacritic usage and declension accuracy

### Explanation Quality (15%)

Scored from 1-3 based on:

- **Good (3)**: Contains relevant Croatian grammar terms, detailed explanation, appropriate length
- **Acceptable (2)**: Detailed explanation, relevant to the question
- **Poor (1)**: Short, lacks detail, or irrelevant

Quality assessment considers:

- Use of Croatian grammar terminology
- Explanation length and detail
- Relevance to expected explanation
- Coverage of specific grammar rules
- Pedagogical appropriateness for CEFR level

### Exercise Design & Guidelines (15%)

- Vocabulary appropriateness for specified CEFR level
- Theme adherence when specified
- Question variety and non-repetitive content
- Cultural relevance and authenticity for Croatian context
- Proper exercise structure and format

### Speed & Reliability (15%)

- Response time measurement and consistency
- Error rate and timeout handling
- Comparison of execution times across models
- System reliability and stability

### Cost Efficiency (10%)

- Input/output token count analysis
- Cost per exercise generation
- Quality-to-cost ratio assessment
- Total cost comparison across models

## 📊 Export Functionality

The evaluation system provides comprehensive export capabilities for data persistence and sharing:

### Export Formats

- **JSON**: Complete structured data with all evaluation details
- **CSV**: Spreadsheet-compatible format for analysis
- **Report**: Human-readable markdown report with rankings and analysis

### Export Options

```typescript
interface ExportOptions {
  format: "json" | "csv" | "report";
  includeFailedCases?: boolean;
  includePerformanceDetails?: boolean;
  includeCostAnalysis?: boolean;
}
```

### Usage Example

```typescript
import { exportToJSON, exportToCSV, exportToReport, downloadFile } from "./export-utils";

// Export to JSON
const jsonData = exportToJSON(evaluationResults, {
  format: "json",
  includeFailedCases: true,
});

// Export to CSV for spreadsheet analysis
const csvData = exportToCSV(evaluationResults, {
  format: "csv",
  includeCostAnalysis: true,
});

// Generate comprehensive report
const report = exportToReport(evaluationResults, {
  format: "report",
  includePerformanceDetails: true,
  includeFailedCases: true,
  includeCostAnalysis: true,
});

// Download in browser
downloadFile(report, "evaluation-report.md", "report");
```

### Data Persistence Benefits

- **Prevent Data Loss**: Save evaluation results across sessions
- **Shareable Reports**: Generate formatted reports for team review
- **Historical Tracking**: Maintain records for model performance trends
- **Decision Documentation**: Preserve rationale for model selection decisions

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

Typical evaluation run based on issue #36 criteria:

- **Time**: 1-2 minutes per model (with rate limiting delays)
- **API Calls**: 11 calls per model (one per test case)
- **Rate Limiting**: 1-second delay between requests to avoid API limits

### Expected Model Performance (According to Issue #36 Weights):

- **Answer Correctness (45% weight)**: 85-95% accuracy on Croatian grammar validation
- **Explanation Quality (15% weight)**: 2.5-3.0 average score for pedagogical explanations
- **Exercise Design (15% weight)**: 80-90% adherence to CEFR levels and themes
- **Speed & Reliability (15% weight)**: Consistent response times under 10 seconds
- **Cost Efficiency (10% weight)**: Balanced token usage vs quality

### Challenging Areas:

- **Complex Croatian Declensions**: Irregular noun forms and case endings
- **Verb Aspects**: Perfective vs imperfective distinctions
- **CEFR Vocabulary Matching**: Age-appropriate word selection
- **Cultural Authenticity**: Croatian-specific contexts and references

### Critical Success Factors:

- **Zero Tolerance for Incorrect Answers**: Models failing answer correctness receive heavy penalties
- **Croatian Language Expertise**: All validation must meet authentic Croatian standards
- **Pedagogical Appropriateness**: Explanations must be suitable for language learners
- **Export-Enabled Results**: All evaluation data can be preserved and shared
