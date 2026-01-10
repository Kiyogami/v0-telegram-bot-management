# Telegram Bot Python Backend

This backend handles Telegram bot authentication and message sending using Telethon.

## Local Development

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Run the server:
\`\`\`bash
python main.py
\`\`\`

The API will be available at `http://localhost:8000`

## Docker Deployment

Build and run with Docker:
\`\`\`bash
docker build -t telegram-bot-backend .
docker run -p 8000:8000 telegram-bot-backend
\`\`\`

## API Endpoints

- POST `/api/telegram/auth/send-code` - Send verification code
- POST `/api/telegram/auth/verify-code` - Verify code
- POST `/api/telegram/auth/verify-password` - Verify 2FA password
- POST `/api/telegram/bot/start` - Start bot
- POST `/api/telegram/bot/stop` - Stop bot
- GET `/api/telegram/bot/status/{bot_id}` - Get bot status
