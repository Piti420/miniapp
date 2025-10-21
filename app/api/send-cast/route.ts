import { NextRequest, NextResponse } from "next/server";

// Ten endpoint wysyła cast z wzmianką użytkownika
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, fid, senderFid } = body;

    console.log(`📨 API: Preparing to send cast to @${username} (FID: ${fid})`);

    // Sprawdź wymagane parametry
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Przygotuj wiadomość z wzmianką i informacją o nadawcy
    const senderName = senderFid || "Someone";
    const message = `Hey @${username}! 👋

${senderName} is sending you greetings! 🎉

Send greet back and join Hello Base community! 🚀

Reply to this cast to send greetings back! 💬✨

#HelloBase #Base #BuildOnBase`;

    // Użyj Neynar API do wysłania casta
    // UWAGA: Będziesz potrzebował klucza API Neynar i signerUuid
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;

    if (!NEYNAR_API_KEY) {
      console.error("❌ NEYNAR_API_KEY not configured");
      
      // Fallback: Zwróć URL do composera
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
      
      return NextResponse.json({
        success: false,
        fallback: true,
        composeUrl,
        message: "API key not configured. Please use manual compose.",
      });
    }

    if (!SIGNER_UUID) {
      console.error("❌ NEYNAR_SIGNER_UUID not configured");
      
      // Fallback: Zwróć URL do composera
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
      
      return NextResponse.json({
        success: false,
        fallback: true,
        composeUrl,
        message: "Signer not configured. Please use manual compose.",
      });
    }

    // Wysłij cast przez Neynar API
    const neynarResponse = await fetch(
      "https://api.neynar.com/v2/farcaster/cast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: NEYNAR_API_KEY,
        },
        body: JSON.stringify({
          signer_uuid: SIGNER_UUID,
          text: message,
          embeds: [
            {
              url: process.env.NEXT_PUBLIC_URL || "https://miniapp-lovat.vercel.app/",
            },
          ],
        }),
      }
    );

    if (!neynarResponse.ok) {
      const errorData = await neynarResponse.json().catch(() => ({}));
      console.error("❌ Neynar API error:", errorData);
      
      // Fallback do composera
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
      
      return NextResponse.json({
        success: false,
        fallback: true,
        composeUrl,
        message: "Failed to send cast via API. Please use manual compose.",
        error: errorData,
      });
    }

    const castData = await neynarResponse.json();
    console.log("✅ Cast sent successfully:", castData);

    return NextResponse.json({
      success: true,
      cast: castData,
      message: `Greeting sent to @${username}! They will receive a notification.`,
    });
  } catch (error) {
    console.error("❌ Error in send-cast API:", error);
    
    // W przypadku błędu, zwróć fallback URL
    const fallbackMessage = `Hey! 👋 Someone from Hello Base is sending you greetings! 🎉`;
    const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(fallbackMessage)}`;
    
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        composeUrl,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Error sending cast. Please use manual compose.",
      },
      { status: 500 }
    );
  }
}

// Endpoint GET do sprawdzenia statusu konfiguracji
export async function GET() {
  const hasApiKey = !!process.env.NEYNAR_API_KEY;
  const hasSigner = !!process.env.NEYNAR_SIGNER_UUID;
  
  return NextResponse.json({
    configured: hasApiKey && hasSigner,
    hasApiKey,
    hasSigner,
    message: hasApiKey && hasSigner 
      ? "API is configured and ready to send casts"
      : "API needs configuration. Missing: " + 
        (!hasApiKey ? "NEYNAR_API_KEY " : "") + 
        (!hasSigner ? "NEYNAR_SIGNER_UUID" : ""),
  });
}

