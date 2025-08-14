#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔗 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not found');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test with a simple health check
    console.log('📋 Testing basic connectivity...');
    
    // Try to access existing tables
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Prompts table not found or accessible:', error.message);
      
      // Check if it's a connection issue or just missing table
      if (error.code === 'PGRST116') {
        console.log('✅ Connection successful - prompts table doesn\'t exist yet (expected)');
        return true;
      } else {
        console.error('❌ Connection failed:', error);
        return false;
      }
    } else {
      console.log('✅ Connection successful - prompts table exists with', data?.length || 0, 'records');
      return true;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 Supabase is accessible! Ready to apply migration.');
    process.exit(0);
  } else {
    console.log('💡 Please check your Supabase project status and credentials.');
    process.exit(1);
  }
});