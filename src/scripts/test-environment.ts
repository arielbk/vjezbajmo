#!/usr/bin/env tsx

// Simple test script to verify API key setup and model fetching

import { fetchAllModels } from '../evals/model-configs';

async function testEnvironment() {
  console.log('🔍 Testing Environment Setup\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`  SITE_API_KEY: ${process.env.SITE_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`  SITE_API_PROVIDER: ${process.env.SITE_API_PROVIDER || 'Not set'}`);

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.SITE_API_KEY) {
    console.log('\n❌ No API keys found!');
    console.log('Please set OPENAI_API_KEY and/or ANTHROPIC_API_KEY environment variables.');
    console.log('See ENVIRONMENT_SETUP.md for detailed instructions.');
    process.exit(1);
  }

  console.log('\n🔍 Fetching Available Models...');
  try {
    const models = await fetchAllModels();
    console.log(`✅ Found ${models.length} models:`);
    
    const openaiModels = models.filter(m => m.provider === 'openai');
    const anthropicModels = models.filter(m => m.provider === 'anthropic');
    
    if (openaiModels.length > 0) {
      console.log(`\n🤖 OpenAI Models (${openaiModels.length}):`);
      openaiModels.forEach(model => console.log(`  • ${model.name}`));
    }
    
    if (anthropicModels.length > 0) {
      console.log(`\n🧠 Anthropic Models (${anthropicModels.length}):`);
      anthropicModels.forEach(model => console.log(`  • ${model.name}`));
    }

    console.log('\n✅ Environment setup looks good!');
    console.log('\nNext steps:');
    console.log('  • Run evaluations: npm run eval');
    console.log('  • Start dev server: npm run dev');
    console.log('  • Visit evaluations page: http://localhost:3000/evals');

  } catch (error) {
    console.log('❌ Error fetching models:', error);
    console.log('\nThis usually means:');
    console.log('  • Invalid API key(s)');
    console.log('  • Network connectivity issues');
    console.log('  • API provider is down');
  }
}

if (require.main === module) {
  testEnvironment().catch(console.error);
}
