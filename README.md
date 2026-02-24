# Fleet Manager Frontend

React + Vite frontend for the Inspection System.

## Local development

1. Install dependencies:
   `npm install`
2. Set API base URL in `.env` (or `.env.local`):
   `VITE_API_BASE_URL=http://localhost:8080`
3. Start dev server:
   `npm run dev`

## Dokploy deployment

This repo is deployed as a standalone frontend service using Docker.

- Dockerfile path: `./Dockerfile`
- Container port: `80`
- Domain: your frontend domain (for example `fleet.yourdomain.com`)
- Build arg:
  `VITE_API_BASE_URL=https://fms.yourdomain.com`

Note: Vite injects env values at build time, so API URL must be provided during build.
Always include the full scheme (`https://...`), not just the hostname.

For same-domain routing (recommended for this deployment), set:

`VITE_API_BASE_URL=/`

Then configure Dokploy reverse proxy to route `/api/*` to your backend service with:

- Route A: `fleet.amindoestech.space` + path `/api` -> backend service
- Route B: `fleet.amindoestech.space` + path `/` -> frontend service
- Backend route precedence above `/`
- `Strip Path` disabled on `/api` route
