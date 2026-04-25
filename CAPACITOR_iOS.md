# Linkr — iOS (Capacitor) build guide

This project is configured to ship as a native iOS app using
[Capacitor](https://capacitorjs.com/). The WebView loads your published
Lovable URL (hosted mode), so SSR, server functions, and live updates keep
working without rebuilding the iOS app every time.

> **macOS + Xcode required.** Native iOS projects can only be opened and
> built on a Mac with Xcode installed. The steps below assume you've
> exported the project to GitHub via Lovable's GitHub integration and
> cloned it locally.

## 1. One-time local setup

```bash
# Install JS deps
bun install   # or: npm install

# Add the iOS native project (creates the ./ios folder)
npx cap add ios

# Sync web config + plugins into the native project
npx cap sync ios
```

If `npx cap add ios` complains about CocoaPods, install it once:

```bash
sudo gem install cocoapods
# Apple Silicon Macs sometimes need:
arch -x86_64 sudo gem install ffi
```

## 2. Open in Xcode and run

```bash
npx cap open ios
```

In Xcode:
1. Select a Simulator (e.g. *iPhone 15 Pro*) or a connected device.
2. Set your **Team** under *Signing & Capabilities* (required for physical devices).
3. Press the ▶︎ Run button.

The app launches and loads `https://linkr-match-maker.lovable.app` inside
a native WebView.

## 3. Updating the app

Because the app is in **hosted mode**, content updates ship the moment
you re-publish from Lovable — no App Store review or rebuild needed.

You only need to rebuild the iOS app when you change:
- Native plugins (`@capacitor/*`)
- `capacitor.config.ts`
- App icons / splash screens
- iOS permissions or `Info.plist`

After such changes:

```bash
npx cap sync ios
npx cap open ios
```

## 4. Switching to bundled (offline) mode later

If you eventually want the app to ship a fully static client bundle
(no network needed for the shell), edit `capacitor.config.ts`:

1. Remove the `server` block.
2. Make sure `webDir` points at your client build output (e.g. `dist`).
3. Produce a client-only build of the app and run `npx cap sync ios`.

> Note: TanStack Start uses SSR + server functions. A fully bundled
> Capacitor build requires reworking those into client-only code or
> calling them as remote APIs against your hosted backend. Hosted mode
> is the simplest path.

## 5. App Store submission

When you're ready to publish to the App Store:
1. Set a unique `appId` in `capacitor.config.ts` (currently `app.lovable.linkr`).
2. Configure icons, splash screens, and privacy strings in Xcode.
3. Archive the build (*Product → Archive*) and upload via Xcode Organizer.
