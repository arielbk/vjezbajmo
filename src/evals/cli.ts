#!/usr/bin/env tsx

import { EvaluationRunner } from './evaluation-runner';
import { ALL_TEST_CASES } from './test-cases';

async function main() {
  console.log('🚀 Croatian Grammar AI Exercise Generation Evaluation CLI\n');

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

  console.log('\n📊 Starting exercise generation evaluation...\n');

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
    console.log('🧪 Running exercise generation evaluations...\n');
    const performances = await runner.runAllModels(ALL_TEST_CASES);

    // Display results
    console.log('📈 EVALUATION RESULTS\n');
    console.log('='.repeat(80));

    performances.forEach((perf, index) => {
      console.log(`${index + 1}. ${perf.modelName}`);
      console.log(`   Overall Score: ${perf.overallScore.toFixed(3)} (${perf.successfulGenerations}/${perf.totalTests} successful)`);
      console.log(`   Structure: ${perf.structureScore.toFixed(3)} | Content: ${perf.contentScore.toFixed(3)} | Explanations: ${perf.explanationScore.toFixed(3)}`);
      console.log(`   Theme: ${perf.themeScore.toFixed(3)} | CEFR: ${perf.cefrScore.toFixed(3)}`);
      console.log(`   Avg Time: ${perf.averageExecutionTime.toFixed(0)}ms`);
      console.log('');
    });

    // Show detailed breakdown by exercise type
    console.log('\n📋 DETAILED BREAKDOWN BY EXERCISE TYPE\n');
    console.log('='.repeat(80));

    const exerciseTypes = ['verbTenses', 'nounDeclension', 'verbAspect', 'interrogativePronouns'];
    
    exerciseTypes.forEach(exerciseType => {
      console.log(`\n🎯 ${exerciseType.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      performances.forEach(perf => {
        const typeResults = perf.results.filter(r => 
          ALL_TEST_CASES.find(tc => tc.id === r.testCaseId)?.request.exerciseType === exerciseType
        );
        
        if (typeResults.length > 0) {
          const successfulCount = typeResults.filter(r => r.exerciseGenerated).length;
          const avgScore = typeResults.length > 0 
            ? typeResults.reduce((sum, r) => sum + r.overallScore, 0) / typeResults.length
            : 0;
          console.log(`${perf.modelName}: ${avgScore.toFixed(3)} (${successfulCount}/${typeResults.length} generated)`);
        }
      });
    });

    // Show failed generations
    console.log('\n❌ FAILED GENERATIONS\n');
    console.log('='.repeat(80));

    performances.forEach(perf => {
      const failedCases = perf.results.filter(r => !r.exerciseGenerated);
      if (failedCases.length > 0) {
        console.log(`\n${perf.modelName} - ${failedCases.length} failed generations:`);
        failedCases.forEach(result => {
          const testCase = ALL_TEST_CASES.find(tc => tc.id === result.testCaseId);
          console.log(`  • ${result.testCaseId}: ${testCase?.description || 'Unknown test'}`);
          if (result.errors.length > 0) {
            result.errors.forEach(error => {
              console.log(`    Error: ${error}`);
            });
          }
        });
      }
    });

    // Show lowest scoring successful generations
    console.log('\n📉 LOWEST SCORING SUCCESSFUL GENERATIONS\n');
    console.log('='.repeat(80));

    performances.forEach(perf => {
      const successfulResults = perf.results.filter(r => r.exerciseGenerated);
      const lowestScoring = successfulResults
        .sort((a, b) => a.overallScore - b.overallScore)
        .slice(0, 3);
      
      if (lowestScoring.length > 0) {
        console.log(`\n${perf.modelName} - Lowest scoring:`);
        lowestScoring.forEach(result => {
          const testCase = ALL_TEST_CASES.find(tc => tc.id === result.testCaseId);
          console.log(`  • ${result.testCaseId}: ${result.overallScore.toFixed(3)} - ${testCase?.description || 'Unknown'}`);
          console.log(`    Structure: ${result.structureScore.toFixed(3)} | Content: ${result.contentScore.toFixed(3)} | Explanations: ${result.explanationScore.toFixed(3)}`);
        });
      }
    });

    console.log('\n✅ Exercise generation evaluation completed successfully!');
  } catch (error) {
    console.error('❌ Error running evaluation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
