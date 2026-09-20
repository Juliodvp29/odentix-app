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
failed login keeps its own error). On 401 from any other endpoint it
clears the session and navigates to `/login` without a page reload
(skipped when already there).
