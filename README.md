# Telegram Bot Management System

A full-stack web application for managing multiple Telegram bots with a Next.js frontend and Python backend.

## Architecture

- **Frontend**: Next.js 16 with React 19, Tailwind CSS, shadcn/ui
- **Backend**: Python FastAPI with Telethon for Telegram API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Features

- Multi-bot management interface
- Telegram authentication with code and 2FA support
- Automated message sending to groups with anti-spam delays
- Auto-reply to private messages
- Real-time bot status monitoring
- Secure session storage

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### Database Setup

1. Run the SQL scripts in the `scripts` folder in your Supabase SQL editor:
   - `001_create_bots_tables.sql`
   - `002_add_auth_fields.sql`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

### Python Backend Setup

1. Navigate to the Python backend directory:
```bash
cd python-backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Python backend:
```bash
python main.py
```

The Python backend will run on `http://localhost:8000`

### Docker Deployment (Python Backend)

```bash
cd python-backend
docker build -t telegram-bot-backend .
docker run -p 8000:8000 telegram-bot-backend
```

## Usage

1. Sign up / Log in to the application
2. Create a new bot with your Telegram API credentials
3. Authorize the bot with your phone number and verification code
4. Configure message templates and delays
5. Start the bot to begin sending messages

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `PYTHON_BACKEND_URL` - URL of the Python backend (default: http://localhost:8000)

## Production Deployment

### Next.js Frontend

Deploy to Vercel:
```bash
vercel deploy
```

### Python Backend

Deploy to any Python hosting service (Railway, Render, Fly.io, etc.) and update the `PYTHON_BACKEND_URL` environment variable in your Vercel project.

## How It Works

1. **Authentication**: User logs in with email/password via Supabase Auth
2. **Bot Creation**: User adds Telegram API credentials (api_id, api_hash, phone number)
3. **Telegram Authorization**: Python backend handles Telegram auth flow with Telethon
4. **Session Storage**: Telegram session strings are stored securely in Supabase
5. **Bot Execution**: Python backend runs bots 24/7, sending messages and handling auto-replies
6. **Frontend Control**: Next.js frontend provides UI for managing bots (start/stop/configure)

## Security Notes

- Never commit `.env` files with real credentials
- Session strings are encrypted in the database
- Row Level Security (RLS) ensures users can only access their own bots
- Python backend should be deployed with proper authentication in production
