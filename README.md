# Heirloom - The Trust Bridge for Your Digital Legacy

Heirloom is an **Identity-Driven Digital Legacy & Emergency Access Platform** powered by enterprise Identity and Access Management (IAM) principles and Ping Identity technologies. It is not a password manager; instead, it governs digital inheritance and break-glass access through granular conditional policies.

---

## 🚀 Quick Start Guide

### Option 1: Running in Containerized Mode (Production Packaging)
To spin up the entire multi-container architecture (PostgreSQL Database, Node/Express Backend API, Next.js Frontend App) simultaneously, execute:

```bash
# Build and run containers
docker compose up --build
```
Once initialized:
* **Frontend Portal:** `http://localhost:3000`
* **Backend API Gateway:** `http://localhost:3001`

---

### Option 2: Running Locally for Development

#### Step 1: Initialize the Relational Database
Ensure a PostgreSQL database is running, or sync environment variables inside `/backend/.env`.

Inside the `/backend` folder:
```bash
# Install node packages
npm install

# Run database schema migrations
npx prisma db push

# Start Express & WebSocket Server in development mode
npm run dev
```

#### Step 2: Initialize Next.js Portal
Inside the `/frontend` folder:
```bash
# Install UI packages
npm install

# Start Next.js App development server
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 🛠 Project Workspace Directory Structure

* `/frontend` - Next.js (App Router), Tailwind CSS, Framer Motion, standard Lucide icons.
* `/backend` - Node.js, Express, TypeScript, Prisma.
  * `src/integrations` - Ping Identity Adapter interfaces and mock adapters.
  * `src/jobs` - Background sweep worker revoking expired access grants.
  * `src/utils/telemetry.ts` - Real-time JSON event pipeline sending console logs over WebSockets.

---

## 📡 Core API Gateway Handlers

Every API endpoint responds with a standardized wrapper containing `success`, `message`, `data`, `timestamp`, and `requestId` fields.

### Authentication (`/api/v1/auth/...`)
* `POST /auth/register` - Registers and syncs user to mock PingDS and local database.
* `POST /auth/login` - Authenticates credentials, assesses session risk via PingOne Protect, and triggers step-up MFA if flagged.
* `POST /auth/mfa/verify` - Validates TOTP/OTP session codes (Default sandbox OTP: `123456`).

### Asset Vault (`/api/v1/assets/...`)
* `POST /assets` - Creates and encrypts new asset contents using AES-256-GCM envelope keys.
* `GET /assets` - Lists assets belonging to the active owner.
* `GET /assets/:id` - Resolves details, decrypting the payload if the caller matches ownership or active emergency grant conditions.

### Visual Policies (`/api/v1/policies/...`)
* `POST /policies` - Compiles conditional visual blocks (IF relationship AND trigger THEN grant assets FOR duration).
* `GET /policies` - Lists compiled rules.

### Emergency break-glass (`/api/v1/emergency/...`)
* `POST /emergency/request` - Initiates access request.
* `POST /emergency/:id/evidence` - Registers physician/medical verification files, transitioning request status to `UNDER_VERIFIER_REVIEW`.
* `POST /emergency/:id/approve` - Validates verifier credentials and provisions access.
* `GET /emergency/vault/:token` - Ephemeral public token decrypt portal.
