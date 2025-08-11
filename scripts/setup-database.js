#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse the DATABASE_URL from .env
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

// Extract project ref from the URL
const match = DATABASE_URL.match(/db\.([^.]+)\.supabase\.co/);
if (!match) {
  console.error('Could not extract project reference from DATABASE_URL');
  process.exit(1);
}

const projectRef = match[1];
const supabaseUrl = `https://${projectRef}.supabase.co`;

// You'll need to provide the anon key for your project
// This can be found in your Supabase project settings
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.log(`
To connect to Supabase, you need to add your project's anon key to the .env file:

1. Go to https://supabase.com/dashboard/project/${projectRef}/settings/api
2. Copy the "anon public" key
3. Add it to your .env file as: SUPABASE_ANON_KEY=your-key-here
4. Run this script again

Your Supabase project URL: ${supabaseUrl}
`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('prompts').select('count');
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is expected
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log(`Project URL: ${supabaseUrl}`);
    console.log(`Project Ref: ${projectRef}`);
    
    // Read and display the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240808_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('\n📄 Migration file found at:', migrationPath);
      console.log('\nTo apply this migration:');
      console.log('1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/' + projectRef + '/sql');
      console.log('2. Copy and paste the contents of the migration file');
      console.log('3. Click "Run" to execute the SQL');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();