const ROOT_URL = process.env.NEXT_PUBLIC_URL || "";

export const minikitConfig = {
  accountAssociation: {
    header: process.env.FARCASTER_HEADER || "",
    payload: process.env.FARCASTER_PAYLOAD || "",
    signature: process.env.FARCASTER_SIGNATURE || "",
  },
  miniapp: {
    version: "1",
    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "",
    subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "",
    screenshotUrls: process.env.NEXT_PUBLIC_APP_SCREENSHOTS 
      ? process.env.NEXT_PUBLIC_APP_SCREENSHOTS.split(',').map(url => url.trim())
      : [],
    iconUrl: process.env.NEXT_PUBLIC_APP_ICON || "",
    splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || "",
    splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "",
    tags: process.env.NEXT_PUBLIC_APP_TAGS 
      ? process.env.NEXT_PUBLIC_APP_TAGS.split(',').map(tag => tag.trim())
      : [],
    heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || "",
    tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "",
    ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || "",
    ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || "",
    ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || "",
  },
  baseBuilder: {
    allowedAddresses: ["0x76342EEeaC75f8Af376B362606e00a846DF34c67"]
  },
} as const;
