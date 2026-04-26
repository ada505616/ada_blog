# Ada Blog API Server

Node.js + Express + SQLite backend for a personal blog admin system.

## Stack

- Node.js
- Express
- SQLite
- JWT access token + refresh session
- Editor.js content storage (`content_json`, `content_html`, `content_text`)
- Local media upload and media library

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start the server:

```bash
npm run dev
```

The server will initialize the SQLite schema automatically and seed a default admin account on first boot.

Default admin credentials come from `.env`:

- username: `admin`
- password: `admin123456`

## API Notes

- Admin login returns `accessToken` and `refreshToken`
- `Authorization: Bearer <accessToken>` is required for admin endpoints except login/refresh
- Article delete and comment delete use soft delete
- SQLite stores `json` and `longtext` fields as `TEXT`, which is normal for SQLite
- Uploaded files are stored locally under `UPLOAD_DIR` and exposed at `/uploads/*`

## Main Endpoints

### Admin

- `POST /admin/auth/login`
- `POST /admin/auth/logout`
- `POST /admin/auth/refresh`
- `GET /admin/auth/me`
- `GET /admin/articles`
- `POST /admin/articles`
- `GET /admin/articles/:id`
- `PUT /admin/articles/:id`
- `DELETE /admin/articles/:id`
- `POST /admin/articles/:id/publish`
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `GET /admin/tags`
- `POST /admin/tags`
- `PUT /admin/tags/:id`
- `DELETE /admin/tags/:id`
- `GET /admin/comments`
- `PUT /admin/comments/:id/audit`
- `DELETE /admin/comments/:id`
- `GET /admin/media-files`
- `GET /admin/media-files/:id`
- `POST /admin/media-files/upload`
- `POST /admin/media-files/editorjs`
- `DELETE /admin/media-files/:id`

### Public

- `GET /articles`
- `GET /articles/:slug`
- `GET /categories`
- `GET /tags`
- `GET /articles/:id/comments`
- `POST /articles/:id/comments`

## Media Upload

### Standard Upload

Use multipart form-data with field name `file`:

```bash
curl -X POST http://localhost:3000/admin/media-files/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/cover.png"
```

### Editor.js Upload

This endpoint returns the structure expected by the Editor.js image tool:

```bash
curl -X POST http://localhost:3000/admin/media-files/editorjs \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/content-image.png"
```
