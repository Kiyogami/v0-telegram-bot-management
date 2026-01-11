import os
import asyncio
import logging
import base64
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient, errors, events
from telethon.sessions import StringSession
import random
from typing import Optional, Dict

# QR code generation
try:
    import qrcode
    HAS_QR = True
except ImportError:
    HAS_QR = False
    print("WARNING: qrcode not installed, QR login disabled")

# Supabase jest opcjonalny
supabase = None
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if supabase_url and supabase_key:
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(supabase_url, supabase_key)
        print(f"Supabase connected")
    except Exception as e:
        print(f"Supabase failed (optional): {e}")
        supabase = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage
active_clients: Dict[str, dict] = {}
bot_tasks: Dict[str, asyncio.Task] = {}
qr_sessions: Dict[str, dict] = {}

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

class QRLoginRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str

class QRCheckRequest(BaseModel):
    bot_id: str

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
    auto_reply_message: str = "To jest automatyczna odpowiedź."

class StopBotRequest(BaseModel):
    bot_id: str

class TestMessageRequest(BaseModel):
    api_id: str
    api_hash: str
    phone_number: str
    session_string: str
    group_id: str
    message: str

# ============ QR LOGIN ============
def generate_qr_base64(data: str) -> str:
    """Generate QR code as base64 string"""
    if not HAS_QR:
        raise Exception("qrcode library not installed")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

