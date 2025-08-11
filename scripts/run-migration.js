#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../apps/studio-web/.env') || path.join(__dirname, '../.env');
let envContent;
try {
  envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
} catch (e) {
  console.error('Could not find .env file');
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Import postgres from studio-web's node_modules
const postgres = require(path.join(__dirname, '../apps/studio-web/node_modules/postgres'));

async function runMigration() {
  const sql = postgres(envVars.DATABASE_URL);
  
  try {
    console.log('📦 Pushing database schema to Supabase...\n');
    
    // Test connection first
    const test = await sql`SELECT version()`;
    console.log('✅ Connected to database:', test[0].version.split(',')[0]);
    
    // Create tables one by one with error handling
    const tables = [
      {
        name: 'prompts',
        sql: `CREATE TABLE IF NOT EXISTS prompts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          category VARCHAR(100),
          tags TEXT[],
          metadata JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'workflows',
        sql: `CREATE TABLE IF NOT EXISTS workflows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          config JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'evaluations',
        sql: `CREATE TABLE IF NOT EXISTS evaluations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
          workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
          model VARCHAR(100),
          input_data JSONB,
          output_data JSONB,
          metrics JSONB,
          score DECIMAL(5,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'paraphrase_history',
        sql: `CREATE TABLE IF NOT EXISTS paraphrase_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          original_text TEXT NOT NULL,
          paraphrased_text TEXT NOT NULL,
          style VARCHAR(50),
          tone VARCHAR(50),
          model VARCHAR(100),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'api_usage',
        sql: `CREATE TABLE IF NOT EXISTS api_usage (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          request_body JSONB,
          response_status INTEGER,
          response_time_ms INTEGER,
          error_message TEXT,
          user_agent TEXT,
          ip_address INET,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      }
    ];
    
    // Create tables
    for (const table of tables) {
      try {
        await sql.unsafe(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  Table already exists: ${table.name}`);
        } else {
          throw err;
        }
      }
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)',
      'CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON prompts(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_prompt_id ON evaluations(prompt_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_workflow_id ON evaluations(workflow_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC)'
    ];
    
    console.log('\n📊 Creating indexes...');
    for (const index of indexes) {
      await sql.unsafe(index);
    }
    console.log('✅ Indexes created');
    
    // Create trigger function
    console.log('\n🔧 Creating trigger function...');
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Trigger function created');
    
    // Add triggers
    console.log('\n⚡ Adding triggers...');
    const triggers = [
      'CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ];
    
    for (const trigger of triggers) {
      try {
        await sql.unsafe(trigger);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
    console.log('✅ Triggers added');
    
    // Verify final state
    const createdTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('prompts', 'workflows', 'evaluations', 'paraphrase_history', 'api_usage')
      ORDER BY tablename
    `;
    
    console.log('\n🎉 Database schema successfully pushed to Supabase!\n');
    console.log('📊 Available tables:');
    createdTables.forEach(t => console.log(`   - ${t.tablename}`));
    
    await sql.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

runMigration();