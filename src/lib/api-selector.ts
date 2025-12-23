/**
 * API Selector Service
 * Selects and queries random WHOIS API from multiple backends
 */

import axios from 'axios';
import logger from './logger';

interface ApiEndpoint {
  name: string;
  url: string;
  port: number;
  healthy: boolean;
  lastCheck: Date | null;
}

interface WhoisApiResponse {
  success: boolean;
  api: string;
  port: number;
  domain: string;
  queryTime: string;
  timestamp: string;
  fromCache?: boolean;
  data: {
    raw: string;
    parsed: Record<string, unknown>;
    dates?: Record<string, string>;
    contacts?: Record<string, Record<string, string>>;
    registrant?: Record<string, string>;
  };
  error?: string;
}

interface QueryResult {
  success: boolean;
  usedApi: ApiEndpoint;
  data: WhoisApiResponse | null;
  error?: string;
}

class ApiSelector {
  private endpoints: ApiEndpoint[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEndpoints();
    this.startHealthChecks();
  }

  /**
   * Initialize API endpoints from environment or defaults
   */
  private initializeEndpoints(): void {
    const envEndpoints = process.env.WHOIS_API_ENDPOINTS;

    if (envEndpoints) {
      // Parse from environment variable (comma-separated)
      const urls = envEndpoints.split(',').map(u => u.trim());
      this.endpoints = urls.map((url, index) => {
        const portMatch = url.match(/:(\d+)/);
        const port = portMatch ? parseInt(portMatch[1]) : 4001 + index;
        return {
          name: `WHOIS-API-${index + 1}`,
          url: url,
          port: port,
          healthy: true,
          lastCheck: null
        };
      });
    } else {
      // Default local development endpoints
      this.endpoints = [
        { name: 'WHOIS-API-1', url: 'http://localhost:4001', port: 4001, healthy: true, lastCheck: null },
        { name: 'WHOIS-API-2', url: 'http://localhost:4002', port: 4002, healthy: true, lastCheck: null },
        { name: 'WHOIS-API-3', url: 'http://localhost:4003', port: 4003, healthy: true, lastCheck: null },
      ];
    }

    logger.info('API endpoints initialized', {
      count: this.endpoints.length,
      endpoints: this.endpoints.map(e => ({ name: e.name, url: e.url }))
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Initial check
    this.checkAllEndpoints();

    // Check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkAllEndpoints();
    }, 30000);
  }

  /**
   * Check health of all endpoints
   */
  private async checkAllEndpoints(): Promise<void> {
    const checks = this.endpoints.map(async (endpoint) => {
      try {
        const response = await axios.get(`${endpoint.url}/health`, { timeout: 5000 });
        endpoint.healthy = response.data?.status === 'healthy';
        endpoint.lastCheck = new Date();
      } catch (error) {
        endpoint.healthy = false;
        endpoint.lastCheck = new Date();
        logger.warn(`Health check failed for ${endpoint.name}`, { url: endpoint.url });
      }
    });

    await Promise.all(checks);

    const healthyCount = this.endpoints.filter(e => e.healthy).length;
    logger.debug('Health check completed', {
      total: this.endpoints.length,
      healthy: healthyCount
    });
  }

  /**
   * Get a random healthy endpoint
   */
  private getRandomEndpoint(): ApiEndpoint | null {
    const healthyEndpoints = this.endpoints.filter(e => e.healthy);

    if (healthyEndpoints.length === 0) {
      // If no healthy endpoints, try all endpoints
      logger.warn('No healthy endpoints available, trying all');
      if (this.endpoints.length === 0) return null;
      return this.endpoints[Math.floor(Math.random() * this.endpoints.length)];
    }

    const randomIndex = Math.floor(Math.random() * healthyEndpoints.length);
    return healthyEndpoints[randomIndex];
  }

  /**
   * Query WHOIS using a random API
   */
  async query(domain: string, queryType: string = 'domain'): Promise<QueryResult> {
    const endpoint = this.getRandomEndpoint();

    if (!endpoint) {
      return {
        success: false,
        usedApi: { name: 'none', url: '', port: 0, healthy: false, lastCheck: null },
        data: null,
        error: 'No API endpoints available'
      };
    }

    logger.info(`Using ${endpoint.name} for WHOIS query`, {
      domain,
      queryType,
      api: endpoint.name,
      port: endpoint.port
    });

    try {
      const response = await axios.get<WhoisApiResponse>(
        `${endpoint.url}/whois`,
        {
          params: { domain, type: queryType },
          timeout: 30000
        }
      );

      return {
        success: response.data.success,
        usedApi: endpoint,
        data: response.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`WHOIS query failed on ${endpoint.name}`, {
        domain,
        error: errorMessage
      });

      // Mark endpoint as unhealthy
      endpoint.healthy = false;

      // Try another endpoint
      const fallbackEndpoint = this.getRandomEndpoint();
      if (fallbackEndpoint && fallbackEndpoint.name !== endpoint.name) {
        logger.info(`Retrying with fallback API ${fallbackEndpoint.name}`, { domain, queryType });
        try {
          const fallbackResponse = await axios.get<WhoisApiResponse>(
            `${fallbackEndpoint.url}/whois`,
            {
              params: { domain, type: queryType },
              timeout: 30000
            }
          );

          return {
            success: fallbackResponse.data.success,
            usedApi: fallbackEndpoint,
            data: fallbackResponse.data
          };
        } catch (fallbackError) {
          fallbackEndpoint.healthy = false;
        }
      }

      return {
        success: false,
        usedApi: endpoint,
        data: null,
        error: errorMessage
      };
    }
  }

  /**
   * Get status of all endpoints
   */
  getStatus(): { endpoints: ApiEndpoint[]; healthy: number; total: number } {
    return {
      endpoints: this.endpoints.map(e => ({ ...e })),
      healthy: this.endpoints.filter(e => e.healthy).length,
      total: this.endpoints.length
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Singleton instance
const apiSelector = new ApiSelector();

export default apiSelector;
export type { ApiEndpoint, WhoisApiResponse, QueryResult };
