// API endpoint rotasyonu için utility
// Rate limit'e takılmamak için sorguları farklı sunuculara dağıtır

// Ortam değişkeninden API endpoint'lerini al
// Örnek: "https://api1.ysftsdln.com,https://api2.ysftsdln.com,https://api3.ysftsdln.com"
const endpointsStr = process.env.WHOIS_API_ENDPOINTS || "";
const endpoints = endpointsStr
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

let currentIndex = 0;

/**
 * Round-robin şeklinde sıradaki API endpoint'ini döndürür
 * Her çağrıda sıradaki endpoint'e geçer
 */
export function getNextApiEndpoint(): string | null {
  if (endpoints.length === 0) {
    return null;
  }

  const endpoint = endpoints[currentIndex];
  currentIndex = (currentIndex + 1) % endpoints.length;
  return endpoint;
}

/**
 * Rastgele bir API endpoint'i döndürür
 * Daha dengeli dağılım için tercih edilebilir
 */
export function getRandomApiEndpoint(): string | null {
  if (endpoints.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * endpoints.length);
  return endpoints[randomIndex];
}

/**
 * Tüm endpoint'leri döndürür
 */
export function getAllApiEndpoints(): string[] {
  return [...endpoints];
}

/**
 * Endpoint sayısını döndürür
 */
export function getEndpointCount(): number {
  return endpoints.length;
}

/**
 * Bu sunucu ana sunucu mu kontrol eder
 * Ana sunucu: Sorguları alt sunuculara dağıtan sunucu
 * Alt sunucu: Doğrudan WHOIS sorgusu yapan sunucu
 */
export function isMainServer(): boolean {
  return process.env.IS_MAIN_SERVER === "true";
}

/**
 * API endpoint'lerinin yapılandırılıp yapılandırılmadığını kontrol eder
 */
export function hasApiEndpoints(): boolean {
  return endpoints.length > 0;
}
