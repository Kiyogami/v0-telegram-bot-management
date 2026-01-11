# Wdrożenie Python Backend na Railway

## Problem: Railway ma starą wersję kodu

Jeśli widzisz błąd `404 Not Found` dla endpointów `/api/telegram/auth/qr-login` lub `/api/telegram/auth/send-code`, oznacza to że Railway używa starej wersji kodu Python.

## Rozwiązanie: Wdróż nowy kod

### Metoda 1: Przez GitHub (zalecane)

1. **Skopiuj zaktualizowany plik**
   - Pobierz `python-backend/main.py` z tego projektu v0
   
2. **Commit i push do GitHub**
   ```bash
   git add python-backend/main.py
   git commit -m "Update Python backend with QR login"
   git push origin main
   ```

3. **Railway automatycznie wdroży**
   - Railway wykryje zmiany i automatycznie zbuduje nową wersję
   - Poczekaj 2-3 minuty na deployment
   - Sprawdź logi w Railway Dashboard

### Metoda 2: Bezpośrednio w Railway

1. **Otwórz Railway Dashboard**
   - Przejdź do swojego projektu Python backend
   
2. **Edytuj plik main.py**
   - Kliknij na service → Files
   - Znajdź `main.py`
   - Skopiuj całą zawartość z v0 projektu
   - Wklej do Railway
   - Zapisz

3. **Redeploy**
   - Railway automatycznie zrestartuje service
   - Sprawdź logi czy wszystko działa

## Weryfikacja wdrożenia

### Sprawdź dostępne endpointy

Otwórz w przeglądarce:
```
https://twoj-backend-url.railway.app/api/debug/routes
```

Powinieneś zobaczyć listę wszystkich endpointów, w tym:
- `/api/telegram/auth/send-code`
- `/api/telegram/auth/qr-login`
- `/api/telegram/auth/qr-check`
- `/api/telegram/auth/verify-code`

### Sprawdź health check

```
https://twoj-backend-url.railway.app/health
```

Powinno zwrócić:
```json
{"status": "ok", "message": "Python backend is running"}
```

## Zmienne środowiskowe Railway

Upewnij się że masz ustawione:

```
PORT=8000
PYTHON_VERSION=3.11
```

Railway automatycznie ustawi `PORT`, ale możesz to sprawdzić w Settings → Variables.

## Rozwiązywanie problemów

### Błąd: "Module not found"

Railway nie zainstalował zależności. Sprawdź czy masz `requirements.txt`:

```txt
fastapi==0.104.1
uvicorn==0.24.0
telethon==1.33.0
pydantic==2.5.0
```

### Błąd: "Application failed to start"

Sprawdź logi w Railway Dashboard:
- Kliknij na service
- Przejdź do zakładki "Deployments"
- Kliknij najnowszy deployment
- Zobacz "Build Logs" i "Deploy Logs"

### Backend działa ale endpointy zwracają 404

Railway używa starej wersji kodu. Wykonaj ponownie kroki wdrożenia.

## Co dalej?

Po pomyślnym wdrożeniu:

1. **Odśwież stronę Next.js** w przeglądarce
2. **Spróbuj ponownie autoryzacji**:
   - Kliknij "Logowanie przez QR Code" (zalecane)
   - LUB użyj tradycyjnego kodu SMS/App
3. **Sprawdź logi Railway** jeśli coś nie działa

## Dodatkowa pomoc

Jeśli nadal masz problemy:
1. Sprawdź logi Railway (Deploy Logs)
2. Sprawdź Network tab w przeglądarce (F12)
3. Sprawdź czy URL backendu jest poprawny w zmiennej `PYTHON_BACKEND_URL`
