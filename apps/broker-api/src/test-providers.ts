import { OpenAI } from 'openai';

async function testProviders() {
  console.log('🧪 Testing All Configured Providers\n');
  
  const client = new OpenAI({
    apiKey: 'sk-9cd021bb22d78b0262ecfa219f73075a346b0eff421658f69b80ffd1932e1993', // Uses LiteLLM master key
    baseURL: 'http://localhost:8001/v1',
  });

  // Test each provider
  const providers = [
    { model: 'gpt-3.5-turbo', name: 'OpenAI GPT-3.5', requiresKey: 'OPENAI_API_KEY' },
    { model: 'gpt-4', name: 'OpenAI GPT-4', requiresKey: 'OPENAI_API_KEY' },
    { model: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash', requiresKey: 'GOOGLE_API_KEY' },
    { model: 'gemini-1.5-pro', name: 'Google Gemini 1.5 Pro', requiresKey: 'GOOGLE_API_KEY' },
    { model: 'llama3', name: 'Ollama Llama 3 (Local)', requiresKey: 'None (Local)' },
    { model: 'codellama', name: 'Ollama CodeLlama (Local)', requiresKey: 'None (Local)' }
  ];

  const results = {
    working: [] as string[],
    failed: [] as { provider: string, error: string }[],
  };

  for (const provider of providers) {
    try {
      process.stdout.write(`Testing ${provider.name}... `);
      
      const response = await client.chat.completions.create({
        model: provider.model,
        messages: [{ 
          role: 'user', 
          content: `Say "Hello from ${provider.name}" in exactly 5 words or less.` 
        }],
        max_tokens: 20,
        temperature: 0.1,
      });
      
      const content = response.choices[0]?.message?.content || 'No response';
      console.log(`✅`);
      console.log(`   Response: ${content}`);
      console.log(`   Tokens used: ${response.usage?.total_tokens || 'N/A'}\n`);
      
      results.working.push(provider.name);
    } catch (error: any) {
      console.log(`❌`);
      
      let errorMsg = error.message;
      if (error.status === 401 || error.message.includes('401')) {
        errorMsg = `Missing or invalid ${provider.requiresKey}`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Service not running (Ollama needs to be started)';
      }
      
      console.log(`   Error: ${errorMsg}\n`);
      results.failed.push({ provider: provider.name, error: errorMsg });
    }
  }

  // Summary
  console.log('\n📊 Summary\n' + '─'.repeat(50));
  console.log(`✅ Working: ${results.working.length} providers`);
  results.working.forEach(p => console.log(`   - ${p}`));
  
  console.log(`\n❌ Failed: ${results.failed.length} providers`);
  results.failed.forEach(({ provider, error }) => {
    console.log(`   - ${provider}: ${error}`);
  });

  // Recommendations
  if (results.failed.length > 0) {
    console.log('\n💡 Recommendations:');
    
    const missingKeys = results.failed.filter(f => f.error.includes('Missing or invalid'));
    if (missingKeys.length > 0) {
      console.log('   1. Add the following API keys to infra/.env:');
      const uniqueKeys = [...new Set(missingKeys.map(f => f.error.match(/Missing or invalid (.+)/)?.[1]))];
      uniqueKeys.forEach(key => console.log(`      - ${key}`));
    }
    
    const ollamaFailed = results.failed.filter(f => f.error.includes('Service not running'));
    if (ollamaFailed.length > 0) {
      console.log('   2. Start Ollama service:');
      console.log('      docker compose up -d ollama');
      console.log('      docker exec infra-ollama-1 ollama pull llama3');
    }
  } else {
    console.log('\n🎉 All providers are working correctly!');
  }
}

// Run the test
testProviders().catch(console.error);