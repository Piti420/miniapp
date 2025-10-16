const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "https://miniapp-lovat.vercel.app";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjg2NDMzMiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDdkRWI2NmVhNEZBMjhmZGZiRTY5QTM5NzlEMkU1YjMxZmI1NWE3OGIifQ",
    payload: "eyJkb21haW4iOiJtaW5pYXBwLWxvdmF0LnZlcmNlbC5hcHAifQ",
    signature: "MHg2YjE3MDM0OGM1YTliZTI1NDA4Y2U1YWVmZjM5ODBhZDY0YTY1ZDI2NTYzMTcxN2E1M2JjYmMxMDU2ODZkOTFhMDcwMmUyMzAwNDUzMTQzZDJlMDM2YTU0OTY3Y2EzMjVmMWY5MjBiZDYyM2YwZGMwYTU3NGMxYzM2ZDdhODJiYzFi",
  },
  baseBuilder: {
    allowedAddresses: ["0x76342EEeaC75f8Af376B362606e00a846DF34c67"],
  },
  miniapp: {
    version: "1",
    name: "Hello Base",
    subtitle: "Say GM onchain and join the Base community!",
    description: "Connect your wallet and send greetings to the Base blockchain. Join thousands of users saying GM (Good Morning) onchain and become part of the Base community! Built with Next.js and OnchainKit.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot.png`
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "utility",
    tags: ["base", "web3", "blockchain", "greetings", "community"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Join the Base community with onchain greetings",
    ogTitle: "Hello Base World - Say GM onchain!",
    ogDescription: "Connect your wallet and send greetings to the Base blockchain. Join thousands of users saying GM onchain and become part of the Base community!",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
