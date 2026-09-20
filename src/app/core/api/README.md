# api

Types generated from the backend's live OpenAPI spec — never hand-written,
never hand-edited. If the generated types look wrong, the fix belongs in
the backend's API, not in `schema.ts`.

Regenerate (requires the backend running locally on port 8081):

```bash
npm run generate:api-types
```

Run this and commit the result whenever the backend's API changes, so the
project always builds against the current spec without requiring the
backend to be running.
