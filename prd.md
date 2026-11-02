# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# HADIR.GURU — Sistem Absensi Digital Guru MTs

**Versi:** 1.0  
**Status:** Draft untuk pengembangan  
**Platform:** Web dan Android  
**Target pengguna:** Guru dan Admin Sekolah  
**Jenis produk:** Sistem manajemen kehadiran guru

---

## 1. Ringkasan Produk

HADIR.GURU adalah aplikasi absensi digital yang dirancang untuk membantu Madrasah Tsanawiyah (MTs) mengelola kehadiran guru secara terpusat, transparan, dan efisien.

Aplikasi menyediakan fasilitas pencatatan absensi masuk dan pulang, validasi lokasi, pengajuan izin dan sakit, monitoring kehadiran, pengelolaan data guru, serta laporan kehadiran.

HADIR.GURU memiliki dua jenis pengguna utama:

- **Guru:** melakukan absensi, melihat riwayat, dan mengajukan izin atau sakit.
- **Admin Sekolah:** mengelola guru, jadwal, pengajuan izin, monitoring, dan laporan.

Data disimpan dalam satu backend terpusat sehingga aktivitas melalui Web dan Android menggunakan sumber data yang sama.

## 2. Latar Belakang dan Masalah

Pengelolaan absensi guru secara manual atau melalui beberapa media terpisah berpotensi menimbulkan masalah:

1. Pencatatan kehadiran membutuhkan proses administratif berulang.
2. Data absensi sulit dipantau secara langsung.
3. Rekapitulasi bulanan membutuhkan waktu.
4. Pengajuan izin dan sakit sulit ditelusuri statusnya.
5. Koreksi absensi berpotensi tidak memiliki riwayat perubahan.
6. Data kehadiran tidak selalu tersedia dalam format laporan yang konsisten.

HADIR.GURU dikembangkan untuk menyatukan proses tersebut dalam satu sistem.

## 3. Product Vision

Menjadi sistem absensi digital guru MTs yang mudah digunakan, akurat, transparan, dan membantu sekolah mengelola administrasi kehadiran secara efisien.

### Product Goals

- Mempermudah guru melakukan absensi.
- Mempercepat monitoring kehadiran oleh admin.
- Mengurangi kesalahan pencatatan manual.
- Mempermudah pengajuan dan verifikasi izin.
- Menyediakan laporan kehadiran yang dapat dipertanggungjawabkan.
- Menyediakan akses melalui Web dan Android.

### Non-Goals

Fitur berikut tidak termasuk ruang lingkup versi pertama:

- Absensi siswa.
- Penggajian dan penghitungan honor.
- Manajemen pembelajaran atau LMS.
- Penjadwalan mata pelajaran.
- Integrasi otomatis dengan sistem kepegawaian eksternal.
- Pengenalan wajah sebagai syarat absensi.

## 4. Target Pengguna

### 4.1 Guru

Karakteristik:
- Menggunakan aplikasi untuk absensi harian.
- Membutuhkan proses yang sederhana dan cepat.
- Perlu melihat status dan riwayat kehadiran.
- Membutuhkan fasilitas pengajuan izin atau sakit.

Kebutuhan utama:
- Login dengan akun sekolah.
- Melakukan absensi masuk dan pulang.
- Mengetahui apakah absensi berhasil dicatat.
- Melihat riwayat kehadiran.
- Mengajukan izin atau sakit.
- Melihat status pengajuan.

### 4.2 Admin Sekolah

Karakteristik:
- Bertanggung jawab terhadap administrasi absensi.
- Mengelola data guru dan jadwal.
- Memantau kehadiran seluruh guru.
- Memproses pengajuan izin.
- Membuat laporan kehadiran.

Kebutuhan utama:
- Dashboard monitoring.
- Manajemen data guru.
- Pengaturan jadwal.
- Verifikasi izin.
- Koreksi absensi dengan audit trail.
- Ekspor laporan.

## 5. Platform dan Perangkat

