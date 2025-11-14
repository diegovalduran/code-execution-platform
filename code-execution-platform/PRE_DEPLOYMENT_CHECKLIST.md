# Pre-Deployment Checklist

## ✅ Security Check

- [x] `.env` files are in `.gitignore` (`.env*` pattern)
- [x] No API keys hardcoded in source code
- [x] All API keys accessed via `process.env` only
- [x] No sensitive files tracked in git

## ✅ Railway Deployment Readiness

- [x] `package.json` has correct build scripts:
  - `build`: `prisma generate && next build`
  - `postinstall`: `prisma generate`
  - `start`: `next start`
- [x] `railway.json` configuration file created
- [x] Prisma schema uses SQLite (works on Railway)
- [x] Environment variables documented:
  - `DATABASE_URL`: `file:./dev.db`
  - `GROQ_API_KEY`: Optional, for AI features

## ✅ Code Quality

- [x] No TypeScript errors
- [x] All dependencies in `package.json`
- [x] README.md updated with deployment instructions
- [x] DEPLOYMENT.md has detailed Railway steps

## Before Pushing to GitHub

1. **Verify no secrets in code:**
```bash
git grep -i "sk-" -- "*.ts" "*.tsx" "*.js" "*.jsx"
git grep -i "gsk_" -- "*.ts" "*.tsx" "*.js" "*.jsx"
```

2. **Check what will be committed:**
```bash
git status
git diff --cached
```

3. **Ensure .env is not tracked:**
```bash
git check-ignore .env  # Should output: .env
```

## Environment Variables for Railway

Set these in Railway dashboard → Variables:

- `DATABASE_URL`: `file:./dev.db`
- `GROQ_API_KEY`: (optional) Your Groq API key from https://console.groq.com/

## Ready to Deploy! 🚀

