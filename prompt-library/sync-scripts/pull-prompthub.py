#!/usr/bin/env python3
"""
Sync prompts from PromptHub API
Fetches and sanitizes prompts from deepset's PromptHub
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import requests

PROMPTHUB_API_URL = "https://api.prompthub.deepset.ai/v1/prompts"
OUTPUT_DIR = Path(__file__).parent.parent / "prompthub"
CACHE_FILE = OUTPUT_DIR / ".last_sync.json"

# Patterns that might indicate PII or sensitive data
PII_PATTERNS = [
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
    r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone numbers
    r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
    r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b',  # Credit cards
]

def sanitize_content(content: str) -> str:
    """Remove potential PII from content"""
    sanitized = content
    for pattern in PII_PATTERNS:
        sanitized = re.sub(pattern, '[REDACTED]', sanitized)
    return sanitized

def fetch_prompts() -> List[Dict[str, Any]]:
    """Fetch prompts from PromptHub API"""
    try:
        response = requests.get(PROMPTHUB_API_URL, timeout=30)
        response.raise_for_status()
        return response.json().get('prompts', [])
    except requests.RequestException as e:
        print(f"Error fetching prompts: {e}")
        return []

def transform_prompt(prompt: Dict[str, Any]) -> Dict[str, Any]:
    """Transform and sanitize a prompt for local storage"""
    return {
        'id': prompt.get('id', ''),
        'name': prompt.get('name', 'Unnamed'),
        'description': sanitize_content(prompt.get('description', '')),
        'prompt_text': sanitize_content(prompt.get('prompt_text', '')),
        'tags': prompt.get('tags', []),
        'meta': {
            'version': prompt.get('version', '1.0'),
            'author': 'PromptHub',
            'source': 'https://prompthub.deepset.ai',
            'synced_at': datetime.now().isoformat(),
        },
        'examples': [
            {
                'input': sanitize_content(ex.get('input', '')),
                'output': sanitize_content(ex.get('output', ''))
            }
            for ex in prompt.get('examples', [])
        ],
    }

def save_prompts(prompts: List[Dict[str, Any]]) -> None:
    """Save prompts to organized JSON files"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Group prompts by tags
    by_tag: Dict[str, List[Dict[str, Any]]] = {}
    for prompt in prompts:
        for tag in prompt.get('tags', ['uncategorized']):
            if tag not in by_tag:
                by_tag[tag] = []
            by_tag[tag].append(prompt)
    
    # Save by category
    for tag, tag_prompts in by_tag.items():
        filename = OUTPUT_DIR / f"{tag.lower().replace(' ', '_')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'category': tag,
                'count': len(tag_prompts),
                'prompts': tag_prompts
            }, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(tag_prompts)} prompts to {filename}")
    
    # Save all prompts in one file
    all_prompts_file = OUTPUT_DIR / "all_prompts.json"
    with open(all_prompts_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(prompts),
            'categories': list(by_tag.keys()),
            'prompts': prompts
        }, f, indent=2, ensure_ascii=False)
    
    # Save sync metadata
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'last_sync': datetime.now().isoformat(),
            'prompt_count': len(prompts),
            'categories': list(by_tag.keys())
        }, f, indent=2)

def main():
    """Main sync function"""
    print("🔄 Syncing prompts from PromptHub...")
    
    # Fetch prompts
    raw_prompts = fetch_prompts()
    if not raw_prompts:
        print("❌ No prompts fetched")
        return
    
    print(f"📥 Fetched {len(raw_prompts)} prompts")
    
    # Transform and sanitize
    transformed_prompts = [transform_prompt(p) for p in raw_prompts]
    
    # Save to disk
    save_prompts(transformed_prompts)
    
    print("✅ Sync complete!")

if __name__ == "__main__":
    main()