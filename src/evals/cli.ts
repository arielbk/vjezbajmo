#!/usr/bin/env tsx

import { EvaluationRunner } from './evaluation-runner';
import { ALL_TEST_CASES } from './test-cases';

async function main() {
  console.log('🚀 Croatian Grammar AI Model Evaluation CLI\n');

  // Check environment variables
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    console.error('❌ Error: At least one API key is required');
    console.error('Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY environment variables');
    process.exit(1);
  }

  if (openaiKey) {
    console.log('✅ OpenAI API key found');
  }
  if (anthropicKey) {
    console.log('✅ Anthropic API key found');
  }

  console.log('\n📊 Starting evaluation...\n');

  try {
    const runner = new EvaluationRunner();
    
    // First, show available models
    console.log('🔍 Fetching available models...');
    const availableModels = await runner.getAvailableModels();
    console.log(`Found ${availableModels.length} models:\n`);
    
    availableModels.forEach(model => {
      console.log(`  • ${model.name} (${model.provider})`);
    });
    console.log('');

    // Run evaluation on all models
    console.log('🧪 Running evaluations...\n');
    const performances = await runner.runAllModels(ALL_TEST_CASES);

    // Display results
    console.log('📈 EVALUATION RESULTS\n');
    console.log('=' .repeat(80));

    performances.forEach((perf, index) => {
      console.log(`${index + 1}. ${perf.modelName}`);
      console.log(`   Accuracy: ${perf.accuracy.toFixed(1)}% (${perf.correctEvaluations}/${perf.totalTests})`);
      console.log(`   Explanation Quality: ${perf.explanationQuality.toFixed(2)}/3.0`);
      console.log('');
    });

    // Show detailed breakdown by exercise type
    console.log('\n📋 DETAILED BREAKDOWN BY EXERCISE TYPE\n');
    console.log('=' .repeat(80));

    const exerciseTypes = ['verbTenses', 'nounDeclension', 'verbAspect', 'interrogativePronouns'];
    
    exerciseTypes.forEach(exerciseType => {
      console.log(`\n🎯 ${exerciseType.toUpperCase()}`);
      console.log('-' .repeat(40));
      
      performances.forEach(perf => {
        const typeResults = perf.results.filter(r => r.testCaseId.startsWith(exerciseType.slice(0, 2)));
        if (typeResults.length > 0) {
          const typeCorrect = typeResults.filter(r => r.actualCorrect).length;
          const typeAccuracy = (typeCorrect / typeResults.length) * 100;
          console.log(`${perf.modelName}: ${typeAccuracy.toFixed(1)}% (${typeCorrect}/${typeResults.length})`);
        }
      });
    });

    // Show failed cases
    console.log('\n❌ FAILED EVALUATIONS\n');
    console.log('=' .repeat(80));

    performances.forEach(perf => {
      const failedCases = perf.results.filter(r => !r.actualCorrect);
      if (failedCases.length > 0) {
        console.log(`\n${perf.modelName} - ${failedCases.length} failed cases:`);
        failedCases.forEach(result => {
          console.log(`  • ${result.testCaseId}: Expected ${result.expectedCorrect}, got ${result.aiResponse.isCorrect}`);
          console.log(`    Question: ${result.userAnswer}`);
          console.log(`    AI Explanation: ${result.aiResponse.explanation.slice(0, 100)}...`);
        });
      }
    });

    console.log('\n✅ Evaluation completed successfully!');
  } catch (error) {
    console.error('❌ Error running evaluation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
