# Backend Setup - Nowa wersja

## Endpointy

Nowy prosty backend ma następujące endpointy:

- `POST /send-code` - wysyła kod weryfikacyjny
  - Body: `{ "api_id": 123, "api_hash": "abc", "phone": "+48xxx" }`
  
- `POST /verify-code` - weryfikuje kod
  - Body: `{ "phone": "+48xxx", "code": "12345" }`
  
- `POST /verify-password` - weryfikuje hasło 2FA
  - Body: `{ "phone": "+48xxx", "password": "haslo" }`
  
- `POST /import-session` - importuje plik .session (multipart/form-data)
  - Form: `session_file`, `api_id`, `api_hash`, `phone`

- `GET /health` - sprawdza status

## Wdrożenie na Railway

1. Skopiuj folder `python-backend/` do nowego repo GitHub
2. W Railway: New Project → Deploy from GitHub
3. Ustaw zmienną `PORT=8000` (Railway ustawi automatycznie)
4. Skopiuj publiczny URL i dodaj jako `PYTHON_BACKEND_URL` w v0

## Import plików .session

Jeśli masz pliki sesji typu `session_+48517539241.session`:
1. Utwórz bota w Dashboard z tym samym numerem telefonu
2. Kliknij "Autoryzuj" → "Import pliku .session"
3. Wybierz plik i gotowe!

Sesja zostanie automatycznie zaimportowana i bot będzie działał.
