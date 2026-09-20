# core

App-wide singletons: the API client, interceptors, guards, and services
that live for the whole session. Nothing here is feature-specific — if a
service only serves one feature, it belongs in `features/`, not here.

Subfolders:

- `api/` — types generated from the backend's OpenAPI spec. Generated
  files: regenerate them whenever the backend API changes, never edit
  them by hand.
