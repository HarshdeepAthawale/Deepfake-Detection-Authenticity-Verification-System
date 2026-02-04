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

## Contact

For security concerns, please contact the project maintainers through GitHub.
