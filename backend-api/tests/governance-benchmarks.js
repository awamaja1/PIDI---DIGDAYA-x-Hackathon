#!/usr/bin/env node

/**
 * Performance Benchmark Suite for Governance Endpoints
 * Validates response times, throughput, and error rates under load
 */

const http = require('http');
const { performance } = require('perf_hooks');

const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  warmupRequests: 10,
  testRequests: 100,
  concurrency: 5,
  timeoutMs: 5000,
};

// Benchmark results storage
const results = {
  evidence: [],
  summary: [],
  readiness: [],
};

// Helper to make HTTP request
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const url = new URL(path, config.baseUrl);
    const method = options.method || 'GET';
    
    const requestOptions = {
      timeout: config.timeoutMs,
      method,
      headers: options.headers || {},
    };
    
    const req = http.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = performance.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode === 200,
          data: data.length,
        });
      });
    });
    
    req.on('error', err => {
      const duration = performance.now() - startTime;
      resolve({
        statusCode: 0,
        duration,
        success: false,
        error: err.message,
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Calculate statistics
function calculateStats(measurements) {
  if (measurements.length === 0) return {};
  
  const sorted = measurements.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

// Benchmark evidence endpoint
async function benchmarkEvidence(correlationId) {
  console.log('\n📊 Benchmarking Evidence Endpoint...');
  const path = `/api/v1/governance/evidence/${correlationId}`;
  
  // Warmup
  console.log('  Warming up...');
  for (let i = 0; i < config.warmupRequests; i++) {
    await makeRequest(path);
  }
  
  // Test load
  console.log(`  Running ${config.testRequests} requests with concurrency ${config.concurrency}...`);
  const durations = [];
  let errorCount = 0;
  
  for (let batch = 0; batch < config.testRequests / config.concurrency; batch++) {
    const promises = [];
    for (let i = 0; i < config.concurrency; i++) {
      promises.push(makeRequest(path));
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.success) {
        durations.push(res.duration);
      } else {
        errorCount++;
      }
    });
    
    process.stdout.write(`\r  Progress: ${Math.min((batch + 1) * config.concurrency, config.testRequests)}/${config.testRequests}`);
  }
  
  const stats = calculateStats(durations);
  const errorRate = (errorCount / config.testRequests * 100).toFixed(2);
  
  console.log(`\n  Results:`);
  console.log(`    Min: ${stats.min?.toFixed(2)}ms`);
  console.log(`    Max: ${stats.max?.toFixed(2)}ms`);
  console.log(`    Avg: ${stats.avg}ms`);
  console.log(`    P95: ${stats.p95?.toFixed(2)}ms`);
  console.log(`    P99: ${stats.p99?.toFixed(2)}ms`);
  console.log(`    Error Rate: ${errorRate}%`);
  console.log(`    ✓ SLA Target (p95 < 100ms): ${stats.p95 < 100 ? 'PASS' : 'FAIL'}`);
  
  results.evidence = durations;
}

// Benchmark summary endpoint
async function benchmarkSummary() {
  console.log('\n📊 Benchmarking Summary Endpoint...');
  const dayKey = new Date().toISOString().split('T')[0];
  const path = `/api/v1/governance/summary?period=daily&key=${dayKey}`;
  
  // Warmup
  console.log('  Warming up...');
  for (let i = 0; i < config.warmupRequests; i++) {
    await makeRequest(path);
  }
  
  // Test load
  console.log(`  Running ${config.testRequests} requests with concurrency ${config.concurrency}...`);
  const durations = [];
  let errorCount = 0;
  
  for (let batch = 0; batch < config.testRequests / config.concurrency; batch++) {
    const promises = [];
    for (let i = 0; i < config.concurrency; i++) {
      promises.push(makeRequest(path));
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.success) {
        durations.push(res.duration);
      } else {
        errorCount++;
      }
    });
    
    process.stdout.write(`\r  Progress: ${Math.min((batch + 1) * config.concurrency, config.testRequests)}/${config.testRequests}`);
  }
  
  const stats = calculateStats(durations);
  const errorRate = (errorCount / config.testRequests * 100).toFixed(2);
  
  console.log(`\n  Results:`);
  console.log(`    Min: ${stats.min?.toFixed(2)}ms`);
  console.log(`    Max: ${stats.max?.toFixed(2)}ms`);
  console.log(`    Avg: ${stats.avg}ms`);
  console.log(`    P95: ${stats.p95?.toFixed(2)}ms`);
  console.log(`    P99: ${stats.p99?.toFixed(2)}ms`);
  console.log(`    Error Rate: ${errorRate}%`);
  console.log(`    ✓ SLA Target (p95 < 200ms): ${stats.p95 < 200 ? 'PASS' : 'FAIL'}`);
  
  results.summary = durations;
}

// Benchmark readiness endpoint
async function benchmarkReadiness() {
  console.log('\n📊 Benchmarking Release Readiness Endpoint...');
  const path = '/api/v1/governance/release-readiness?releaseCandidate=v0.2.0';
  
  // Warmup
  console.log('  Warming up...');
  for (let i = 0; i < config.warmupRequests; i++) {
    await makeRequest(path);
  }
  
  // Test load
  console.log(`  Running ${config.testRequests} requests with concurrency ${config.concurrency}...`);
  const durations = [];
  let errorCount = 0;
  
  for (let batch = 0; batch < config.testRequests / config.concurrency; batch++) {
    const promises = [];
    for (let i = 0; i < config.concurrency; i++) {
      promises.push(makeRequest(path));
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.success) {
        durations.push(res.duration);
      } else {
        errorCount++;
      }
    });
    
    process.stdout.write(`\r  Progress: ${Math.min((batch + 1) * config.concurrency, config.testRequests)}/${config.testRequests}`);
  }
  
  const stats = calculateStats(durations);
  const errorRate = (errorCount / config.testRequests * 100).toFixed(2);
  
  console.log(`\n  Results:`);
  console.log(`    Min: ${stats.min?.toFixed(2)}ms`);
  console.log(`    Max: ${stats.max?.toFixed(2)}ms`);
  console.log(`    Avg: ${stats.avg}ms`);
  console.log(`    P95: ${stats.p95?.toFixed(2)}ms`);
  console.log(`    P99: ${stats.p99?.toFixed(2)}ms`);
  console.log(`    Error Rate: ${errorRate}%`);
  console.log(`    ✓ SLA Target (p95 < 150ms): ${stats.p95 < 150 ? 'PASS' : 'FAIL'}`);
  
  results.readiness = durations;
}

