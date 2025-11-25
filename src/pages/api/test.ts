import type { NextApiRequest, NextApiResponse } from "next";
import { ProviderManager } from "@/lib/whois/providers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("Starting Real World Provider Test...");
    log("This test uses the actual ProviderManager logic with real WHOIS lookups.");
    
    // Use the real ProviderManager logic, but with our logger to capture output
    const manager = new ProviderManager(log);
    
    // We can add more providers here if we had them, but currently only DirectProvider exists.
    // If the user had added others, they would be added here too if we want to test them.
    // Since the default constructor adds DirectProvider, we are good.

    const domains = ["google.com", "microsoft.com", "amazon.com"];

    for (const domain of domains) {
        log(`\n--- Lookup: ${domain} ---`);
        const result = await manager.execute(domain);
        log(`Result: Success`);
        log(`Registrar: ${result.registrar}`);
        log(`Created: ${result.creationDate}`);
    }

    res.status(200).json({ status: "success", logs });
  } catch (error: any) {
    res.status(500).json({ 
      status: "error", 
      message: error.message,
      logs 
    });
  }
}
