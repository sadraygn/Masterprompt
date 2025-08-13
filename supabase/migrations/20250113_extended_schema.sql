-- Extended schema migration for missing tables
-- This migration is idempotent and can be run multiple times safely

-- Create users table for authentication
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

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table for API key management
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

-- Create audit_logs table for audit trail
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

-- Add user_id foreign key to existing tables if not exists
DO $$ 
BEGIN
    -- Add user_id to prompts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prompts' AND column_name = 'user_id') THEN
        ALTER TABLE prompts ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add user_id to workflows table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workflows' AND column_name = 'user_id') THEN
        ALTER TABLE workflows ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add user_id to evaluations table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'evaluations' AND column_name = 'user_id') THEN
        ALTER TABLE evaluations ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add user_id to paraphrase_history table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'paraphrase_history' AND column_name = 'user_id') THEN
        ALTER TABLE paraphrase_history ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add user_id to api_usage table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'api_usage' AND column_name = 'user_id') THEN
        ALTER TABLE api_usage ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Create indexes for user_id on existing tables
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_paraphrase_history_user_id ON paraphrase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for sessions table
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON sessions
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for api_keys table
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys" ON api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys" ON api_keys
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for audit_logs table
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- Update RLS policies for existing tables to include user_id
DROP POLICY IF EXISTS "Enable read access for all users" ON prompts;
DROP POLICY IF EXISTS "Enable insert for all users" ON prompts;
DROP POLICY IF EXISTS "Enable update for all users" ON prompts;
DROP POLICY IF EXISTS "Enable delete for all users" ON prompts;

CREATE POLICY "Users can view all public prompts" ON prompts
    FOR SELECT USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own prompts" ON prompts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prompts" ON prompts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own prompts" ON prompts
    FOR DELETE USING (user_id = auth.uid());

-- Similar updates for workflows table
DROP POLICY IF EXISTS "Enable read access for all users" ON workflows;
DROP POLICY IF EXISTS "Enable insert for all users" ON workflows;
DROP POLICY IF EXISTS "Enable update for all users" ON workflows;
DROP POLICY IF EXISTS "Enable delete for all users" ON workflows;

CREATE POLICY "Users can view all public workflows" ON workflows
    FOR SELECT USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own workflows" ON workflows
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workflows" ON workflows
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON workflows
    FOR DELETE USING (user_id = auth.uid());

-- Update evaluations policies
DROP POLICY IF EXISTS "Enable read access for all users" ON evaluations;
DROP POLICY IF EXISTS "Enable insert for all users" ON evaluations;

CREATE POLICY "Users can view their own evaluations" ON evaluations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own evaluations" ON evaluations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update paraphrase_history policies
DROP POLICY IF EXISTS "Enable read access for all users" ON paraphrase_history;
DROP POLICY IF EXISTS "Enable insert for all users" ON paraphrase_history;

CREATE POLICY "Users can view their own paraphrase history" ON paraphrase_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own paraphrase history" ON paraphrase_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update api_usage policies
DROP POLICY IF EXISTS "Enable insert for all users" ON api_usage;
DROP POLICY IF EXISTS "Enable read access for all users" ON api_usage;

CREATE POLICY "System can insert API usage" ON api_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own API usage" ON api_usage
    FOR SELECT USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;