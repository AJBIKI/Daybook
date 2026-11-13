# Daybook V1 — Daily Task Management & Planner

> A focused, production-grade daily task management and reminder mobile application engineered with **React Native CLI (0.88.1, TypeScript, Hermes)** and an **Express.js (TypeScript)** REST API backed by **MongoDB**.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Client ["Mobile Client (Android React Native)"]
        UI["React Native UI Screens<br/>(Today, Calendar, Stats, Settings, TaskModal)"]
        TQ["TanStack Query Cache<br/>(Optimistic Mutations & Sync Engine)"]
        KS["Hardware Keystore / Keychain<br/>(Encrypted JWT Refresh Tokens)"]
        NOTIF["Notifee Engine<br/>(Device-Local Exact Alarm Reminders)"]
    end

    subgraph Gateway ["Security & API Middleware"]
        SEC["Helmet + Strict CORS + Rate Limiter"]
        AUTH_MW["Bearer JWT Authentication Guard"]
        VALID["Zod Schema Validation Middleware"]
    end

    subgraph Backend ["Backend API Service (Express + TypeScript)"]
        AUTH_ROUTER["/api/v1/auth<br/>(Register, Login, Refresh, Me)"]
        TASK_ROUTER["/api/v1/tasks<br/>(CRUD, Day Filtering, Stats Summary)"]
        HEALTH["/health<br/>(Liveness & Readiness Probes)"]
    end

    subgraph Database ["Persistence Layer"]
        MONGO[("MongoDB Atlas / Local Community<br/>- Users Collection (bcrypt cost 12)<br/>- Tasks Collection (compound indexes)")]
    end

    UI --> TQ
    UI --> NOTIF
    TQ -->|Secure Token Retrieval| KS
    TQ -->|HTTPS REST Requests| SEC
    SEC --> VALID
    VALID --> AUTH_MW
    AUTH_MW --> AUTH_ROUTER
    AUTH_MW --> TASK_ROUTER
    AUTH_ROUTER --> MONGO
    TASK_ROUTER --> MONGO
    HEALTH --> MONGO
```

---

## 2. Prerequisites

Ensure your development environment meets the following specifications:

| Requirement | Minimum Supported Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.18.0+` (LTS) | JavaScript runtime for server and Metro bundler |
| **npm** | `v10.x+` | Package manager |
| **Java JDK** | `OpenJDK 17` (Eclipse Temurin 17) | Android compilation and Gradle toolchain |
| **Android SDK** | `API Level 35` (Platform 35.0.0, Build-Tools 35.0.0) | Target compilation runtime |
| **Android NDK** | `27.1.12297006` + CMake `3.22.1` | Hermes C++ engine & native JNI compilation |
| **MongoDB** | `v7.0+` (or MongoDB Atlas Free M0 cluster) | Document database storage |
| **Git** | `2.x+` | Version control |

---

## 3. Getting Started & Local Setup

### 3.1. Clone Repository
```bash
git clone https://github.com/your-username/daybook.git
cd daybook
```

### 3.2. Server Setup & Launch
```bash
cd server
npm install

# Create environment configuration from example
copy .env.example .env
```

Verify or configure `server/.env`:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/daybook
JWT_ACCESS_SECRET=your-secure-access-secret-minimum-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-minimum-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_LEVEL=info
```

Run server commands:
```bash
# Start in development mode with hot-reloading
npm run dev

# Run unit and integration tests
npm test

# Run TypeScript typechecker and ESLint
npm run typecheck
npm run lint

# Compile production bundle
npm run build
```

### 3.3. Mobile Client Setup & Launch
```bash
cd mobile
npm install

# Reverse Android device port to local server
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8081 tcp:8081

# Start Metro bundler
npm start