### Web
- Mendukung browser modern.
- Responsif untuk desktop, tablet, dan ponsel.
- Menjadi platform utama administrasi sekolah.

### Android
- Mendukung perangkat Android yang kompatibel dengan versi aplikasi.
- Menggunakan kamera atau GPS jika dibutuhkan oleh fitur.
- Memiliki navigasi yang sederhana.
- Terhubung ke backend yang sama dengan Web.

### Prinsip lintas platform
- Satu akun dapat digunakan pada Web dan Android.
- Hak akses pengguna harus konsisten.
- Data absensi tersinkronisasi.
- Perbedaan platform tidak boleh mengubah aturan bisnis.

## 6. Role dan Permission

| Modul | Guru | Admin Sekolah |
|---|---|---|
| Login | Ya | Ya |
| Dashboard pribadi | Ya | — |
| Dashboard monitoring | — | Ya |
| Absensi masuk | Ya | — |
| Absensi pulang | Ya | — |
| Riwayat pribadi | Ya | — |
| Riwayat semua guru | — | Ya |
| Pengajuan izin | Ya | — |
| Verifikasi izin | — | Ya |
| Data guru | — | Ya |
| Pengaturan jadwal | — | Ya |
| Piket Sambut Siswa 5S | Mandiri (Akun Sendiri & Hari Kosong) | Penuh (Semua Guru & Hari) |
| Koreksi absensi | — | Ya |
| Laporan | Pribadi | Seluruh guru |
| Pengaturan sekolah | — | Ya |

Seluruh pemeriksaan hak akses wajib dilakukan di backend dan divalidasi pada client.

## 7. Struktur Informasi dan Navigasi

### Guru
1. Dashboard
2. Absensi
3. Riwayat
4. Izin dan Sakit
5. Profil

### Admin Sekolah
1. Dashboard
2. Monitoring
3. Data Guru
4. Jadwal
5. Pengajuan Izin
6. Koreksi Absensi
7. Laporan
8. Pengaturan Sekolah
9. Profil

## 8. Functional Requirements

### FR-01: Autentikasi

**Deskripsi:** Pengguna masuk menggunakan akun yang diberikan sekolah.

Persyaratan:
- Sistem menyediakan halaman login.
- Username atau email dan password wajib diisi.
- Password harus disimpan dalam bentuk hash.
- Sistem mengarahkan pengguna berdasarkan role.
- Pengguna dapat logout.
- Sesi harus memiliki masa berlaku dan mekanisme pembaruan token.
- Sistem menampilkan pesan kesalahan yang mudah dipahami.

Acceptance Criteria:
- Pengguna dengan kredensial valid dapat masuk.
- Pengguna dengan kredensial tidak valid tidak dapat masuk.
- Guru tidak dapat mengakses halaman khusus admin.
- Pengguna yang logout tidak dapat menggunakan sesi sebelumnya.

### FR-02: Dashboard Guru

**Deskripsi:** Menampilkan informasi kehadiran pribadi.

Informasi:
- Nama dan profil guru.
- Tanggal hari ini.
- Status absensi.
- Waktu masuk.
- Waktu pulang.
- Ringkasan kehadiran bulan berjalan.
- Status izin atau sakit.
- Akses cepat ke absensi dan pengajuan izin.

Acceptance Criteria:
- Dashboard menampilkan data sesuai akun yang login.
- Data berubah setelah absensi berhasil disimpan.
- Guru tidak dapat melihat data pribadi guru lain.

### FR-03: Absensi Masuk

**Deskripsi:** Mencatat kehadiran guru saat mulai bekerja.

Persyaratan:
- Guru dapat melakukan absensi masuk pada hari kerja.
- Sistem menggunakan waktu server sebagai waktu resmi.
- Sistem mencatat tanggal dan waktu absensi.
- Sistem dapat memvalidasi lokasi berdasarkan radius sekolah.
- Sistem mencegah absensi masuk ganda.
- Sistem memberikan konfirmasi keberhasilan atau kegagalan.

