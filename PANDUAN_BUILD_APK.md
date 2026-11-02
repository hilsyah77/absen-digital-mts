# 📱 Panduan Pembuatan & Download APK Android via GitHub Actions

Repositori ini telah dilengkapi dengan sistem **CI/CD otomatis (GitHub Actions)** yang bertugas membangun file **APK Android (`hadir-guru-mts.apk`)** secara langsung di cloud GitHub. Anda tidak perlu menginstal Android Studio, Java, Gradle, ataupun Node.js di komputer lokal Anda!

---

## ⚡ 1. Cara Menjalankan Build APK di GitHub

Ada **dua cara** untuk memicu pembuatan APK:

### Cara A: Otomatis Setiap Melakukan `git push`
Setiap kali Anda melakukan commit dan push ke branch `main`:
```bash
git add .
git commit -m "feat: pembaruan aplikasi"
git push origin main
```
GitHub Actions akan secara otomatis menjalankan proses kompilasi APK.

---

### Cara B: Manual Lewat Browser (Satu Klik di Web GitHub)
Jika Anda ingin membuat APK tanpa perlu commit kode baru:
1. Buka repositori Anda di browser:  
   👉 [https://github.com/hilsyah77/absen-digital-mts](https://github.com/hilsyah77/absen-digital-mts)
2. Klik tab **Actions** di bagian atas repositori.
3. Di panel sebelah kiri, pilih workflow **"Build Android APK"**.
4. Klik tombol **"Run workflow"** di sebelah kanan atas.
5. Pilih branch `main`, lalu klik tombol hijau **"Run workflow"**.
6. Tunggu sekitar 1–2 menit sampai muncul tanda centang hijau (✅).

---

## 📥 2. Cara Mengunduh File APK

Setelah proses build selesai, ada dua cara mengunduh APK:

### Metode 1: Lewat Menu GitHub Releases (Paling Mudah untuk HP Android)
1. Buka halaman utama repositori Anda di GitHub.
2. Di sebelah kanan (sidebar), klik bagian **Releases** (atau buka [Releases](https://github.com/hilsyah77/absen-digital-mts/releases)).
3. Cari rilis bertanda **"latest"** atau versi terbaru.
4. Di bagian **Assets**, klik langsung file **`hadir-guru-mts.apk`**.
5. File APK akan langsung terunduh ke HP Android Anda tanpa perlu ekstrak ZIP!

### Metode 2: Lewat Menu GitHub Actions Artifacts
1. Buka tab **Actions** di GitHub.
2. Klik run yang baru selesai (centang hijau).
3. Scroll ke bagian paling bawah ke bagian **Artifacts**.
4. Klik **`HADIR-GURU-MTs-APK`**.
5. File akan terunduh dalam format `.zip`. Ekstrak file zip tersebut di HP atau laptop untuk mendapatkan file `hadir-guru-mts.apk`.

---

## 📲 3. Cara Memasang (Install) di Smartphone Android

1. Buka file **`hadir-guru-mts.apk`** yang telah diunduh di smartphone Android Anda.
2. Jika muncul peringatan keamanan:
   > *"Demi keamanan, ponsel Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini"*
3. Klik **Setelan (Settings)** lalu aktifkan toggle:
   > **"Izinkan aplikasi dari sumber ini" (Allow from this source)**.
4. Tekan tombol **Kembali (Back)** lalu pilih **Pasang (Install)**.
5. Buka aplikasi **HADIR.GURU**.
6. Saat pertama kali membuka presensi atau izin berkas, izinkan akses:
   - **Izin Lokasi (GPS)**: Untuk kalkulasi radius validasi geofence sekolah.
   - **Izin Kamera & Berkas**: Untuk mengambil foto langsung atau mengunggah bukti surat izin/sakit.

---

## 🏗️ 4. Struktur Proyek Android

Proyek Android terletak di direktori `android/`:
```text
android/
├── app/
│   ├── build.gradle              # Konfigurasi SDK (minSdk 23, compileSdk 34) & auto-sync aset
│   ├── proguard-rules.pro        # Aturan proguard WebView
│   └── src/main/
│       ├── AndroidManifest.xml   # Izin GPS, Kamera, Storage, dan FileProvider
│       ├── java/com/hadirguru/mts/
│       │   └── MainActivity.java # WebView modern, WebChromeClient, Geolocation, FileChooser
│       └── res/                  # Ikon aplikasi (ic_launcher) & tema warna HADIR.GURU
├── build.gradle                  # Root build script
├── gradle.properties             # Alokasi memori JVM dan opsi AndroidX
├── settings.gradle               # Root project settings
└── gradle/wrapper/               # Gradle wrapper 8.5
```

---

## 🔒 5. Mengapa Debug APK?

File APK yang dihasilkan bertipe **Debug APK**. Tipe ini dipilih secara khusus agar:
- APK sudah otomatis ditandatangani oleh sertifikat bawaan Android.
- Dapat **langsung dipasang** di semua HP Android tanpa memerlukan konfigurasi Keystore/JKS khusus.
- Sangat praktis untuk digunakan oleh staf dan guru madrasah.
