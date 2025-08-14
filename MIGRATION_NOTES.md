# Migration Notes - Supabase Data Model Alignment

## Migration Status
**Date**: 2025-01-13  
**Version**: 1.0.0  
**Status**: ✅ DEPLOYED TO PRODUCTION

**Supabase Project**: https://hebgfllpnrsqvcrgnqhp.supabase.co  
**Database**: PostgreSQL 17.4  
**Migration Applied**: 2025-01-13 via `apply-migration-safe.js`

## Changes Applied

### 1. Dependencies Added
- `@supabase/supabase-js@2.54.0` - Supabase JavaScript client
- `supabase@2.34.3` - Supabase CLI (dev dependency)

### 2. Database Schema Extended
Created migration file: `/supabase/migrations/20250113_extended_schema.sql`

New tables added:
- `users` - User authentication and profile data
- `sessions` - Session management
- `api_keys` - API key management
- `audit_logs` - Audit trail

Modified existing tables:
- Added `user_id` foreign key to all existing tables
- Updated RLS policies for user-based access control

### 3. TypeScript Types Generated
- `/apps/studio-web/src/lib/database.types.ts`
- `/apps/broker-api/src/lib/database.types.ts`

### 4. Supabase Client Configuration
- `/apps/studio-web/src/lib/supabase.ts` - Client-side Supabase client
- `/apps/broker-api/src/lib/supabase.ts` - Server-side admin client

### 5. Data Access Layer Created
Repository pattern implemented:
- `/apps/broker-api/src/repositories/base.repository.ts` - Base repository class
- `/apps/broker-api/src/repositories/prompts.repository.ts` - Prompts CRUD
- `/apps/broker-api/src/repositories/workflows.repository.ts` - Workflows CRUD
- `/apps/broker-api/src/repositories/evaluations.repository.ts` - Evaluations tracking
- `/apps/broker-api/src/repositories/paraphrase-history.repository.ts` - Paraphrase history

### 6. API Routes Updated
- `/apps/broker-api/src/routes/prompts/index.ts` - New prompts API endpoints
- `/apps/broker-api/src/routes/workflows/index.ts` - Updated to use database
- `/apps/broker-api/src/routes/paraphrase/index.ts` - Saves history to database

## Environment Variables Required

Add these to your `.env` file:
```bash
# Supabase Configuration
SUPABASE_URL=https://kmrvlmnduypzisiparnc.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key> # Optional, for admin operations

# For frontend (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://kmrvlmnduypzisiparnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Migration Steps

### To Apply Migration:

1. **Apply database schema**:
   ```bash
   # Go to Supabase SQL Editor
   # https://supabase.com/dashboard/project/kmrvlmnduypzisiparnc/sql
   
   # Copy and run the contents of:
   # /supabase/migrations/20250113_extended_schema.sql
   ```

2. **Update environment variables**:
   ```bash
   # Add Supabase credentials to .env files
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Restart services**:
   ```bash
   pnpm dev
   ```

## Rollback Plan

### To Rollback Changes:

1. **Rollback database schema** (if applied):
   ```sql
   -- Run in Supabase SQL Editor
   
   -- Drop new tables
   DROP TABLE IF EXISTS audit_logs CASCADE;
   DROP TABLE IF EXISTS api_keys CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   
   -- Remove user_id columns from existing tables
   ALTER TABLE prompts DROP COLUMN IF EXISTS user_id;
   ALTER TABLE workflows DROP COLUMN IF EXISTS user_id;
   ALTER TABLE evaluations DROP COLUMN IF EXISTS user_id;
   ALTER TABLE paraphrase_history DROP COLUMN IF EXISTS user_id;
   ALTER TABLE api_usage DROP COLUMN IF EXISTS user_id;
   
   -- Restore original RLS policies
   DROP POLICY IF EXISTS "Users can view all public prompts" ON prompts;
   DROP POLICY IF EXISTS "Users can create their own prompts" ON prompts;
   DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
   DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;
   
   CREATE POLICY "Enable read access for all users" ON prompts FOR SELECT USING (true);
   CREATE POLICY "Enable insert for all users" ON prompts FOR INSERT WITH CHECK (true);
   CREATE POLICY "Enable update for all users" ON prompts FOR UPDATE USING (true);
   CREATE POLICY "Enable delete for all users" ON prompts FOR DELETE USING (true);
   
   -- Repeat for other tables...
   ```

2. **Revert code changes**:
   ```bash
   # Revert to previous commit
   git revert HEAD
   
   # Or checkout previous state
   git checkout <previous-commit-hash>
   ```

3. **Remove dependencies**:
   ```bash
   pnpm remove @supabase/supabase-js supabase
   ```

4. **Clear environment variables**:
   ```bash
   # Remove Supabase-related variables from .env
   ```

## Feature Flags

The implementation includes built-in fallbacks:
- Database operations check `isSupabaseConfigured()` before executing
- If database is not configured, operations return empty results or log warnings
- In-memory implementations remain as fallback

To disable database features without rollback:
1. Remove or comment out Supabase environment variables
2. The app will automatically fall back to in-memory storage

## Testing Checklist

### Pre-deployment:
- [ ] Test database connection
- [ ] Verify RLS policies work correctly
- [ ] Test CRUD operations for prompts
- [ ] Test workflow persistence
- [ ] Verify evaluation tracking
- [ ] Check paraphrase history saving

### Post-deployment:
- [ ] Monitor error logs for database connection issues
- [ ] Check query performance metrics
- [ ] Verify data persistence across restarts
- [ ] Test user isolation (RLS)

## Known Issues & Limitations

1. **Auth Integration**: User authentication is still mocked. Full Supabase Auth integration pending.
2. **Migration Tool**: Manual SQL execution required. Consider using Supabase CLI migrations.
3. **Type Generation**: Types are manually created. Set up automatic generation with Supabase CLI.
4. **Connection Pooling**: Using default settings. May need tuning for production.

## Performance Considerations

- Indexes added for common query patterns
- Consider adding connection pooling for high traffic
- Monitor slow queries in Supabase dashboard
- Enable query caching for frequently accessed data

## Security Notes

1. **Service Key**: Never expose service key in frontend code
2. **RLS Policies**: Always test RLS policies thoroughly
3. **API Keys**: Store hashed, not plain text
4. **Audit Logging**: Enable for compliance requirements

## Next Steps

1. **Phase 2**: Implement Supabase Auth integration
2. **Phase 3**: Add real-time subscriptions for collaboration
3. **Phase 4**: Implement vector search for semantic prompt search
4. **Phase 5**: Add file storage for prompt attachments

## Support & Troubleshooting

### Common Issues:

**Database connection fails:**
- Check SUPABASE_URL format
- Verify API keys are correct
- Check network connectivity

**RLS policies blocking access:**
- Temporarily disable RLS for testing
- Check auth.uid() is properly set
- Review policy conditions

**Type mismatches:**
- Regenerate types after schema changes
- Check nullable fields match schema

### Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [Project Dashboard](https://supabase.com/dashboard/project/kmrvlmnduypzisiparnc)
- [SQL Editor](https://supabase.com/dashboard/project/kmrvlmnduypzisiparnc/sql)