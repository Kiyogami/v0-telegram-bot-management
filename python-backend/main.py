import os
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient, errors
from telethon.sessions import StringSession
from typing import Optional, List
import shutil
from telethon.tl.types import Chat, Channel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS_DIR = "sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)

# Pending auth clients
clients = {}

# Running bots
running_bots = {}

class SendCode(BaseModel):
    api_id: int
    api_hash: str
    phone: str

class VerifyCode(BaseModel):
    phone: str
    code: str

class VerifyPassword(BaseModel):
    phone: str
    password: str

class ImportSession(BaseModel):
    api_id: int
    api_hash: str
    phone: str

# Bot management models
class StartBot(BaseModel):
    bot_id: str
    api_id: int
    api_hash: str
    phone_number: str
    session_string: str
    message_template: str = "Hello!"
    min_delay: int = 20
    max_delay: int = 40
    group_ids: List[int] = []
    auto_reply_enabled: bool = True
    auto_reply_message: str = "To jest tylko bot."

class StopBot(BaseModel):
    bot_id: str

class FetchGroups(BaseModel):
    bot_id: str
    api_id: int
    api_hash: str
    session_string: str

@app.post("/send-code")
async def send_code(data: SendCode):
    """Send verification code to phone"""
    session_path = f"{SESSIONS_DIR}/session_{data.phone}"

    client = TelegramClient(
        session_path,
        data.api_id,
        data.api_hash,
        device_model="Chrome",
        system_version="Windows 10",
        app_version="4.0",
        lang_code="en"
    )

    await client.connect()

    try:
        await client.send_code_request(data.phone)
    except errors.PhoneNumberInvalidError:
        raise HTTPException(400, "Nieprawidłowy numer telefonu")
    except errors.FloodWaitError as e:
        raise HTTPException(429, f"Zbyt wiele prób. Odczekaj {e.seconds} sekund.")
    except errors.ApiIdInvalidError:
        raise HTTPException(400, "Nieprawidłowy API ID lub API Hash")
    except Exception as e:
        raise HTTPException(500, str(e))

    clients[data.phone] = {
        'client': client,
        'api_id': data.api_id,
        'api_hash': data.api_hash
    }
    
    return {
        "status": "CODE_SENT",
        "info": "Kod wysłany! Sprawdź aplikację Telegram na telefonie (nie SMS!)"
    }

