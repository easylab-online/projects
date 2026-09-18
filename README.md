# مشاريع EasyLab / EasyLab Projects

لوحة ويب داخلية (Next.js + PWA) لعرض مشاريع EasyLab، محمية بكلمة مرور، وقابلة للنشر على Cloudflare Workers عبر `@opennextjs/cloudflare`.

Internal project gallery (Next.js + PWA) for EasyLab — password-gated, Arabic-first RTL UI, deployable to Cloudflare Workers.

**Domain:** `projects.easylab.online`  
**Worker name:** `easylab-projects`  
**Repo:** https://github.com/easylab-online/projects

---

## العربية

### المتطلبات
- Node.js 22+ (موصى به لـ Wrangler 4) أو 20+ للتطوير المحلي
- حساب Cloudflare مع Workers مفعّل
- نطاق `easylab.online` على Cloudflare DNS

### التطوير المحلي
```bash
npm install
npm run icons   # يولّد أيقونات PNG من scripts/icon-pngs.json
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) — سيُطلب منك تسجيل الدخول.

كلمة المرور الافتراضية (مضمّنة في الكود): `wajih`

### البناء
```bash
npm run build
```

### النشر على Cloudflare Workers
```bash
npx wrangler login   # مرة واحدة
npm run deploy       # يبني عبر OpenNext ثم ينشر
```

معاينة محلية ببيئة Workers:
```bash
npm run preview
```

### ربط النطاق `projects.easylab.online`
1. انشر الـ Worker (`easylab-projects`) بالأمر أعلاه.
2. في لوحة Cloudflare → **Workers & Pages** → `easylab-projects` → **Settings** → **Domains & Routes**.
3. أضف نطاقاً مخصصاً: `projects.easylab.online`.
4. تأكد من سجل DNS (عادةً يُنشأ تلقائياً كـ CNAME/Proxied إلى الـ Worker):
   - **Type:** CNAME (أو A/AAAA عبر Proxied)
   - **Name:** `projects`
   - **Target:** الـ Worker / `easylab-projects.<account>.workers.dev`
   - **Proxy:** مفعّل (سحابة برتقالية)
5. اختياري: فعّل `routes` في `wrangler.jsonc` إذا كنت تفضّل الإعداد عبر الملف.

### إضافة مشروع جديد
عدّل الملف `src/data/projects.ts` وأضف عنصراً إلى المصفوفة `projects`.

### هيكل مختصر
- `src/app` — مسارات App Router
- `src/components` — واجهة الدخول وبطاقات المشاريع
- `src/data/projects.ts` — بيانات المشاريع
- `src/lib/auth.ts` — بوابة كلمة المرور والكوكي
- `src/middleware.ts` — حماية الصفحات وواجهات API
- `wrangler.jsonc` / `open-next.config.ts` — إعداد Cloudflare

---

## English

### Requirements
- Node.js 22+ recommended (Wrangler 4); 20+ fine for local `next dev`
- Cloudflare account with Workers enabled
- `easylab.online` zone on Cloudflare DNS

### Local development
```bash
npm install
npm run icons   # restores PNG icons from scripts/icon-pngs.json
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). You will be prompted to log in.

Default password (hardcoded): `wajih`

### Build
```bash
npm run build
```

### Deploy to Cloudflare Workers
```bash
npx wrangler login   # once
npm run deploy       # OpenNext build + deploy
```

Workers-runtime local preview:
```bash
npm run preview
```

### DNS / custom domain `projects.easylab.online`
1. Deploy the worker named `easylab-projects`.
2. Cloudflare Dashboard → **Workers & Pages** → `easylab-projects` → **Settings** → **Domains & Routes**.
3. Add custom domain: `projects.easylab.online`.
4. Ensure DNS (often auto-created, Proxied):
   - **Type:** CNAME (or proxied record)
   - **Name:** `projects`
   - **Target:** worker / `easylab-projects.<account>.workers.dev`
   - **Proxy:** ON (orange cloud)
5. Optionally uncomment `routes` in `wrangler.jsonc`.

### Extending projects
Edit `src/data/projects.ts` and append to the `projects` array.

### PWA
Uses Serwist (`@serwist/next`) — service worker generated to `public/sw.js` on production build; web app manifest via `src/app/manifest.ts`.

### Security note
This app uses a **simple hardcoded password gate** for an internal gallery. Do not store additional secrets in the repo.
