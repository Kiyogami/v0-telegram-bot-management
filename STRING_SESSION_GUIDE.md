# String Session Authorization Guide

## Czym jest String Session?

String Session to profesjonalna metoda autoryzacji używana przez managery botów i farmy kont. Zamiast logować się za każdym razem kodem SMS, generujesz sesję jednorazowo i bot działa 24/7 bez przerwy.

## Zalety String Session

✅ **Brak kodów SMS** - żadnego wysyłania i wpisywania kodów  
✅ **Działa 24/7** - sesja nie wygasa (chyba że wylogujesz się ręcznie)  
✅ **Profesjonalne** - używane w systemach produkcyjnych  
✅ **Szybkie** - autoryzacja w 10 sekund zamiast minuty  
✅ **Niezawodne** - nie zależy od dostępu do numeru telefonu

## Jak wygenerować String Session?

### Metoda 1: Lokalny skrypt Python (zalecane)

1. **Zainstaluj Telethon:**
   ```bash
   pip install telethon
   ```

2. **Uruchom skrypt generujący:**
   ```bash
   python scripts/generate_session.py
   ```

3. **Podaj dane:**
   - API ID (z my.telegram.org)
   - API Hash (z my.telegram.org)
   - Numer telefonu (z kodem kraju, np. +48123456789)

4. **Wprowadź kod:**
   - Telegram wyśle kod do aplikacji lub SMS
   - Wprowadź go w terminalu

5. **Jeśli masz 2FA:**
   - Skrypt poprosi o hasło
   - Wprowadź hasło Telegram

6. **Skopiuj String Session:**
   - Pojawi się długi string (zaczyna się od "1AgAO...")
   - Skopiuj go w całości

7. **Wklej w aplikacji:**
   - W dialogu autoryzacji wybierz "String Session"
   - Wklej skopiowany string
   - Kliknij "Autoryzuj"

### Metoda 2: Online generator (dla zaawansowanych)

Jeśli nie możesz uruchomić Pythona lokalnie, użyj trusted online generatora:
- **repl.it/session-gen** - publiczny generator
- ⚠️ **Uwaga:** Używaj tylko zaufanych źródeł!

## Bezpieczeństwo

🔒 **String Session = pełny dostęp do konta**  
- Traktuj go jak hasło
- Nie udostępniaj nikomu
- Przechowuj bezpiecznie
- Usuń z bazy gdy nie używasz bota

## FAQ

**Q: Czy String Session wygasa?**  
A: Nie, sesja działa dopóki nie wylogujesz się ręcznie z urządzenia.

**Q: Mogę używać jednej sesji w wielu miejscach?**  
A: Tak, ale Telegram może to wykryć i wymagać ponownej autoryzacji.

**Q: Co jeśli zmienię hasło Telegram?**  
A: String Session nadal będzie działał.

**Q: Co jeśli włączę/wyłączę 2FA?**  
A: String Session nadal będzie działał.

**Q: Jak usunąć sesję?**  
A: W aplikacji Telegram → Settings → Devices → znajdź sesję i wyloguj.

**Q: Czy String Session jest bezpieczny?**  
A: Tak, pod warunkiem że trzymasz go prywatnie. To oficjalna metoda Telegram.
