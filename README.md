# Naivolt — Crypto to Naira Mobile App

> A mobile application that allows users to convert cryptocurrency (USDT and others) into Nigerian Naira, paid directly to their bank account. Built for Android and iOS from a single codebase.

---

## Table of Contents

1. [What We Are Building](#what-we-are-building)
2. [How the App Works](#how-the-app-works)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Environment Variables](#environment-variables)
6. [Implementation Plan](#implementation-plan)

---

## What We Are Building

Naivolt is a **crypto-to-Naira conversion mobile app** targeted at Nigerian users. A user sends cryptocurrency to a provided wallet address, uploads proof of the transfer inside the app, and receives Nigerian Naira in their bank account after admin verification.

The first version (MVP) uses a **manual settlement model**:
- No automated blockchain detection yet
- Admin manually verifies each transaction and sends Naira to the user's bank
- Admin marks the transaction as paid inside an admin dashboard

This is the same model used by early-stage Nigerian fintech apps like Breet and Monica before they automated. It is simple, safe, low-cost, and fast to build.

### Core Features

| Feature | Description |
|---|---|
| User Authentication | Sign up, login, secure sessions with JWT |
| Live Exchange Rate | Real-time USDT to Naira rate from CoinGecko API |
| Wallet Address Display | Show users the wallet address to send crypto to |
| Transaction Submission | User enters amount sent + uploads screenshot proof |
| Transaction Status Tracking | Pending → Processing → Paid |
| Bank Account Management | User saves their Nigerian bank details for payout |
| Push Notifications | Notify user when transaction status changes |
| Admin Dashboard | Admin views, verifies, and marks transactions as paid |
| Profile Management | User can update their profile and bank details |

---

## How the App Works

### User Flow
```
1. User signs up and saves their bank account details
2. User opens the app and sees the current USDT/Naira rate
3. User taps "Convert" and sees the wallet address to send to
4. User sends USDT from their external wallet (Binance, Trust Wallet, etc.)
5. User returns to app, enters amount sent, uploads transaction screenshot
6. Transaction shows as "Pending" in their history
7. Admin sees the new transaction in the admin dashboard
8. Admin verifies the screenshot and sends Naira to the user's bank
9. Admin marks transaction as "Paid" in the dashboard
10. User receives a push notification that their Naira has been sent
11. User's transaction history updates to "Paid"
```

### Admin Flow
```
1. Admin logs in to the admin dashboard (same app, admin role)
2. Admin sees all pending transactions
3. Admin opens a transaction, views the proof screenshot
4. Admin sends Naira to the user's saved bank account manually
5. Admin marks the transaction as Paid or Rejected
6. User is automatically notified
```

---

## Tech Stack

### Mobile App (Frontend)
| Tool | Purpose | Why |
|---|---|---|
| React Native | Core mobile framework | Write once, runs on Android and iOS |
| Expo (SDK 55) | Development tooling | Simplifies builds, no native code needed |
| Expo Router | Navigation between screens | File-based routing, clean and simple |
| NativeWind | Styling (Tailwind for React Native) | Fast, consistent styling |
| Axios | HTTP requests to backend | Clean API calls |
| Expo Notifications | Push notifications | Works with Development Build |
| Expo Image Picker | Upload transaction proof screenshot | Access phone gallery/camera |
| Expo Secure Store | Store JWT token securely on device | Safer than AsyncStorage for tokens |
| React Query (TanStack) | Server state management | Caching, loading states, refetching |
| Zustand | Global app state | Lightweight, simple store |
| React Hook Form + Zod | Forms and validation | Clean, type-safe form handling |

### Backend (Server)
| Tool | Purpose | Why |
|---|---|---|
| Node.js | Runtime | Same language as frontend |
| Express.js | Web framework | Fast API development |
| MongoDB (Atlas) | Database | Flexible document storage, free tier |
| Mongoose | MongoDB object modeling | Clean schemas and queries |
| JWT (jsonwebtoken) | Authentication tokens | Stateless, secure sessions |
| Bcrypt | Password hashing | Industry standard |
| Multer | Handle file uploads | Middleware for receiving images |
| Cloudinary | Cloud image storage | Stores transaction proof screenshots |
| CoinGecko API | Live crypto rates | Free, no API key needed to start |
| Expo Server SDK | Send push notifications | Official Expo notification server tool |
| Express Validator | Input validation | Prevent bad data entering the system |
| Dotenv | Environment variables | Keep secrets out of code |
| CORS | Cross-origin requests | Allow app to talk to backend |
| Morgan | HTTP request logging | Debug and monitor API calls |

### DevOps & Deployment
| Tool | Purpose |
|---|---|
| Railway or Render | Host the Node.js backend (free tier) |
| MongoDB Atlas | Host the database (free tier) |
| Cloudinary | Host uploaded images (free tier) |
| EAS Build | Build Android APK and iOS IPA |
| EAS Submit | Submit to Google Play and App Store |
| GitHub | Version control |

---

## Folder Structure

Create this folder structure manually before starting development.

```
naivolt/
│
├── app/                          # All screens (Expo Router file-based routing)
│   ├── (auth)/                   # Auth screens group (no bottom tabs)
│   │   ├── _layout.tsx           # Auth layout (stack navigator)
│   │   ├── welcome.tsx           # Welcome/onboarding screen
│   │   ├── login.tsx             # Login screen
│   │   ├── register.tsx          # Sign up screen
│   │   └── forgot-password.tsx   # Forgot password screen
│   │
│   ├── (tabs)/                   # Main app screens (with bottom tab bar)
│   │   ├── _layout.tsx           # Tab layout (bottom navigation)
│   │   ├── index.tsx             # Home/Dashboard screen
│   │   ├── convert.tsx           # Convert crypto screen
│   │   ├── history.tsx           # Transaction history screen
│   │   └── profile.tsx           # Profile screen
│   │
│   ├── (admin)/                  # Admin screens group
│   │   ├── _layout.tsx           # Admin layout
│   │   ├── dashboard.tsx         # Admin dashboard (all transactions)
│   │   └── transaction/
│   │       └── [id].tsx          # Single transaction detail for admin
│   │
│   ├── transaction/
│   │   └── [id].tsx              # Transaction detail screen (user)
│   │
│   ├── bank-details.tsx          # Add/edit bank account screen
│   ├── submit-transaction.tsx    # Submit proof screen
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404 screen
│
├── assets/                       # Static assets
│   ├── icon.png                  # App icon (1024x1024)
│   ├── splash.png                # Splash screen
│   ├── adaptive-icon.png         # Android adaptive icon
│   └── fonts/                    # Custom fonts if any
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI elements
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx             # Status badge (Pending/Paid/Rejected)
│   │   ├── Avatar.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── transaction/              # Transaction-specific components
│   │   ├── TransactionCard.tsx   # Single transaction list item
│   │   ├── TransactionList.tsx   # List of transactions
│   │   └── StatusBadge.tsx       # Pending / Processing / Paid badge
│   │
│   ├── home/
│   │   ├── RateDisplay.tsx       # Live USDT/Naira rate card
│   │   ├── QuickActions.tsx      # Convert / History buttons
│   │   └── WalletCard.tsx        # Wallet address display card
│   │
│   └── admin/
│       ├── AdminTransactionCard.tsx
│       └── AdminStats.tsx        # Stats summary for admin
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state and actions
│   ├── useRate.ts                # Fetch live crypto rate
│   ├── useTransactions.ts        # Fetch user transactions
│   ├── useNotifications.ts       # Push notification setup
│   └── useAdmin.ts               # Admin-specific data hooks
│
├── store/                        # Zustand global state
│   ├── authStore.ts              # User auth state (token, user object)
│   └── appStore.ts               # General app state (rate, loading, etc.)
│
├── services/                     # API call functions
│   ├── api.ts                    # Axios instance with base URL + interceptors
│   ├── authService.ts            # Login, register, logout API calls
│   ├── transactionService.ts     # Transaction API calls
│   ├── rateService.ts            # Fetch rate from CoinGecko
│   ├── userService.ts            # Profile and bank details API calls
│   └── adminService.ts           # Admin API calls
│
├── constants/                    # App-wide constants
│   ├── colors.ts                 # Color palette
│   ├── config.ts                 # API base URL, app config
│   └── strings.ts                # Static text strings
│
├── types/                        # TypeScript type definitions
│   ├── user.ts                   # User, BankDetails types
│   ├── transaction.ts            # Transaction type
│   └── api.ts                    # API response types
│
├── utils/                        # Helper functions
│   ├── formatCurrency.ts         # Format Naira amounts
│   ├── formatDate.ts             # Format dates nicely
│   └── validators.ts             # Shared validation helpers
│
├── app.json                      # Expo app config
├── eas.json                      # EAS build config
├── tailwind.config.js            # NativeWind/Tailwind config
├── babel.config.js               # Babel config
├── tsconfig.json                 # TypeScript config
├── package.json
└── .env                          # Environment variables (never commit this)
│
│
└── backend/                      # Backend server (separate folder)
    │
    ├── src/
    │   ├── config/
    │   │   ├── db.ts             # MongoDB connection
    │   │   ├── cloudinary.ts     # Cloudinary config
    │   │   └── expo.ts           # Expo push notification config
    │   │
    │   ├── models/               # Mongoose schemas
    │   │   ├── User.ts           # User model
    │   │   ├── Transaction.ts    # Transaction model
    │   │   └── BankDetails.ts    # Bank details model
    │   │
    │   ├── routes/               # Express route definitions
    │   │   ├── auth.routes.ts    # /api/auth/*
    │   │   ├── user.routes.ts    # /api/users/*
    │   │   ├── transaction.routes.ts  # /api/transactions/*
    │   │   ├── rate.routes.ts    # /api/rate/*
    │   │   └── admin.routes.ts   # /api/admin/*
    │   │
    │   ├── controllers/          # Route handler logic
    │   │   ├── auth.controller.ts
    │   │   ├── user.controller.ts
    │   │   ├── transaction.controller.ts
    │   │   ├── rate.controller.ts
    │   │   └── admin.controller.ts
    │   │
    │   ├── middleware/           # Express middleware
    │   │   ├── auth.middleware.ts     # Verify JWT token
    │   │   ├── admin.middleware.ts    # Check admin role
    │   │   ├── upload.middleware.ts   # Multer file upload
    │   │   └── error.middleware.ts    # Global error handler
    │   │
    │   ├── services/             # Business logic
    │   │   ├── notification.service.ts  # Send push notifications
    │   │   ├── cloudinary.service.ts    # Upload image to Cloudinary
    │   │   └── rate.service.ts          # Fetch and cache crypto rate
    │   │
    │   └── utils/
    │       ├── apiResponse.ts    # Standardized API response format
    │       └── catchAsync.ts     # Async error wrapper
    │
    ├── server.ts                 # Entry point
    ├── package.json
    ├── tsconfig.json
    └── .env                      # Backend environment variables
```

---

## Environment Variables

### Frontend `.env`
```
EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
EXPO_PUBLIC_WALLET_ADDRESS=your_usdt_trc20_wallet_address
```

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=admin@naivolt.com
ADMIN_PASSWORD=your_admin_password
```

---

## Implementation Plan

Work through these phases **in order**. Do not skip ahead. Each phase builds on the previous one. Complete and test each phase before moving to the next.

---

### PHASE 1 — Backend Foundation
> Goal: Get the server running with database connected

**Step 1.1 — Backend Setup**
- Initialize Node.js project inside `/backend`
- Install all backend dependencies
- Set up TypeScript config
- Create `server.ts` entry point with Express
- Connect to MongoDB Atlas
- Set up `.env` file with all secrets
- Test that the server starts without errors

**Step 1.2 — User Model**
- Create `User.ts` Mongoose schema with fields:
  - `name` (string, required)
  - `email` (string, required, unique)
  - `password` (string, required, hashed)
  - `phone` (string)
  - `role` (enum: `user` | `admin`, default: `user`)
  - `pushToken` (string, for notifications)
  - `createdAt` (date)
- Add password hashing with bcrypt before save

**Step 1.3 — Auth Routes**
- `POST /api/auth/register` — create new user, return JWT
- `POST /api/auth/login` — validate credentials, return JWT
- `GET /api/auth/me` — return current user (protected route)
- Set up JWT middleware to protect routes
- Test all routes with Postman or Thunder Client

**Step 1.4 — Bank Details Model + Routes**
- Create `BankDetails.ts` schema:
  - `userId` (ref to User)
  - `bankName` (string)
  - `accountNumber` (string)
  - `accountName` (string)
- `POST /api/users/bank-details` — save bank details (protected)
- `GET /api/users/bank-details` — get user's bank details (protected)
- `PUT /api/users/bank-details` — update bank details (protected)

**Step 1.5 — Transaction Model**
- Create `Transaction.ts` schema:
  - `userId` (ref to User)
  - `amountCrypto` (number — how much USDT was sent)
  - `amountNaira` (number — expected Naira payout)
  - `rateAtTime` (number — USDT/NGN rate at time of submission)
  - `proofImageUrl` (string — Cloudinary URL)
  - `walletAddress` (string — address they sent to)
  - `status` (enum: `pending` | `processing` | `paid` | `rejected`)
  - `adminNote` (string — optional note from admin)
  - `createdAt`, `updatedAt`

**Step 1.6 — Cloudinary + File Upload**
- Set up Cloudinary config
- Set up Multer middleware for receiving image files
- Create upload service that sends image to Cloudinary and returns URL
- Test image upload via Postman

**Step 1.7 — Transaction Routes**
- `POST /api/transactions` — submit new transaction with proof image (protected)
- `GET /api/transactions` — get all transactions for logged in user (protected)
- `GET /api/transactions/:id` — get single transaction detail (protected)

**Step 1.8 — Rate Route**
- `GET /api/rate` — fetch live USDT to NGN rate from CoinGecko API
- Cache the rate for 60 seconds to avoid hitting API limits

**Step 1.9 — Admin Routes**
- `GET /api/admin/transactions` — get ALL transactions across all users (admin only)
- `PUT /api/admin/transactions/:id` — update transaction status (admin only)
- `GET /api/admin/stats` — total transactions, total volume, pending count

**Step 1.10 — Push Notification Service**
- Install Expo Server SDK on backend
- Create notification service function that accepts a push token and message
- Call this service whenever a transaction status changes

**Step 1.11 — Deploy Backend**
- Push backend code to GitHub
- Connect GitHub repo to Railway or Render
- Set all environment variables on the hosting platform
- Test that all API endpoints work on the live URL

---

### PHASE 2 — Mobile App Foundation
> Goal: App opens, navigates between screens, connects to backend

**Step 2.1 — Project Cleanup**
- Remove all default Expo template boilerplate code
- Set up NativeWind (Tailwind for React Native)
- Configure the color palette in `tailwind.config.js` using Naivolt brand colors:
  - Primary background: `#060B18` (dark navy)
  - Accent: `#00E5FF` (cyan)
  - Gold: `#F0B429`
  - Text: `#FFFFFF`
- Set up custom fonts if using any
- Configure Axios in `services/api.ts` with the backend base URL

**Step 2.2 — Zustand Auth Store**
- Create `store/authStore.ts`
- Store: `user`, `token`, `isAuthenticated`
- Actions: `setUser`, `setToken`, `logout`
- Persist token using `Expo Secure Store`

**Step 2.3 — Navigation Structure**
- Set up Expo Router layouts:
  - Root layout checks auth state and redirects accordingly
  - `(auth)` group for unauthenticated screens
  - `(tabs)` group for authenticated screens with bottom tab bar
  - `(admin)` group for admin screens
- Bottom tab bar with icons for: Home, Convert, History, Profile

**Step 2.4 — Welcome Screen**
- App logo and name
- Short tagline
- "Get Started" button → Register screen
- "Already have an account? Login" link

**Step 2.5 — Register Screen**
- Form fields: Full Name, Email, Phone, Password, Confirm Password
- Validation with React Hook Form + Zod
- Call `POST /api/auth/register`
- On success: save token to Secure Store, redirect to Home
- Show loading state during API call
- Show error messages clearly

**Step 2.6 — Login Screen**
- Form fields: Email, Password
- Call `POST /api/auth/login`
- On success: save token, redirect to Home
- "Forgot Password?" link (placeholder for now)

**Step 2.7 — Protected Route Guard**
- Root layout checks Secure Store for token on app load
- If token exists → go to `(tabs)`
- If no token → go to `(auth)/welcome`

---

### PHASE 3 — Core App Screens
> Goal: All main user-facing screens are built and functional

**Step 3.1 — Home Screen**
- Greeting: "Good morning, [Name]"
- Live rate card showing current USDT → NGN rate (fetched from `/api/rate`)
- Rate refreshes every 60 seconds automatically
- Quick action buttons: "Convert Now" and "View History"
- Recent transactions list (last 3 transactions)
- Show loading skeleton while data is fetching

**Step 3.2 — Convert Screen (Wallet Address)**
- Display the USDT TRC20 wallet address
- Large "Copy Address" button (copies to clipboard with haptic feedback)
- QR code of the wallet address for easy scanning
- Current rate displayed
- Simple calculator: user enters USDT amount → sees Naira equivalent
- "I Have Sent" button → goes to Submit Transaction screen

**Step 3.3 — Submit Transaction Screen**
- Input: Amount of USDT sent
- Calculated Naira equivalent shown automatically
- Image picker to upload transaction proof screenshot
- Image preview after selection
- Submit button calls `POST /api/transactions`
- On success: show confirmation and redirect to History

**Step 3.4 — Transaction History Screen**
- List of all user's transactions
- Each item shows: date, amount, status badge (color coded)
- Pull to refresh
- Empty state when no transactions yet
- Tap a transaction → Transaction Detail screen

**Step 3.5 — Transaction Detail Screen**
- Full details of a single transaction
- Proof image displayed (tappable to zoom)
- Status with color coded badge
- Date and time
- Amount in USDT and expected Naira
- Admin note (if any) — shown when rejected

**Step 3.6 — Profile Screen**
- User's name and email displayed
- "Bank Account Details" section showing saved bank info
- Edit bank details button
- Logout button
- App version at bottom

**Step 3.7 — Bank Details Screen**
- Form: Bank Name (dropdown of Nigerian banks), Account Number, Account Name
- Save button calls `POST /api/users/bank-details` or `PUT` if updating
- Validation: account number must be 10 digits

---

### PHASE 4 — Admin Dashboard
> Goal: Admin can manage all transactions from inside the app

**Step 4.1 — Admin Role Check**
- After login, check if `user.role === 'admin'`
- If admin: show admin dashboard instead of regular home
- Admin sees a different bottom tab bar: Transactions, Stats, Profile

**Step 4.2 — Admin Transactions Screen**
- List of ALL transactions from all users
- Filter tabs: All, Pending, Processing, Paid, Rejected
- Each item shows: user name, amount, date, status
- Pending transactions shown first, highlighted

**Step 4.3 — Admin Transaction Detail Screen**
- Full transaction info
- User's name, email, bank details displayed clearly
- Proof screenshot displayed large (easy to verify)
- Action buttons:
  - "Mark as Processing" (grey)
  - "Mark as Paid" (green)
  - "Reject" (red) with optional note input
- Calls `PUT /api/admin/transactions/:id`
- On status change: push notification sent to user automatically

**Step 4.4 — Admin Stats Screen**
- Total transactions today / this week / all time
- Total USDT volume processed
- Total Naira paid out
- Pending count (highlighted if > 0)

---

### PHASE 5 — Push Notifications
> Goal: Users get notified when their transaction status changes

**Step 5.1 — Register Push Token**
- On app load (after login), request notification permissions
- Get the Expo push token from the device
- Send the token to backend: `PUT /api/users/push-token`
- Save it to the User document in MongoDB

**Step 5.2 — Send Notification from Backend**
- When admin updates a transaction status, the backend:
  - Finds the user's push token
  - Sends a notification via Expo's push API
  - Message examples:
    - "Processing": "Your transaction is being verified ⏳"
    - "Paid": "Your Naira has been sent! Check your bank 🎉"
    - "Rejected": "Your transaction was rejected. Open app for details."

**Step 5.3 — Handle Notification on Device**
- When app is open: show in-app toast/alert
- When app is in background: system notification appears
- Tapping notification → opens the relevant transaction screen

---

### PHASE 6 — Polish and Testing
> Goal: App is smooth, error-free, and ready for real users

**Step 6.1 — Loading States**
- Every screen that fetches data must show a skeleton loader or spinner
- Every button that submits must show a loading indicator and be disabled while loading

**Step 6.2 — Error Handling**
- All API errors must show a user-friendly message
- Network errors: "No internet connection. Please try again."
- Server errors: "Something went wrong. Please try again."
- Never show raw error messages from the server to the user

**Step 6.3 — Empty States**
- Transaction history with no transactions: friendly illustration and message
- Admin dashboard with no pending: "All caught up! No pending transactions."

**Step 6.4 — Form Validation**
- All forms must validate before submitting
- Show inline error messages under each field
- Disable submit button if form is invalid

**Step 6.5 — Security Checks**
- JWT token expiry handled: if token expired, logout user and redirect to login
- Sensitive data (token) stored in Expo Secure Store, never in AsyncStorage
- All admin routes double-protected on backend (middleware checks role)

**Step 6.6 — Real Device Testing**
- Test full user flow on Android (Redmi 14C)
- Test full admin flow on Android
- Test push notifications end to end
- Test image upload with different file sizes
- Test with slow network (airplane mode on/off)

---

### PHASE 7 — Build and Launch
> Goal: App is live on Google Play Store

**Step 7.1 — App Configuration**
- Set correct app name: "Naivolt" in `app.json`
- Set bundle ID: `com.naivolt.app`
- Set correct icon (1024x1024 PNG)
- Set splash screen
- Set correct version: `1.0.0`

**Step 7.2 — Production Build (Android)**
```bash
eas build --profile production --platform android
```
- This creates an AAB file (Android App Bundle) for Play Store

**Step 7.3 — Google Play Store Submission**
- Create Google Play Console account ($25 one-time)
- Create new app: "Naivolt"
- Upload the AAB file
- Fill in store listing: description, screenshots, category (Finance)
- Set content rating
- Submit for review
- Wait 1–3 days for approval

**Step 7.4 — Production Build (iOS) — Do after Android is approved**
```bash
eas build --profile production --platform ios
```
- Requires Apple Developer account ($99/year)
- Submit via EAS or Transporter
- Prepare extra documentation for Apple (financial app requirements)

---

## Important Development Rules

1. **Always test on a real device** — not emulator. Use your Redmi 14C for Android testing throughout development.

2. **Build backend first** — never build a frontend screen until the API endpoint it needs is working and tested.

3. **Test each phase completely** before starting the next one. A broken foundation breaks everything built on top.

4. **Never commit `.env` files** to GitHub. Add `.env` to your `.gitignore` immediately.

5. **One feature at a time** — complete it fully (backend + frontend + tested) before starting the next.

6. **Keep the admin account credentials secure** — the admin account is created manually in the database (or via a seeder script), never through the public register endpoint.

7. **Rebuild the Development Build** only when you add a new native package. For regular code changes, just save and the app reloads automatically.

---

## Quick Command Reference

```bash
# Start development server
npx expo start --dev-client

# Build development APK (Android)
eas build --profile development --platform android

# Build production AAB (Android - for Play Store)
eas build --profile production --platform android

# Build production IPA (iOS - for App Store)
eas build --profile production --platform ios

# Start backend server
cd backend && npm run dev

# Install a new package (mobile)
npx expo install package-name

# Install a new package (backend)
cd backend && npm install package-name
```

---

*Built with React Native + Expo | Node.js + Express | MongoDB | Cloudinary*
*Target Market: Nigeria | Platforms: Android + iOS*