Data yang disimpan:
- User ID.
- Teacher ID.
- Tanggal absensi.
- Waktu masuk.
- Latitude dan longitude jika validasi lokasi aktif.
- Status kehadiran.
- Informasi perangkat seperlunya.

Acceptance Criteria:
- Absensi berhasil jika semua aturan validasi terpenuhi.
- Absensi kedua pada hari yang sama ditolak.
- Waktu yang tersimpan berasal dari server.
- Sistem memberikan alasan jika absensi ditolak.
- Lokasi di luar radius ditolak jika kebijakan geofence aktif.

### FR-04: Absensi Pulang

**Deskripsi:** Mencatat waktu guru menyelesaikan aktivitas kerja.

Persyaratan:
- Absensi pulang hanya dapat dilakukan setelah absensi masuk.
- Sistem mencatat waktu pulang dari server.
- Sistem mencegah absensi pulang ganda.
- Sistem dapat mencatat lokasi pulang jika validasi diaktifkan.

Acceptance Criteria:
- Absensi pulang berhasil jika guru memiliki absensi masuk.
- Absensi pulang kedua ditolak.
- Waktu pulang tersimpan dengan benar.
- Riwayat absensi diperbarui setelah berhasil.

### FR-05: Penentuan Status Kehadiran

Status:
- Hadir.
- Terlambat.
- Izin.
- Sakit.
- Tidak hadir.
- Belum absen.
- Pulang belum tercatat.

Aturan awal:
- Jam masuk standar: 07.00 WIB.
- Jam pulang standar: 14.00 WIB.
- Absensi masuk setelah batas jam masuk dikategorikan terlambat.
- Toleransi keterlambatan dapat diatur admin.
- Status tidak hadir ditentukan setelah hari kerja selesai dan tidak ada absensi maupun izin yang disetujui.

Catatan: Aturan final mengenai toleransi, hari kerja, tugas luar, dan jadwal khusus harus dikonfirmasi sekolah sebelum produksi.

### FR-06: Riwayat Absensi Guru

Persyaratan:
- Guru dapat melihat riwayat pribadi.
- Data dapat difilter berdasarkan periode.
- Sistem menampilkan tanggal, waktu masuk, waktu pulang, dan status.
- Sistem menampilkan keterangan jika ada koreksi.

Acceptance Criteria:
- Data hanya menampilkan catatan milik pengguna.
- Filter periode bekerja dengan benar.
- Data sesuai dengan catatan absensi yang tersimpan.

### FR-07: Pengajuan Izin dan Sakit

Persyaratan:
- Guru dapat memilih jenis pengajuan.
- Guru mengisi tanggal mulai dan tanggal selesai.
- Guru memasukkan alasan.
- Guru dapat melampirkan dokumen jika diperlukan.
- Sistem mencatat waktu pengajuan.
- Status awal adalah Menunggu Verifikasi.

Status pengajuan:
- Menunggu Verifikasi.
- Disetujui.
- Ditolak.

Acceptance Criteria:
- Pengajuan valid dapat disimpan.
- Guru dapat melihat status pengajuan.
- Lampiran hanya dapat diakses pengguna yang berwenang.
- Pengajuan yang telah diproses tidak dapat diubah tanpa mekanisme koreksi yang tercatat.

### FR-08: Verifikasi Izin oleh Admin

Persyaratan:
- Admin melihat daftar pengajuan.
- Admin dapat memfilter status dan periode.
- Admin dapat membuka detail pengajuan.
- Admin dapat menyetujui atau menolak.
- Admin dapat memberikan catatan keputusan.
- Sistem mencatat identitas dan waktu verifikasi.

Acceptance Criteria:
- Hanya admin yang berwenang dapat memverifikasi.
- Keputusan tersimpan dan tercermin pada akun guru.
- Setiap perubahan status memiliki catatan audit.

### FR-09: Dashboard Admin

