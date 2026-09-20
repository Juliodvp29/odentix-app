// Template with placeholder values. Copy this file to environment.ts (dev)
// and environment.prod.ts (prod) and fill in the real values. This file is
// committed; the real ones are git-ignored and never committed.
// On hosts without the real files (e.g. Vercel), they are generated at
// build time from ODENTIX_API_URL (prod) and ODENTIX_API_URL_DEV (dev,
// falls back to the localhost URL below).
export const environment = {
  apiUrl: 'http://localhost:8081/api/v1',
};
