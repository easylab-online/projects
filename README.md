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
npm run icons   # يولّد أيقونات PNG
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) — سيُطلب منك تسجيل الدخول.

كلمة المرور الافتراضية (مضمّنة في الكود): `wajih`

### البناء
```bash
npm run build          # Next.js فقط
npm run build:worker   # OpenNext → مجلد .open-next (مطلوب قبل النشر)
```

### النشر على Cloudflare Workers

#### من الجهاز
```bash
npx wrangler login   # مرة واحدة
npm run deploy       # opennextjs-cloudflare build ثم deploy
```

#### عبر Workers Builds (GitHub)
في إعدادات البناء على Cloudflare غيّر إلى:

| الإعداد | القيمة |
|---------|--------|
| **Build command** | `npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |

لا تستخدم `npx wrangler deploy` وحده — يفشل بخطأ `Could not find compiled Open Next config`.

تفاصيل إضافية: [`docs/WORKERS_BUILDS.md`](docs/WORKERS_BUILDS.md)

معاينة محلية ببيئة Workers:
```bash
npm run preview
```

### ربط النطاق `projects.easylab.online`
1. انشر الـ Worker (`easylab-projects`).
2. في لوحة Cloudflare → **Workers & Pages** → `easylab-projects` → **Settings** → **Domains & Routes**.
3. أضف نطاقاً مخصصاً: `projects.easylab.online`.
4. تأكد من سجل DNS (Proxied).

### إضافة مشروع جديد
عدّل الملف `src/data/projects.ts`.

---

## English

### Requirements
- Node.js 22+ recommended (Wrangler 4); 20+ fine for local `next dev`
- Cloudflare account with Workers enabled
- `easylab.online` zone on Cloudflare DNS

### Local development
```bash
npm install
npm run icons
npm run dev
```
Default password (hardcoded): `wajih`

### Build
```bash
npm run build          # Next.js only
npm run build:worker   # OpenNext → .open-next (required before deploy)
```

### Deploy to Cloudflare Workers

#### Local
```bash
npx wrangler login
npm run deploy
```

#### Workers Builds (GitHub)
Set in Cloudflare Build settings:

| Setting | Value |
|---------|--------|
| **Build command** | `npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |

Do **not** use `npx wrangler deploy` alone — it fails with `Could not find compiled Open Next config`.

See [`docs/WORKERS_BUILDS.md`](docs/WORKERS_BUILDS.md).

### DNS / custom domain `projects.easylab.online`
Workers & Pages → `easylab-projects` → Domains & Routes → add `projects.easylab.online` (Proxied DNS).

### Extending projects
Edit `src/data/projects.ts`.

### Security note
Simple hardcoded password gate for an internal gallery. Do not store additional secrets in the repo.