Informasi:
- Jumlah guru terdaftar.
- Jumlah guru hadir.
- Jumlah terlambat.
- Jumlah izin dan sakit.
- Jumlah belum absen.
- Persentase kehadiran.
- Daftar pengajuan yang menunggu verifikasi.

Acceptance Criteria:
- Angka dashboard berasal dari database.
- Filter tanggal dapat digunakan.
- Angka ringkasan sesuai dengan data detail.

### FR-10: Manajemen Data Guru

Persyaratan:
- Admin dapat menambah guru.
- Admin dapat mengubah profil guru.
- Admin dapat mengaktifkan atau menonaktifkan akun.
- Admin dapat mengelola username dan role.
- Sistem memvalidasi data wajib.
- Sistem mencegah duplikasi identitas unik.

Data guru:
- NIP atau nomor identitas pegawai.
- Nama lengkap.
- Email atau username.
- Nomor telepon.
- Mata pelajaran.
- Status kepegawaian jika diperlukan.
- Status akun.

### FR-11: Pengaturan Jadwal

Persyaratan:
- Admin dapat mengatur jam masuk.
- Admin dapat mengatur jam pulang.
- Admin dapat menentukan hari kerja.
- Admin dapat mengatur toleransi keterlambatan.
- Admin dapat menentukan zona waktu sekolah.
- Sistem mendukung jadwal khusus jika diperlukan.

Default awal:
- Zona waktu: Asia/Jakarta.
- Jam masuk: 07.00 WIB.
- Jam pulang: 14.00 WIB.

### FR-11b: Jadwal Piket Penyambutan Siswa (5S Gerbang Madrasah)

Persyaratan:
- Jam pelaksanaan: 06.15 – 07.00 WIB di titik gerbang madrasah (Gerbang Utama A, Gerbang Timur B, Lobi Utama).
- Hak akses Guru:
  - Guru dapat mendaftarkan jadwal piket secara mandiri (*self-assignment*).
  - Pilihan nama guru otomatis terkunci pada akun guru yang sedang login (tidak dapat memilih guru lain).
  - Guru hanya dapat memilih hari yang masih kosong (*0 petugas*) atau masih memiliki kuota kosong (*maksimal 4 petugas per regu*).
  - Hari di mana guru yang bersangkutan sudah terdaftar otomatis dinonaktifkan/dikunci (*tidak bisa mendaftar ganda*).
  - Guru hanya dapat membatalkan penugasan piket miliknya sendiri (tidak dapat menghapus guru lain).
- Hak akses Admin:
  - Memiliki hak penuh untuk menugaskan atau menghapus guru mana saja pada hari dan titik gerbang mana saja.
- Presensi Piket:
  - Presensi standby gerbang dapat dicatat langsung oleh guru terjadwal atau admin saat bertugas di gerbang.

### FR-12: Monitoring Kehadiran

Persyaratan:
- Admin melihat kehadiran seluruh guru.
- Admin dapat mencari nama guru.
- Admin dapat memfilter tanggal dan status.
- Admin dapat membuka detail absensi.
- Data diperbarui setelah transaksi absensi tersimpan.

### FR-13: Koreksi Absensi

Persyaratan:
- Admin berwenang dapat mengoreksi data absensi.
- Admin wajib mengisi alasan koreksi.
- Sistem menyimpan nilai sebelum dan sesudah perubahan.
- Sistem menyimpan identitas admin dan waktu perubahan.
- Guru dapat melihat catatan koreksi pada riwayatnya.

Acceptance Criteria:
- Koreksi tanpa alasan ditolak.
- Data awal tetap dapat ditelusuri melalui audit log.
- Guru tidak dapat mengubah catatan absensi secara langsung.

### FR-14: Laporan

Jenis laporan:
- Laporan harian.
- Laporan bulanan.
- Laporan per guru.
- Laporan berdasarkan status kehadiran.

