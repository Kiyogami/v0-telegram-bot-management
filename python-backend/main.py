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
import json

app = FastAPI()

# CORS configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active bot clients
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
    phone_code: str

class VerifyPasswordRequest(BaseModel):
    bot_id: str
    password: str

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

class StopBotRequest(BaseModel):
    bot_id: str

# Helper functions
async def send_messages_loop(bot_id: str, client: TelegramClient, config: dict):
    """Main loop for sending messages to groups"""
    message_template = config['message_template']
    min_delay = config['min_delay']
    max_delay = config['max_delay']
    group_ids = config['group_ids']
    
    print(f"[v0] Starting message loop for bot {bot_id}")
    
    while bot_id in bot_tasks:
        for group_id in group_ids:
            if bot_id not in bot_tasks:
                break
                
            attempts = 0
            while attempts < 5:
                try:
                    delay = random.uniform(min_delay, max_delay)
                    await asyncio.sleep(delay)
                    
                    await client.send_message(group_id, message_template)
                    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    print(f"[v0] [{current_time}] Message sent to group {group_id} from bot {bot_id}")
                    break
                    
                except errors.FloodWaitError as e:
                    print(f"[v0] FloodWaitError: waiting {e.seconds} seconds")
                    await asyncio.sleep(e.seconds)
                except errors.ServerError as e:
                    print(f"[v0] Server error: {e}, retrying...")
                    attempts += 1
                    await asyncio.sleep(2 ** attempts)
                except Exception as e:
                    print(f"[v0] Error sending to group {group_id}: {e}")
                    break
        
        # Small pause between full cycles
        await asyncio.sleep(5)

# API Endpoints
@app.post("/api/telegram/auth/send-code")
async def send_code(request: SendCodeRequest):
    """Send verification code to phone number"""
    try:
        print(f"[v0] Sending code to {request.phone_number} for bot {request.bot_id}")
        
        # Create client with empty StringSession
        client = TelegramClient(
            StringSession(),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        # Send code
        result = await client.send_code_request(request.phone_number)
        
        # Store client temporarily for verification
        active_clients[request.bot_id] = {
            'client': client,
            'phone': request.phone_number,
            'phone_code_hash': result.phone_code_hash,
            'api_id': request.api_id,
            'api_hash': request.api_hash
        }
        
        print(f"[v0] Code sent successfully to {request.phone_number}")
        
        return {
            "success": True,
            "phone_code_hash": result.phone_code_hash,
            "message": "Code sent successfully"
        }
        
    except Exception as e:
        print(f"[v0] Error sending code: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/auth/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """Verify the code sent to phone"""
    try:
        print(f"[v0] Verifying code for bot {request.bot_id}")
        
        if request.bot_id not in active_clients:
            raise HTTPException(status_code=400, detail="No active session found")
        
        client_data = active_clients[request.bot_id]
        client = client_data['client']
        
        # Sign in with code
        try:
            await client.sign_in(
                phone=client_data['phone'],
                code=request.phone_code,
                phone_code_hash=client_data['phone_code_hash']
            )
            
            # Get session string
            session_string = client.session.save()
            
            print(f"[v0] Code verified successfully for bot {request.bot_id}")
            
            # Disconnect temporary client
            await client.disconnect()
            del active_clients[request.bot_id]
            
            return {
                "success": True,
                "session_string": session_string,
                "requires_password": False
            }
            
        except errors.SessionPasswordNeededError:
            print(f"[v0] 2FA password required for bot {request.bot_id}")
            return {
                "success": False,
                "requires_password": True,
                "message": "2FA password required"
            }
            
    except Exception as e:
        print(f"[v0] Error verifying code: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/auth/verify-password")
async def verify_password(request: VerifyPasswordRequest):
    """Verify 2FA password"""
    try:
        print(f"[v0] Verifying 2FA password for bot {request.bot_id}")
        
        if request.bot_id not in active_clients:
            raise HTTPException(status_code=400, detail="No active session found")
        
        client_data = active_clients[request.bot_id]
        client = client_data['client']
        
        # Sign in with password
        await client.sign_in(password=request.password)
        
        # Get session string
        session_string = client.session.save()
        
        print(f"[v0] 2FA verified successfully for bot {request.bot_id}")
        
        # Disconnect temporary client
        await client.disconnect()
        del active_clients[request.bot_id]
        
        return {
            "success": True,
            "session_string": session_string
        }
        
    except Exception as e:
        print(f"[v0] Error verifying password: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/bot/start")
async def start_bot(request: StartBotRequest):
    """Start a bot with saved session"""
    try:
        print(f"[v0] Starting bot {request.bot_id}")
        
        # Create client with saved session
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired, please re-authenticate")
        
        # Setup auto-reply for private messages
        @client.on(events.NewMessage)
        async def auto_reply_handler(event):
            if event.out or not event.is_private:
                return
            reply_message = "To jest tylko bot. Pisz do @praskizbawiciel"
            await event.reply(reply_message)
            print(f"[v0] Auto-reply sent to user {event.sender_id}")
        
        # Store bot configuration
        config = {
            'message_template': request.message_template,
            'min_delay': request.min_delay,
            'max_delay': request.max_delay,
            'group_ids': request.group_ids
        }
        
        # Start message sending loop
        task = asyncio.create_task(send_messages_loop(request.bot_id, client, config))
        bot_tasks[request.bot_id] = task
        
        active_clients[request.bot_id] = {
            'client': client,
            'task': task,
            'config': config
        }
        
        print(f"[v0] Bot {request.bot_id} started successfully")
        
        return {
            "success": True,
            "message": "Bot started successfully"
        }
        
    except Exception as e:
        print(f"[v0] Error starting bot: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/telegram/bot/stop")
async def stop_bot(request: StopBotRequest):
    """Stop a running bot"""
    try:
        print(f"[v0] Stopping bot {request.bot_id}")
        
        if request.bot_id not in bot_tasks:
            return {"success": True, "message": "Bot already stopped"}
        
        # Cancel task
        task = bot_tasks[request.bot_id]
        task.cancel()
        del bot_tasks[request.bot_id]
        
        # Disconnect client
        if request.bot_id in active_clients:
            client_data = active_clients[request.bot_id]
            await client_data['client'].disconnect()
            del active_clients[request.bot_id]
        
        print(f"[v0] Bot {request.bot_id} stopped successfully")
        
        return {
            "success": True,
            "message": "Bot stopped successfully"
        }
        
    except Exception as e:
        print(f"[v0] Error stopping bot: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/telegram/bot/status/{bot_id}")
async def get_bot_status(bot_id: str):
    """Get bot status"""
    is_running = bot_id in bot_tasks
    return {
        "bot_id": bot_id,
        "is_running": is_running
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
