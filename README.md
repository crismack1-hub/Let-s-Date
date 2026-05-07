# WhatsApp-like Messaging App

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
