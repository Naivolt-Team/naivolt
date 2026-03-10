# Using OutRay tunnel (Metro + Backend)

When the Android emulator can't reach your machine directly, use OutRay to expose both the Expo dev server (Metro) and the backend API. The app then loads the bundle and hits the API through the tunnel URLs.

## 1. Install OutRay and log in

From the naivolt folder:

```bash
npm install
npx outray login
```

(or install globally: `npm install -g outray` and use `outray` instead of `npx outray`)

## 2. Start the backend (Terminal 1)

The tunnel will forward to your local server, so the backend must be running first:

```bash
cd backend
npm run dev
```

Leave this running. The API will be available on `http://localhost:5000`.

## 3. Start both OutRay tunnels (Terminal 2)

From the **naivolt** (project root) folder:

```bash
npm run tunnel
```

Or directly:

```bash
npx outray start
```

To check the config first: `npm run tunnel:validate` or `npx outray validate-config`.

This uses `outray/config.toml` and exposes:

- **metro** → local port **8081** (Expo dev server)
- **api** → local port **5000** (Naivolt backend)

You'll see two tunnel URLs, for example:

```
Tunnel ready: https://random-name-1.tunnel.outray.app   (metro)
Tunnel ready: https://random-name-2.tunnel.outray.app   (api)
```

Note which URL is for **metro** (8081) and which is for **api** (5000). Order in the output matches the order in `outray/config.toml` (metro first, api second). Leave this terminal running.

## 4. Start Expo with tunnel URLs (Terminal 3)

Set both the Metro tunnel URL (so the dev client loads the bundle) and the API tunnel URL (so the app hits the backend via OutRay).

**Windows (PowerShell):**

```powershell
$env:EXPO_PACKAGER_PROXY_URL="https://YOUR-METRO-URL.tunnel.outray.app"
$env:EXPO_PUBLIC_API_URL="https://YOUR-API-URL.tunnel.outray.app"
npx expo start --dev-client
```

**Mac/Linux:**

```bash
EXPO_PACKAGER_PROXY_URL=https://YOUR-METRO-URL.tunnel.outray.app EXPO_PUBLIC_API_URL=https://YOUR-API-URL.tunnel.outray.app npx expo start --dev-client
```

Replace:

- `YOUR-METRO-URL` with the first tunnel host (for port 8081).
- `YOUR-API-URL` with the second tunnel host (for port 5000).

## 5. Open the app on the emulator

Open your Expo dev client build. It will load the bundle from the Metro tunnel and send API requests to the backend tunnel.

---

### Optional: single-tunnel (Metro only)

If you only need the dev client to load (and the API is reachable at `10.0.2.2:5000` or elsewhere), you can run a single tunnel:

```bash
npx outray 8081
```

Then set only `EXPO_PACKAGER_PROXY_URL` when starting Expo (and keep using your existing `EXPO_PUBLIC_API_URL` in `.env` for the backend).

### Reserved subdomains

Tunnel URLs change each run unless you use [OutRay reserved subdomains](https://outray.dev/docs/reserved-subdomains). With reserved subdomains you can put the API URL in `.env` as `EXPO_PUBLIC_API_URL=https://your-api-subdomain.outray.app` and reuse it.
