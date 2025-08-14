#!/usr/bin/env node

const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function applyMigrationSafe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase database...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Test connection
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version.split(',')[0]);

    // Create the updated_at trigger function first if it doesn't exist
    console.log('🔧 Creating trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create new tables
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255),
              role VARCHAR(50) DEFAULT 'user',
              permissions TEXT[],
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_login_at TIMESTAMP WITH TIME ZONE
          );
        `
      },
      {
        name: 'sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS sessions (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              token TEXT UNIQUE NOT NULL,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              data JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'api_keys',
        sql: `
          CREATE TABLE IF NOT EXISTS api_keys (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              key_hash TEXT UNIQUE NOT NULL,
              name VARCHAR(255),
              permissions TEXT[],
              last_used_at TIMESTAMP WITH TIME ZONE,
              expires_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES users(id) ON DELETE SET NULL,
              action VARCHAR(100) NOT NULL,
              resource VARCHAR(255),
              resource_id VARCHAR(255),
              metadata JSONB DEFAULT '{}',
              ip_address INET,
              user_agent TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    // Create tables
    for (const table of tables) {
      console.log(`📋 Creating table: ${table.name}`);
      try {
        await client.query(table.sql);
        console.log(`  ✅ ${table.name} created/verified`);
      } catch (error) {
        console.log(`  ⚠️  ${table.name}:`, error.message);
      }
    }

    // Add user_id columns to existing tables
    const alterations = [
      'ALTER TABLE prompts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE workflows ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE paraphrase_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL',
      'ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL'
    ];

    console.log('🔗 Adding user_id columns to existing tables...');
    for (const alter of alterations) {
      try {
        await client.query(alter);
        console.log('  ✅ Column added successfully');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ✅ Column already exists');
        } else {
          console.log('  ⚠️  Error:', error.message);
        }
      }
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_paraphrase_history_user_id ON paraphrase_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)'
    ];

    console.log('📊 Creating indexes...');
    for (const index of indexes) {
      try {
        await client.query(index);
        console.log('  ✅ Index created');
      } catch (error) {
        console.log('  ⚠️  Index:', error.message);
      }
    }

    // Enable RLS on new tables
    const rlsTables = ['users', 'sessions', 'api_keys', 'audit_logs'];
    console.log('🔒 Enabling Row Level Security...');
    for (const table of rlsTables) {
      try {
        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`  🔒 RLS enabled on ${table}`);
      } catch (error) {
        console.log(`  ⚠️  RLS on ${table}:`, error.message);
      }
    }

    // Add triggers
    console.log('⚡ Adding triggers...');
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('  ✅ Users trigger added');
    } catch (error) {
      console.log('  ⚠️  Users trigger:', error.message);
    }

    // Verify final state
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    const newTables = ['users', 'sessions', 'api_keys', 'audit_logs'];
    const existingTables = tablesResult.rows.map(r => r.table_name);
    
    console.log('\n🆕 New tables status:');
    newTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('  1. Test the API endpoints');
    console.log('  2. Monitor the database performance');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrationSafe();