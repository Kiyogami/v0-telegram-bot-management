# Wdrożenie Backendu - Instrukcja

## Co zostało zmienione:

### 1. Python Backend (`python-backend/main.py`)
Dodano brakujące endpointy:
- `POST /api/telegram/bot/start` - startuje bota z wysyłaniem wiadomości
- `POST /api/telegram/bot/stop` - zatrzymuje bota
- `GET /api/telegram/bot/status/{bot_id}` - status bota

### 2. Next.js API Routes
Naprawiono podwójny slash w URL (usunięto trailing slash z `PYTHON_BACKEND_URL`)

## Jak wdrożyć na Railway:

### Krok 1: Zaktualizuj pliki na Railway

**Opcja A: Przez GitHub (jeśli masz połączone repo)**
```bash
cd python-backend
git add .
git commit -m "Add bot start/stop endpoints"
git push
```
Railway automatycznie wdroży zmiany.

**Opcja B: Przez Railway CLI**
```bash
cd python-backend
railway up
```

### Krok 2: Sprawdź czy backend działa
Otwórz w przeglądarce:
```
https://y4y4y4y000-production.up.railway.app/health
```

Powinieneś zobaczyć:
```json
{
  "status": "ok",
  "sessions_dir": "sessions",
  "running_bots": 0
}
```

### Krok 3: Sprawdź zmienną środowiskową w v0
Upewnij się że `PYTHON_BACKEND_URL` NIE ma slasha na końcu:
- Dobrze: `https://y4y4y4y000-production.up.railway.app`
- Źle: `https://y4y4y4y000-production.up.railway.app/`

## Nowe endpointy backendu:

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/send-code` | POST | Wysyła kod weryfikacyjny |
| `/verify-code` | POST | Weryfikuje kod |
| `/verify-password` | POST | Weryfikuje hasło 2FA |
| `/import-session` | POST | Importuje plik .session |
| `/validate-session` | POST | Waliduje string session |
| `/api/telegram/bot/start` | POST | Startuje bota |
| `/api/telegram/bot/stop` | POST | Zatrzymuje bota |
| `/api/telegram/bot/status/{id}` | GET | Status bota |
| `/health` | GET | Health check |

## Testowanie:

1. Autoryzuj bota przez Dashboard (wyślij kod -> wprowadź kod)
2. Kliknij "Start" na bocie
3. Bot powinien wystartować i wysyłać wiadomości do grup

## Rozwiązywanie problemów:

**404 Not Found** - Railway ma starą wersję kodu. Wdróż ponownie.

**Session expired** - Sesja Telegram wygasła. Autoryzuj ponownie.

**Podwójny slash w URL** - Usuń trailing slash z PYTHON_BACKEND_URL.
