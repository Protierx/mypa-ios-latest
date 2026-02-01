# MYPA - Social Productivity Platform

MYPA (Make Your Plan Accountable) is a social-first productivity app that combines task management with gamification and accountability features.

## Features

- 📋 Task Management & Planning
- 🎮 Gamification (XP, Levels, Streaks)
- 👥 Accountability Circles
- 🏆 Challenges & Competitions
- 🤖 AI-Powered Assistance
- 📊 Analytics & Insights

## Tech Stack

### Frontend
- React Native + Expo
- TypeScript
- React Navigation

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- Socket.io for real-time features

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Xcode 14+ (for iOS)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cd ios && pod install && cd ..
npm start
npm run ios
```

## License

Proprietary - All rights reserved

## Contact

For inquiries, please open an issue in this repository.
