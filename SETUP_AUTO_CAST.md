# 🚀 Konfiguracja Automatycznego Wysyłania Castów

## ✅ System jest już zaimplementowany!

Po kliknięciu "Send Greeting 👋" system automatycznie wysyła cast z powiadomieniem do użytkownika!

## 📋 Wymagane Zmienne Środowiskowe

Aby automatyczne wysyłanie działało, dodaj te zmienne do pliku `.env.local`:

```env
# Neynar API Configuration
NEYNAR_API_KEY=your_api_key_here
NEYNAR_SIGNER_UUID=your_signer_uuid_here
```

## 🔑 Jak zdobyć klucze API?

### Krok 1: Utwórz konto na Neynar

1. Odwiedź: https://neynar.com
2. Zarejestruj się (bezpłatnie)
3. Przejdź do Dashboard

### Krok 2: Pobierz API Key

1. W Dashboard, kliknij "API Keys"
2. Skopiuj swój API Key
3. Dodaj do `.env.local`:
   ```
   NEYNAR_API_KEY=twoj_klucz_api
   ```

### Krok 3: Stwórz Signer

Signer to specjalny klucz, który pozwala aplikacji wysyłać casty w Twoim imieniu.

**Opcja A - Przez Neynar Dashboard:**
1. W Dashboard, przejdź do "Signers"
2. Kliknij "Create Signer"
3. Skopiuj `signer_uuid`
4. Dodaj do `.env.local`:
   ```
   NEYNAR_SIGNER_UUID=twoj_signer_uuid
   ```

**Opcja B - Przez API:**
```bash
curl -X POST https://api.neynar.com/v2/farcaster/signer \
  -H "Content-Type: application/json" \
  -H "api_key: YOUR_API_KEY" \
  -d '{
    "app_fid": YOUR_APP_FID
  }'
```

### Krok 4: Zrestartuj aplikację

```bash
npm run dev
```

## 🎯 Jak to działa?

### **Z konfiguracją (automatyczne):**

1. Użytkownik klika "Send Greeting 👋"
2. System natychmiast wysyła cast przez Neynar API
3. Użytkownik dostaje powiadomienie w Farcasterze
4. Może kliknąć Reply i odpowiedzieć!

**Komunikat dla użytkownika:**
```
🎉 Greeting sent! @username will receive a notification!
📬 @username can now see your greeting and reply to send greetings back! 👋
```

### **Bez konfiguracji (fallback):**

1. Użytkownik klika "Send Greeting 👋"
2. Otwiera się Warpcast composer z gotową wiadomością
3. Użytkownik klika "Cast" ręcznie
4. Odbiorca dostaje powiadomienie

**Komunikat dla użytkownika:**
```
⚠️ Auto-send not configured. Opening manual composer...
📬 Click "Cast" in Warpcast to notify @username!
```

## 📬 Wiadomość wysyłana do użytkownika:

```
Hey @nataliahodl! 👋

Piti420 is sending you greetings! 🎉

Send greet back and join Hello Base community! 🚀

Reply to this cast to send greetings back! 💬✨

#HelloBase #Base #BuildOnBase
```

**Personalizacja:**
- System automatycznie wstawia **username nadawcy** (pobierany z Farcaster SDK)
- Jeśli nie ma username, użyje skróconego adresu portfela (np. `0x1234...5678`)
- Username odbiorcy zawsze jest poprawny (z wyszukiwania FID)

**🎯 Mini App Embed:**
- ✅ Cast automatycznie zawiera **link do Hello Base Mini App** jako embed
- ✅ Każdy kto zobaczy cast może **kliknąć i uruchomić aplikację** bezpośrednio
- ✅ Wyświetla się jako **ładna karta (preview)** w Warpcast/Farcaster
- ✅ Zwiększa viralność - łatwy dostęp dla nowych użytkowników!

**Przykład jak wygląda w Warpcast:**
```
Hey @username! 👋
Piti420 is sending you greetings!
[...rest of message...]

┌─────────────────────────────────┐
│  🚀 Hello Base                   │
│  Say GM onchain! Join community  │
│  ▶️ Launch Mini App              │
└─────────────────────────────────┘
```

## 🔧 Testowanie

### Test 1: Sprawdź konfigurację
```bash
curl http://localhost:3000/api/send-cast
```

Odpowiedź jeśli skonfigurowane:
```json
{
  "configured": true,
  "hasApiKey": true,
  "hasSigner": true,
  "message": "API is configured and ready to send casts"
}
```

### Test 2: Wyślij testowy cast
```bash
curl -X POST http://localhost:3000/api/send-cast \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dwr",
    "displayName": "Dan Romero",
    "fid": 3
  }'
```

## 💰 Koszty

**Neynar Free Tier:**
- 1000 requestów/dzień
- Całkowicie wystarczające dla małej/średniej aplikacji
- Więcej info: https://neynar.com/pricing

## ❓ Troubleshooting

### Problem: "Auto-send not configured"
**Rozwiązanie:** 
- Sprawdź czy masz zmienne w `.env.local`
- Zrestartuj aplikację (`npm run dev`)
- Sprawdź czy zmienne są dostępne w `process.env`

### Problem: "Invalid API key"
**Rozwiązanie:**
- Sprawdź czy klucz API jest poprawny
- Sprawdź czy nie ma spacji na początku/końcu
- Wygeneruj nowy klucz w Neynar Dashboard

### Problem: "Signer not found"
**Rozwiązanie:**
- Upewnij się że signer jest utworzony w Neynar
- Sprawdź czy `signer_uuid` jest poprawne
- Stwórz nowy signer jeśli potrzeba

## 🎉 Gotowe!

Po konfiguracji, użytkownicy będą automatycznie otrzymywać powiadomienia w Farcasterze po kliknięciu "Send Greeting 👋"!

---

**Pytania?** Sprawdź dokumentację Neynar: https://docs.neynar.com

