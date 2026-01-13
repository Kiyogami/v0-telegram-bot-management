import os
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient, errors
from telethon.sessions import StringSession
import shutil

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

clients = {}

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
        
        # Get session string for storage
        session_string = StringSession.save(client.session)
        
        # Keep client connected but remove from pending
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
        # Save uploaded session file
        session_path = f"{SESSIONS_DIR}/session_{phone}.session"
        
        with open(session_path, "wb") as f:
            content = await session_file.read()
            f.write(content)
        
        # Verify session works
        client = TelegramClient(
            f"{SESSIONS_DIR}/session_{phone}",
            api_id,
            api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            os.remove(session_path)
            raise HTTPException(400, "Sesja wygasła lub jest nieprawidłowa")
        
        # Get string session for database storage
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

@app.get("/health")
async def health():
    return {"status": "ok", "sessions_dir": SESSIONS_DIR}

@app.get("/")
async def root():
    return {"message": "Telegram Bot Backend", "version": "2.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
