# مشاريع EasyLab / EasyLab Projects

لوحة ويب داخلية (Next.js + PWA) لعرض مشاريع EasyLab، محمية بتسجيل دخول (بريد + كلمة مرور) عبر Cloudflare D1، وقابلة للنشر على Cloudflare Workers عبر `@opennextjs/cloudflare`.

Internal project gallery (Next.js + PWA) for EasyLab — email+password auth and projects stored in Cloudflare D1, Arabic-first RTL UI, deployable to Cloudflare Workers.

**Domain:** `projects.easylab.online`  
**Worker name:** `projects`  
**Repo:** https://github.com/easylab-online/projects  
**D1 database:** `projects-db` (binding: `DB`)

---

## العربية

### المتطلبات
- Node.js 22+ (موصى به لـ Wrangler 4) أو 20+ للتطوير المحلي
- حساب Cloudflare مع Workers و D1 مفعّلين
- نطاق `easylab.online` على Cloudflare DNS

### التطوير المحلي
```bash
npm install
npm run icons   # يولّد أيقونات PNG
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) — سيُطلب منك تسجيل الدخول بالبريد الإلكتروني وكلمة المرور.

حسابات المستخدمين مخزّنة في Cloudflare D1 (جدول `users`). لا تُوثَّق كلمات المرور في المستودع.

### قاعدة البيانات (D1)
- **Binding:** `DB`
- **Database name:** `projects-db`
- **الجداول:** `users`, `projects`, `project_links`
- **الهجرات:** `migrations/` (طبّقها عبر Wrangler عند الحاجة)

```bash
npx wrangler d1 migrations apply projects-db --local   # محلي
npx wrangler d1 migrations apply projects-db --remote  # إنتاج
```

المشاريع تُحمَّل من D1 (وليس من مصفوفة ثابتة في الكود).

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
1. انشر الـ Worker (`projects`).
2. في لوحة Cloudflare → **Workers & Pages** → `projects` → **Settings** → **Domains & Routes**.
3. أضف نطاقاً مخصصاً: `projects.easylab.online`.
4. تأكد من سجل DNS (Proxied).

### إضافة مشروع جديد
أضف صفوفاً في جداول `projects` و `project_links` في D1 (أو عبر هجرة SQL).

---

## English

### Requirements
- Node.js 22+ recommended (Wrangler 4); 20+ fine for local `next dev`
- Cloudflare account with Workers + D1 enabled
- `easylab.online` zone on Cloudflare DNS

### Local development
```bash
npm install
npm run icons
npm run dev
```
Login uses **email + password**. Users live in D1 (`users` table). Passwords are never documented in this repo.

### D1
- Binding: `DB` → database `projects-db`
- Tables: `users`, `projects`, `project_links`
- Migrations: `migrations/`

```bash
npx wrangler d1 migrations apply projects-db --local
npx wrangler d1 migrations apply projects-db --remote
```

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
Workers & Pages → `projects` → Domains & Routes → add `projects.easylab.online` (Proxied DNS).

### Extending projects
Insert into D1 `projects` / `project_links` (or add a SQL migration).

### Security note
Auth is email+password with PBKDF2-SHA256 hashes in D1. Do not commit plaintext passwords or additional secrets to the repo.