Persyaratan:
- Admin dapat memilih periode.
- Admin dapat memilih guru.
- Admin dapat memfilter status.
- Sistem menyediakan ekspor Excel dan PDF.
- Laporan memiliki identitas sekolah dan waktu pembuatan.

Acceptance Criteria:
- Data laporan sesuai filter.
- Total setiap status konsisten dengan data detail.
- File ekspor dapat dibuka.
- Pengguna yang tidak berwenang tidak dapat mengakses laporan seluruh guru.

### FR-15: Notifikasi

Notifikasi yang direncanakan:
- Pengingat absen masuk.
- Pengingat absen pulang.
- Konfirmasi pengajuan izin.
- Hasil verifikasi izin.
- Informasi perubahan absensi.

Saluran notifikasi dapat berupa notifikasi dalam aplikasi dan push notification Android.

### FR-16: Pengaturan Sekolah

Persyaratan:
- Admin mengatur nama sekolah.
- Admin mengatur alamat.
- Admin mengatur koordinat lokasi sekolah.
- Admin mengatur radius geofence.
- Admin mengatur logo dan identitas laporan.
- Admin mengatur zona waktu.

## 9. Business Rules

1. Satu guru hanya memiliki satu catatan absensi utama per tanggal kerja.
2. Absensi masuk harus mendahului absensi pulang.
3. Waktu resmi diambil dari server.
4. Semua aturan waktu mengikuti zona waktu sekolah.
5. Status keterlambatan mengikuti jadwal aktif.
6. Izin atau sakit harus melalui verifikasi admin.
7. Koreksi absensi wajib memiliki alasan.
8. Setiap perubahan data penting harus tercatat.
9. Akun nonaktif tidak dapat melakukan absensi.
10. Admin tidak boleh mengubah riwayat tanpa audit trail.
11. Data lintas platform harus konsisten.
12. Ketika koneksi gagal, sistem tidak boleh mengklaim absensi berhasil sebelum server mengonfirmasi penyimpanan.

## 10. Non-Functional Requirements

### Performance
- Halaman utama ditargetkan tampil dalam waktu maksimal 3 detik pada kondisi jaringan normal.
- Permintaan absensi ditargetkan memperoleh respons maksimal 2 detik pada kondisi normal.
- Dashboard menggunakan pagination untuk data besar.

### Security
- HTTPS wajib.
- Password menggunakan algoritma hashing yang aman.
- Role-based access control diterapkan pada backend.
- Token memiliki masa berlaku.
- Input divalidasi di frontend dan backend.
- Lampiran izin disimpan secara privat.
- Aktivitas penting masuk ke audit log.

### Reliability
- Database memiliki backup berkala.
- Sistem memiliki mekanisme pemulihan.
- Transaksi absensi harus mencegah data ganda.
- Gangguan koneksi harus ditangani dengan pesan yang jelas.

### Usability
- Antarmuka berbahasa Indonesia.
- Navigasi sederhana.
- Status menggunakan teks, bukan warna saja.
- Tombol utama mudah ditemukan.
- Formulir menggunakan label yang jelas.
- Antarmuka responsif dan ramah aksesibilitas.

### Compatibility
- Web mendukung browser modern.
- Android mendukung perangkat yang memenuhi minimum versi aplikasi yang ditetapkan saat pengembangan.
- Backend yang sama digunakan kedua platform.

## 11. UX Requirements

Prinsip desain:
- Simple: guru dapat melakukan absensi tanpa langkah yang tidak perlu.
- Clear: status absensi mudah dipahami.
- Consistent: pola komponen sama di seluruh halaman.
- Accessible: warna, kontras, ukuran teks, dan label mudah dibaca.
- Feedback: setiap aksi memiliki respons sistem.
- Error prevention: sistem mencegah absensi ganda dan kesalahan input.

### Alur Guru

Login → Dashboard → Absensi → Validasi → Konfirmasi → Riwayat.

### Alur Pengajuan Izin

Dashboard → Izin dan Sakit → Isi Form → Kirim → Menunggu Verifikasi → Hasil Keputusan.

