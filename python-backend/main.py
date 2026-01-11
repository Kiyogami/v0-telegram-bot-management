import os
import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient, errors, events
from telethon.sessions import StringSession
import random
from datetime import datetime
from typing import Optional, Dict

# Supabase jest całkowicie opcjonalny - backend działa bez niego
supabase = None
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if supabase_url and supabase_key:
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(supabase_url, supabase_key)
        print(f"Supabase connected: {supabase_url[:30]}...")
    except Exception as e:
        print(f"Supabase connection failed (optional): {e}")
        supabase = None
else:
    print("Running WITHOUT Supabase (phone_code_hash stored in memory only)")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active bot clients and sessions in memory
active_clients: Dict[str, dict] = {}
bot_tasks: Dict[str, asyncio.Task] = {}

# Models
class SendCodeRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str
    phone_number: str

class VerifyCodeRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str
    phone_number: str
    phone_code: str
    phone_code_hash: str

class VerifyPasswordRequest(BaseModel):
    bot_id: str
    password: str

class FetchGroupsRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str
    session_string: str

class StartBotRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str
    phone_number: str
    session_string: str
    message_template: str
    min_delay: int
    max_delay: int
    group_ids: list[int]
    auto_reply_enabled: bool = True
    auto_reply_message: str = "To jest tylko bot."

class StopBotRequest(BaseModel):
    bot_id: str

class TestMessageRequest(BaseModel):
    api_id: str
    api_hash: str
    phone_number: str
    session_string: str
    group_id: str
    message: str

# Message sending loop
async def send_messages_loop(bot_id: str, client: TelegramClient, config: dict):
    message_template = config['message_template']
    min_delay = config['min_delay']
    max_delay = config['max_delay']
    group_ids = config['group_ids']
    
    logger.info(f"Starting message loop for bot {bot_id}")
    
    while bot_id in bot_tasks:
        for group_id in group_ids:
            if bot_id not in bot_tasks:
                break
            try:
                delay = random.uniform(min_delay, max_delay)
                await asyncio.sleep(delay)
                await client.send_message(group_id, message_template)
                logger.info(f"Message sent to group {group_id}")
            except errors.FloodWaitError as e:
                logger.info(f"FloodWait: {e.seconds}s")
                await asyncio.sleep(e.seconds)
            except Exception as e:
                logger.error(f"Error sending to {group_id}: {e}")
        await asyncio.sleep(5)