@app.post("/api/telegram/auth/qr-login")
async def qr_login(request: QRLoginRequest):
    """Generate QR code for Telegram login"""
    try:
        logger.info(f"=== QR LOGIN ===")
        logger.info(f"Bot: {request.bot_id}, API ID: {request.api_id}")
        
        if not HAS_QR:
            raise HTTPException(status_code=500, detail="QR code library not installed on server")
        
        # Create new client
        client = TelegramClient(
            StringSession(),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        # Generate QR login token
        qr_login_result = await client.qr_login()
        
        # Generate QR code image
        qr_url = qr_login_result.url
        qr_base64 = generate_qr_base64(qr_url)
        
        # Store client for checking
        qr_sessions[request.bot_id] = {
            'client': client,
            'qr_login': qr_login_result,
            'api_id': request.api_id,
            'api_hash': request.api_hash
        }
        
        logger.info(f"QR code generated for bot {request.bot_id}")
        
        return {
            "success": True,
            "qr_code": qr_base64,
            "expires_in": 60
        }
        
    except errors.ApiIdInvalidError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy API ID")
    except Exception as e:
        logger.error(f"QR login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/telegram/auth/qr-check")
async def qr_check(request: QRCheckRequest):
    """Check if QR code was scanned and user authorized"""
    try:
        logger.info(f"=== QR CHECK ===")
        logger.info(f"Bot: {request.bot_id}")
        
        if request.bot_id not in qr_sessions:
            raise HTTPException(status_code=400, detail="Brak aktywnej sesji QR. Wygeneruj nowy kod.")
        
        session_data = qr_sessions[request.bot_id]
        client = session_data['client']
        qr_login = session_data['qr_login']
        
        try:
            # Wait for scan (with short timeout)
            await asyncio.wait_for(qr_login.wait(timeout=2), timeout=3)
            
            # If we get here, user scanned and authorized!
            session_string = StringSession.save(client.session)
            
            # Cleanup
            del qr_sessions[request.bot_id]
            
            logger.info(f"QR login successful for bot {request.bot_id}")
            
            return {
                "authorized": True,
                "session_string": session_string
            }
            
        except asyncio.TimeoutError:
            # Not scanned yet
            return {
                "authorized": False,
                "message": "Oczekiwanie na skanowanie..."
            }
        except errors.SessionPasswordNeededError:
            return {
                "authorized": False,
                "requires_password": True,
                "message": "Wymagane hasło 2FA"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"QR check error: {e}")
        # Clean up on error
        if request.bot_id in qr_sessions:
            try:
                await qr_sessions[request.bot_id]['client'].disconnect()
            except:
                pass
            del qr_sessions[request.bot_id]
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/auth/qr-refresh")
async def qr_refresh(request: QRCheckRequest):
    """Refresh QR code if expired"""
    try:
        if request.bot_id not in qr_sessions:
            raise HTTPException(status_code=400, detail="Brak sesji")
        
        session_data = qr_sessions[request.bot_id]
        qr_login = session_data['qr_login']
        
        # Recreate QR code
        await qr_login.recreate()
        qr_base64 = generate_qr_base64(qr_login.url)
        
        return {
            "success": True,
            "qr_code": qr_base64,
            "expires_in": 60
        }
        
    except Exception as e:
        logger.error(f"QR refresh error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============ STANDARD CODE LOGIN ============
@app.post("/api/telegram/auth/send-code")
async def send_code(request: SendCodeRequest):
    """Send verification code"""
    try:
        logger.info(f"=== SEND CODE ===")
        logger.info(f"Phone: {request.phone_number}")
        
        client = TelegramClient(
            StringSession(),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        result = await client.send_code_request(request.phone_number)
        phone_code_hash = result.phone_code_hash
        
        logger.info(f"Code sent! Hash: {phone_code_hash[:10]}...")
        
        active_clients[request.bot_id] = {
            'client': client,
            'phone': request.phone_number,
            'phone_code_hash': phone_code_hash,
            'api_id': request.api_id,
            'api_hash': request.api_hash
        }
        
        if supabase:
            try:
                supabase.table('bots').update({
                    'phone_code_hash': phone_code_hash
                }).eq('id', request.bot_id).execute()
            except:
                pass
        
        return {
            "success": True,
            "phone_code_hash": phone_code_hash,
            "code_type": "SentCodeTypeApp",
            "message": "Kod wysłany! Sprawdź aplikację Telegram."
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
            raise HTTPException(status_code=400, detail="Brak sesji. Wyślij kod ponownie.")
        
        client_data = active_clients[request.bot_id]
        client = client_data['client']
        phone_code_hash = client_data['phone_code_hash']
        
        try:
            await client.sign_in(
                phone=request.phone_number,
                code=request.phone_code,
                phone_code_hash=phone_code_hash
            )
            
            session_string = StringSession.save(client.session)
            logger.info(f"Logged in!")
            
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

# ============ BOT OPERATIONS ============
async def send_messages_loop(bot_id: str, client: TelegramClient, config: dict):
    message_template = config['message_template']
    min_delay = config['min_delay']
    max_delay = config['max_delay']
    group_ids = config['group_ids']
    
    while bot_id in bot_tasks:
        for group_id in group_ids:
            if bot_id not in bot_tasks:
                break
            try:
                delay = random.uniform(min_delay, max_delay)
                await asyncio.sleep(delay)
                await client.send_message(group_id, message_template)
                logger.info(f"Message sent to {group_id}")
            except errors.FloodWaitError as e:
                await asyncio.sleep(e.seconds)
            except Exception as e:
                logger.error(f"Error: {e}")
        await asyncio.sleep(5)

@app.post("/api/telegram/groups/fetch")
async def fetch_groups(request: FetchGroupsRequest):
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
    try:
        if request.bot_id in bot_tasks:
            bot_tasks[request.bot_id].cancel()
            del bot_tasks[request.bot_id]
        
        if request.bot_id in active_clients:
            try:
                await active_clients[request.bot_id]['client'].disconnect()
            except:
                pass
            del active_clients[request.bot_id]
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/test/send")
async def test_send(request: TestMessageRequest):
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
    return {"status": "ok", "qr_enabled": HAS_QR, "supabase": supabase is not None}

@app.get("/")
async def root():
    return {"message": "Telegram Bot Backend", "status": "running", "qr_enabled": HAS_QR}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
