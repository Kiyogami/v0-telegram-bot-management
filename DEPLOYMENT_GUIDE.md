# 🚀 Telegram Bot Manager - Instrukcja Wdrożenia 24/7

## 📋 Wymagania

1. **Konto Vercel** - do hostingu Next.js frontend
2. **Konto Railway** - do hostingu Python backend
3. **Konto Supabase** - baza danych PostgreSQL
4. **Telegram API credentials** - api_id i api_hash z https://my.telegram.org

## 🔧 Krok 1: Wdrożenie Python Backend na Railway

### 1.1 Przygotowanie Repozytorium
```bash
# Skopiuj folder python-backend do osobnego repo GitHub
cd python-backend
git init
git add .
git commit -m "Initial Python backend for Telegram bots"
git branch -M main
git remote add origin https://github.com/TWOJ_USERNAME/telegram-bot-backend.git
git push -u origin main
```

### 1.2 Wdrożenie na Railway
1. Idź na [railway.app](https://railway.app)
2. Kliknij **"New Project"**
3. Wybierz **"Deploy from GitHub repo"**
4. Wybierz swoje repo `telegram-bot-backend`
5. Railway automatycznie wykryje `Dockerfile` i zbuduje aplikację
6. Po wdrożeniu:
   - Kliknij na serwis → **"Settings"** → **"Networking"**
   - Kliknij **"Generate Domain"**
   - Skopiuj URL (np. `https://telegram-bot-backend-production-xxxx.up.railway.app`)

### 1.3 Weryfikacja
Otwórz w przeglądarce:
```
https://TWOJ-BACKEND-URL/
```
Powinieneś zobaczyć: `{"status": "ok", "message": "Telegram Bot Manager API"}`

## 🗄️ Krok 2: Konfiguracja Supabase

### 2.1 Utworzenie Projektu
1. Idź na [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Zapisz **Database Password**

### 2.2 Uruchomienie Skryptów SQL
1. W Supabase Dashboard przejdź do **SQL Editor**
2. Uruchom po kolei skrypty z folderu `scripts/`:
   - `001_create_bots_tables.sql` - podstawowe tabele
   - `002_add_auth_fields.sql` - pola autoryzacji
   - `003_add_auth_session_fields.sql` - sesje
   - `004_add_group_enabled_field.sql` - grupy aktywne
   - `005_add_auto_reply_field.sql` - auto-odpowiedzi
   - `008_final_schema_fix.sql` - finalne poprawki

### 2.3 Weryfikacja Row Level Security (RLS)
Upewnij się że RLS jest włączony dla wszystkich tabel:
```sql
-- Sprawdź czy RLS jest aktywny
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🌐 Krok 3: Wdrożenie Frontend na Vercel

### 3.1 Połączenie z v0
1. W v0, kliknij **"Publish"** w prawym górnym rogu
2. Wybierz **"Deploy to Vercel"**
3. Autoryzuj Vercel
4. Wybierz nazwę projektu

### 3.2 Konfiguracja Zmiennych Środowiskowych w Vercel
W Vercel Dashboard → Settings → Environment Variables dodaj:

```env
# Supabase (skopiuj z Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Python Backend
PYTHON_BACKEND_URL=https://telegram-bot-backend-production-xxxx.up.railway.app

# Dev redirect (dla lokalnego testowania)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

### 3.3 Wdrożenie
1. Kliknij **"Deploy"**
2. Poczekaj na zakończenie budowania (~2-3 min)
3. Twoja aplikacja będzie dostępna pod `https://TWOJ-PROJEKT.vercel.app`

## ✅ Krok 4: Weryfikacja Działania

### 4.1 Testowanie Aplikacji
1. Otwórz `https://TWOJ-PROJEKT.vercel.app`
2. Zarejestruj nowe konto
3. Zaloguj się
4. Sprawdź status backendu - powinien być zielony

### 4.2 Dodanie Pierwszego Bota
1. Kliknij **"+ Dodaj Bota"**
2. Wypełnij formularz:
   - Nazwa bota (np. "Marketing Bot")
   - API ID (z https://my.telegram.org)
   - API Hash (z https://my.telegram.org)
   - Numer telefonu (format: +48123456789)
   - Szablon wiadomości
   - Opóźnienia (min: 30, max: 60)
3. Kliknij **"Zapisz"**

### 4.3 Autoryzacja Telegram
1. Kliknij ikonę klucza przy bocie
2. Kliknij **"Wyślij kod"**
3. Sprawdź Telegram - otrzymasz kod weryfikacyjny
4. Wpisz kod i kliknij **"Weryfikuj"**
5. Jeśli masz 2FA, wpisz hasło
6. Status bota zmieni się na **"Autoryzowany"**

### 4.4 Dodanie Grup
1. Kliknij ikonę użytkowników przy bocie
2. Kliknij **"Auto-Detect Groups from Telegram"**
3. System pobierze wszystkie grupy
4. Zaznacz grupy na które bot ma wysyłać
5. Kliknij **"Zapisz wybrane grupy"**

### 4.5 Uruchomienie Bota
1. Kliknij **"Uruchom"** przy bocie
2. Bot zacznie wysyłać wiadomości zgodnie z harmonogramem
3. Sprawdź logi w konsoli Railway aby zobaczyć aktywność

## 🔄 Krok 5: Monitoring i Utrzymanie

### 5.1 Sprawdzanie Logów Railway
```bash
# W terminalu (opcjonalnie)
railway logs --follow
```
Lub w Railway Dashboard → Deployments → View Logs

### 5.2 Monitorowanie Statystyk w Aplikacji
- Dashboard pokazuje statystyki wszystkich botów
- Kliknij na bota aby zobaczyć szczegółowe logi
- Statystyki odświeżają się automatycznie co 10 sekund

### 5.3 Zatrzymanie/Restart Bota
- **Zatrzymanie**: Kliknij "Zatrzymaj" w aplikacji
- **Restart**: Zatrzymaj i uruchom ponownie
- Boty automatycznie restartują się po awarii Railway

## 🛠️ Rozwiązywanie Problemów

### Python Backend nie działa
```bash
# Sprawdź logi Railway
railway logs

# Sprawdź czy port jest prawidłowy
# Railway automatycznie ustawia zmienną PORT
```

### Bot nie wysyła wiadomości
1. Sprawdź czy bot jest autoryzowany (zielona ikona)
2. Sprawdź czy grupy są włączone
3. Sprawdź harmonogram - czy bot jest aktywny w danej godzinie
4. Sprawdź logi Python backendu

### Problem z autoryzacją Telegram
1. Upewnij się że numer telefonu jest w formacie międzynarodowym (+48...)
2. Sprawdź czy API ID i API Hash są poprawne
3. Usuń bota i dodaj ponownie z poprawnymi danymi

### Backend zwraca 404/500
1. Sprawdź czy `PYTHON_BACKEND_URL` jest ustawiony w Vercel
2. Sprawdź czy Railway backend jest uruchomiony
3. Odwiedź `https://TWOJ-BACKEND/` w przeglądarce - powinno działać

## 📊 Zaawansowana Konfiguracja

### Harmonogram Wysyłania
1. Kliknij ikonę zegara przy bocie
2. Ustaw godziny aktywności (np. 8:00 - 22:00)
3. Wybierz dni tygodnia
4. Ustaw dzienny limit wiadomości

### Wiele Wiadomości (Losowy Wybór)
1. Kliknij ikonę listy przy bocie
2. Dodaj wiele szablonów wiadomości
3. Bot będzie losowo wybierał wiadomość przy każdym wysłaniu

### Auto-odpowiedzi
1. W ustawieniach bota włącz "Auto-odpowiedź"
2. Wpisz wiadomość która będzie wysyłana na prywatne wiadomości
3. Bot automatycznie odpowie każdemu kto napisze prywatnie

## 🎉 Gotowe!

Twój system do zarządzania botami Telegram działa 24/7!

**Wsparcie**: Jeśli masz problemy, sprawdź logi w Railway i Vercel Dashboard.
