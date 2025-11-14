# Deployment Guide

## Step 1: Push to GitHub

### Create a new GitHub repository

1. Go to GitHub and create a new **public** repository
2. Add the GitHub remote:
```bash
cd code-execution-platform
git remote add github https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push github master
```

Or if you want to replace the existing remote:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push origin master
```

## Step 2: Deploy to Railway

Railway is perfect for this project because it supports SQLite with persistent file storage (unlike Vercel which is serverless).

### Quick Deploy Steps

1. **Go to Railway**: Visit [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure the Service**:
   - Railway will auto-detect Next.js
   - **Root Directory**: Set to `code-execution-platform` (if your repo contains the folder) or leave as `.` (if the repo IS the code-execution-platform folder)

4. **Add Environment Variables**:
   Click on your service → Variables tab → Add:
   - `DATABASE_URL`: `file:./dev.db` (SQLite works on Railway!)
   - `GROQ_API_KEY`: Your Groq API key (optional, for AI test case generation)

5. **Deploy**:
   - Railway will automatically build and deploy
   - The build command is already set in `package.json`: `npm run build`
   - Railway will run `prisma generate` automatically via `postinstall` script

6. **Get Your URL**:
   - Once deployed, Railway will provide a public URL
   - You can also add a custom domain if needed

### Important Notes

- **SQLite works on Railway** because it provides persistent file storage (unlike Vercel's serverless functions)
- The database file (`dev.db`) will persist across deployments
- No need to change `prisma/schema.prisma` - keep it as SQLite
- Railway will automatically run migrations on first deploy

### Troubleshooting

- **Build fails**: Check the build logs in Railway dashboard
- **Database errors**: Ensure `DATABASE_URL="file:./dev.db"` is set
- **Port issues**: Railway auto-assigns PORT, Next.js handles this automatically

## Step 3: Verify Deployment

1. Visit your Railway URL (provided after deployment)
2. Test creating a problem
3. Test submitting a solution
4. Test admin review features

## Troubleshooting

- **Build fails**: Check the build logs in Railway dashboard
- **Database errors**: Ensure `DATABASE_URL="file:./dev.db"` is set correctly
- **API errors**: Check that Piston API is accessible (it's public, should work)
- **AI generation fails**: Check `GROQ_API_KEY` is set (feature is optional)
- **Port issues**: Railway auto-assigns PORT, Next.js handles this automatically

