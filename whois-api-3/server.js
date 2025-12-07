/**
 * WHOIS API Server 3 - Port 4003
 * Simple WHOIS lookup microservice with caching
 */

const http = require('http');
const { exec } = require('child_process');
const url = require('url');

const PORT = process.env.PORT || 4003;
const API_NAME = process.env.API_NAME || 'WHOIS-API-3';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Execute WHOIS command
 */
function whoisLookup(domain) {
  return new Promise((resolve, reject) => {
    exec(`whois ${domain}`, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(new Error(`WHOIS lookup failed: ${error.message}`));
        return;
      }
      resolve(stdout || stderr);
    });
  });
}

/**
 * Check cache
 */
function getFromCache(domain) {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(domain);
  return null;
}

/**
 * Set cache
 */
function setCache(domain, data) {
  cache.set(domain, {
    data: data,
    timestamp: Date.now()
  });
}

/**
 * Comprehensive WHOIS parser
 */
function parseWhoisResponse(raw) {
  const result = {
    raw: raw,
    parsed: {},
    dates: {},
    contacts: {}
  };

  // Domain info patterns
  const domainPatterns = {
    domainName: /Domain Name:\s*(.+)/i,
    registrar: /Registrar:\s*(.+)/i,
    whoisServer: /Registrar WHOIS Server:\s*(.+)/i,
    registrarUrl: /Registrar URL:\s*(.+)/i,
    dnssec: /DNSSEC:\s*(.+)/i,
  };

  // Date patterns
  const datePatterns = {
    created: /Creation Date:\s*(.+)/i,
    expires: /Registry Expiry Date:\s*(.+)/i,
    updated: /Updated Date:\s*(.+)/i,
  };

  // Array patterns
  const arrayPatterns = {
    nameServers: /Name Server:\s*(.+)/gi,
    status: /Domain Status:\s*(.+)/gi,
  };

  // Parse domain info
  for (const [key, pattern] of Object.entries(domainPatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.parsed[key] = match[1].trim();
    }
  }

  // Parse dates
  for (const [key, pattern] of Object.entries(datePatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.dates[key] = match[1].trim();
    }
  }

  // Parse arrays
  for (const [key, pattern] of Object.entries(arrayPatterns)) {
    const matches = [];
    let match;
    while ((match = pattern.exec(raw)) !== null) {
      matches.push(match[1].trim());
    }
    if (matches.length > 0) {
      result.parsed[key] = matches;
    }
  }

  // Contact patterns
  const contactTypes = ['Registrant', 'Admin', 'Tech'];
  const contactFields = ['Name', 'Organization', 'Email', 'Country'];

  for (const type of contactTypes) {
    result.contacts[type.toLowerCase()] = {};
    for (const field of contactFields) {
      const pattern = new RegExp(`${type} ${field}:\\s*(.+)`, 'i');
      const match = raw.match(pattern);
      if (match) {
        result.contacts[type.toLowerCase()][field.toLowerCase()] = match[1].trim();
      }
    }
  }

  return result;
}

/**
 * HTTP Request handler
 */
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Health check
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      api: API_NAME,
      port: PORT,
      cacheSize: cache.size,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Cache stats
  if (path === '/cache') {
    res.writeHead(200);
    res.end(JSON.stringify({
      api: API_NAME,
      cacheSize: cache.size,
      domains: Array.from(cache.keys())
    }));
    return;
  }

  // WHOIS lookup
  if (path === '/whois' || path === '/') {
    const domain = parsedUrl.query.domain;
    const noCache = parsedUrl.query.nocache === 'true';

    if (!domain) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'Domain parameter is required',
        api: API_NAME
      }));
      return;
    }

    try {
      console.log(`[${API_NAME}] Looking up: ${domain}`);
      const startTime = Date.now();
      
      // Check cache first
      let parsed;
      let fromCache = false;
      
      if (!noCache) {
        parsed = getFromCache(domain);
        if (parsed) {
          fromCache = true;
          console.log(`[${API_NAME}] Cache hit for ${domain}`);
        }
      }

      if (!parsed) {
        const rawWhois = await whoisLookup(domain);
        parsed = parseWhoisResponse(rawWhois);
        setCache(domain, parsed);
      }

      const duration = Date.now() - startTime;

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        api: API_NAME,
        port: PORT,
        domain: domain,
        queryTime: `${duration}ms`,
        fromCache: fromCache,
        timestamp: new Date().toISOString(),
        data: parsed
      }));
      
      console.log(`[${API_NAME}] Completed lookup for ${domain} in ${duration}ms (cache: ${fromCache})`);
    } catch (error) {
      console.error(`[${API_NAME}] Error:`, error.message);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        api: API_NAME,
        port: PORT
      }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found',
    api: API_NAME
  }));
}

const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${API_NAME} running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   WHOIS:  http://localhost:${PORT}/whois?domain=example.com`);
  console.log(`   Cache:  http://localhost:${PORT}/cache`);
});

process.on('SIGTERM', () => {
  console.log(`[${API_NAME}] Shutting down...`);
  server.close(() => process.exit(0));
});
