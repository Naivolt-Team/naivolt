# How to run Naivolt (UI → Backend)

## Quick order

1. **Backend** (API + DB)  
2. **Android emulator only:** run `adb reverse` (so emulator can reach Metro)  
3. **Expo** (UI)

---

## 1. Backend

```bash
cd backend
npm run dev
```

- Uses `backend/.env.dev` (MongoDB, JWT, etc.).
- API: `http://localhost:5000`. Keep this running.

---

## 2. Android emulator: port forward (recommended)

So the emulator can load the bundle from Metro **without a tunnel**:

```bash
adb reverse tcp:8081 tcp:8081
```

- Run once per emulator boot (or per `adb kill-server`).
- Then the emulator’s `localhost:8081` points at your PC’s Metro.

---

## 3. UI (Expo)

**Android emulator (after `adb reverse`):**

```bash
# from project root (naivolt)
# So the dev client uses localhost:8081 (forwarded to your PC by adb reverse):
$env:REACT_NATIVE_PACKAGER_HOSTNAME="localhost"; npx expo start --dev-client
```

- `.env`: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000` for the API.
- Open the dev client on the emulator; it should load from Metro.

**If you still use OutRay tunnel:**

```bash
# 1) npm run tunnel → note Metro URL and API URL
# 2) then:
$env:EXPO_PACKAGER_PROXY_URL="https://METRO-URL.outray.app"
$env:EXPO_PUBLIC_API_URL="https://API-URL.outray.app"
npx expo start --dev-client
```

- “Unable to load script” with OutRay is often due to WebSocket/HTTPS. Prefer `adb reverse` on the emulator when possible.

---

## Summary

| Step | Command / Action |
|------|-------------------|
| 1 | `cd backend` → `npm run dev` (leave running) |
| 2 | **Emulator:** `adb reverse tcp:8081 tcp:8081` (once) |
| 3 | `npx expo start --dev-client` → open app on emulator |

Backend must be running before the app calls the API.
