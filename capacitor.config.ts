import type { CapacitorConfig } from "@capacitor/cli";

const appUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://creative.siamesecat.cafe/game/cat-vs-dog/";

const config: CapacitorConfig = {
  appId: "cafe.siamesecat.catvsdog1986",
  appName: "Cat vs Dog 1986",
  webDir: "mobile-shell",
  server: {
    url: appUrl,
    cleartext: appUrl.startsWith("http://"),
    allowNavigation: ["creative.siamesecat.cafe", "siamesecat.cafe"],
  },
  android: {
    backgroundColor: "#07050f",
  },
  ios: {
    backgroundColor: "#07050f",
    contentInset: "always",
    scrollEnabled: false,
  },
};

export default config;
