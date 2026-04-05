#!/usr/bin/env npx tsx
/**
 * Dead link checker for references.
 * Run: npx tsx scripts/check-links.ts
 * Exits with code 1 if any links are dead.
 */

import { dataReferences } from '../src/data/references';

async function checkLink(url: string): Promise<{ url: string; ok: boolean; status: number }> {
  try {
    // Try HEAD first (faster), fall back to GET if blocked (401/403/405)
    const head = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'ph-oil-intel-link-checker/1.0' },
      redirect: 'follow',
    });
    if (head.ok) return { url, ok: true, status: head.status };
    if ([401, 403, 405, 503].includes(head.status)) {
      const get = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ph-oil-intel-link-checker/1.0)' },
        redirect: 'follow',
      });
      return { url, ok: get.ok, status: get.status };
    }
    return { url, ok: false, status: head.status };
  } catch {
    return { url, ok: false, status: 0 };
  }
}

async function main() {
  console.log(`Checking ${dataReferences.length} reference links...\n`);

  const results = await Promise.all(dataReferences.map((r) => checkLink(r.url)));

  let hasFailures = false;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    const color = r.ok ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${r.url} (${r.status || 'timeout'})`);
    if (!r.ok) hasFailures = true;
  }

  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} links healthy`);
  process.exit(hasFailures ? 1 : 0);
}

main();
