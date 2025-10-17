const ROOT_URL = process.env.NEXT_PUBLIC_URL || "https://miniapp-lovat.vercel.app/";

export const minikitConfig = {
  accountAssociation: {
    header: process.env.FARCASTER_HEADER || "",
    payload: process.env.FARCASTER_PAYLOAD || "",
    signature: process.env.FARCASTER_SIGNATURE || "",
  },
  miniapp: {
    version: "1",
    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Hello Base",
    subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "Farcaster Mini App",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "A simple and fun mini app for Farcaster users to interact with Base blockchain",
    screenshotUrls: process.env.NEXT_PUBLIC_APP_SCREENSHOTS 
      ? process.env.NEXT_PUBLIC_APP_SCREENSHOTS.split(',').map(url => url.trim())
      : [`${ROOT_URL}/screenshot.png`],
    iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${ROOT_URL}/icon.png`,
    splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${ROOT_URL}/splash.png`,
    splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "social",
    tags: process.env.NEXT_PUBLIC_APP_TAGS 
      ? process.env.NEXT_PUBLIC_APP_TAGS.split(',').map(tag => tag.trim())
      : ["social", "farcaster", "web3", "base", "blockchain"],
    heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${ROOT_URL}/hero.png`,
    tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Welcome to Hello Base - Your Gateway to Web3",
    ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || "Hello Base - Farcaster Mini App",
    ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || "A simple and fun mini app for Farcaster users to interact with Base blockchain",
    ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${ROOT_URL}/logo.png`,
  },
  baseBuilder: {
    allowedAddresses: ["0x76342EEeaC75f8Af376B362606e00a846DF34c67"]
  },
} as const;