# In a separate terminal, deploy debug build to connected device/emulator:
npm run android
```

---

## 4. API Reference

All protected endpoints require an `Authorization: Bearer <access_token>` header.

| Method | Path | Auth | Request Body | Success (2xx) | Errors (4xx/5xx) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | None | `200 { status: 'ok', uptime, timestamp }` | `500` Database down | Liveness and health probe for orchestrators and uptime checkers. |
| `POST` | `/api/v1/auth/register` | None | `{ name, email, password }` | `201 { user, accessToken, refreshToken }` | `400` Validation, `409` Email exists | Creates a new user profile with bcrypt-hashed credentials. |
| `POST` | `/api/v1/auth/login` | None | `{ email, password }` | `200 { user, accessToken, refreshToken }` | `400` Validation, `401` Invalid credentials | Authenticates user; constant-time check protects against email enumeration. |
| `POST` | `/api/v1/auth/refresh` | None | `{ refreshToken }` | `200 { accessToken, refreshToken }` | `400` Missing token, `401` Expired/Invalid token | Rotates JWT refresh tokens securely. |
| `POST` | `/api/v1/auth/logout` | Bearer | `{ refreshToken? }` | `200 { message: 'Logged out successfully' }` | `401` Unauthorized | Invalidates active user session. |
| `GET` | `/api/v1/auth/me` | Bearer | None | `200 { user: { id, name, email, createdAt } }` | `401` Unauthorized | Returns the authenticated profile identity. |
| `POST` | `/api/v1/tasks` | Bearer | `{ title, description?, scheduledDate, priority?, estimatedMinutes?, reminderAt? }` | `201 { task }` | `400` Validation, `401` Unauthorized | Creates a new scheduled task for the authenticated user. |
| `GET` | `/api/v1/tasks` | Bearer | Query: `startDate`, `endDate`, `status`, `priority`, `page`, `limit` | `200 { tasks: Task[], pagination: { total, page, totalPages } }` | `400` Validation, `401` Unauthorized | Retrieves scoped, paginated tasks within a given date range. |
| `GET` | `/api/v1/tasks/:id` | Bearer | None | `200 { task }` | `401` Unauthorized, `404` Not found | Fetches an isolated task instance owned by the caller. |
| `PATCH` | `/api/v1/tasks/:id` | Bearer | `{ title?, description?, status?, priority?, scheduledDate?, reminderAt? }` | `200 { task }` | `400` Validation, `401` Unauthorized, `404` Not found | Updates task attributes or toggles completion status. |
| `DELETE`| `/api/v1/tasks/:id` | Bearer | None | `204 No Content` | `401` Unauthorized, `404` Not found | Permanently deletes a task instance owned by the caller. |
| `GET` | `/api/v1/tasks/stats/summary` | Bearer | Query: `range?: 'week' \| 'month' \| 'all'` | `200 { total, completed, pending, completionRate, streakDays }` | `401` Unauthorized | Aggregates user productivity metrics and completion streak. |

---

## 5. Key Architectural Decisions

### 5.1. MongoDB over PostgreSQL / SQLite (Backend)
- **Document Model Alignment**: Tasks feature flexible metadata (sub-checklist items, recurring metadata, time tags) that map cleanly into BSON documents without rigid joins.
- **Fast Iteration & Schema Evolution**: Mongoose schemas provide strict TypeScript typing in application code while allowing index optimizations (`userId + scheduledDate + status`) without migration bottlenecks.

### 5.2. TanStack Query over Redux Toolkit
- **Declarative Server Cache**: Solves cache invalidation, background refetching, and stale-while-revalidate lifecycles out-of-the-box with zero boilerplate reducer code.
- **Built-in Optimistic Mutations**: Allows tasks to instantly toggle completion and update client UI, rolling back automatically if network transmission fails.

### 5.3. Hardware Keystore / Keychain over AsyncStorage for Tokens
- **Cryptographic Security**: Plain `AsyncStorage` stores serialized strings unencrypted in app sandbox storage.
- `react-native-keychain` delegates to Android KeyStore with hardware-backed encryption (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), ensuring sensitive JWT refresh tokens cannot be dumped from filesystem backups or ADB debugging without physical device unlock.

### 5.4. Page-based Pagination over Cursor for V1
- **Day Planner Bucket Predictability**: Daybook views are organized into discrete date buckets (Today, Upcoming, Completed). Page-based querying allows the client to fetch complete date blocks and compute exact completion stats without complex cursor reconstruction.

### 5.5. Client-Sent Day Boundaries (Timezone Isolation)
- **Timezone Drift Protection**: The mobile client sends explicit ISO string date boundaries (`startOfDay` and `endOfDay` computed via `date-fns`) matching the user's active device timezone. The server operates in pure UTC, preventing midnight rollover bugs across differing global timezones.

### 5.6. Optimistic Rollbacks with Offline Notifee Sync
- **Instant Responsiveness**: Task state changes are immediately rendered in the UI with haptic feedback.
- If the network drops or rejects the operation, the mutation rollback restores UI consistency while `mobile/src/lib/reminders.ts` ensures scheduled Android notification triggers remain synchronized with local task states.

---

## 6. Production Deployment Guide

### 6.1. Backend Deployment (Render.com + MongoDB Atlas)

#### Step 1: Provision MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster in your preferred region.
3. Under **Security > Database Access**, create an application user (e.g. `daybook_app`) with read/write privileges to the `daybook` database.
4. Under **Security > Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) or restrict to Render outbound CIDR blocks.
5. Copy your connection URI:
   ```
   mongodb+srv://daybook_app:<PASSWORD>@daybook-cluster.xxxxxx.mongodb.net/daybook?retryWrites=true&w=majority
   ```

#### Step 2: Deploy Web Service to Render.com
1. Create an account on [Render](https://render.com) and click **New > Web Service**.
2. Connect your Git repository.
3. Configure the build parameters:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `MONGODB_URI`: `mongodb+srv://daybook_app:...@daybook-cluster...`
   - `JWT_SECRET`: *(Generate a secure 64-char string: `e.g. 7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a`)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*`
   - `LOG_LEVEL`: `info`
5. Click **Create Web Service**. After deployment finishes, verify health via:
   ```bash
   curl -I https://<your-render-subdomain>.onrender.com/health
   ```

---

### 6.2. Android Release APK Build & Distribution

#### Step 1: Generate Release Keystore
The project includes release signing configuration. To generate your own PKCS12 keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore mobile/android/app/daybook-release.keystore -alias daybook -keyalg RSA -keysize 2048 -validity 10000
```

