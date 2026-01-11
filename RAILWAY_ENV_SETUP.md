# Konfiguracja zmiennych środowiskowych w Railway

## Problem
Backend wymaga zmiennych środowiskowych Supabase do działania.

## Rozwiązanie

### 1. Otwórz projekt na Railway
1. Idź na https://railway.app
2. Kliknij na swój projekt Python backend

### 2. Dodaj zmienne środowiskowe
1. Kliknij zakładkę **"Variables"**
2. Dodaj następujące zmienne:

```
SUPABASE_URL=https://iyvnvnynpmazqfeqidrh.supabase.co
SUPABASE_ANON_KEY=skopiuj_z_v0_vars_NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Gdzie znaleźć wartości:**
- Otwórz v0.app
- Kliknij lewą sidebar → **"Vars"**
- Skopiuj wartości:
  - `NEXT_PUBLIC_SUPABASE_URL` → użyj jako `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → użyj jako `SUPABASE_ANON_KEY`

### 3. Redeploy
Po dodaniu zmiennych Railway automatycznie zrestartuje backend.

### 4. Sprawdź czy działa
Otwórz w przeglądarce:
```
https://twoj-backend.up.railway.app/health
```

Powinno zwrócić:
```json
{
  "status": "ok",
  "message": "Python backend is running",
  "supabase_connected": true
}
```

## Troubleshooting

**Backend się nie uruchamia po dodaniu zmiennych:**
1. Sprawdź czy zmienne są zapisane (zakładka Variables)
2. Kliknij "Deploy" → "Restart"
3. Sprawdź logi w zakładce "Deployments" → kliknij najnowszy deploy → "View Logs"

**Backend działa ale supabase_connected: false:**
- Sprawdź czy wartości zmiennych są poprawne
- Upewnij się że `SUPABASE_URL` zaczyna się od `https://`
- Upewnij się że `SUPABASE_ANON_KEY` jest długim stringiem (nie service_role_key!)
