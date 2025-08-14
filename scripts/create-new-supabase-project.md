# Creating a New Supabase Project

## Steps to Create New Project:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in with your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Set project name: "Masterprompt" or "Prompt Engineering Studio"
   - Set database password (save this!)
   - Select region (closest to your users)

3. **Get Project Credentials**
   After project is created, go to Settings > API:
   - Copy the Project URL
   - Copy the `anon` `public` key
   - Copy the `service_role` `secret` key (keep this secure!)

4. **Update .env File**
   Replace these values in your .env:
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://[your-project-ref].supabase.co
   SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_KEY=[your-service-key] # Optional, for admin operations
   
   # Database URL from Settings > Database
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   
   # For frontend (Next.js)
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   ```

5. **Apply Migration**
   Once you have the correct credentials:
   ```bash
   # Test connection first
   node scripts/test-supabase-connection.js
   
   # Apply the migration
   node scripts/apply-migration.js
   ```

## Alternative: Manual Migration

If you prefer to apply the migration manually:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20250113_extended_schema.sql`
4. Paste and run the SQL in the editor

This will create all the necessary tables and set up Row Level Security policies.