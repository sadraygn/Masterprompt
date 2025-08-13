# Supabase Data Model Alignment Plan

## 1. Repository Map

### Backend Entry Points
- **Main API**: `/apps/broker-api/src/app.ts`
- **Routes**:
  - `/v1/chat/completions` - LLM completions endpoint
  - `/v1/paraphrase` - Text paraphrasing service
  - `/v1/workflows` - Workflow management
  - `/health` - Health check endpoint
  - `/api/cache/stats` - Cache statistics
  - `/ws` - WebSocket connections

### Frontend Entry Points
- **Studio Web App**: `/apps/studio-web/src/app`
  - Main prompt engineering interface
  - Workflow builder
  - Prompt library
  - API proxy routes

### Data Layer
- **Current DB Client**: `postgres` package in `/apps/studio-web/src/lib/db.ts`
- **Supabase Schema**: `/supabase/migrations/20240808_initial_schema.sql`
- **No Supabase SDK Integration**: Currently using raw PostgreSQL

## 2. Entity Model & CRUD Matrix

| Entity | Create | Read | Update | Delete | Current Storage | Notes |
|--------|--------|------|--------|--------|----------------|-------|
| **Prompts** | ❌ | ❌ | ❌ | ❌ | In-memory/Frontend | Schema exists, not used |
| **Workflows** | ❌ | ✅ | ❌ | ❌ | In-memory registry | Runtime only, no persistence |
| **Evaluations** | ❌ | ❌ | ❌ | ❌ | File system | Schema exists, not used |
| **Paraphrase History** | ❌ | ❌ | ❌ | ❌ | None | Schema exists, not used |
| **API Usage** | ❌ | ❌ | ❌ | ❌ | None | Schema exists, not used |
| **Users** | ❌ | ❌ | ❌ | ❌ | Mock/In-memory | No schema, auth is mocked |
| **Sessions** | ❌ | ❌ | ❌ | ❌ | In-memory | No schema |
| **API Keys** | ❌ | ❌ | ❌ | ❌ | Environment vars | No schema |
| **Audit Logs** | ❌ | ❌ | ❌ | ❌ | In-memory | No schema, placeholder code |
| **Cache Entries** | ✅ | ✅ | ✅ | ✅ | Redis/Memory | No database persistence |

## 3. Gap Analysis

### Critical Gaps (HIGH Risk)
1. **No Database Operations**: Despite having schema, NO actual database operations are implemented
2. **No Supabase Client**: Project uses raw postgres, not @supabase/supabase-js
3. **No User Management**: Auth system exists but doesn't integrate with Supabase Auth
4. **No Data Persistence**: All data is ephemeral (in-memory or file-based)

### Schema vs Usage Mismatches (MEDIUM Risk)
1. **Unused Tables**: All 5 tables in schema are completely unused
2. **Missing Tables**: 
   - No `users` table (auth system needs it)
   - No `sessions` table
   - No `api_keys` table
   - No `audit_logs` table
   - No `cache_entries` table

### Type Safety Issues (LOW Risk)
1. **No Generated Types**: Missing Supabase TypeScript types
2. **Manual Interfaces**: Frontend defines its own interfaces instead of using DB types
3. **No Schema Validation**: No runtime validation against DB schema

## 4. Proposed Changes

### Phase 1: Foundation (LOW Risk)
1. **Install Supabase Client**
   - Add @supabase/supabase-js to dependencies
   - Create Supabase client configuration
   - Generate TypeScript types from schema

2. **Extend Schema**
   ```sql
   -- Add missing tables
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255),
     role VARCHAR(50) DEFAULT 'user',
     permissions TEXT[],
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     last_login_at TIMESTAMP WITH TIME ZONE
   );

   CREATE TABLE sessions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     token TEXT UNIQUE NOT NULL,
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     data JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE api_keys (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     key_hash TEXT UNIQUE NOT NULL,
     name VARCHAR(255),
     permissions TEXT[],
     last_used_at TIMESTAMP WITH TIME ZONE,
     expires_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE audit_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE SET NULL,
     action VARCHAR(100) NOT NULL,
     resource VARCHAR(255),
     resource_id VARCHAR(255),
     metadata JSONB,
     ip_address INET,
     user_agent TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### Phase 2: Integration (MEDIUM Risk)
1. **Create Data Access Layer**
   - Repository pattern for each entity
   - Implement CRUD operations
   - Add transaction support

2. **Migrate In-Memory Storage**
   - Workflows: Add persistence layer
   - Cache: Add DB fallback
   - Audit: Switch to DB storage

3. **Update API Routes**
   - Add database operations to endpoints
   - Implement proper error handling
   - Add data validation

### Phase 3: Enhancement (HIGH Risk)
1. **Implement Supabase Auth**
   - Replace mock auth with Supabase Auth
   - Migrate user management
   - Add RLS policies per user

2. **Real-time Features**
   - Use Supabase Realtime for collaboration
   - Sync workflow updates
   - Live presence indicators

3. **Advanced Features**
   - Vector embeddings for semantic search
   - Edge functions for serverless compute
   - Storage for file uploads

## 5. Migration Strategy

### Rollback Plan
1. Keep existing in-memory implementations as fallback
2. Use feature flags to toggle DB operations
3. Maintain backwards compatibility
4. Create database snapshots before each migration

### Testing Requirements
1. Unit tests for all repository methods
2. Integration tests for API endpoints
3. E2E tests for critical user flows
4. Performance benchmarks

### Monitoring
1. Add database query logging
2. Monitor connection pool health
3. Track query performance
4. Alert on migration failures

## 6. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | HIGH | LOW | Backup before migration, test in staging |
| Performance degradation | MEDIUM | MEDIUM | Index optimization, query analysis |
| Breaking changes | HIGH | LOW | Feature flags, gradual rollout |
| Type mismatches | LOW | HIGH | Generated types, runtime validation |
| Auth integration issues | HIGH | MEDIUM | Parallel auth systems during transition |

## 7. Implementation Order

1. **Week 1**: Foundation
   - Install dependencies
   - Setup Supabase client
   - Generate types
   - Create extended schema

2. **Week 2**: Basic CRUD
   - Implement repositories
   - Add prompt persistence
   - Add workflow persistence
   - Update API routes

3. **Week 3**: Advanced Features
   - Implement evaluations storage
   - Add API usage tracking
   - Setup audit logging
   - Add paraphrase history

4. **Week 4**: Auth & Real-time
   - Integrate Supabase Auth
   - Add real-time subscriptions
   - Implement collaboration features
   - Performance optimization

## 8. Success Metrics

- [ ] All 5 existing tables have CRUD operations
- [ ] 4 new tables created and integrated
- [ ] TypeScript types generated and used
- [ ] 100% of API routes use database
- [ ] Auth system integrated with Supabase
- [ ] Zero data loss during migration
- [ ] < 100ms average query time
- [ ] Real-time updates working