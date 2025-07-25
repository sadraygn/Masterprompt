import { OpenAI } from 'openai';

// Test script to verify LiteLLM connection
async function testLiteLLM() {
  console.log('🧪 Testing LiteLLM connection...\n');

  const client = new OpenAI({
    apiKey: 'sk-1234567890abcdef', // Mock key for testing
    baseURL: 'http://localhost:8000/v1',
  });

  try {
    // Test 1: List models
    console.log('📋 Listing available models...');
    const models = await client.models.list();
    console.log(`✅ Found ${models.data.length} models:`);
    models.data.forEach(model => {
      console.log(`   - ${model.id}`);
    });

    // Test 2: Simple completion with mock key
    console.log('\n🤖 Testing completion with mock key...');
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Hello from LiteLLM!" in exactly 5 words.' }
        ],
        temperature: 0.7,
      });

      console.log('✅ Completion response:');
      console.log(`   Model: ${completion.model}`);
      console.log(`   Response: ${completion.choices[0]?.message.content}`);
      console.log(`   Tokens: ${completion.usage?.total_tokens || 'N/A'}`);
    } catch (error) {
      if (error instanceof OpenAI.APIError && error.status === 401) {
        console.log('⚠️  Got expected 401 error with mock key - this is normal!');
        console.log('   LiteLLM is running correctly but needs real API keys.');
      } else {
        throw error;
      }
    }

    console.log('\n✨ LiteLLM proxy is working correctly!');
    console.log('   Update infra/.env with real API keys to test actual completions.');

  } catch (error) {
    console.error('❌ LiteLLM test failed:', error);
    console.error('\nMake sure Docker services are running:');
    console.error('   cd infra && docker-compose up -d');
    process.exit(1);
  }
}

testLiteLLM();