import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.linkr",
  appName: "Linkr",
  // Hosted mode: the iOS WebView loads your published Lovable URL so
  // SSR, server functions, and live updates keep working without rebuilding
  // the native app. To ship a fully offline/static build instead, remove the
  // `server` block and set `webDir` to your client build output.
  webDir: "dist",
  server: {
    url: "https://linkr-match-maker.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
