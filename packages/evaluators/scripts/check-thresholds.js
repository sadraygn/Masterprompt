#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const THRESHOLDS = {
  quality: 0.8,
  security: 0.9,
  regression: 0.8,
  performance: {
    latency_p95: 1000, // ms
    tokens_per_second: 50,
  },
};

function checkThresholds() {
  const resultsPath = join(process.cwd(), 'results', 'latest.json');
  
  if (!existsSync(resultsPath)) {
    console.error('❌ No evaluation results found at:', resultsPath);
    process.exit(1);
  }
  
  const results = JSON.parse(readFileSync(resultsPath, 'utf8'));
  let failed = false;
  
  console.log('🔍 Checking evaluation thresholds...\n');
  
  // Check quality score
  if (results.quality) {
    const passed = results.quality.score >= THRESHOLDS.quality;
    console.log(`Quality Score: ${results.quality.score} (threshold: ${THRESHOLDS.quality}) ${passed ? '✅' : '❌'}`);
    if (!passed) failed = true;
  }
  
  // Check security score
  if (results.security) {
    const passed = results.security.score >= THRESHOLDS.security;
    console.log(`Security Score: ${results.security.score} (threshold: ${THRESHOLDS.security}) ${passed ? '✅' : '❌'}`);
    if (!passed) failed = true;
  }
  
  // Check regression score
  if (results.regression) {
    const passed = results.regression.score >= THRESHOLDS.regression;
    console.log(`Regression Score: ${results.regression.score} (threshold: ${THRESHOLDS.regression}) ${passed ? '✅' : '❌'}`);
    if (!passed) failed = true;
  }
  
  // Check performance metrics
  if (results.performance) {
    console.log('\nPerformance Metrics:');
    
    if (results.performance.latency_p95) {
      const passed = results.performance.latency_p95 <= THRESHOLDS.performance.latency_p95;
      console.log(`  P95 Latency: ${results.performance.latency_p95}ms (threshold: ${THRESHOLDS.performance.latency_p95}ms) ${passed ? '✅' : '❌'}`);
      if (!passed) failed = true;
    }
    
    if (results.performance.tokens_per_second) {
      const passed = results.performance.tokens_per_second >= THRESHOLDS.performance.tokens_per_second;
      console.log(`  Tokens/sec: ${results.performance.tokens_per_second} (threshold: ${THRESHOLDS.performance.tokens_per_second}) ${passed ? '✅' : '❌'}`);
      if (!passed) failed = true;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (failed) {
    console.log('❌ Evaluation thresholds not met!');
    process.exit(1);
  } else {
    console.log('✅ All evaluation thresholds passed!');
    process.exit(0);
  }
}

// Run the check
checkThresholds();