# Deployment — SCCC Management System

Target: **Hostinger VPS** (Ubuntu 22.04+, Node 20), Next.js under **PM2** behind
**Nginx** with HTTPS via **certbot**. The same build also runs unchanged on
Vercel (set the env vars in the dashboard and deploy — skip §2–§8 below).

Owner checklist before you start (PRD §9): Neon `DATABASE_URL`, PromptPay ID,
bank name/account, Terms & Privacy URLs, admin email + password, a domain or
subdomain pointing at the VPS IP.

---

## 1. Neon Postgres

1. Create a project at <https://neon.tech> → copy the **pooled** connection
   string (host contains `-pooler`), e.g.
   `postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/sccc?sslmode=require`.
2. Keep it for `DATABASE_URL` below. (Singapore `ap-southeast-1` is closest to
   Bangkok.)

## 2. Server prerequisites

```bash
# as a sudo user on the VPS
sudo apt update && sudo apt install -y curl git nginx
# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# pnpm + pm2
sudo corepack enable && corepack prepare pnpm@latest --activate
sudo npm install -g pm2
```

## 3. Get the code & install

```bash
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www
git clone <your-repo-url> sccc && cd sccc   # or rsync the project up
pnpm install --frozen-lockfile
```

## 4. Environment

```bash
cp .env.example .env
nano .env
```

Fill in every value. Generate the two secrets:

```bash
# ADMIN_PASSWORD_HASH — bcrypt hash of the admin password
pnpm create-admin admin@yourshop.com 'your-strong-password'   # prints the hash + upserts the admin row
# SESSION_SECRET — any long random string
openssl rand -base64 48
```

Set `UPLOAD_DIR=/var/sccc/uploads` and create it:

```bash
sudo mkdir -p /var/sccc/uploads && sudo chown $USER:$USER /var/sccc/uploads
```

## 5. Database migrate + seed

```bash
pnpm db:migrate   # creates all tables
pnpm db:seed      # inserts the 11 products (idempotent)
```

(`pnpm create-admin ...` in §4 already inserted the admin row. If you skipped it,
run it now with `DATABASE_URL` set.)

## 6. Build & start under PM2

```bash
pnpm build
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # run the printed command once so PM2 resurrects on reboot
```

The app now listens on `127.0.0.1:3000`.

## 7. Nginx reverse proxy

`/etc/nginx/sites-available/sccc`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Proof photos are uploaded here — allow room above the ~500KB client target.
    client_max_body_size 12M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sccc /etc/nginx/sites-enabled/sccc
sudo nginx -t && sudo systemctl reload nginx
```

## 8. HTTPS (certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com    # auto-edits the server block + auto-renews
```

## 9. Signup QR code

Generate the QR parents scan at the door:

```bash
pnpm signup-qr https://your-domain.com     # writes signup-qr.png → https://your-domain.com/signup
```

Print `signup-qr.png` and place it at the entrance.

---

## Updating a running deployment

```bash
cd /var/www/sccc
git pull
pnpm install --frozen-lockfile
pnpm db:migrate        # if the schema changed
pnpm build
pm2 reload sccc
```

## Backups & notes

- **Database**: Neon keeps automatic point-in-time backups; no cron needed here.
- **Proof photos** live on disk at `UPLOAD_DIR` — include `/var/sccc/uploads` in
  your VPS backup/snapshot routine (they are *not* in Neon).
- **Logs**: `pm2 logs sccc`. **Restart**: `pm2 restart sccc`.
- Storage is abstracted behind `src/lib/storage.ts`; swap it for S3 later without
  touching callers (the Vercel path would need this since its disk is ephemeral).
