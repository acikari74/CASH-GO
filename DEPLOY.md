# Panduan Deploy CashGo — GitHub + Firebase Hosting

Paket ini berisi:
- `index.html` — aplikasi CashGo (sudah pakai Firebase Firestore, bukan lagi `window.storage`)
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` — konfigurasi Firebase
- `.gitignore`

Ikuti urutan di bawah ini. Semua perintah dijalankan di terminal komputermu sendiri (bukan di Claude).

---

## 1. Buat Project Firebase

1. Buka https://console.firebase.google.com
2. **Add project** → beri nama (mis. `cashgo-brilink`) → ikuti wizard sampai selesai.
3. Di sidebar kiri, buka **Build → Firestore Database** → **Create database** → pilih **Start in production mode** → pilih lokasi server (mis. `asia-southeast2 (Jakarta)`) → **Enable**.
4. Di sidebar kiri, buka **Build → Authentication** → tab **Sign-in method** → aktifkan provider **Anonymous** → **Save**.
   (Ini WAJIB — aplikasi pakai login anonim di belakang layar supaya Firestore rules bisa jalan. Ini beda dengan login Owner/Staff/Driver di dalam app, yang itu murni custom dan tidak pakai Firebase Authentication.)

## 2. Ambil Firebase Config

1. Di **Project Settings** (ikon gerigi) → tab **General** → scroll ke **Your apps**.
2. Klik ikon **Web (`</>`)** → beri nickname (mis. `cashgo-web`) → **Register app** (tidak perlu centang Hosting di langkah ini).
3. Copy objek `firebaseConfig` yang muncul, bentuknya seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "cashgo-brilink.firebaseapp.com",
     projectId: "cashgo-brilink",
     storageBucket: "cashgo-brilink.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
4. Buka `index.html`, cari blok `firebaseConfig` di bagian atas `<script>` (ada komentar `GANTI_DENGAN_...`), **ganti semua nilainya** dengan punya kamu.

## 3. Update `.firebaserc`

Buka `.firebaserc`, ganti `GANTI_DENGAN_PROJECT_ID_KAMU` dengan Project ID Firebase kamu (terlihat di Project Settings, bukan nama tampilan — biasanya huruf kecil + angka, mis. `cashgo-brilink`).

## 4. Install Firebase CLI (sekali saja di komputermu)

```bash
npm install -g firebase-tools
firebase login
```
Ini akan buka browser untuk login pakai akun Google yang sama dengan project Firebase kamu.

## 5. Deploy ke Firebase Hosting + Firestore Rules

Dari dalam folder project ini:

```bash
firebase deploy --only hosting,firestore:rules
```

Setelah selesai, terminal akan menampilkan URL live-nya, biasanya:
`https://GANTI_DENGAN_PROJECT_ID_KAMU.web.app`

Buka URL itu — aplikasi CashGo sudah bisa dipakai dari HP/laptop mana saja.

## 6. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial deploy: CashGo BRILink"
```

Buat repo baru di https://github.com/new (jangan centang "Initialize with README"), lalu:

```bash
git remote add origin https://github.com/USERNAME-KAMU/NAMA-REPO.git
git branch -M main
git push -u origin main
```

## 7. (Opsional) Auto-deploy tiap kali push ke GitHub

Kalau mau setiap `git push` otomatis men-deploy ulang ke Firebase Hosting lewat GitHub Actions:

```bash
firebase init hosting:github
```

Ikuti wizard-nya (pilih repo GitHub kamu, izinkan GitHub Actions). Firebase CLI akan otomatis membuat file workflow di `.github/workflows/` dan menyimpan kredensial sebagai GitHub Secret — setelah itu commit & push seperti biasa, deploy akan jalan sendiri.

---

## Update konten setelahnya

Kalau nanti ubah `index.html` lagi:

```bash
git add .
git commit -m "update fitur X"
git push
firebase deploy --only hosting
```

(Baris terakhir tidak perlu kalau sudah pakai GitHub Actions auto-deploy dari langkah 7.)

---

## ⚠️ Catatan Keamanan — Wajib Dibaca

- Password Owner/Staff/Driver di app ini **disimpan apa adanya** (tanpa hash/enkripsi) di dokumen Firestore koleksi `meta`. Siapa pun yang tahu URL Firebase project & berhasil mengakses Firestore console/API bisa melihatnya.
- Firestore rules di paket ini hanya mensyaratkan "sudah sign-in" (termasuk sign-in anonim otomatis) — jadi **siapa pun yang membuka aplikasi otomatis punya akses baca/tulis penuh** ke semua data (toko, driver, pesanan, termasuk kredensial login).
- Ini cocok untuk **tim internal kecil yang saling percaya**, bukan untuk data yang benar-benar sensitif (PIN rekening, OTP, dsb).
- Kalau butuh keamanan lebih serius: pertimbangkan pakai Firebase Authentication sungguhan (email/password per user) + Firestore rules berbasis `request.auth.uid`, atau batasi akses lewat App Check. Ini pengembangan lanjutan yang belum ada di paket ini.