### Alur Admin

Login → Dashboard → Monitoring → Detail Kehadiran atau Pengajuan → Tindakan Admin → Audit Log.

## 12. Data Model

Tabel inti:

| Tabel | Fungsi |
|---|---|
| schools | Identitas dan konfigurasi sekolah |
| users | Akun dan autentikasi |
| teachers | Profil guru |
| schedules | Jadwal kerja |
| attendance | Catatan absensi |
| attendance_locations | Lokasi absensi |
| leave_requests | Pengajuan izin dan sakit |
| attendance_corrections | Riwayat koreksi |
| notifications | Notifikasi pengguna |
| audit_logs | Catatan aktivitas sistem |

Relasi utama:
- Satu sekolah memiliki banyak pengguna.
- Satu pengguna guru terhubung dengan satu profil guru.
- Satu guru memiliki banyak catatan absensi.
- Satu guru dapat membuat banyak pengajuan izin.
- Satu admin dapat memverifikasi banyak pengajuan.
- Setiap koreksi terhubung dengan catatan absensi dan admin yang melakukan perubahan.

## 13. Analytics dan Success Metrics

Metrik keberhasilan produk:

| Metrik | Target awal |
|---|---|
| Guru aktif menggunakan aplikasi | ≥ 95% |
| Keberhasilan pencatatan absensi | ≥ 99% |
| Ketersediaan layanan bulanan | ≥ 99,5% |
| Waktu respons absensi | ≤ 2 detik |
| Pengurangan waktu rekap manual | ≥ 70% |
| Pengajuan izin tercatat melalui sistem | ≥ 95% |

Target ini merupakan sasaran awal yang harus dievaluasi setelah pilot.

Event analytics:
- login_success
- login_failed
- attendance_check_in
- attendance_check_out
- attendance_failed
- leave_request_submitted
- leave_request_approved
- leave_request_rejected
- attendance_corrected
- report_exported

Analytics tidak boleh mengumpulkan data lokasi atau data pribadi lebih dari yang dibutuhkan untuk operasional.

## 14. MVP Scope

### Wajib untuk MVP

1. Login dan autentikasi.
2. Role Guru dan Admin.
3. Dashboard guru.
4. Dashboard admin.
5. Absensi masuk.
6. Absensi pulang.
7. Validasi waktu server.
8. Validasi GPS dan radius sekolah.
9. Riwayat absensi.
10. Pengajuan izin dan sakit.
11. Verifikasi izin.
12. Manajemen data guru.
13. Pengaturan jadwal.
14. Monitoring kehadiran.
15. Laporan bulanan.
16. Ekspor Excel dan PDF.
17. Audit log.
18. Web responsif dan Android.

### Fitur setelah MVP

- QR Code dinamis.
- Notifikasi push lanjutan.
- Pengelolaan tugas luar.
- Jadwal khusus per kelompok guru.
- Integrasi sistem kepegawaian.
- Analisis tren kehadiran.

## 15. Prioritas Fitur

Metode prioritas: MoSCoW.

**Must Have**
- Login.
- Role dan permission.
- Absensi masuk dan pulang.
- Waktu server.
- Riwayat absensi.
- Dashboard monitoring.
- Pengajuan dan verifikasi izin.
- Manajemen guru.
- Laporan dasar.

**Should Have**
- Validasi GPS.
- Koreksi absensi dengan audit trail.
- Ekspor PDF dan Excel.
- Pengaturan jadwal fleksibel.

**Could Have**
- QR Code.
- Push notification.
- Tugas luar.
- Dashboard analitik lanjutan.

**Won't Have pada MVP**
- Absensi siswa.
- Payroll.
- LMS.
- Face recognition.

