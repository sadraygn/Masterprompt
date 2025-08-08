#!/bin/bash

echo "=== Phase 2 Security Testing - Rate Limiting ==="
echo "Testing 105 consecutive requests to trigger rate limiting..."
echo

# Counter for successful and rate-limited requests
success_count=0
rate_limited_count=0

# Make 105 requests
for i in {1..105}; do
    # Make request and capture HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:4000/v1/chat/completions \
        -H "Authorization: Bearer bearer-d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81" \
        -H "Content-Type: application/json" \
        -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5}')
    
    # Check status code
    if [ "$status_code" = "429" ]; then
        rate_limited_count=$((rate_limited_count + 1))
        echo "Request $i: RATE LIMITED (429)"
    elif [ "$status_code" = "200" ]; then
        success_count=$((success_count + 1))
        echo -n "."
    else
        echo "Request $i: Status $status_code"
    fi
    
    # Short delay between requests
    sleep 0.1
done

echo
echo
echo "=== Rate Limiting Test Results ==="
echo "Total requests: 105"
echo "Successful requests: $success_count"
echo "Rate-limited requests (429): $rate_limited_count"
echo

if [ $rate_limited_count -gt 0 ]; then
    echo "✅ Rate limiting is working! Triggered after ~100 requests"
else
    echo "⚠️ Rate limiting did not trigger as expected"
fi

echo "=== End of Rate Limiting Test ==="