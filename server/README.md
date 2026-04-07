# CLMS Server (minimal scaffold)

Quick start

1. Copy `.env.example` to `.env` and edit values.
2. Install dependencies:

```bash
cd server
npm install
```

3. Seed admin (optional):

```bash
npm run seed
```

4. Start server:

```bash
npm run dev
```

API base: `http://localhost:4000/api`

Notes
 - For production use a managed Postgres DB and set `DATABASE_URL` in your environment.
 - On Render, create a Postgres instance and add the provided `DATABASE_URL` to your Web Service environment variables. The app will use that automatically.
