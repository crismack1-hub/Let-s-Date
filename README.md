# Date Messaging App

This workspace contains a full-stack messaging platform scaffold for web + mobile.

## Architecture

- `backend/`: Node.js API, auth, realtime chat, media, encryption key management, admin tools.
- `web/`: React + TypeScript web client with chat, groups, media, presence, statuses.
- `mobile/`: Expo React Native mobile app targeting iOS/Android with shared UI and realtime messaging.

## Features

- User auth + phone verification
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

This repository is a scaffold for the full application. The backend exposes REST APIs and Socket.IO events. The web and mobile clients connect to the same realtime backend.

## Next steps

To go from "two browsers can chat on the same LAN" to a real product:

1. **Proper account system.** Today, login is just a name from `localStorage` — anyone can pick any name, identity is per-socket and resets on disconnect, and impersonation is trivial. Add real accounts so identity persists across sessions and devices. Easiest path for v1: skip self-managed passwords (no password-reset/breach surface) and support OAuth sign-in via Google / Apple / Meta only.

2. **SQLite backend for accounts and messages.** All state currently lives in process memory in `server.js`, so a container restart wipes every account, message, and group. Persist users + messages to a SQLite file mounted on a docker named volume. `backend/src/storage.ts` already gestures at this; pick a single source of truth once accounts are real.

3. **HTTPS.** Required for two things that the rest of the roadmap depends on:
   - **WebRTC voice/video calling** — browsers refuse `getUserMedia` in non-secure contexts, so the camera and mic can't be accessed from plain `http://` URLs even on a LAN.
   - **OAuth sign-in** — Google / Apple / Meta all require HTTPS redirect URIs at the consent step.

   Cheapest path: a Caddy or nginx reverse-proxy in front of the node app with a self-signed cert for LAN testing, and a real cert (Let's Encrypt) once there's a public hostname.
