import { HISTORY_LIMIT } from "@/lib/env";

// SSR güvenliği için localStorage kontrolü
const isClient = typeof window !== 'undefined';

export function listHistory(): string[] {
  if (!isClient) return [];
  
  try {
    const history = localStorage.getItem("history");
    if (!history || history === "[]") return [];

    const parsed = JSON.parse(history);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item: unknown) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  } catch (error) {
    console.error("Failed to parse history from localStorage:", error);
    return [];
  }
}

export function addHistory(query: string) {
  if (!isClient || !query || query.trim().length === 0) return;

  try {
    let history = listHistory();
    const domain = query.trim().toLowerCase();

    if (history.includes(domain)) {
      // if the domain is already in the history, remove it first
      history = history.filter((item) => item !== domain);
    }

    history = [domain, ...history].slice(0, HISTORY_LIMIT);
    localStorage.setItem("history", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to add history:", error);
  }
}

export function removeHistory(query: string) {
  if (!isClient || !query || query.trim().length === 0) return;

  try {
    let history = listHistory();
    const domain = query.trim().toLowerCase();

    if (!history.includes(domain)) return;

    history = history.filter((item) => item !== domain);
    localStorage.setItem("history", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to remove history:", error);
  }
}
