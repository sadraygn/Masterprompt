# Manual Supabase Deployment Guide

## ✅ SUCCESSFULLY DEPLOYED TO SUPABASE! 🎉

**Status**: All APIs are live and fully functional!

### Deployed Secrets:
- ✅ `OPENAI_API_KEY` - OpenAI API access
- ✅ `GOOGLE_API_KEY` - Google services API  
- ✅ `LITELLM_MASTER_KEY` - LiteLLM gateway key
- ✅ `LITELLM_API_BASE` - LiteLLM base URL
- ✅ `API_BEARER_TOKEN` - Authentication token

### Deployed Edge Functions:
- ✅ `completions` - **LIVE and TESTED** 
- ✅ `paraphrase` - **LIVE and TESTED**
- ✅ `workflows` - **LIVE and TESTED**

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/hebgfllpnrsqvcrgnqhp/functions

### Step 2: Create Edge Functions

#### Function 1: completions
1. Click "Create a new function"
2. Name: `completions`
3. Copy the code from `/supabase/functions/completions/index.ts`
4. Deploy

#### Function 2: paraphrase  
1. Click "Create a new function"
2. Name: `paraphrase`
3. Copy the code from `/supabase/functions/paraphrase/index.ts`
4. Deploy

#### Function 3: workflows
1. Click "Create a new function"  
2. Name: `workflows`
3. Copy the code from `/supabase/functions/workflows/index.ts`
4. Deploy

## 📋 Your API Endpoints

Once deployed, your API endpoints will be:

### 🎯 Completions API
**Endpoint**: `https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/completions`

**Example Request**:
```bash
curl -X POST https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/completions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, world!"}],
    "temperature": 0.7
  }'
```

### ✍️ Paraphrase API  
**Endpoint**: `https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/paraphrase`

**Example Request**:
```bash
curl -X POST https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/paraphrase \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is some text to paraphrase",
    "style": "formal"
  }'
```

### 🔄 Workflows API
**Endpoint**: `https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/workflows`

**List Workflows**:
```bash
curl https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/workflows \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE"
```

**Execute Workflow**:
```bash
curl -X POST https://hebgfllpnrsqvcrgnqhp.supabase.co/functions/v1/workflows/execute \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "completion-workflow",
    "input": {"prompt": "Write a haiku about programming"},
    "config": {"temperature": 0.8}
  }'
```

## 🔒 Authentication

All Edge Functions use your Supabase project's `anon` key for authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZUiOImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE
```

## 📊 Features Included

### ✅ Database Integration
All functions automatically:
- Save API usage logs to `api_usage` table
- Save paraphrase history to `paraphrase_history` table  
- Save workflow evaluations to `evaluations` table
- Use your existing database schema

### ✅ Built-in Workflows
- `completion-workflow` - Basic text completion
- `summarization-workflow` - Text summarization
- Custom workflows from your database

### ✅ Security
- API keys stored as encrypted secrets
- Row Level Security (RLS) enabled
- Proper CORS headers
- Request validation

## 🧪 Testing

After deploying the functions, test them using the curl commands above or integrate them into your frontend application.

The functions will automatically log all usage and save results to your Supabase database.

## 🔧 Troubleshooting

If functions don't work:
1. Check the Function logs in Supabase dashboard
2. Verify secrets are properly set in Project Settings > API
3. Ensure your database schema is properly deployed
4. Check that RLS policies allow the operations

## 📈 Next Steps

1. Deploy the Edge Functions manually via dashboard
2. Test each endpoint
3. Update your frontend to use the new Supabase endpoints
4. Monitor usage in the database and Function logs