# Send verification code - using exact same method as working script
@app.post("/api/telegram/auth/send-code")
async def send_code(request: SendCodeRequest):
    """Send verification code - using exact same method as working script"""
    try:
        logger.info(f"=== SEND CODE ===")
        logger.info(f"Phone: {request.phone_number}, API ID: {request.api_id}")
        
        # Create client exactly like in working script
        client = TelegramClient(
            StringSession(),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        # Sign in with code and phone_code_hash
        result = await client.send_code_request(request.phone_number)
        phone_code_hash = result.phone_code_hash
        
        logger.info(f"Code sent! Hash: {phone_code_hash[:10]}...")
        
        # Store client for verification
        active_clients[request.bot_id] = {
            'client': client,
            'phone': request.phone_number,
            'phone_code_hash': phone_code_hash,
            'api_id': request.api_id,
            'api_hash': request.api_hash
        }
        
        # Try to save to Supabase if available
        if supabase:
            try:
                supabase.table('bots').update({
                    'phone_code_hash': phone_code_hash
                }).eq('id', request.bot_id).execute()
            except Exception as e:
                logger.warning(f"Could not save to Supabase: {e}")
        
        return {
            "success": True,
            "phone_code_hash": phone_code_hash,
            "code_type": "SentCodeTypeApp",
            "message": "Kod wysłany! Sprawdź aplikację Telegram lub SMS."
        }
        
    except errors.ApiIdInvalidError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy API ID")
    except errors.PhoneNumberInvalidError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy numer telefonu")
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/telegram/auth/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """Verify the code"""
    try:
        logger.info(f"=== VERIFY CODE ===")
        
        if request.bot_id not in active_clients:
            raise HTTPException(status_code=400, detail="Brak aktywnej sesji. Wyślij kod ponownie.")
        
        client_data = active_clients[request.bot_id]
        client = client_data['client']
        phone_code_hash = client_data['phone_code_hash']
        
        try:
            # Sign in with code and phone_code_hash
            await client.sign_in(
                phone=request.phone_number,
                code=request.phone_code,
                phone_code_hash=phone_code_hash
            )
            
            session_string = StringSession.save(client.session)
            logger.info(f"Logged in! Session length: {len(session_string)}")
            
            await client.disconnect()
            del active_clients[request.bot_id]
            
            return {
                "success": True,
                "session_string": session_string,
                "requires_password": False
            }
            
        except errors.SessionPasswordNeededError:
            return {
                "success": False,
                "requires_password": True,
                "message": "Wymagane hasło 2FA"
            }
        except errors.PhoneCodeInvalidError:
            raise HTTPException(status_code=400, detail="Nieprawidłowy kod")
        except errors.PhoneCodeExpiredError:
            await client.disconnect()
            del active_clients[request.bot_id]
            raise HTTPException(status_code=400, detail="Kod wygasł")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/auth/verify-password")
async def verify_password(request: VerifyPasswordRequest):
    """Verify 2FA password"""
    try:
        if request.bot_id not in active_clients:
            raise HTTPException(status_code=400, detail="Brak sesji")
        
        client = active_clients[request.bot_id]['client']
        await client.sign_in(password=request.password)
        session_string = StringSession.save(client.session)
        
        await client.disconnect()
        del active_clients[request.bot_id]
        
        return {"success": True, "session_string": session_string}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/groups/fetch")
async def fetch_groups(request: FetchGroupsRequest):
    """Fetch groups"""
    try:
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Sesja wygasła")
        
        groups = []
        async for dialog in client.iter_dialogs():
            if dialog.is_group or dialog.is_channel:
                groups.append({
                    "group_id": str(dialog.id),
                    "group_name": dialog.name or "Unnamed",
                    "is_channel": dialog.is_channel,
                    "is_group": dialog.is_group
                })
        
        await client.disconnect()
        return {"success": True, "groups": groups}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/bot/start")
async def start_bot(request: StartBotRequest):
    """Start bot"""
    try:
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Sesja wygasła")
        
        if request.auto_reply_enabled:
            @client.on(events.NewMessage)
            async def handler(event):
                if event.out or not event.is_private:
                    return
                await event.reply(request.auto_reply_message)
        
        config = {
            'message_template': request.message_template,
            'min_delay': request.min_delay,
            'max_delay': request.max_delay,
            'group_ids': request.group_ids
        }
        
        task = asyncio.create_task(send_messages_loop(request.bot_id, client, config))
        bot_tasks[request.bot_id] = task
        active_clients[request.bot_id] = {'client': client, 'task': task}
        
        return {"success": True, "message": "Bot started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/bot/stop")
async def stop_bot(request: StopBotRequest):
    """Stop bot"""
    try:
        if request.bot_id in bot_tasks:
            bot_tasks[request.bot_id].cancel()
            del bot_tasks[request.bot_id]
        
        if request.bot_id in active_clients:
            await active_clients[request.bot_id]['client'].disconnect()
            del active_clients[request.bot_id]
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/test/send")
async def test_send(request: TestMessageRequest):
    """Send test message"""
    try:
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Sesja wygasła")
        
        group_id = int(request.group_id) if request.group_id.lstrip('-').isdigit() else request.group_id
        await client.send_message(group_id, request.message)
        await client.disconnect()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/telegram/bot/status/{bot_id}")
async def bot_status(bot_id: str):
    return {"bot_id": bot_id, "is_running": bot_id in bot_tasks}

@app.get("/health")
async def health():
    return {"status": "ok", "supabase": supabase is not None}

@app.get("/")
async def root():
    return {"message": "Telegram Bot Backend", "status": "running"}