@app.post("/verify-code")
async def verify_code(data: VerifyCode):
    """Verify the received code"""
    if data.phone not in clients:
        raise HTTPException(400, "Brak sesji. Wyślij kod ponownie.")

    client_data = clients[data.phone]
    client = client_data['client']

    try:
        await client.sign_in(data.phone, data.code)
        
        session_string = StringSession.save(client.session)
        del clients[data.phone]
        
        return {
            "status": "LOGGED_IN",
            "session_string": session_string
        }
    except errors.PhoneCodeInvalidError:
        raise HTTPException(400, "Nieprawidłowy kod")
    except errors.PhoneCodeExpiredError:
        del clients[data.phone]
        raise HTTPException(400, "Kod wygasł. Wyślij nowy kod.")
    except errors.SessionPasswordNeededError:
        return {
            "status": "PASSWORD_REQUIRED",
            "info": "Konto ma włączone 2FA. Wprowadź hasło."
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/verify-password")
async def verify_password(data: VerifyPassword):
    """Verify 2FA password"""
    if data.phone not in clients:
        raise HTTPException(400, "Brak sesji. Zacznij od początku.")

    client = clients[data.phone]['client']

    try:
        await client.sign_in(password=data.password)
        session_string = StringSession.save(client.session)
        del clients[data.phone]
        
        return {
            "status": "LOGGED_IN",
            "session_string": session_string
        }
    except errors.PasswordHashInvalidError:
        raise HTTPException(400, "Nieprawidłowe hasło 2FA")
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/import-session")
async def import_session(
    session_file: UploadFile = File(...),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    phone: str = Form(...)
):
    """Import existing .session file"""
    try:
        session_path = f"{SESSIONS_DIR}/session_{phone}.session"
        
        with open(session_path, "wb") as f:
            content = await session_file.read()
            f.write(content)
        
        client = TelegramClient(
            f"{SESSIONS_DIR}/session_{phone}",
            api_id,
            api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            os.remove(session_path)
            raise HTTPException(400, "Sesja wygasła lub jest nieprawidłowa")
        
        session_string = StringSession.save(client.session)
        await client.disconnect()
        
        return {
            "status": "IMPORTED",
            "session_string": session_string,
            "info": "Sesja zaimportowana pomyślnie!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Błąd importu: {str(e)}")

@app.post("/validate-session")
async def validate_session(api_id: int = Form(...), api_hash: str = Form(...), session_string: str = Form(...)):
    """Validate a string session"""
    try:
        client = TelegramClient(
            StringSession(session_string),
            api_id,
            api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(400, "Sesja wygasła")
        
        me = await client.get_me()
        await client.disconnect()
        
        return {
            "status": "VALID",
            "user": {
                "id": me.id,
                "first_name": me.first_name,
                "phone": me.phone
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Nieprawidłowa sesja: {str(e)}")

# Start a bot with messaging
@app.post("/api/telegram/bot/start")
async def start_bot(data: StartBot):
    """Start a bot with messaging"""
    try:
        # Check if bot already running
        if data.bot_id in running_bots:
            return {"status": "ALREADY_RUNNING", "bot_id": data.bot_id}
        
        # Create client from session string
        client = TelegramClient(
            StringSession(data.session_string),
            data.api_id,
            data.api_hash,
            device_model="Chrome",
            system_version="Windows 10",
            app_version="4.0"
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(400, "Session expired, please re-authenticate")
        
        # Store bot info
        running_bots[data.bot_id] = {
            "client": client,
            "config": data,
            "running": True
        }
        
        # Start message loop in background
        asyncio.create_task(bot_message_loop(data.bot_id))
        
        return {
            "status": "STARTED",
            "bot_id": data.bot_id,
            "groups": len(data.group_ids)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

async def bot_message_loop(bot_id: str):
    """Background task to send messages"""
    import random
    
    while bot_id in running_bots and running_bots[bot_id]["running"]:
        try:
            bot_data = running_bots[bot_id]
            client = bot_data["client"]
            config = bot_data["config"]
            
            if config.group_ids:
                for group_id in config.group_ids:
                    try:
                        await client.send_message(group_id, config.message_template)
                        print(f"[BOT {bot_id}] Sent message to {group_id}")
                    except Exception as e:
                        print(f"[BOT {bot_id}] Error sending to {group_id}: {e}")
                    
                    # Random delay between messages
                    delay = random.randint(config.min_delay, config.max_delay)
                    await asyncio.sleep(delay)
            else:
                # No groups, just wait
                await asyncio.sleep(60)
                
        except Exception as e:
            print(f"[BOT {bot_id}] Loop error: {e}")
            await asyncio.sleep(30)
    
    print(f"[BOT {bot_id}] Message loop stopped")

# Stop a running bot
@app.post("/api/telegram/bot/stop")
async def stop_bot(data: StopBot):
    """Stop a running bot"""
    if data.bot_id not in running_bots:
        return {"status": "NOT_RUNNING", "bot_id": data.bot_id}
    
    try:
        bot_data = running_bots[data.bot_id]
        bot_data["running"] = False
        
        client = bot_data["client"]
        await client.disconnect()
        
        del running_bots[data.bot_id]
        
        return {"status": "STOPPED", "bot_id": data.bot_id}
    except Exception as e:
        # Force remove from running bots
        if data.bot_id in running_bots:
            del running_bots[data.bot_id]
        raise HTTPException(500, str(e))

# Get bot status
@app.get("/api/telegram/bot/status/{bot_id}")
async def bot_status(bot_id: str):
    """Get bot status"""
    if bot_id in running_bots:
        return {
            "status": "running",
            "bot_id": bot_id,
            "groups": len(running_bots[bot_id]["config"].group_ids)
        }
    return {"status": "stopped", "bot_id": bot_id}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "sessions_dir": SESSIONS_DIR,
        "running_bots": len(running_bots)
    }

@app.get("/")
async def root():
    return {"message": "Telegram Bot Backend", "version": "2.0"}

@app.post("/api/telegram/groups/fetch")
async def fetch_groups(data: FetchGroups):
    """Fetch all groups and channels the user is member of"""
    try:
        client = TelegramClient(
            StringSession(data.session_string),
            data.api_id,
            data.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(400, "Session expired")
        
        groups = []
        
        # Get all dialogs (chats, groups, channels)
        async for dialog in client.iter_dialogs():
            entity = dialog.entity
            
            # Only include groups and channels (not private chats)
            if isinstance(entity, (Chat, Channel)):
                # Skip if it's a private channel we can't post to
                if isinstance(entity, Channel) and entity.broadcast and not entity.creator:
                    # It's a broadcast channel and we're not the creator - skip
                    continue
                    
                groups.append({
                    "id": entity.id,
                    "title": dialog.title or entity.title or "Unknown",
                    "type": "channel" if isinstance(entity, Channel) else "group",
                    "members_count": getattr(entity, 'participants_count', None),
                    "username": getattr(entity, 'username', None),
                    "is_megagroup": getattr(entity, 'megagroup', False) if isinstance(entity, Channel) else False
                })
        
        await client.disconnect()
        
        return {
            "status": "SUCCESS",
            "groups": groups,
            "total": len(groups)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching groups: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
