#!/bin/bash

# Script to push the project to GitHub
# Repository: https://github.com/Artvios/Masterprompt

set -e

echo "==========================================="
echo "Pushing to GitHub Repository"
echo "==========================================="
echo ""

# Add all files
echo "Adding all files to git..."
git add .

# Commit changes
echo "Creating commit..."
git commit -m "Complete Prompt Engineering Studio implementation

- Phase 1: Core infrastructure with LiteLLM broker
- Phase 2: Security features (Rebuff, Guardrails)
- Phase 3: Advanced features (Flowise, workflows)
- Phase 4: Production features (caching, WebSockets)
- Comprehensive documentation and testing guides
- Setup and diagnostic scripts"

# Add remote if it doesn't exist
if ! git remote | grep -q "origin"; then
    echo "Adding GitHub remote..."
    git remote add origin https://github.com/Artvios/Masterprompt.git
else
    echo "Remote 'origin' already exists"
fi

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin master

echo ""
echo "==========================================="
echo "Successfully pushed to GitHub!"
echo "==========================================="
echo ""
echo "Your repository is now available at:"
echo "https://github.com/Artvios/Masterprompt"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/Artvios/Masterprompt"
echo "2. Add a description to your repository"
echo "3. Add topics like: prompt-engineering, litellm, langchain, ai, llm"
echo "4. Consider adding a LICENSE file (MIT, Apache 2.0, etc.)"