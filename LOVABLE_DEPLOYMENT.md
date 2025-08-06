# 🚀 Lovable.dev Deployment Guide

## 🔒 Secure API Key Setup

This guide ensures your API keys remain private when deploying to Lovable.dev's public platform.

### ✅ What's Already Secured

Your project is now **safely configured** for Lovable.dev deployment:

- ✅ All `.env` files are excluded from Git
- ✅ No API keys in your repository 
- ✅ Environment validation for production
- ✅ Comprehensive `.env.example` documentation

### 🔑 Required Environment Variables

In your **Lovable.dev project settings**, configure these environment variables:

#### **Essential (Required)**
```env
# LLM Provider (at least one required)
OPENAI_API_KEY=sk-your-actual-openai-key-here
# OR
GOOGLE_API_KEY=AIza-your-actual-google-key-here

# Security Keys (MUST change from defaults!)
LITELLM_MASTER_KEY=your-secure-random-key-here
API_BEARER_TOKEN=your-secure-bearer-token-here
```

#### **Optional (Recommended)**
```env
# Observability
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
LANGFUSE_HOST=https://your-langfuse-instance.com

# Workflow Engine
FLOWISE_API_KEY=your-flowise-key
NEXT_PUBLIC_FLOWISE_URL=https://your-flowise-instance.com
```

#### **Production Configuration**
```env
NODE_ENV=production
FRONTEND_URL=https://your-lovable-app.lovable.app
BROKER_API_URL=https://your-lovable-app.lovable.app
```

---

## 📋 Deployment Steps

### 1. **Connect GitHub Repository**
1. Go to your Lovable.dev dashboard
2. Create new project → **Import from GitHub**
3. Select your repository: `sadraygn/Masterprompt`
4. Import the project

### 2. **Configure Environment Variables**
1. In your Lovable.dev project settings
2. Navigate to **"Environment Variables"** section
3. Add each variable from the **Required** list above
4. **Never paste placeholder values** - use your actual API keys

### 3. **Verify Deployment**
1. Deploy your project
2. Check the application logs for any missing variables
3. Test API endpoints to ensure they work correctly

---

## 🛡️ Security Best Practices

### ✅ **What's Protected**
- All sensitive API keys stored securely in Lovable.dev
- No secrets visible in your public repository
- Environment validation prevents deployment with missing keys
- Local development uses separate `.env` files

### ⚠️ **Security Checklist**
- [ ] Never commit `.env` files to git
- [ ] Replace default security keys with strong, unique values
- [ ] Regularly rotate API keys
- [ ] Monitor usage for unexpected activity
- [ ] Use separate keys for development and production

---

## 🔧 Local Development

Your local development setup remains unchanged:

```bash
# 1. Copy environment template
cp infra/.env.example infra/.env

# 2. Add your actual API keys to infra/.env
# (This file is ignored by git)

# 3. Start development servers
pnpm dev
```

---

## 🚨 Troubleshooting

### **"Missing required environment variable" Error**
- Check Lovable.dev environment variable settings
- Ensure all **Required** variables are configured
- Verify no placeholder values are used

### **"No LLM provider keys configured" Warning**
- Add either `OPENAI_API_KEY` or `GOOGLE_API_KEY`
- Ensure the key format is correct (starts with `sk-` or `AIza`)

### **Authentication Issues**
- Verify `API_BEARER_TOKEN` is set to a secure value
- Check `LITELLM_MASTER_KEY` is configured properly

---

## 📚 Additional Resources

- [Environment Variables Documentation](./infra/.env.example)
- [Full Setup Guide](./Instruction2.md)
- [API Testing Guide](./phase1_test.md)

---

## 🤝 Support

If you encounter issues:
1. Check the environment variable configuration
2. Review application logs in Lovable.dev
3. Verify API key formats and permissions
4. Test locally first to isolate the issue

**Your API keys are now safely secured for Lovable.dev deployment!** 🔒