# Backend - Kompletna Lista Funkcji

## Endpointy Autoryzacji
- `POST /send-code` - wysyła kod weryfikacyjny na telefon
- `POST /verify-code` - weryfikuje kod i zwraca session_string
- `POST /verify-password` - weryfikuje hasło 2FA
- `POST /import-session` - importuje plik .session
- `POST /validate-session` - sprawdza czy sesja jest ważna

## Endpointy Botów
- `POST /api/telegram/bot/start` - uruchamia bota z auto-reply i wysyłaniem do grup
- `POST /api/telegram/bot/stop` - zatrzymuje bota
- `GET /api/telegram/bot/status/{bot_id}` - sprawdza status bota
- `GET /api/telegram/bot/stats/{bot_id}` - pobiera statystyki bota
- `GET /api/telegram/bot/logs/{bot_id}` - pobiera logi bota

## Endpointy Grup
- `POST /api/telegram/groups/fetch` - pobiera wszystkie grupy/kanały użytkownika

## Endpointy Testowe
- `POST /api/telegram/test/send` - wysyła testową wiadomość do grupy
- `GET /health` - sprawdza status backendu

## Statystyki i Logi

Backend automatycznie zapisuje do Supabase:
- **message_logs** - każda wysłana/nieudana wiadomość
- **bot_logs** - zdarzenia bota (start, stop, auto-reply)
- **bot_groups** - aktualizuje licznik wiadomości per grupa

## Zmienne Środowiskowe Railway

Dodaj te zmienne w Railway Dashboard → Variables:

```
SUPABASE_URL=https://iyvnvnynpmazqfeqidrh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Bez tych zmiennych bot nadal działa, ale statystyki nie będą zapisywane do bazy danych.

## Wdrożenie

1. Wdróż pliki na Railway:
   - `python-backend/main.py`
   - `python-backend/requirements.txt`
   - `python-backend/Procfile`

2. Dodaj zmienne środowiskowe Supabase w Railway

3. Railway automatycznie zainstaluje zależności i uruchomi backend

## Funkcje Bota

### Auto-Reply
- Odpowiada automatycznie na prywatne wiadomości (DMs)
- Ignoruje wiadomości z kanałów i własne wiadomości
- Loguje każdą odpowiedź do Supabase

### Wysyłanie do Grup
- Wysyła wiadomości do wybranych grup w pętli
- Losowe opóźnienie między wiadomościami (min_delay - max_delay sekund)
- Loguje każdą wiadomość (sukces/błąd) do Supabase

### Statystyki (w pamięci + Supabase)
- messages_sent - liczba wysłanych wiadomości
- messages_failed - liczba nieudanych wiadomości  
- auto_replies - liczba automatycznych odpowiedzi
- started_at - czas uruchomienia bota
