# EMDR Platform

EMDR Platform is a full-stack web solution that allows therapists to deliver Eye Movement Desensitization and Reprocessing sessions remotely. It offers secure client management, scheduling, and built-in PHI protection so mental health professionals can confidently provide therapy online.

**Tech:** Node.js, Express, React, TypeScript, Prisma, PostgreSQL, Redis, Docker, Twilio, Google Cloud Speech, Jest.

## Features
- User authentication with JWT and role-based access
- Appointment scheduling and calendar management
- PHI detection, encryption and audit logging
- Video session integration via Twilio (placeholder)
- React front end styled with Tailwind CSS

## Architecture
- **Backend:** Express + TypeScript API using Prisma ORM and PostgreSQL for persistent storage. Redis is available for caching. Security middlewares handle PHI tokenization and encryption.
- **Frontend:** React app built with TypeScript and Tailwind CSS. Uses React Router for navigation and integrates with backend APIs.
- **Dev Environment:** Docker Compose starts Postgres and Redis. Workspace scripts use `concurrently` to run backend and frontend during development.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start databases:
   ```bash
   docker-compose up -d
   ```
3. Initialize the database schema:
   ```bash
   cd packages/backend
   npx prisma migrate dev --name init
   cd ../..
   ```
4. Run the application in development mode:
   ```bash
   npm run dev
   ```
   This starts both the API on port 4000 and the React frontend on port 3000.

## Testing
Run the combined test suites:
```bash
npm test
```

## Repository Layout
- `packages/backend` – Express API and Prisma models
- `packages/frontend` – React application
- `docker-compose.yml` – Local Postgres and Redis services

## Contributing
Pull requests are welcome. Please run lint and tests before submitting:
```bash
npm run lint
npm test
```

## License
UNLICENSED – see package.json
