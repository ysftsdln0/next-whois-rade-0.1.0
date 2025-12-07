/**
 * Stats API Route
 * Returns cache statistics and service status
 */

import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/whois-service';
import type { ApiResponse } from '@/lib/types';

interface StatsData {
  service: string;
  version: string;
  uptime: number;
  cache: {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
}

// Track server start time
const startTime = Date.now();

/**
 * GET /api/stats
 * Get service statistics
 */
export async function GET() {
  const cacheStats = getCacheStats();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const stats: StatsData = {
    service: 'whois-service',
    version: '1.0.0',
    uptime,
    cache: cacheStats,
  };

  return NextResponse.json<ApiResponse<StatsData>>({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}