## 16. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| GPS tidak akurat | Toleransi lokasi dan prosedur koreksi |
| Guru tidak memiliki internet | Pesan kegagalan yang jelas dan mekanisme percobaan ulang yang aman |
| Penyalahgunaan akun | Autentikasi dan manajemen sesi |
| Manipulasi waktu perangkat | Waktu server sebagai acuan |
| Kesalahan admin | Audit trail dan konfirmasi perubahan |
| Kebocoran data | Hak akses, enkripsi, dan penyimpanan privat |
| Data ganda | Constraint database dan idempotency |
| Perbedaan aturan sekolah | Konfigurasi jadwal dan kebijakan |

## 17. QA dan Acceptance Testing

Sebelum peluncuran, pengujian minimum meliputi:

- Login valid dan tidak valid.
- Pemisahan akses Guru dan Admin.
- Absensi masuk berhasil.
- Absensi masuk ganda ditolak.
- Absensi pulang tanpa masuk ditolak.
- Absensi di luar radius ditolak saat geofence aktif.
- Status terlambat sesuai jadwal.
- Pengajuan izin berhasil.
- Pengajuan dapat disetujui dan ditolak.
- Koreksi tercatat di audit log.
- Filter monitoring bekerja.
- Laporan sesuai data sumber.
- Ekspor file dapat dibuka.
- Sinkronisasi Web dan Android konsisten.
- Aplikasi tetap aman saat sesi berakhir.
- Pengujian kondisi jaringan lambat dan terputus.

## 18. Roadmap Pengembangan

### Sprint 1 — Fondasi
- Setup proyek.
- Database.
- Autentikasi.
- Role dan permission.
- Profil sekolah dan guru.

### Sprint 2 — Absensi
- Absensi masuk.
- Absensi pulang.
- Aturan jadwal.
- Waktu server.
- Validasi GPS.

### Sprint 3 — Administrasi
- Pengajuan izin.
- Verifikasi.
- Monitoring.
- Koreksi absensi.

### Sprint 4 — Laporan
- Rekap harian dan bulanan.
- Filter laporan.
- Ekspor PDF dan Excel.
- Audit log.

### Sprint 5 — Android
- Integrasi API.
- Navigasi Android.
- GPS dan izin perangkat.
- Notifikasi.
- Pengujian perangkat.

### Sprint 6 — UAT dan Peluncuran
- User Acceptance Testing.
- Perbaikan bug.
- Pelatihan admin.
- Migrasi data.
- Pilot di sekolah.
- Evaluasi dan peluncuran.

## 19. Open Questions

Hal berikut perlu dikonfirmasi bersama sekolah sebelum implementasi final:

1. Apakah absensi harus dilakukan hanya dari area sekolah?
2. Berapa radius GPS yang diperbolehkan?
3. Apakah semua guru menggunakan jadwal yang sama?
4. Apakah ada guru yang memiliki jadwal khusus atau tugas luar?
5. Apakah lampiran surat sakit wajib?
6. Apakah guru dapat mengajukan koreksi absensi sendiri?
7. Apakah laporan memerlukan format khusus dari yayasan atau instansi?
8. Apakah satu aplikasi akan digunakan oleh satu MTs saja atau beberapa MTs?
9. Siapa yang berhak menjadi admin dan apakah diperlukan admin cadangan?
10. Apakah notifikasi Android wajib tersedia pada MVP?

## 20. Definition of Done

Fitur dianggap selesai apabila:

- Persyaratan fungsional terpenuhi.
- UI sesuai desain yang disetujui.
- API dan database berjalan.
- Hak akses diuji.
- Validasi dan pesan error tersedia.
- Unit test dan integration test lulus.
- Acceptance criteria terpenuhi.
- Tidak ada bug kritis atau high severity yang belum diselesaikan.
- Dokumentasi teknis diperbarui.
- Fitur telah disetujui melalui UAT oleh perwakilan sekolah.

---

**Dokumen ini menjadi baseline kebutuhan produk HADIR.GURU versi 1.0.** Perubahan ruang lingkup, aturan absensi, dan kebutuhan sekolah selanjutnya harus dicatat sebagai revisi PRD agar desain, development, dan QA menggunakan acuan yang sama.
