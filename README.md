# HADIR.GURU — Sistem Absensi Digital Guru MTs

Aplikasi sistem manajemen presensi digital modern yang dirancang khusus untuk Madrasah Tsanawiyah (MTs). Memudahkan pencatatan kehadiran guru secara terpusat, transparan, akurat, dan efisien dengan validasi lokasi (geofencing) dan panel monitoring interaktif.

---

## 🌟 Fitur Utama

### 1. Portal Guru (Dashboard Guru)
- **Presensi Masuk & Pulang Mandiri**: Validasi waktu dan radius lokasi sekolah (geofence) secara presisi.
- **Pengajuan Izin & Sakit**: Formulir pengajuan dispensasi terpadu dilengkapi unggah dokumen/bukti surat.
- **Riwayat & Statistik Kehadiran**: Rekapitulasi kehadiran bulanan, status tepat waktu, terlambat, dan izin.
- **Jadwal Mengajar & Kalender Pendidikan**: Integrasi jadwal tatap muka dan hari libur resmi kaldik.

### 2. Portal Administrator (Admin Sekolah)
- **Monitoring Real-time**: Pantau status kehadiran guru hari ini secara langsung.
- **Verifikasi & Persetujuan Izin**: Tinjau permohonan izin/sakit dengan riwayat persetujuan transparan.
- **Manajemen Data Guru & Jadwal**: Kelola profil pendidik, penugasan mata pelajaran, serta jam kerja.
- **Konfigurasi Radius & Jam Operasional**: Pengaturan koordinat geofence madrasah dan toleransi keterlambatan.
- **Kalender Pendidikan (Kaldik)**: Pengaturan hari libur nasional, libur semester, dan agenda madrasah.
- **Laporan & Rekapitulasi**: Ekspor laporan kehadiran per periode untuk administrasi madrasah.

---

## 🚀 Teknologi yang Digunakan

- **Frontend**: HTML5 Semantik, Modern Vanilla CSS (Glassmorphism, CSS Variables, Responsive Layout), JavaScript (ES6+ Native)
- **Storage & State**: LocalStorage / Modular state management untuk simulasi dan integrasi backend
- **Desain & UX**: Antarmuka responsif ramah mobile (PWA-ready layout) dan desktop

---

## 📂 Struktur Direktori

```text
absen-digital-mts/
├── assets/             # Aset gambar, ikon, dan logo madrasah
├── data/               # Mock data / dataset guru dan konfigurasi
├── scripts/
│   ├── app.js          # Logika utama aplikasi, event listener, interaksi UI
│   └── data.js         # Pengelolaan data kehadiran, storage, dan fungsi helper
├── styles/
│   └── main.css        # Desain visual, tema, komponen, dan animasi
├── android/            # Proyek native wrapper Android (WebView, Geolocation, FileChooser)
├── .github/workflows/  # CI/CD otomatis untuk build APK Android di cloud GitHub
├── index.html          # Halaman portal utama (Login, Guru, dan Admin)
├── prd.md              # Product Requirements Document komprehensif
├── PANDUAN_BUILD_APK.md # Panduan komprehensif build dan instalasi APK Android
└── README.md           # Dokumentasi repositori proyek
```

---

## 📱 Build APK Android Lewat GitHub Actions

Aplikasi ini sudah dilengkapi alur kerja otomatis (CI/CD) GitHub Actions untuk mengkompilasi file APK Android (`hadir-guru-mts.apk`) secara instan di cloud tanpa perlu instalasi Android Studio lokal:

1. **Otomatis**: Setiap kali Anda melakukan `git push` ke branch `main`, GitHub akan otomatis mengkompilasi APK.
2. **Manual (1 Klik)**: Masuk ke tab **Actions** di GitHub ➔ Pilih **"Build Android APK"** ➔ Klik **"Run workflow"**.
3. **Download**: Unduh file APK siap pasang langsung dari menu **Releases** atau bagian **Artifacts** di GitHub Actions.

📖 *Panduan lengkap cara download dan instalasi di smartphone dapat dilihat di [PANDUAN_BUILD_APK.md](PANDUAN_BUILD_APK.md).*

---

## 💻 Cara Menjalankan

1. Clone repositori ini:
   ```bash
   git clone https://github.com/hilsyah77/absen-digital-mts.git
   ```
2. Buka folder proyek:
   ```bash
   cd absen-digital-mts
   ```
3. Buka file `index.html` di browser web modern (Google Chrome, Edge, Firefox, Safari) atau gunakan ekstensi live server:
   ```bash
   # Contoh jika menggunakan Python
   python -m http.server 8080
   ```
   Lalu akses di browser pada `http://localhost:8080`.

---

## 📄 Lisensi & Hak Cipta

Dikembangkan untuk mendukung digitalisasi madrasah di Indonesia. © 2026 HADIR.GURU.

