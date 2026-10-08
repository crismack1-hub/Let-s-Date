# Connect

This workspace contains a full-stack messaging platform scaffold for web + mobile.

## Architecture

- `backend/`: Node.js API, auth, realtime chat, media, encryption key management, admin tools.
- `web/`: React + TypeScript web client with chat, groups, media, presence, statuses.
- `mobile/`: Expo React Native mobile app targeting iOS/Android with shared UI and realtime messaging.
- Open `/messages` in the web client for a messaging-only experience without the dating navigation.

## Features

- User auth + email or phone profile verification (SMTP/Twilio)
- 1:1 and group chat
- Media sharing: images, audio, video, documents
- Voice/video calling via WebRTC
- Presence, typing indicators, read receipts
- End-to-end encryption + key management
- Push notifications
- Status / story feature
- Admin / moderation tools

## Getting started

1. `npm install`
2. `npm run dev:backend`
3. `npm run dev:web`
4. `npm run dev:mobile`

## Notes

The backend exposes REST APIs and Socket.IO events. Accounts, password hashes, profile edits,
likes, favorites, friends, messages, groups, and statuses are persisted in a private SQLite
database. Passwords are stored as bcrypt hashes, not plaintext. Users access their own data through
authenticated app APIs; the database file is not exposed for download.

The production web client connects to `https://lets-date-backend-uf7o.onrender.com`. Set
`VITE_API_URL` in the Vercel project environment if the backend uses a different public URL, then
redeploy the web project so the value is included in its build.

By default, the SQLite file is `backend/data/connect.sqlite` and is excluded from Git. Set
`DATABASE_PATH` to choose a different location. Local data survives backend restarts. The hosted
Render backend uses a paid persistent disk mounted at `/var/data`, with
`DATABASE_PATH=/var/data/connect.sqlite`, so accounts, password hashes, and other SQLite data
survive backend restarts and redeploys. The persistent disk and paid service plan may incur charges.

### Email and phone verification

The backend can send profile-verification codes by SMTP email or Twilio SMS. Configure these
environment variables on the backend before enabling verification:

- Email: `SMTP_HOST`, `SMTP_PORT` (optional; defaults to 587), `SMTP_SECURE` (optional),
  `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.

Profile-verification codes expire after 10 minutes, are rate-limited, and are limited to five
confirmation attempts. Profile-verification codes are never returned by the API.

### Password recovery

Password resets use the account phone number and the same Twilio SMS configuration. During local
development, or when `PASSWORD_RESET_TEST_MODE=true` is explicitly enabled, the API returns a
temporary reset code if SMS delivery is unavailable. Do not enable this testing fallback on a
public production service.

The web app currently unlocks all features and unlimited messaging for the testing phase. Set
`TESTING_ACCESS` to `false` in `web/src/hooks/useSubscription.ts` when testing is complete to
restore the free-tier message limit and subscription UI.

## Next steps

To go from "two browsers can chat on the same LAN" to a real product:

1. **Proper account system.** Today, login is just a name from `localStorage` — anyone can pick any name, identity is per-socket and resets on disconnect, and impersonation is trivial. Add real accounts so identity persists across sessions and devices. Easiest path for v1: skip self-managed passwords (no password-reset/breach surface) and support OAuth sign-in via Google / Apple / Meta only.

2. **Production database storage.** The TypeScript backend persists account and app data in SQLite locally. Configure a persistent Render disk or hosted database before deploying so production restarts do not lose data. The legacy `server.js` app still has separate in-memory state and should not be used as the account database.

3. **HTTPS.** Required for two things that the rest of the roadmap depends on:
   - **WebRTC voice/video calling** — browsers refuse `getUserMedia` in non-secure contexts, so the camera and mic can't be accessed from plain `http://` URLs even on a LAN.
   - **OAuth sign-in** — Google / Apple / Meta all require HTTPS redirect URIs at the consent step.

   Cheapest path: a Caddy or nginx reverse-proxy in front of the node app with a self-signed cert for LAN testing, and a real cert (Let's Encrypt) once there's a public hostname.
