#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const postgres = require('../apps/studio-web/node_modules/postgres');

// Parse and rebuild the connection string
const dbUrl = envVars.DATABASE_URL;
console.log('Using connection string:', dbUrl);

const sql = postgres(dbUrl);

async function applyMigration() {
  try {
    console.log('Applying database migration to Supabase...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240808_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as one transaction
    await sql.begin(async sql => {
      // Split into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          try {
            await sql.unsafe(statement);
          } catch (err) {
            if (!err.message.includes('already exists')) {
              throw err;
            }
            console.log(`  Skipping (already exists): ${statement.substring(0, 50)}...`);
          }
        }
      }
    });
    
    console.log('✅ Migration applied successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('prompts', 'workflows', 'evaluations', 'paraphrase_history', 'api_usage')
    `;
    
    console.log('\nCreated tables:');
    tables.forEach(t => console.log('  - ' + t.tablename));
    
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sql.end();
    process.exit(1);
  }
}

applyMigration();