-- Create prompts table for storing prompt templates
CREATE TABLE IF NOT EXISTS prompts (
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
);

-- Create workflows table for storing workflow configurations
CREATE TABLE IF NOT EXISTS workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table for storing prompt evaluation results
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    model VARCHAR(100),
    input_data JSONB,
    output_data JSONB,
    metrics JSONB,
    score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create paraphrase_history table for storing paraphrase operations
CREATE TABLE IF NOT EXISTS paraphrase_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_text TEXT NOT NULL,
    paraphrased_text TEXT NOT NULL,
    style VARCHAR(50),
    tone VARCHAR(50),
    model VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_usage table for tracking API usage
CREATE TABLE IF NOT EXISTS api_usage (
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
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_evaluations_prompt_id ON evaluations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_workflow_id ON evaluations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at columns
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paraphrase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON prompts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON prompts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON prompts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON workflows FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON workflows FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON evaluations FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON paraphrase_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON paraphrase_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON api_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON api_usage FOR SELECT USING (true);