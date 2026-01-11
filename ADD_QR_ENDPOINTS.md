# Jak dodać endpointy QR do Python Backend

Plik `python-backend/main.py` jest obecnie **zablokowany**. Aby dodać QR login:

## Krok 1: Odblokuj plik

1. W v0, kliknij prawym przyciskiem na `python-backend/main.py` w drzewie plików
2. Wybierz **"Unlock"**

## Krok 2: Dodaj endpointy QR

Po odblokowaniu, dodaj te endpointy na końcu pliku `main.py` (przed `if __name__ == "__main__"`):

```python
# ============ QR LOGIN ENDPOINTS ============

from qr_auth import generate_qr_login, check_qr_login

class QRLoginRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str

class QRCheckRequest(BaseModel):
    bot_id: str
    api_id: str
    api_hash: str
    client_session: str

@app.post("/api/telegram/auth/qr-login")
async def qr_login_endpoint(request: QRLoginRequest):
    """Generate QR code for Telegram login"""
    try:
        logger.info(f"=== QR LOGIN REQUEST ===")
        logger.info(f"Bot ID: {request.bot_id}, API ID: {request.api_id}")
        
        result = await generate_qr_login(
            int(request.api_id),
            request.api_hash
        )
        
        # Store client session for checking
        active_clients[request.bot_id] = {
            'client_session': result['client_session'],
            'api_id': request.api_id,
            'api_hash': request.api_hash,
            'login_token': result['login_token']
        }
        
        logger.info(f"QR code generated successfully")
        return result
        
    except Exception as e:
        logger.error(f"QR login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/telegram/auth/qr-check")
async def qr_check_endpoint(request: QRCheckRequest):
    """Check if QR code was scanned"""
    try:
        result = await check_qr_login(
            int(request.api_id),
            request.api_hash,
            request.client_session
        )
        
        # Clean up if authorized
        if result.get('authorized') and request.bot_id in active_clients:
            del active_clients[request.bot_id]
        
        return result
        
    except Exception as e:
        logger.error(f"QR check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

## Krok 3: Zweryfikuj dependencies

Upewnij się że `requirements.txt` zawiera:

```txt
qrcode
pillow
```

## Krok 4: Wdróż na Railway

1. Skopiuj zaktualizowany `main.py` i `qr_auth.py` do Railway
2. Railway automatycznie zainstaluje nowe zależności
3. Po wdrożeniu, QR login będzie działał!

## Testowanie

Po wdrożeniu, otwórz dialog autoryzacji i kliknij **"Kod QR (Zalecane)"**. Powinieneś zobaczyć:
- ✅ QR kod do zeskanowania
- ✅ Timer odliczający ważność kodu
- ✅ Automatyczne sprawdzanie co 2s czy kod został zeskanowany
- ✅ Przekierowanie po udanym logowaniu

## Rozwiązywanie problemów

**404 Not Found na /api/telegram/auth/qr-login:**
- Railway nie ma zaktualizowanego kodu
- Upewnij się że wdrożyłeś nowe pliki

**"Invalid API key" lub "Supabase error":**
- Ustaw zmienne środowiskowe w Railway zgodnie z `RAILWAY_ENV_SETUP.md`

**QR kod nie generuje się:**
- Sprawdź logi Railway czy `qr_auth.py` został poprawnie zaimportowany
- Upewnij się że `qrcode` i `pillow` są w requirements.txt
```

```txt file="" isHidden
