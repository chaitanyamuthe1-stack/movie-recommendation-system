# Security Guide

## Rules
1. Secrets live only in `.env` (git-ignored). Commit `.env.example` with blank/placeholder values.
2. Never hardcode API keys, passwords or JWT secrets in code or `docker-compose.yml`.
3. Do not commit database files: they contain user accounts and password hashes.
4. Run `make secrets` before every push (CI also runs it).

## If a key was ever committed or shared
Assume it is compromised.
1. Revoke/regenerate it (TMDB: Account Settings → API).
2. Replace it in `.env`.
3. Remove it from git history (`git filter-repo` or BFG), or create a fresh repo.

## Generating a JWT secret
    python -c "import secrets; print(secrets.token_urlsafe(48))"

## Production hardening checklist
- [ ] Strong, unique POSTGRES_PASSWORD and JWT_SECRET_KEY
- [ ] CORS_ORIGINS limited to your real frontend domain
- [ ] Postgres and Redis not exposed publicly (compose binds them to 127.0.0.1)
- [ ] `/api/admin/*` requires an admin user
- [ ] DEBUG=False
- [ ] HTTPS in front of the app (Render/Railway provide it)
