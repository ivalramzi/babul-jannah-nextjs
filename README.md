# Website Majelis Babul Jannah (Next.js 16 + React + Redis)

Data **jadwal, acara, artikel, foto, dan jumlah suka** disimpan di **Redis** lewat Route Handler Next.js di `src/app/api/` (logikanya di `src/server/`).
Admin (`/admin`) menulis langsung ke Redis, jadi perubahan tampil untuk semua pengunjung tanpa deploy ulang.
Notifikasi memakai **Web Push** sungguhan (masuk ke perangkat walau situs sedang ditutup).

## Deploy (Vercel)
1. Push proyek ke GitHub, impor ke Vercel. **Framework Preset: Next.js** (kosongkan Build Command & Output Directory; `vercel.json` sudah mengaturnya). Bila proyek Vercel lama masih berpreset Vite, ubah di Settings → Build & Development.
2. Buat Redis gratis: Vercel → Storage → **Upstash Redis** (atau upstash.com). Variabel `KV_REST_API_URL/TOKEN` atau `UPSTASH_REDIS_REST_URL/TOKEN` otomatis dikenali.
3. Isi Environment Variables (lihat `.env.example`):
   - `ADMIN_PASSWORD_HASH` → `npm run hash -- PASSWORD_BARU` (default password `babuljannah`, **wajib diganti**)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` → `npm run vapid`
   - `CRON_SECRET` → string acak panjang
4. Deploy. Data awal (`src/server/_seed.js`) otomatis masuk ke Redis saat pertama diakses. Tombol **Reset** di admin mengembalikannya.

Butuh Node.js 20.9+ dan hosting yang menjalankan Next.js (Vercel disarankan); hosting statis tidak cukup.

## Jalankan lokal
    npm install
    cp .env.example .env.local   # isi variabel Redis, dst.
    npm run dev                  # http://localhost:3000 (API ikut berjalan)
    npm run build && npm start   # uji versi produksi

## Admin
Tambah/edit/hapus **Artikel**, **Acara**, **Jadwal** (maks 4 foto per artikel/acara; foto dikecilkan lalu disimpan di Redis).
Menyimpan artikel/acara **baru** otomatis mengirim notifikasi ke pelanggan pengumuman. Ada juga form **Kirim notifikasi** manual.
Ekspor/Impor = cadangan JSON. Login diperiksa di server (dibatasi 5 percobaan/menit).

## Postingan feed profil & crop gambar
- **Admin → Postingan**: buat postingan ala Instagram (hingga 10 foto per postingan = carousel geser, caption, lokasi, tanggal). Semuanya tampil di **Profil → Postingan** (terbaru di atas). Bila belum ada postingan buatan admin, halaman Profil memakai cadangan lama (feed Instagram asli, lalu daftar acara).
- **Admin → Pengaturan crop**: pilih rasio gambar untuk tiap tempat: Beranda (kartu artikel), halaman Artikel (kartu), Profil (feed), Detail (sampul), Detail (galeri), dan Pop-up acara. Contoh: Beranda 1:1, sampul detail 16:9.
- **Tombol *crop* di tiap foto** (editor artikel/acara/postingan): geser gambar dan atur zoom untuk **tiap tempat secara terpisah**, dengan pratinjau sesuai rasio. Ada tombol *Salin ke semua tempat*.
- Crop hanya lewat CSS (`aspect-ratio` + `object-position` + zoom), jadi foto asli tidak berubah dan posisi bisa diatur ulang kapan saja. Pengaturan disimpan di Redis (`bj:crop` untuk rasio, `fokus` di tiap item untuk posisi).
- Data baru Redis: `bj:postingan` (hash id→JSON). Ekspor/Impor ikut membawa postingan & pengaturan crop; cadangan lama tanpa postingan tetap bisa diimpor.

## Notifikasi
- Ikon lonceng di navbar: pengumuman acara & artikel baru.
- Tombol **Ingatkan** pada jadwal/acara: pengingat untuk item itu.
- Pengingat dikirim oleh `/api/cron` (waktu WIB): H-1 (sejak 07.00), hari-H (sejak 06.00), dan 1 jam sebelum mulai. Sekali kirim per pengingat.
- `vercel.json` memasang cron **harian** (`0 1 * * *` = 08.00 WIB), batas paket Hobby. Untuk pengingat "1 jam lagi" yang tepat waktu, panggil
  `https://DOMAIN/api/cron?key=CRON_SECRET` tiap 5–10 menit lewat layanan gratis seperti cron-job.org (atau pakai Vercel Pro dengan jadwal lebih rapat).
- iPhone/iPad: push hanya bekerja bila situs ditambahkan ke Layar Utama (Bagikan → Tambah ke Layar Utama) dan dibuka dari ikon tersebut (iOS 16.4+).

## Struktur data Redis
`bj:artikel|acara|jadwal` (hash id→JSON), `bj:likes:<jenis>:<id>` (set perangkat), `bj:likecount`, `bj:foto:<id>`, `bj:subs`, `bj:subs:all`, `bj:rem:<j|a>:<id>`.

## Ubah konten lain
Nama, WhatsApp, alamat, stories, pengikut/mengikuti: `src/data.js` · Warna: `:root` di `src/styles.css`.
Jumlah *postingan* di profil dihitung otomatis dari jumlah postingan buatan admin.
