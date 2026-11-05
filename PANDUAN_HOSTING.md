# PANDUAN LENGKAP PUBLIKASI KE WEB HOSTING & CPANEL
## HADIR.GURU - Sistem Absensi Digital MTs (Database MySQL)

Dokumen ini memandu langkah demi langkah cara meng-upload dan menjalankan aplikasi **HADIR.GURU** pada Web Hosting (cPanel / DirectAdmin / VPS) dengan database **MySQL / MariaDB**.

---

### Daftar Berkas yang Terlibat
1. **`database.sql`**: Berkas skema tabel database lengkap beserta data awal 52 akun guru & konfigurasi madrasah.
2. **`api/config.php`**: Berkas pengaturan koneksi database MySQL di hosting.
3. **Folder `api/`**: REST API Backend PHP (`auth.php`, `attendance.php`, `teachers.php`, `teaching-logs.php`, `leaves.php`, `settings.php`).
4. **`scripts/api-service.js`**: Penghubung antarmuka frontend ke database MySQL hosting.

---

## LANGKAH 1: Buat Database MySQL di cPanel

1. Masuk ke **cPanel** hosting madrasah Anda (misal: `https://namadomain.com:2083`).
2. Cari dan klik menu **"MySQL® Databases"** (atau **"MySQL Database Wizard"**).
3. Buat database baru:
   * Contoh nama database: `u123456_absendigital`
4. Buat user database baru:
   * Contoh username: `u123456_adminabsen`
   * Masukkan password yang kuat (misal: `MtsJatibarang#2026!`). **Catat password ini!**
5. Hubungkan User ke Database:
   * Pilih **All Privileges** (Semua Hak Akses), lalu klik **Make Changes**.

---

## LANGKAH 2: Import File `database.sql` via phpMyAdmin

1. Di cPanel, buka menu **"phpMyAdmin"**.
2. Di sebelah kiri, klik nama database yang baru saja Anda buat (`u123456_absendigital`).
3. Klik tab **"Import"** di bagian atas menu.
4. Klik tombol **"Choose File"** (Pilih Berkas) dan pilih file `database.sql` dari komputer Anda.
5. Gulir ke bawah dan klik tombol **"Import"** (atau **"Kirim"**).
6. Pastikan muncul pesan sukses berwarna hijau. Anda akan melihat 6 tabel telah terbuat:
   * `teachers` (sudah terisi 52 guru lengkap)
   * `attendance`
   * `teaching_logs`
   * `leaves`
   * `app_settings`
   * `admins`

---

## LANGKAH 3: Sesuaikan Konfigurasi di `api/config.php`

Buka file **`api/config.php`** (bisa diedit di komputer sebelum di-upload atau lewat File Manager cPanel):

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_absendigital'); // Ganti dengan nama database cPanel Anda
define('DB_USER', 'u123456_adminabsen');    // Ganti dengan username database cPanel Anda
define('DB_PASS', 'MtsJatibarang#2026!');   // Ganti dengan password database cPanel Anda
define('DB_CHARSET', 'utf8mb4');
```

---

## LANGKAH 4: Upload Seluruh File ke Hosting

1. Di cPanel, buka menu **"File Manager"**.
2. Masuk ke folder tujuan:
   * Jika untuk domain utama: masuk ke folder **`public_html/`**.
   * Jika untuk subdomain (misal `absen.mts-asy.sch.id`): masuk ke folder subdomain tersebut.
3. Kompres seluruh file project menjadi satu file ZIP di komputer Anda (kecuali folder `.git`), lalu klik **"Upload"** di File Manager cPanel.
4. Setelah ter-upload, klik kanan file ZIP tersebut di cPanel lalu pilih **"Extract"**.
5. Pastikan struktur folder di `public_html` terlihat seperti ini:
   ```text
   public_html/
   ├── api/
   │   ├── config.php
   │   ├── auth.php
   │   ├── attendance.php
   │   ├── teachers.php
   │   ├── teaching-logs.php
   │   ├── leaves.php
   │   └── settings.php
   ├── scripts/
   │   ├── api-service.js
   │   ├── app.js
   │   ├── data.js
   │   └── ...
   ├── styles/
   ├── database.sql
   ├── index.html
   └── ...
   ```

---

## LANGKAH 5: Wajib Pasang SSL (HTTPS)

> [!IMPORTANT]
> **Fitur GPS Radius Madrasah Wajib Menggunakan HTTPS!**
> Google Chrome dan browser Android/iPhone **memblokir deteksi lokasi GPS** jika website diakses lewat `http://` biasa.

1. Di cPanel, buka menu **"SSL/TLS Status"** atau **"Let's Encrypt SSL"**.
2. Centang domain/subdomain Anda lalu klik **"Run AutoSSL"** (atau "Issue SSL").
3. Tunggu hingga sertifikat aktif (muncul ikon gembok hijau di alamat website Anda).
4. Akses website melalui `https://namadomain.com`.

---

## Kredensial Default Setelah Instalasi

### 1. Akun Administrator Absensi:
* **Username**: `admin`
* **Password**: `admin123`

### 2. Akun Guru (52 Guru MTs):
* **ID / Username**: Gunakan **NIP resmi** masing-masing guru (contoh: `91000074100899` untuk Abdur Rouf)
* **PIN & Password Default**: `123456`
* Guru dapat mengganti password dan PIN secara mandiri melalui menu Pengaturan Profil di aplikasi.