#### Step 2: Configure Gradle Properties
Add signing variables to your user gradle file (`~/.gradle/gradle.properties`):
```properties
DAYBOOK_RELEASE_STORE_FILE=daybook-release.keystore
DAYBOOK_RELEASE_KEY_ALIAS=daybook
DAYBOOK_RELEASE_STORE_PASSWORD=YourStorePassword
DAYBOOK_RELEASE_KEY_PASSWORD=YourKeyPassword
```

#### Step 3: Compile Release APK
```bash
cd mobile/android
./gradlew assembleRelease
```
The compiled, signed, and ProGuard-optimized APK will be generated at:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

#### Step 4: Verify APK Signature
```bash
keytool -printcert -jarfile mobile/android/app/build/outputs/apk/release/app-release.apk
```

#### Step 5: Distribution
- **Google Play Console**: Upload the release build to Internal Testing / Production tracks.
- **Firebase App Distribution**: Distribute APK directly to beta testers via CLI:
  ```bash
  firebase appdistribution:distribute mobile/android/app/build/outputs/apk/release/app-release.apk --app <FIREBASE_APP_ID> --groups "testers"
  ```
- **Direct Sideloading**: Transfer `app-release.apk` to any Android 10+ (API 29+) device and install directly.

---

## 7. Known Limitations & V2 Roadmap

- **V1 Offline Mode**: Reminders are scheduled directly on the device using Notifee and persist offline. However, mutations performed while completely disconnected require reconnection to sync with the backend. Full offline-first SQLite/WatermelonDB sync is scheduled for **V2**.
- **Push Notifications vs. Device-Local Alarms**: V1 relies on device-local Android AlarmManager notifications (`@notifee/react-native`). V2 will introduce remote cloud push triggers via Firebase Cloud Messaging (FCM).
- **Free-Tier Render Spin-down**: When deployed on Render free tier, instances spin down after 15 minutes of inactivity. For production deployments, an upgraded standard tier instance or a 14-minute cron heartbeat ping is recommended.
- **V2 Roadmap**:
  1. Recurring tasks engine (daily, weekly, custom RFC 5545 RRULEs).
  2. Sub-tasks & nested checklists.
  3. Tags & color-coded category labels.
  4. Real-time multi-device sync via WebSockets / SSE.
  5. Dark / Light / System auto theme toggle with custom accent palettes.

---

## 8. License

This project is licensed under the MIT License — see the LICENSE file for details.