// Main execution
async function runBenchmarks() {
  console.log('🚀 Governance Endpoints Performance Benchmark Suite');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Test Requests: ${config.testRequests} per endpoint`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log(`Timeout: ${config.timeoutMs}ms`);
  
  // Create test data via tokenization
  console.log('\n📝 Setting up test data...');
  // Use a consistent correlation ID from recent test runs
  const correlationId = 'GARUDA-ffffffff-ffff-ffff-ffff-ffffffffffff';
  
  try {
    await benchmarkEvidence(correlationId);
    await benchmarkSummary();
    await benchmarkReadiness();
    
    // Summary report
    console.log('\n📋 SUMMARY REPORT');
    console.log('='.repeat(50));
    
    const evidenceStats = calculateStats(results.evidence);
    const summaryStats = calculateStats(results.summary);
    const readinessStats = calculateStats(results.readiness);
    
    console.log('\nEndpoint Performance SLA Compliance:');
    console.log(`  Evidence (target p95 < 100ms): ${evidenceStats.p95 < 100 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Summary (target p95 < 200ms): ${summaryStats.p95 < 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Readiness (target p95 < 150ms): ${readinessStats.p95 < 150 ? '✓ PASS' : '✗ FAIL'}`);
    
    const allPass = 
      evidenceStats.p95 < 100 && 
      summaryStats.p95 < 200 && 
      readinessStats.p95 < 150;
    
    console.log(`\n🎯 Overall Result: ${allPass ? '✓ ALL SLAs MET' : '✗ SLA VIOLATIONS DETECTED'}`);
    console.log('='.repeat(50));
    
    process.exit(allPass ? 0 : 1);
  } catch (error) {
    console.error('❌ Benchmark error:', error.message);
    process.exit(1);
  }
}

runBenchmarks();
