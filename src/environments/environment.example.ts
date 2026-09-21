// Template with placeholder values. Copy this file to environment.ts (dev)
// and environment.prod.ts (prod) and fill in the real values. This file is
// committed; the real ones are git-ignored and never committed.
// apiUrl is the backend host WITHOUT path prefix: calls always use the full
// OpenAPI path (e.g. `/api/v1/auth/login`), verbatim from schema.ts.
// On hosts without the real files (e.g. Vercel), they are generated at
// build time from ODENTIX_API_URL (prod) and ODENTIX_API_URL_DEV (dev,
// falls back to the localhost URL below).
export interface Environment {
  apiUrl: string;
}

export const environment: Environment = {
  apiUrl: 'http://localhost:8081',
};
