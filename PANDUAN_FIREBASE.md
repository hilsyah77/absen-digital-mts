# 🛡️ Panduan Setup Database Firebase Kapasitas Tertutup (Private & Secure)

Panduan ini berisi langkah-langkah menyiapkan database cloud **Firebase Cloud Firestore & Authentication** dengan **Kapasitas Tertutup (Zero Public Access)** untuk aplikasi **HADIR.GURU MTs**.

Dengan sistem keamanan ini, orang luar/publik **sama sekali tidak bisa membaca maupun meretas database**, dan setiap guru hanya bisa mengakses data presensi miliknya sendiri.

---

## 📋 Langkah 1: Buat Proyek di Firebase Console

1. Buka browser dan kunjungi: 👉 [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Login menggunakan akun Google Anda.
3. Klik tombol **"Add project"** (atau "Tambahkan proyek").
4. Masukkan nama proyek, misalnya: `hadir-guru-mts`.
5. Google Analytics bersifat opsional (bisa dimatikan atau diaktifkan), lalu klik **Create project**.
6. Tunggu beberapa detik hingga proyek siap, lalu klik **Continue**.

---

## 🔐 Langkah 2: Aktifkan Firebase Authentication

1. Di menu sidebar sebelah kiri, klik **Build** ➔ **Authentication**.
2. Klik tombol **Get started**.
3. Pada tab **Sign-in method**, pilih penyedia **Email/Password**.
4. Aktifkan toggle **Email/Password** (biarkan *Email link* nonaktif).
5. Klik **Save**.
> 💡 *Catatan: Guru dan admin tetap login menggunakan **NIP & Password** seperti biasa di aplikasi. Sistem `FirebaseService` secara otomatis mengonversi NIP menjadi kredensial aman di Firebase Auth.*

---

## 🗄️ Langkah 3: Buat Database Cloud Firestore (Region Jakarta)

1. Di sidebar sebelah kiri, klik **Build** ➔ **Firestore Database**.
2. Klik tombol **Create database**.
3. **Pilih Lokasi Database (Region)**:
   - Pilih **`asia-southeast2 (Jakarta)`**.  
   *(Sangat penting: Region Jakarta memberikan latensi respon tercepat < 20ms untuk madrasah di Indonesia).*
4. Pada pilihan Security Rules:
   - Pilih **Start in production mode** (Mode produksi / tertutup).
5. Klik **Create / Enable**.

---

## 🔒 Langkah 4: Terapkan Aturan Keamanan Tertutup (Security Rules)

Aturan keamanan ini memastikan **hanya guru yang login yang bisa membaca absensinya sendiri**, dan admin yang bisa memantau monitoring:

1. Di halaman **Firestore Database**, klik tab **Rules** (Aturan) di bagian atas.
2. Hapus seluruh isi kode bawaan, lalu salin dan tempelkan seluruh isi dari file:  
   👉 [`firestore.rules`](firestore.rules)
3. Klik tombol **Publish** di pojok kanan atas.
4. Database Anda sekarang **100% TERTUTUP** dari publik dan scraper luar!

---

## 📁 Langkah 5: Pasang Aturan Firebase Storage (Opsional: Foto Surat Izin/Sakit)

Jika Anda ingin menyimpan foto surat dokter / izin di Firebase Storage:
1. Di sidebar sebelah kiri, klik **Build** ➔ **Storage**.
2. Klik **Get started**, pilih lokasi yang sama (`asia-southeast2`), lalu klik **Done**.
3. Klik tab **Rules** di bagian atas Storage.
4. Salin dan tempelkan seluruh isi dari file:  
   👉 [`storage.rules`](storage.rules)
5. Klik tombol **Publish**.

---

## 🔑 Langkah 6: Daftarkan Web App & Salin Kunci Konfigurasi

1. Klik ikon ⚙️ **Project settings** (di samping menu *Project Overview* kiri atas).
2. Di tab **General**, scroll ke bagian bawah ke kartu **"Your apps"**.
3. Klik ikon web **`</>`** (Web App).
4. Masukkan nama aplikasi: `HADIR.GURU Web`.
5. Klik **Register app**.
6. Anda akan melihat blok konfigurasi JavaScript:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "hadir-guru-mts.firebaseapp.com",
     projectId: "hadir-guru-mts",
     storageBucket: "hadir-guru-mts.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
7. Buka file [`scripts/firebase-config.js`](scripts/firebase-config.js) di proyek ini.
8. Ganti nilai di dalam `window.FIREBASE_CONFIG` dengan konfigurasi asli Anda dari Firebase Console.
9. Simpan file (`Ctrl + S`).

---

## ✅ Selesai!

Setelah Anda memasukkan konfigurasi:
- Aplikasi akan otomatis mendeteksi koneksi Firebase.
- Saat Guru atau Admin login dengan NIP dan Password, sesi tertutup akan dibuat di Firebase Auth.
- Presensi dan izin otomatis tersinkronisasi ke Cloud Firestore secara real-time.
- Ketika offline, data tetap tersimpan aman di IndexedDB perangkat HP dan otomatis sinkron saat internet aktif kembali.
