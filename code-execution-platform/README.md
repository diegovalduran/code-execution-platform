# Code Execution Platform

A LeetCode-inspired coding challenge platform built with Next.js, allowing users to create problems, write solutions in Python/JavaScript, and automatically validate them against test cases.

## Features

- **Problem Management**: Create and manage coding problems with structured function signatures
- **Code Execution**: Run Python and JavaScript solutions against test cases using Piston API
- **Test Case Management**: Add, edit, and delete test cases with AI-powered generation
- **Submission Review**: Admin panel for reviewing and approving/rejecting submissions
- **User Dashboard**: Track submission status and view test results
- **Dark Theme UI**: LeetCode-inspired dark theme with purple accent colors

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Code Execution**: Piston API (emkc.org)
- **AI Integration**: Groq API for test case generation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd code-execution-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key_here"  # Optional, for AI test case generation
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Railway (Recommended)

Railway supports SQLite with persistent storage, making it perfect for this project.

1. **Push your code to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin master
```

2. **Go to Railway**: Visit [railway.app](https://railway.app) and sign in with GitHub

3. **Create New Project**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

4. **Configure Environment Variables**:
   - `DATABASE_URL`: `file:./dev.db` (SQLite works on Railway!)
   - `GROQ_API_KEY`: Your Groq API key (optional)

5. **Deploy**: Railway will automatically build and deploy your app

6. **Get Your URL**: Railway provides a public URL after deployment

**Note**: SQLite works perfectly on Railway because it provides persistent file storage. No need to switch to PostgreSQL!

See `DEPLOYMENT.md` for detailed instructions.

## Project Structure

```
code-execution-platform/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin pages
│   │   ├── problems/          # Problem pages
│   │   └── submissions/       # Submission pages
│   ├── components/            # React components
│   └── lib/                   # Utility functions
└── public/                    # Static assets
```

## Environment Variables

- `DATABASE_URL`: Database connection string
- `GROQ_API_KEY`: Groq API key for AI test case generation (optional)

## License

MIT
