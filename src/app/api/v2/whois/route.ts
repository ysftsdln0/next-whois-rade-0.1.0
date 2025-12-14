/**
 * WHOIS API v2 Route
 * Uses random backend API selection from multiple microservices
 */

import { NextResponse } from 'next/server';
import apiSelector from '@/lib/api-selector';
import type { QueryResult } from '@/lib/api-selector';
import { log } from '@/lib/logger';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

const captchaRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CAPTCHA_RATE_LIMIT_WINDOW = 3600000; // 1 hour
const CAPTCHA_RATE_LIMIT_THRESHOLD = 5; // After 5 requests, require captcha

interface ApiV2Response {
  success: boolean;
  domain?: string;
  usedApi: {
    name: string;
    port: number;
  };
  queryTime?: string;
  fromCache?: boolean;
  captchaRequired?: boolean;
  data?: {
    raw?: string;
    parsed?: Record<string, unknown>;
    dates?: Record<string, string>;
    contacts?: Record<string, Record<string, string>>;
  };
  error?: string;
  timestamp: string;
}

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

function checkCaptchaRequired(ip: string): boolean {
  const now = Date.now();
  const limit = captchaRateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    captchaRateLimitMap.set(ip, { count: 1, resetTime: now + CAPTCHA_RATE_LIMIT_WINDOW });
    return false;
  }

  if (limit.count >= CAPTCHA_RATE_LIMIT_THRESHOLD) {
    return true;
  }

  limit.count++;
  return false;
}

function resetCaptchaLimit(ip: string): void {
  captchaRateLimitMap.delete(ip);
}

async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    log.error('RECAPTCHA_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    log.error('reCAPTCHA verification failed', { error });
    return false;
  }
}

/**
 * GET /api/v2/whois?domain=example.com
 * Lookup WHOIS data using random backend API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const captchaToken = searchParams.get('captchaToken');

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      log.warn('Rate limit exceeded', { ip });
      return NextResponse.json<ApiV2Response>(
        {
          success: false,
          usedApi: { name: 'none', port: 0 },
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    const captchaRequired = checkCaptchaRequired(ip);
    
    if (captchaRequired) {
      if (!captchaToken) {
        log.info('Captcha required for IP', { ip });
        return NextResponse.json<ApiV2Response>(
          {
            success: false,
            usedApi: { name: 'none', port: 0 },
            captchaRequired: true,
            error: 'Çok fazla sorgu yaptınız. Lütfen robot olmadığınızı doğrulayın.',
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }

      const isValidCaptcha = await verifyCaptcha(captchaToken);
      if (!isValidCaptcha) {
        log.warn('Invalid captcha token', { ip });
        return NextResponse.json<ApiV2Response>(
          {
            success: false,
            usedApi: { name: 'none', port: 0 },
            captchaRequired: true,
            error: 'Captcha doğrulaması başarısız. Lütfen tekrar deneyin.',
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }

      resetCaptchaLimit(ip);
      log.info('Captcha verified successfully', { ip });
    }

    // Validate domain parameter
    if (!domain) {
      return NextResponse.json<ApiV2Response>(
        {
          success: false,
          usedApi: { name: 'none', port: 0 },
          error: 'Domain parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Query using random API
    const result: QueryResult = await apiSelector.query(domain);

    if (!result.success || !result.data) {
      return NextResponse.json<ApiV2Response>(
        {
          success: false,
          domain,
          usedApi: {
            name: result.usedApi.name,
            port: result.usedApi.port
          },
          error: result.error || 'Failed to fetch WHOIS data',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiV2Response>({
      success: true,
      domain,
      usedApi: {
        name: result.data.api,
        port: result.data.port
      },
      queryTime: result.data.queryTime,
      fromCache: result.data.fromCache,
      data: {
        raw: result.data.data.raw,
        parsed: result.data.data.parsed,
        dates: result.data.data.dates,
        contacts: result.data.data.contacts
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('WHOIS API v2 error', { error: errorMessage });

    return NextResponse.json<ApiV2Response>(
      {
        success: false,
        usedApi: { name: 'error', port: 0 },
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/whois/status
 * Get status of all backend APIs
 */
export async function POST(request: Request) {
  try {
    const status = apiSelector.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        totalApis: status.total,
        healthyApis: status.healthy,
        endpoints: status.endpoints.map(e => ({
          name: e.name,
          url: e.url,
          port: e.port,
          healthy: e.healthy,
          lastCheck: e.lastCheck?.toISOString() || null
        }))
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('API status error', { error: errorMessage });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
