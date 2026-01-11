# Telegram Bot Management System

A professional system for managing multiple Telegram bots with automated message sending, analytics dashboard, and an admin panel.

## Architecture

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python FastAPI + Telethon for Telegram API
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth + Role-based access control

## Features

### Bot Management
- Creation and configuration of multiple Telegram bots
- **🚀 QR Code Authentication (NEW!)** - instant login by scanning a QR code in Telegram app
- Traditional SMS/App authentication + 2FA support
- Automatic detection and selection of groups for message sending
- Auto-replies to private messages

### Advanced Features
- **Bulk Operations** - batch operations (start/stop/delete multiple bots)
- **Export/Import** - backup and restore of bot configurations
- **Analytics Dashboard** - performance charts, real-time statistics
- **Test Mode** - sending test messages before mass campaigns
- **Dark/Light Mode** - theme switching

### Admin Panel
- Full system overview (users, bots, statistics)
- User permission management
- Activity charts for the last 7 days
- Bot deletion and content moderation

### Anti-Ban Protection
- Intelligent random delays between messages
- Respect for FloodWait errors from Telegram
- Daily message limit
- Detection of expired sessions

## Requirements

- Node.js 18+
- Python 3.11+
- Supabase account
- Railway account (for hosting Python backend)

## Setup

### 1. Database (Supabase)

Run the SQL scripts in order in your Supabase SQL editor:

```sql
scripts/001_create_bots_tables.sql
scripts/002_add_auth_fields.sql  
scripts/003_create_groups_table.sql
scripts/004_add_group_enabled_field.sql
scripts/005_add_auto_reply_field.sql
scripts/008_final_schema_fix.sql
scripts/011_complete_admin_fix.sql
```

**Important**: Your account will automatically be set as an administrator if you use an email from the database.

### 2. Frontend (Next.js)

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

### 3. Python Backend

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

## Environment Variables

### Next.js (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Python Backend (USE PUBLIC URL!)
PYTHON_BACKEND_URL=https://your-backend.up.railway.app

# Development only
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### Python Backend (Railway)

Railway automatically sets `PORT`. No environment variables need to be added.

## Production Deployment

### Frontend on Vercel

1. Click **"Publish"** in the top right corner of v0
2. Connect with your Vercel account
3. Add environment variables
4. Deploy!

### **Important: Python Backend on Railway**

⚠️ **Railway has an OLD version of the code without QR login and updated endpoints!**

#### How to Update Railway:

**Method 1: Through GitHub (recommended)**

```bash
# Copy the updated python-backend/main.py from v0
git add python-backend/main.py
git commit -m "Update Python backend with QR login"
git push origin main
```

Railway automatically detects and deploys the new version.

**Method 2: Directly in Railway**

1. Open Railway Dashboard → Your project
2. Click service → "View Files"
3. Find `main.py`
4. Replace the entire content with the code from v0
5. Railway automatically redeploy

#### Verification of Deployment:

Open in your browser:
```
https://your-backend.railway.app/api/debug/routes
```

You should see endpoints:
- `/api/telegram/auth/send-code`
- `/api/telegram/auth/qr-login` ✨ **NEW**
- `/api/telegram/auth/qr-check` ✨ **NEW**
- `/api/telegram/auth/verify-code`
- `/api/telegram/groups/fetch`

**If you see 404 for these endpoints** = Railway has an old version → follow the deployment steps above again.

## Usage

### Creating a Bot

1. Log in to the application
2. Click **"Add Bot"**
3. Get API credentials from [my.telegram.org/auth](https://my.telegram.org/auth)
4. Enter API ID, API Hash, phone number

### Bot Authorization

**Option 1: 🚀 QR Code (Recommended - Fast & Easy)**
1. Click **"Authorize"** on the bot
2. Select **"QR Code (Recommended)"**
3. Open Telegram app → Settings → Devices → Link Desktop Device
4. Scan the displayed QR code
5. Confirm in the app - **Done in 3 seconds!**

**Option 2: 📱 SMS/App Code**
1. Click **"Authorize"** on the bot
2. Select **"SMS/App Code"**
3. Telegram will send a code (check app or SMS)
4. Enter the verification code
5. If you have 2FA, enter the password

### Sending Configuration

1. Click **"Groups"** to select where to send
2. The system automatically detects all your groups
3. Select target groups
4. Set the message and delays (min/max delay)
5. Click **"Start"** to run the bot 24/7

### Test Mode

Before mass sending:
1. Click the **"Test"** icon (a ball) on the bot card
2. Select a test group
3. Send a test message
4. Check if everything works

## Troubleshooting

### Bot not sending authorization code

**Reason**: Railway uses an old version of the backend code without fixes.

**Solution**: 
1. Go to the **"Production Deployment"** section above
2. Follow the Railway update steps
3. Wait 2-3 minutes for deployment
4. Refresh the page and try again

### "Session expired" error

**Reason**: Telegram session expired (normal after a few days).

**Solution**:
1. Click **"Authorize"** on the bot card
2. Log in again via QR or code

### 404 Error for endpoints

**Reason**: Railway uses an old version of the code.

**Solution**: See the **"How to Update Railway"** section above.

### QR Code not generating

**Reason**: Railway backend doesn't have QR endpoints yet.

**Solution**:
1. See `QR_LOGIN_SETUP.md` for complete setup instructions
2. Unlock `python-backend/main.py` and `python-backend/requirements.txt` in v0
3. Add QR endpoints and dependencies (instructions in `QR_LOGIN_SETUP.md`)
4. Deploy updated code to Railway

### Multiple GoTrueClient instances warning

This warning does not affect the application's functionality. It occurs when Supabase creates multiple clients, but it is handled by the singleton pattern.

## Admin Panel

Available for users with the `admin` role at `/admin`.

To set an administrator:
1. Log in to your account
2. Run in Supabase SQL Editor:
```sql
INSERT INTO admin_users (user_id, email)
VALUES ('your-user-id', 'your@email.com');
```

The panel displays:
- System statistics (users, bots, messages)
- List of all users with permission granting capability
- List of all bots in the system
- Activity charts

## Security Notes

- Never commit `.env` files with real credentials
- Session strings are stored securely in the database
- Row Level Security (RLS) ensures that users can only see their own bots
- The `admin_users` table is without RLS for admin access
- 2FA support for Telegram accounts with additional protection

## Technical Stack

- **Next.js 16** with App Router and React Server Components
- **Tailwind CSS v4** with custom design tokens
- **shadcn/ui** for UI components
- **Supabase** for authentication and database
- **FastAPI** + **Telethon** for Python backend
- **Recharts** for charts and analytics
- **Sonner** for toast notifications

## Documentation

Check these files for detailed instructions:
- `QR_LOGIN_SETUP.md` - **Complete QR login setup guide** 🆕
- `RAILWAY_DEPLOYMENT.md` - Railway deployment instructions
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide  
- `DEPLOYMENT_GUIDE.md` - Comprehensive step-by-step guide

## License

MIT License - use as you wish, build your own projects!

---

**Have questions?** Check:
- `RAILWAY_DEPLOYMENT.md` - detailed deployment instructions
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide  
- `DEPLOYMENT_GUIDE.md` - comprehensive step-by-step guide
