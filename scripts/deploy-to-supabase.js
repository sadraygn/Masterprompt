#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config();

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function deployToSupabase() {
  try {
    console.log('🚀 Deploying to Supabase...\n');

    // Check if supabase CLI is available
    try {
      await runCommand('pnpm', ['supabase', '--version']);
    } catch (error) {
      console.error('❌ Supabase CLI not found. Installing...');
      await runCommand('pnpm', ['add', '-D', 'supabase']);
    }

    // Set the project reference
    const projectRef = 'hebgfllpnrsqvcrgnqhp'; // From your SUPABASE_URL

    console.log(`🔗 Linking to project: ${projectRef}`);

    // Link to the project
    try {
      await runCommand('pnpm', ['supabase', 'link', '--project-ref', projectRef]);
    } catch (error) {
      console.log('⚠️  Link failed, continuing with deployment...');
    }

    // Set environment variables for Edge Functions
    console.log('🔧 Setting up environment variables...');

    const secrets = [
      { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
      { name: 'GOOGLE_API_KEY', value: process.env.GOOGLE_API_KEY },
      { name: 'LITELLM_MASTER_KEY', value: process.env.LITELLM_MASTER_KEY },
      { name: 'LITELLM_API_BASE', value: process.env.LITELLM_API_BASE },
      { name: 'API_BEARER_TOKEN', value: process.env.API_BEARER_TOKEN },
    ];

    for (const secret of secrets) {
      if (secret.value) {
        try {
          console.log(`  🔐 Setting ${secret.name}...`);
          await runCommand('pnpm', ['supabase', 'secrets', 'set', `${secret.name}=${secret.value}`]);
        } catch (error) {
          console.log(`  ⚠️  Failed to set ${secret.name}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Skipping ${secret.name} (not set)`);
      }
    }

    // Deploy Edge Functions
    console.log('📦 Deploying Edge Functions...');

    const functions = ['completions', 'paraphrase', 'workflows'];

    for (const func of functions) {
      try {
        console.log(`  🚀 Deploying ${func}...`);
        await runCommand('pnpm', ['supabase', 'functions', 'deploy', func]);
        console.log(`  ✅ ${func} deployed successfully`);
      } catch (error) {
        console.log(`  ❌ Failed to deploy ${func}: ${error.message}`);
      }
    }

    console.log('\n🎉 Deployment completed!');
    console.log('\n📋 Your API endpoints:');
    console.log(`  • Completions: https://${projectRef}.supabase.co/functions/v1/completions`);
    console.log(`  • Paraphrase: https://${projectRef}.supabase.co/functions/v1/paraphrase`);
    console.log(`  • Workflows: https://${projectRef}.supabase.co/functions/v1/workflows`);

    console.log('\n🔑 Authentication:');
    console.log(`  Use your SUPABASE_ANON_KEY as the Authorization header:`);
    console.log(`  Authorization: Bearer ${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 Manual deployment steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/hebgfllpnrsqvcrgnqhp');
    console.log('2. Navigate to Edge Functions');
    console.log('3. Create new functions and copy the code from supabase/functions/');
    console.log('4. Set environment variables in Project Settings > API');
    process.exit(1);
  }
}

deployToSupabase();