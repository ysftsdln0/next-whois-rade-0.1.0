import type { NextApiRequest, NextApiResponse } from "next";
import { lookupWhoisWithCache } from "@/lib/whois/lookup";
import { WhoisResult } from "@/lib/whois/types";

const LOG_PREFIX = "[API /whois]";

/**
 * Alt sunucular için WHOIS API endpoint'i
 * 
 * Bu endpoint ana sunucudan gelen istekleri karşılar
 * ve doğrudan WHOIS sorgusu yapar.
 * 
 * Kullanım: GET /api/whois/google.com
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WhoisResult>
) {
  const clientIP = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
  
  console.log(`${LOG_PREFIX} ========================================`);
  console.log(`${LOG_PREFIX} İstek alındı: ${req.method} ${req.url}`);
  console.log(`${LOG_PREFIX} Client IP: ${clientIP}`);

  // Sadece GET isteklerini kabul et
  if (req.method !== "GET") {
    console.log(`${LOG_PREFIX} ❌ Method not allowed: ${req.method}`);
    return res.status(405).json({
      status: false,
      error: "Method not allowed",
      time: 0,
    });
  }

  const { domain } = req.query;

  // Domain parametresi kontrolü
  if (!domain || typeof domain !== "string" || domain.length === 0) {
    console.log(`${LOG_PREFIX} !! Domain parametresi eksik`);
    return res.status(400).json({
      status: false,
      error: "Domain parameter is required",
      time: 0,
    });
  }

  console.log(`${LOG_PREFIX} Domain: ${domain}`);

  // İsteğe bağlı: API key doğrulaması
  const apiKey = req.headers["x-api-key"];
  const expectedApiKey = process.env.INTERNAL_API_KEY;

  if (expectedApiKey && apiKey !== expectedApiKey) {
    console.log(`${LOG_PREFIX} !! Unauthorized - API key eşleşmedi`);
    return res.status(401).json({
      status: false,
      error: "Unauthorized",
      time: 0,
    });
  }

  try {
    // WHOIS sorgusu yap
    console.log(`${LOG_PREFIX} WHOIS sorgusu başlatılıyor...`);
    const startTime = Date.now();
    const result = await lookupWhoisWithCache(domain);
    const duration = Date.now() - startTime;

    console.log(`${LOG_PREFIX} Sorgu tamamlandı (${duration}ms): ${result.status ? 'Başarılı' : 'Hata'}`);
    console.log(`${LOG_PREFIX} ========================================`);

    // Sonucu döndür
    return res.status(result.status ? 200 : 500).json(result);
  } catch (error: any) {
    console.log(`${LOG_PREFIX} !! Hata: ${error.message}`);
    console.log(`${LOG_PREFIX} ========================================`);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal server error",
      time: 0,
    });
  }
}
