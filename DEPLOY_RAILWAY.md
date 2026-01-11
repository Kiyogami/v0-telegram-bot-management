# Wdrożenie Python Backend na Railway

## Krok 1: Skopiuj pliki

Z folderu `python-backend/` potrzebujesz:
- `main.py`
- `requirements.txt`

## Krok 2: Wdróż na Railway

### Przez Railway CLI (najprostsze):

```bash
# Zainstaluj CLI
npm install -g @railway/cli

# Zaloguj się
railway login

# W folderze python-backend:
cd python-backend
railway init
railway up
```

### Przez GitHub:

1. Stwórz nowe repo na GitHub
2. Dodaj pliki `main.py` i `requirements.txt`
3. W Railway: New Project → Deploy from GitHub

## Krok 3: Skonfiguruj zmienne (OPCJONALNE)

W Railway Dashboard → Variables dodaj:

```
SUPABASE_URL=https://iyvnvnynpmazqfeqidrh.supabase.co
SUPABASE_ANON_KEY=twoj_anon_key_z_supabase
```

**UWAGA:** Backend działa BEZ tych zmiennych! Są opcjonalne.

## Krok 4: Pobierz publiczny URL

1. Railway Dashboard → Settings → Networking
2. Kliknij "Generate Domain"
3. Skopiuj URL (np. `https://telegram-backend-production.up.railway.app`)

## Krok 5: Dodaj URL do v0

W v0 → Vars (w lewym panelu) dodaj:

```
PYTHON_BACKEND_URL=https://twoj-backend.up.railway.app
```

## Weryfikacja

Otwórz w przeglądarce:
```
https://twoj-backend.up.railway.app/health
```

Powinieneś zobaczyć:
```json
{"status": "ok", "supabase": false}
```

## Problemy?

### Backend nie startuje (502):
- Sprawdź logi w Railway Dashboard
- Upewnij się że `requirements.txt` jest w głównym folderze

### Kod nie dochodzi:
- Backend DZIAŁA - kod jest wysyłany przez Telegram
- Sprawdź aplikację Telegram na telefonie (wiadomości od "Telegram")
- Sprawdź SMS-y jeśli nie masz aplikacji

### Invalid API key w logach:
- Usuń zmienne SUPABASE_URL i SUPABASE_KEY z Railway
- Lub dodaj poprawne wartości z Supabase Dashboard
