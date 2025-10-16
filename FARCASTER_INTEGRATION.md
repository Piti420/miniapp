# 🚀 Farcaster SDK Integration - Hello Base

## ✅ Zakończona integracja

Twoja aplikacja została pomyślnie zintegrowana z SDK Farcaster! Oto co zostało skonfigurowane:

### 📦 Zainstalowane pakiety
- `@farcaster/miniapp-sdk@0.2.0` - Główny SDK dla Mini Apps
- `@farcaster/quick-auth@0.0.8` - Szybkie logowanie
- `@farcaster/miniapp-wagmi-connector@1.1.0` - Connector dla wagmi

### 🔧 Konfiguracja

#### 1. **Wagmi Config** (`wagmi.config.ts`)
```typescript
import { http } from 'wagmi';
import { base } from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
  ],
  transports: {
    [base.id]: http(),
  },
});
```

#### 2. **RootProvider** (`app/rootProvider.tsx`)
```typescript
<WagmiProvider config={config}>
  <OnchainKitProvider
    apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
    chain={base}
    miniKit={{
      enabled: true,
      autoConnect: true,
    }}
  >
    {children}
  </OnchainKitProvider>
</WagmiProvider>
```

#### 3. **Zmienne środowiskowe** (`.env`)
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=854440ff-7552-4cbb-a266-f720849e84b5
NEXT_PUBLIC_URL=http://localhost:3000
```

### 🎯 Przykład użycia

Utworzony został komponent `FarcasterSDK` (`app/components/FarcasterSDK.tsx`) pokazujący jak używać SDK:

```typescript
import { sdk } from '@farcaster/miniapp-sdk';

// Sprawdź czy aplikacja działa w Mini App
const isInMiniApp = await sdk.isInMiniApp();

// Pobierz kontekst aplikacji
const context = await sdk.context;

// Logowanie użytkownika
const result = await sdk.actions.signIn({
  nonce: Math.random().toString(36).substring(2, 15),
  acceptAuthAddress: true,
});

// Otwórz URL
await sdk.actions.openUrl('https://base.org');

// Ustaw przycisk główny
await sdk.actions.setPrimaryButton({
  text: 'Click me!',
  disabled: false,
});
```

### 🔗 Dostępne funkcje SDK

#### **Podstawowe funkcje:**
- `sdk.isInMiniApp()` - Sprawdza czy aplikacja działa w Mini App
- `sdk.context` - Pobiera kontekst aplikacji
- `sdk.actions.ready()` - Oznacza aplikację jako gotową

#### **Akcje użytkownika:**
- `sdk.actions.signIn(options)` - Logowanie użytkownika
- `sdk.actions.openUrl(url)` - Otwieranie URL
- `sdk.actions.close()` - Zamykanie aplikacji
- `sdk.actions.setPrimaryButton(options)` - Ustawianie przycisku głównego

#### **Funkcje społecznościowe:**
- `sdk.actions.composeCast(options)` - Tworzenie casta
- `sdk.actions.viewCast(castHash)` - Wyświetlanie casta
- `sdk.actions.viewProfile(fid)` - Wyświetlanie profilu

#### **Funkcje portfela:**
- `sdk.actions.sendToken(options)` - Wysyłanie tokenów
- `sdk.actions.swapToken(options)` - Zamiana tokenów
- `sdk.wallet.ethProvider` - Provider Ethereum

### 🚀 Jak używać

1. **Dodaj komponent do swojej strony:**
```typescript
import { FarcasterSDK } from './components/FarcasterSDK';

export default function Page() {
  return (
    <div>
      <h1>Hello Base</h1>
      <FarcasterSDK />
    </div>
  );
}
```

2. **Uruchom aplikację:**
```bash
npm run dev
```

3. **Przetestuj w Farcaster:**
   - Aplikacja będzie działać najlepiej w kontekście Farcaster Mini App
   - W przeglądarce niektóre funkcje mogą nie działać

### 📚 Dokumentacja

- [Farcaster Mini Apps](https://docs.farcaster.xyz/mini-apps)
- [OnchainKit](https://docs.coinbase.com/onchainkit)
- [Wagmi](https://wagmi.sh)

### ⚠️ Uwagi

- SDK działa najlepiej w kontekście Farcaster Mini App
- Niektóre funkcje wymagają odpowiednich uprawnień
- Zawsze sprawdzaj `isInMiniApp()` przed używaniem funkcji SDK
- Używaj try-catch do obsługi błędów

### 🎉 Gotowe!

Twoja aplikacja jest teraz w pełni zintegrowana z Farcaster SDK i gotowa do użycia w ekosystemie Farcaster!

