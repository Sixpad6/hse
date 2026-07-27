# Sistem Manajemen K3 (HSE) & Fatigue Management — Base Project

Aplikasi full-stack untuk sistem HSE & Fatigue Management dengan **7 modul lengkap**:
Auth & Dashboard, Fit To Work, Take 5, Hazard Report, Tasklist & Monitoring, PTO,
dan Modul Inspeksi.

## Tech Stack

| Layer     | Teknologi |
|-----------|-----------|
| Backend   | Node.js, Express, Prisma ORM, JWT (jsonwebtoken), bcryptjs |
| Frontend  | React (Vite), React Router, Tailwind CSS (dark mode default), Axios |
| Database  | SQLite (default, dev) → tinggal ganti provider ke PostgreSQL untuk production |

Kenapa Prisma? Karena schema-nya provider-agnostic — pindah dari SQLite ke
PostgreSQL/MySQL nanti cuma ganti 1 baris (`provider`) + `DATABASE_URL`,
tanpa menulis ulang query.

## Struktur Folder

```
hse-fatigue-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # model User, FitToWork, Take5, HazardReport, PTO, Inspection
│   │   └── seed.js            # data contoh (3 user: employee, hse, supervisor)
│   ├── src/
│   │   ├── index.js           # entrypoint Express
│   │   ├── prismaClient.js
│   │   ├── middleware/auth.js # JWT guard + role guard
│   │   └── routes/
│   │       ├── auth.js          # register, login, /me
│   │       ├── users.js         # daftar karyawan (dropdown PIC dll)
│   │       ├── fitToWork.js     # kalkulasi durasi tidur + fit-status logic
│   │       ├── take5.js         # asesmen risiko + rekomendasi PROCEED/STOP
│   │       ├── hazardReport.js  # laporan bahaya + basis data Tasklist & Monitoring
│   │       ├── pto.js           # Planned Task Observation
│   │       └── inspection.js    # checklist digital (5R, Power Tools, Lifting Gear, dll)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/     # Login, Dashboard, FitToWork, Take5, HazardReport, Tasklist, PTO, Inspection
    │   ├── components/ # Sidebar, ProtectedLayout
    │   ├── context/AuthContext.jsx
    │   ├── api.js       # axios instance + auto JWT header
    │   └── App.jsx       # routing
    └── .env.example
```

## Modul yang Tersedia

1. **Dashboard & Auth** — login JWT, profil karyawan, sidebar navigasi ke semua modul.
2. **Fit To Work** — input jam tidur/bangun dengan kalkulasi durasi otomatis, kuesioner kesehatan, status Fit/Kondisional/Tidak Fit, riwayat & validasi.
3. **Take 5** — asesmen risiko cepat berbasis lokasi & jenis kerja, rekomendasi kondisional Lanjutkan/STOP.
4. **Hazard Report** — form pelaporan bahaya 3-langkah (lokasi → detail temuan → penunjukan PIC).
5. **Tasklist & Monitoring** — tabel status (To Do / Monitoring / Riwayat) bersumber dari Hazard Report, dengan info pelapor, PIC, target selesai, dan aksi ubah status.
6. **PTO (Planned Task Observation)** — form observasi tugas terencana per departemen/prosedur.
7. **Modul Inspeksi** — checklist digital untuk 5R, Power Tools, Lifting Gear, Area Parkir, dan Kendaraan Operasional, dengan hasil PASS/FAIL otomatis.

## Cara Menjalankan (Development)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init   # generate & buat dev.db (SQLite)
npm run seed                         # buat 2 user contoh
npm run dev                          # jalan di http://localhost:4000
```

Akun contoh setelah seed:
- `employee@company.com` / `password123` (role EMPLOYEE)
- `hse@company.com` / `password123` (role HSE_OFFICER — bisa lihat & validasi semua laporan, akses Tasklist penuh)
- `supervisor@company.com` / `password123` (role SUPERVISOR — bisa ditunjuk sebagai PIC, akses Tasklist penuh)

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # jalan di http://localhost:5173
```

Buka `http://localhost:5173`, login pakai salah satu akun di atas.

## Pindah ke PostgreSQL (Production)

1. Di `backend/prisma/schema.prisma`, ubah:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Di `backend/.env`, isi `DATABASE_URL` dengan connection string PostgreSQL, contoh:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/hse_fatigue?schema=public"
   ```
3. Jalankan ulang migrasi: `npx prisma migrate dev --name init`

## Logika Kunci yang Sudah Diimplementasikan

- **Kalkulasi durasi tidur otomatis**: dihitung di frontend (live preview saat isi form)
  dan dihitung ulang di backend (`calcSleepDuration` di `routes/fitToWork.js`) agar
  konsisten & tidak bisa dimanipulasi dari client. Otomatis menangani kasus tidur
  malam → bangun keesokan hari.
- **Logika kondisional status Fit To Work** (`determineFitStatus`): kombinasi durasi
  tidur + jawaban kuesioner (alkohol, kondisi tubuh, tingkat stres) → `FIT` /
  `CONDITIONAL` / `NOT_FIT`. Silakan sesuaikan ambang batas & aturan dengan SOP HSE
  perusahaan yang sebenarnya.
- **Role-based access**: `EMPLOYEE`, `SUPERVISOR`, `HSE_OFFICER`, `ADMIN`. Endpoint
  `GET /api/fit-to-work` (lihat semua laporan) & validasi laporan hanya bisa diakses
  role selain EMPLOYEE — pola ini bisa dipakai untuk modul lain (mis. penunjukan PIC
  di Hazard Report, validasi Tasklist, dsb).
- **Dark mode**: aktif secara default (`class="dark"` di `index.html`), styling
  dengan Tailwind `dark:` variant di semua komponen.

## Catatan Pengembangan Lanjutan

Base ini fokus pada fungsionalitas inti tiap modul. Beberapa hal yang wajar
ditambahkan sebelum produksi:
- Upload foto/lampiran (mis. untuk Hazard Report & Inspeksi) — bisa pakai
  layanan storage seperti S3/Cloudinary, field `photoUrl` tinggal ditambahkan
  ke model terkait.
- Notifikasi (email/WhatsApp) saat PIC ditunjuk atau due date mendekat.
- Export laporan ke Excel/PDF.
- Paginasi pada tabel Tasklist & riwayat bila data sudah banyak.
- Audit log perubahan status pada Tasklist & Monitoring.
