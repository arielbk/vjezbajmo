#!/usr/bin/env tsx

// Test script to verify the evals system structure without requiring API keys

import { EvaluationRunner } from './evaluation-runner';
import { ALL_TEST_CASES } from './test-cases';
import { fetchAllModels } from './model-configs';

async function testEvalsStructure() {
  console.log('🔍 Testing Evals System Structure\n');

  try {
    // Test 1: Load test cases
    console.log(`✅ Test cases loaded: ${ALL_TEST_CASES.length} cases`);
    
    // Test 2: Create evaluation runner
    new EvaluationRunner();
    console.log('✅ EvaluationRunner created successfully');
    
    // Test 3: Test model discovery (will use hardcoded fallbacks)
    console.log('🔍 Testing model discovery...');
    const models = await fetchAllModels();
    console.log(`✅ Model discovery completed: ${models.length} models found`);
    
    // Display models
    console.log('\n📋 Available Models:');
    models.forEach(model => {
      console.log(`  • ${model.name} (${model.provider})`);
    });
    
    // Test 4: Test case structure
    console.log('\n📋 Test Case Types:');
    const exerciseTypes = [...new Set(ALL_TEST_CASES.map(tc => tc.request.exerciseType))];
    exerciseTypes.forEach(type => {
      const count = ALL_TEST_CASES.filter(tc => tc.request.exerciseType === type).length;
      console.log(`  • ${type}: ${count} test cases`);
    });
    
    console.log('\n✅ All structural tests passed!');
    console.log('\n💡 To run actual evaluations, set API keys:');
    console.log('   export OPENAI_API_KEY="your-key"');
    console.log('   export ANTHROPIC_API_KEY="your-key"');
    console.log('   npx tsx src/evals/cli.ts');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testEvalsStructure();
}
