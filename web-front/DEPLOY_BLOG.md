# Deploy Ada Blog Frontend To `/blog`

This frontend is already configured for a production subpath deployment:

- Frontend URL: `http://43.131.36.226/blog`
- API URL: `http://43.131.36.226:3000`
- Vite base path: `/blog/`

## 1. Build locally

Run this in `web-front`:

```bash
npm install
npm run build
```

The build output is generated in `dist/`.

## 2. Upload static files to the server

Recommended server target directory:

```bash
/var/www/ada-blog/blog
```

Create the directory on the server if it does not exist:

```bash
sudo mkdir -p /var/www/ada-blog/blog
```

Upload the built files. From your local machine:

```bash
scp -r dist/* root@43.131.36.226:/var/www/ada-blog/blog/
```

If your login user is not `root`, replace it with your actual server user.

## 3. Configure Nginx

Add a server config similar to this:

```nginx
server {
    listen 80;
    server_name 43.131.36.226;

    root /var/www/ada-blog;
    index index.html;

    location = /blog {
        return 301 /blog/;
    }

    location /blog/ {
        alias /var/www/ada-blog/blog/;
        try_files $uri $uri/ /blog/index.html;
    }
}
```

If you already have an existing server block, merge only the `/blog` related rules into it.

Then test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Verify

Open:

- `http://43.131.36.226/blog`

Then verify:

- Home page loads normally
- Refreshing a frontend route like `/blog/archive` does not return `404`
- Browser network requests go to `http://43.131.36.226:3000`

## 5. Backend CORS check

Because the frontend will now be loaded from:

- `http://43.131.36.226`

Your backend should allow that origin.

In `api-server/.env`, make sure `CORS_ORIGIN` includes:

```env
CORS_ORIGIN=http://43.131.36.226
```

If you later add HTTPS or a domain name, update it accordingly.

## 6. Update flow

When you modify the frontend again:

```bash
npm run build
scp -r dist/* root@43.131.36.226:/var/www/ada-blog/blog/
```

No Node.js process is required for the frontend static files. Nginx is enough.
