# TaskBoard Frontend

Single-page React + Vite + TypeScript app for TaskBoard services. Uses Chakra UI, Zustand, and `@hello-pangea/dnd`.

## Requirements

- Node.js 20+
- npm (ships with Node)
- Backend services running locally (see `.env.example` for URLs)

## Env variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update URLs if your backend runs on different ports.

## Local development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. Make sure backend services are running and accept CORS from this origin.

## Tests & lint

```bash
npm run lint
# Add tests when available:
# npm run test
```

## Production build

```bash
npm run build
npm run preview
```

## Docker

Multi-stage Dockerfile builds the SPA and serves it with Nginx.

```bash
docker build -t taskboard-frontend .
docker run -p 8080:80 --env-file .env taskboard-frontend
```

## Deploy hints

- For static hosting (S3, CloudFront, Vercel) upload `dist/`.
- To run with `docker-compose`, mount `.env` and expose port 80 (or 8080) alongside backend services.
