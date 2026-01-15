import { NextRequest, NextResponse } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitEntry>();

function getClientId(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

export function enforceRateLimit(request: NextRequest): NextResponse | null {
  const windowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000);
  const maxRequests = Number(process.env.API_RATE_LIMIT_MAX || 30);
  if (!Number.isFinite(windowMs) || !Number.isFinite(maxRequests)) {
    return null;
  }

  const key = getClientId(request);
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxRequests) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  entry.count += 1;
  return null;
}

export function enforceApiKey(request: NextRequest): NextResponse | null {
  const requiredKey = process.env.INTERNAL_API_KEY;
  if (!requiredKey) return null;

  const providedKey = request.headers.get('x-internal-api-key');
  if (!providedKey || providedKey !== requiredKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const host = request.headers.get('host');
  if (!host) return null;

  const allowedOrigin = process.env.APP_ORIGIN;
  const originHost = new URL(origin).host;

  if (allowedOrigin && origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!allowedOrigin && originHost !== host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
