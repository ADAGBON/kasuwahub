# Deploying KasuwaHub

| Part | Host | Plan | Address (example) |
|---|---|---|---|
| Database | MongoDB Atlas | M0 Free | `cluster0.xxxx.mongodb.net` |
| API (Express) | Render | Free web service | `https://kasuwahub-api.onrender.com` |
| Website (React) | Netlify | Free | `https://kasuwahub.netlify.app` |

```
Browser ──► Netlify (static React build) ──fetch /api──► Render (Express API) ──► MongoDB Atlas
                                         ◄── Paystack webhook (optional) ──
```

## 0. Before you start
- Code pushed to GitHub (`ADAGBON/kasuwahub`).
- MongoDB Atlas: **Network Access** includes `0.0.0.0/0` (Render's IP addresses change).
- Products seeded in Atlas (`npm run seed` from your laptop already did this).
- Recommended: give the database user a strong password (Atlas → Database Access → Edit → Autogenerate) and update `MONGODB_URI` in your local `.env`.

## 1. API on Render
1. Sign in at **render.com** with GitHub.
2. **New → Blueprint** → select the `kasuwahub` repo. Render reads `render.yaml` and proposes the `kasuwahub-api` service.
3. Fill in the values it asks for:
   - `MONGODB_URI`: your Atlas string ending in `/kasuwahub?retryWrites=true&w=majority`
   - `CLIENT_URL`: put `http://localhost:5173` for now (you'll change it in step 3)
   - `PAYSTACK_SECRET_KEY`: leave **empty** for demo payments, or paste a Paystack **test** secret key (`sk_test_…`)
4. Click **Apply**. The first build takes 2–4 minutes.
5. Open `https://<your-service>.onrender.com/api/health`. It should show `"status":"ok","db":"connected"`.

> No Blueprint option? Use **New → Web Service** instead: Root Directory `server`, Build `npm ci`, Start `npm start`, Health check path `/api/health`, then add the same environment variables plus `NODE_ENV=production` and a long random `JWT_SECRET`.

## 2. Website on Netlify
1. Sign in at **app.netlify.com** with GitHub → **Add new site → Import an existing project → GitHub → kasuwahub**.
2. Settings:
   - **Base directory:** `client`
   - Build command `npm run build` and publish directory `client/dist` are read from `client/netlify.toml`
3. **Environment variables → Add:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. **Deploy**. Then optionally go to Site configuration → Change site name to `kasuwahub` (→ `https://kasuwahub.netlify.app`).

> `VITE_API_URL` is baked in at build time. If you change it, use **Deploys → Trigger deploy → Clear cache and deploy site**.

## 3. Connect them
On Render → `kasuwahub-api` → **Environment** → set `CLIENT_URL` to your Netlify address, e.g.
`https://kasuwahub.netlify.app` (no trailing slash; add `,http://localhost:5173` if you also want local dev to work). Save. Render redeploys automatically.

## 4. Secure the admin account
On your laptop, set a strong `ADMIN_PASSWORD` (10+ characters) in `server/.env`, then:
```bash
cd server
npm run admin:password
```
This updates the admin in Atlas, so it applies to the live site immediately.

## 5. Test the live site
Automated (from `server/`):
```bash
SMOKE_ADMIN_EMAIL=admin@kasuwahub.ng SMOKE_ADMIN_PASSWORD='your-admin-password' \
npm run smoke -- --api https://<your-service>.onrender.com --site https://<your-site>.netlify.app
```
It checks: API health and DB, website and deep links, `VITE_API_URL`, CORS, products/search/filters, register/login/JWT, access control, cart, checkout and payment, order history, and admin product CRUD and orders (14 checks). It creates one test customer and one order, then cancels that order.

Manual checklist (phone + laptop): home → shop → search → product → add to cart → register → checkout → pay → My orders → admin dashboard → mark order processing/shipped/delivered.

## Paystack (optional, test mode)
1. Paystack dashboard → Settings → API Keys & Webhooks → copy the **Test Secret Key** into `PAYSTACK_SECRET_KEY` on Render.
2. Set the **Test Webhook URL** to `https://<your-service>.onrender.com/api/payments/webhook`.
3. Pay with Paystack's test card (shown on the Paystack checkout page).

## Troubleshooting
| Symptom | Fix |
|---|---|
| First load takes ~1 minute | Render free instances sleep after 15 min idle; the site shows a "waking up" notice. Normal. |
| "Cannot reach the KasuwaHub server" | `VITE_API_URL` wrong or missing → fix on Netlify and **Clear cache and deploy** |
| Browser console: *blocked by CORS policy* | `CLIENT_URL` on Render must exactly match the Netlify address (https, no trailing slash) |
| Render log: *Could not connect to MongoDB* | Check `MONGODB_URI` and Atlas Network Access `0.0.0.0/0` |
| 404 when refreshing `/shop` on Netlify | Base directory must be `client` so `netlify.toml` is used |
| "Your session has expired" after redeploy | Only if `JWT_SECRET` changed; sign in again |
