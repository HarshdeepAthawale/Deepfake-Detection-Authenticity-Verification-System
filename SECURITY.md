# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our deepfake detection system seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do Not** Disclose Publicly
Please do not open a public GitHub issue for security vulnerabilities.

### 2. Report Privately
Send an email to the project maintainers with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### 3. Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Best effort

### 4. Disclosure Policy
- We will acknowledge your report within 48 hours
- We will provide regular updates on our progress
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will coordinate the disclosure timeline with you

## Security Best Practices

### For Deployment
1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **HTTPS Only**: Always use HTTPS in production
4. **Database**: Use strong passwords and restrict access
5. **Updates**: Keep dependencies up to date

### For Development
1. **Code Review**: All code must be reviewed before merging
2. **Dependency Scanning**: Run `npm audit` and `pip check` regularly
3. **Input Validation**: Sanitize all user inputs
4. **Authentication**: Use JWT tokens with proper expiration
5. **Rate Limiting**: Implement rate limiting on all endpoints

## Known Security Considerations

### ML Model Security
- Model files are large and stored locally
- Ensure model integrity with checksums
- Validate input data before inference

### File Upload Security
- File size limits enforced (100MB)
- File type validation
- Virus scanning recommended for production

### API Security
- JWT authentication required
- Rate limiting implemented
- CORS configured for specific origins

## Security Scan Report

*Last scan: 2025-02-12*

### Summary
- **Helmet**: Enabled for HTTP headers.
- **Rate limiting**: Applied (express-rate-limit).
- **Auth**: JWT + `authenticate` middleware on protected routes; `/api/auth` is public by design.
- **CORS**: Restricts origins (localhost in dev).
- **File exports**: PDF/CSV filenames are server-generated (scanId + timestamp), no path traversal risk.
- **Chart UI**: `dangerouslySetInnerHTML` in `components/ui/chart.tsx` uses only build-time theme/color data, not user input.

### Findings to Address

| Area | Risk | Recommendation |
|------|------|----------------|
| **Default secrets** (`backend/src/config/env.js`) | High if deployed without env | Ensure production sets `JWT_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_IV` (no defaults in prod). Consider failing startup when `NODE_ENV=production` and these are unset. |
| **Create-admin script** (`backend/scripts/create-admin.js`) | Medium | Hardcoded email/password (`Admin@123`). Use env vars (e.g. `ADMIN_EMAIL`, `ADMIN_PASSWORD`) or prompt; remove defaults before production use. |
| **MongoDB $regex** (`user.service.js`, `case.service.js`) | Low–Medium (ReDoS) | `filters.search` is passed directly to `$regex`. Escape regex special characters or use a sanitizer to prevent ReDoS and injection. |
| **Test secrets** (`backend/tests/setup.js`) | Low | `JWT_SECRET` for tests is fine; keep test DB and secrets separate from production. |
| **kill-port.js** | Low | Uses `exec` with numeric port and parsed PIDs; ensure this script is not exposed to untrusted input (CLI only). |

### Good Practices in Place
- `.env*` (and `.env.example`) in `.gitignore`; no real credentials in repo.
- Passwords hashed with bcrypt (configurable rounds).
- Sensitive fields (e.g. password, token) excluded from audit logs.
- Protected routes use `authenticate`; admin routes use RBAC.

## Contact

For security concerns, please contact the project maintainers through GitHub.
