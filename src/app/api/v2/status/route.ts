/**
 * API Status Route
 * Returns the health and status of all backend WHOIS APIs
 */

import { NextResponse } from 'next/server';
import apiSelector from '@/lib/api-selector';

export async function GET() {
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get API status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
