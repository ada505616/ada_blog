# Ada Blog Web Front

Vue 3 frontend for the blog public site and admin console.

## Project Guide

For module responsibilities, routing, API calling relationships, and common change entry points, see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

## Start

```bash
npm install
npm run dev
```

## Environment Modes

Local development:

```bash
npm run dev
```

Uses:

- `VITE_APP_BASE_PATH=/`
- `VITE_API_BASE_URL=http://localhost:3000`

Remote API test mode:

```bash
npm run test
```

Uses:

- `VITE_APP_BASE_PATH=/`
- `VITE_API_BASE_URL=http://43.131.36.226:3000`

Production build:

```bash
npm run build
```

Uses:

- `VITE_APP_BASE_PATH=/blog/`
- `VITE_API_BASE_URL=http://43.131.36.226:3000`

## URLs

Default local frontend URL:

- `http://localhost:5173`

Production target URL:

- `http://43.131.36.226/blog`

## Deploy

Build for the server subpath `/blog`:

```bash
npm run build
```

The production build already uses:

- `VITE_APP_BASE_PATH=/blog/`
- `VITE_API_BASE_URL=http://43.131.36.226:3000`

After building, upload the contents of `dist/` to your server's `/blog` static directory.

Detailed deployment steps:

- See [DEPLOY_BLOG.md](./DEPLOY_BLOG.md)
