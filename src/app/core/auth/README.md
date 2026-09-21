# auth

Session state and HTTP authentication for the app.

## Token storage decision

Access and refresh tokens live in `localStorage` (`odentix.accessToken` /
`odentix.refreshToken`), exposed as signals by `SessionService`.

- The backend issues both tokens in the login JSON body and rotates the
  refresh token on every refresh. There is no httpOnly-cookie option, so a
  JavaScript-readable store is required.
- `localStorage` (not sessionStorage or memory) so the session survives
  reloads and works across tabs.
- Risk: XSS exfiltration. Mitigations: short access-token TTL, server-side
  refresh rotation and revocation on logout, Angular auto-escaping, no
  `innerHTML`, CSP headers at deploy.

## Interceptor

`authInterceptor` attaches `Authorization: Bearer <access>` to every
request except `/api/v1/auth/*` (login, refresh, and logout manage their
own credentials — an expired token must never poison a refresh, and a
failed login keeps its own error).

## Silent renewal

When any other endpoint answers `401`, the interceptor tries one silent
refresh before giving up:

- `TokenRefreshService.refresh()` posts the stored refresh token to
  `/api/v1/auth/refresh` and stores the rotated pair, keeping the
  current user. It calls the backend through `HttpBackend` directly so
  the refresh itself bypasses the interceptor and can never recurse.
- Concurrent `401`s share a single in-flight refresh instead of firing
  one per request.
- The failed request is retried once with the new access token. Only
  when the refresh fails with `401`/`403` (or there is no refresh token
  at all) is the session cleared and the user sent to `/login`.
  Transient refresh failures keep the session so the next request can
  try again.
