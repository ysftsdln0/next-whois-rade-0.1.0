/**
 * Type declarations for whois module
 */

declare module 'whois' {
  interface WhoisOptions {
    server?: string;
    follow?: number;
    timeout?: number;
    verbose?: boolean;
    bind?: string;
  }

  interface WhoisResult {
    server: string;
    data: string;
  }

  type WhoisCallback = (err: Error | null, data: string | WhoisResult[]) => void;

  function lookup(
    domain: string,
    options: WhoisOptions,
    callback: WhoisCallback
  ): void;

  function lookup(
    domain: string,
    callback: WhoisCallback
  ): void;

  export { lookup, WhoisOptions, WhoisCallback, WhoisResult };
}
