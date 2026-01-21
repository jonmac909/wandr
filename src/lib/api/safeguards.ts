// API Safeguards - Prevents runaway loops and excessive API usage
// These limits protect against bugs that cause infinite fetching

// === LIMITS ===
const LIMITS = {
  MAX_CALLS_PER_SESSION: 200,      // Hard stop after this many total API calls
  MAX_CALLS_PER_ENDPOINT: 50,      // Max calls to same endpoint per session
  MAX_FAILURES_BEFORE_STOP: 5,     // Circuit breaker - stop after consecutive failures
  MIN_MS_BETWEEN_CALLS: 100,       // Throttle - minimum gap between calls to same endpoint
  REQUEST_TIMEOUT_MS: 10000,       // 10 second timeout for any API call
};

// === STATE ===
let totalCalls = 0;
const endpointCalls: Record<string, number> = {};
const endpointFailures: Record<string, number> = {};
const lastCallTime: Record<string, number> = {};

// === FUNCTIONS ===

// Check if we can make an API call (returns false if limit reached)
export function canMakeApiCall(endpoint: string): { allowed: boolean; reason?: string } {
  // Check total limit
  if (totalCalls >= LIMITS.MAX_CALLS_PER_SESSION) {
    console.error(`[API Safeguard] Session limit reached (${LIMITS.MAX_CALLS_PER_SESSION} calls)`);
    return { allowed: false, reason: 'Session API limit reached' };
  }
  
  // Check per-endpoint limit
  const epCalls = endpointCalls[endpoint] || 0;
  if (epCalls >= LIMITS.MAX_CALLS_PER_ENDPOINT) {
    console.error(`[API Safeguard] Endpoint limit reached for ${endpoint} (${LIMITS.MAX_CALLS_PER_ENDPOINT} calls)`);
    return { allowed: false, reason: `Endpoint ${endpoint} limit reached` };
  }
  
  // Check circuit breaker
  const failures = endpointFailures[endpoint] || 0;
  if (failures >= LIMITS.MAX_FAILURES_BEFORE_STOP) {
    console.error(`[API Safeguard] Circuit breaker open for ${endpoint} (${failures} consecutive failures)`);
    return { allowed: false, reason: `${endpoint} is failing - circuit breaker open` };
  }
  
  // Check throttle
  const lastCall = lastCallTime[endpoint] || 0;
  const timeSince = Date.now() - lastCall;
  if (timeSince < LIMITS.MIN_MS_BETWEEN_CALLS) {
    return { allowed: false, reason: 'Throttled - too fast' };
  }
  
  return { allowed: true };
}

// Record a successful API call
export function recordApiCall(endpoint: string): void {
  totalCalls++;
  endpointCalls[endpoint] = (endpointCalls[endpoint] || 0) + 1;
  endpointFailures[endpoint] = 0; // Reset failure count on success
  lastCallTime[endpoint] = Date.now();
}

// Record a failed API call
export function recordApiFailure(endpoint: string): void {
  endpointFailures[endpoint] = (endpointFailures[endpoint] || 0) + 1;
  lastCallTime[endpoint] = Date.now();
}

// Get current stats (for debugging)
export function getApiStats(): {
  totalCalls: number;
  endpointCalls: Record<string, number>;
  endpointFailures: Record<string, number>;
  limitsRemaining: number;
} {
  return {
    totalCalls,
    endpointCalls: { ...endpointCalls },
    endpointFailures: { ...endpointFailures },
    limitsRemaining: LIMITS.MAX_CALLS_PER_SESSION - totalCalls,
  };
}

// Reset all counters (call on page refresh/navigation)
export function resetApiCounters(): void {
  totalCalls = 0;
  Object.keys(endpointCalls).forEach(k => delete endpointCalls[k]);
  Object.keys(endpointFailures).forEach(k => delete endpointFailures[k]);
  Object.keys(lastCallTime).forEach(k => delete lastCallTime[k]);
}

// Wrapper for fetch with safeguards
export async function safeFetch(
  endpoint: string,
  url: string,
  options?: RequestInit
): Promise<Response | null> {
  const check = canMakeApiCall(endpoint);
  if (!check.allowed) {
    console.warn(`[API Safeguard] Blocked call to ${endpoint}: ${check.reason}`);
    return null;
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LIMITS.REQUEST_TIMEOUT_MS);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    recordApiCall(endpoint);
    return response;
  } catch (error) {
    recordApiFailure(endpoint);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[API Safeguard] Request to ${endpoint} timed out`);
    }
    throw error;
  }
}

// Export limits for reference
export const API_LIMITS = LIMITS;
