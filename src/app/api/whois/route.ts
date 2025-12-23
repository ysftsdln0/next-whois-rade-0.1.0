/**
 * WHOIS API Route
 * Handles WHOIS lookup requests
 */

import { NextResponse } from 'next/server';
import { lookupWhois } from '@/lib/whois-service';
import { log } from '@/lib/logger';
import type { ApiResponse, WhoisResult } from '@/lib/types';

// Rate limiting storage (simple in-memory for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * GET /api/whois?domain=example.com
 * Lookup WHOIS data for a domain
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const force = searchParams.get('force') === 'true';

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      log.warn('Rate limit exceeded', { ip });
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // Validate domain parameter
    if (!domain) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Domain parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Perform WHOIS lookup
    const result = await lookupWhois(domain, { force });

    // Check if we got any data
    if (!result.data) {
      return NextResponse.json<ApiResponse<WhoisResult>>(
        {
          success: false,
          data: result,
          error: result.errors.length > 0 
            ? result.errors.join('; ') 
            : 'No WHOIS data found for this domain',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WhoisResult>>({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('WHOIS API error', { error: errorMessage });

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whois
 * Lookup WHOIS data for a domain (alternative to GET)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, force } = body;

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      log.warn('Rate limit exceeded', { ip });
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // Validate domain parameter
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Domain is required and must be a string',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Perform WHOIS lookup
    const result = await lookupWhois(domain, { force: force === true });

    // Check if we got any data
    if (!result.data) {
      return NextResponse.json<ApiResponse<WhoisResult>>(
        {
          success: false,
          data: result,
          error: result.errors.length > 0 
            ? result.errors.join('; ') 
            : 'No WHOIS data found for this domain',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WhoisResult>>({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('WHOIS API error', { error: errorMessage });

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
