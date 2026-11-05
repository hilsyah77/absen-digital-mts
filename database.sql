-- ========================================================
-- DATABASE SCHEMA: HADIR.GURU - ABSENSI DIGITAL MTS
-- Engine: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Karakter Set: utf8mb4 / Kolasi: utf8mb4_unicode_ci
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Tabel: teachers (Master Data Guru & Akun Login)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(30) NOT NULL COMMENT 'NIP Guru sebagai ID unik utama',
  `nip` VARCHAR(30) NOT NULL,
  `legacy_id` VARCHAR(20) DEFAULT NULL COMMENT 'ID legacy (TCH-XX)',
  `name` VARCHAR(150) NOT NULL,
  `nuptk` VARCHAR(30) DEFAULT '-',
  `subject` VARCHAR(100) DEFAULT '',
  `dept` VARCHAR(100) DEFAULT '',
  `target_jtm` INT(11) DEFAULT 0,
  `class_assigned` VARCHAR(100) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `phone` VARCHAR(30) DEFAULT '',
  `avatar_url` TEXT DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'Laki-laki',
  `status` VARCHAR(20) DEFAULT 'Aktif',
  `pin` VARCHAR(20) DEFAULT '123456',
  `password` VARCHAR(255) DEFAULT '123456',
  `role` VARCHAR(50) DEFAULT 'Guru Pengajar',
  `position` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nip` (`nip`),
  KEY `idx_legacy_id` (`legacy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabel: attendance (Presensi Harian Guru Datang & Pulang)
-- Format ID Dokumen: <NIP>_<YYYY-MM-DD>
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` VARCHAR(60) NOT NULL COMMENT 'Format: <NIP>_<YYYY-MM-DD>',
  `teacher_id` VARCHAR(30) NOT NULL,
  `nip` VARCHAR(30) NOT NULL,
  `teacher_name` VARCHAR(150) DEFAULT '',
  `date` DATE NOT NULL,
  `day` VARCHAR(20) DEFAULT '',
  `status` VARCHAR(30) NOT NULL DEFAULT 'Hadir',
  `status_detail` VARCHAR(150) DEFAULT '',
  `check_in_time` VARCHAR(20) DEFAULT '-',
  `check_in_lat` DECIMAL(10, 7) DEFAULT NULL,
  `check_in_lng` DECIMAL(10, 7) DEFAULT NULL,
  `check_in_distance` VARCHAR(50) DEFAULT '',
  `check_in_device` VARCHAR(150) DEFAULT '',
  `check_in_verified` TINYINT(1) DEFAULT 1,
  `check_out_time` VARCHAR(20) DEFAULT '-',
  `check_out_lat` DECIMAL(10, 7) DEFAULT NULL,
  `check_out_lng` DECIMAL(10, 7) DEFAULT NULL,
  `check_out_distance` VARCHAR(50) DEFAULT '',
  `is_late` TINYINT(1) DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_att_date` (`date`),
  KEY `idx_att_teacher` (`teacher_id`),
  KEY `idx_att_nip` (`nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabel: teaching_logs (Jurnal KBM Kelas & Absen Siswa)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teaching_logs` (
  `id` VARCHAR(80) NOT NULL,
  `schedule_id` VARCHAR(60) DEFAULT '',
  `teacher_id` VARCHAR(30) NOT NULL,
  `teacher_name` VARCHAR(150) DEFAULT '',
  `class_name` VARCHAR(50) NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `period_range` VARCHAR(50) DEFAULT '',
  `check_in_time` VARCHAR(20) DEFAULT '',
  `check_out_time` VARCHAR(20) DEFAULT '',
  `topic_material` TEXT DEFAULT NULL,
  `teaching_media` VARCHAR(150) DEFAULT '',
  `student_attendance` LONGTEXT DEFAULT NULL COMMENT 'JSON string kehadiran siswa',
  `status` VARCHAR(30) DEFAULT 'Selesai',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teach_date` (`date`),
  KEY `idx_teach_teacher` (`teacher_id`),
  KEY `idx_teach_class` (`class_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabel: leaves (Pengajuan Izin / Cuti / Sakit Guru)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leaves` (
  `id` VARCHAR(60) NOT NULL,
  `teacher_id` VARCHAR(30) NOT NULL,
  `teacher_name` VARCHAR(150) DEFAULT '',
  `nip` VARCHAR(30) NOT NULL,
  `type` VARCHAR(30) NOT NULL COMMENT 'Izin / Sakit / Dinas Luar',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT NOT NULL,
  `proof_attachment` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(30) DEFAULT 'Pending' COMMENT 'Pending / Disetujui / Ditolak',
  `approved_by` VARCHAR(100) DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leave_teacher` (`teacher_id`),
  KEY `idx_leave_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabel: app_settings (Konfigurasi Radius GPS & Jam Madrasah)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(50) NOT NULL,
  `setting_value` LONGTEXT NOT NULL,
  `description` VARCHAR(200) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Tabel: admins (Akun Administrator Absensi)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(30) DEFAULT 'Super Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SEED DATA: AKUN ADMINISTRATOR DEFAULT (admin / admin123)
-- --------------------------------------------------------
INSERT INTO `admins` (`id`, `username`, `password`, `name`, `role`) VALUES
(1, 'admin', 'admin123', 'Administrator Madrasah', 'Super Admin')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------
-- SEED DATA: PENGATURAN RADIUS GPS & JAM SEKOLAH
-- --------------------------------------------------------
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`) VALUES
('school_coordinates', '{\"lat\": -6.208842, \"lng\": 106.845612, \"radius\": 100, \"address\": \"Gedung MTs Asy-Syafi\'iyyah Jatibarang\"}', 'Pusat koordinat dan radius absensi (meter)'),
('attendance_schedule', '{\"checkInStart\": \"06:00\", \"checkInStandard\": \"07:00\", \"checkInLateLimit\": \"07:15\", \"checkOutStandard\": \"14:00\", \"checkOutJumat\": \"11:30\", \"checkOutSabtu\": \"12:30\"}', 'Jadwal jam masuk dan kepulangan'),
('app_info', '{\"name\": \"HADIR.GURU\", \"subTitle\": \"Absensi Digital MTs Asy-Syafi\'iyyah Jatibarang\", \"npsn\": \"20108741\"}', 'Identitas Aplikasi & Madrasah')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- SEED DATA: 52 GURU REEL LENGKAP DENGAN NIP RESMI
-- Password & PIN Awal: 123456
-- --------------------------------------------------------
INSERT INTO `teachers` (`id`, `nip`, `legacy_id`, `name`, `nuptk`, `subject`, `dept`, `target_jtm`, `class_assigned`, `email`, `phone`, `gender`, `status`, `pin`, `password`, `role`, `position`) VALUES
('9248740641200003', '9248740641200003', 'TCH-00', 'Drs. H. Akhmad Rosidi', '9248740641200003', 'Kepala Madrasah', 'Manajemen Madrasah', 0, 'Kepala Madrasah', 'akhmad.rosisi@mtsasyjtb.sch.id', '6281234567890', 'Laki-laki', 'Aktif', '123456', '123456', 'Pendidik', 'Kepala Madrasah'),
('91000074100899', '91000074100899', 'TCH-01', 'ABDUR ROUF', '-', 'SKI', 'PAI', 24, 'Wali Kelas VII-A', 'abdur.rouf@mtsasyjtb.sch.id', '6281548138852', 'Laki-laki', 'Aktif', '123456', '123456', 'Pendidik', 'Wali Kelas VII-A'),
('20326797197002', '20326797197002', 'TCH-02', 'ADE AYU NUR TANTRI', '-', 'Pendidikan Pancasila', 'Sosial & Kewarganegaraan', 26, 'Wali Kelas VII-B', 'ade.ayu@mtsasyjtb.sch.id', '6285869979210', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20200613100001', '20200613100001', 'TCH-03', 'AENI AFTHINA', '-', 'IPA', 'MIPA', 26, 'Wali Kelas VII-C', 'aeni.afthina@mtsasyjtb.sch.id', '6287775288140', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000080102905', '91000080102905', 'TCH-04', 'AHMAD FARID', '-', 'Akidah Akhlak', 'PAI', 12, 'Guru Mapel', 'ahmad.farid@mtsasyjtb.sch.id', '6285601633669', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797185001', '20326797185001', 'TCH-05', 'Ahmad Syafi', '-', 'Ke-NU-an', 'Keagamaan & Muatan Lokal', 26, 'Wali Kelas VII-D', 'ahmad.syafi@mtsasyjtb.sch.id', '', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797199001', '20326797199001', 'TCH-06', 'AHMAD SYAMSUL FALAH', '-', 'Ke-NU-an', 'Keagamaan & Muatan Lokal', 26, 'Guru Mapel', 'syamsul.falah@mtsasyjtb.sch.id', '6281542130070', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000081103794', '91000081103794', 'TCH-07', 'Aini Lutfiyah', '-', 'Bahasa Arab', 'Bahasa', 24, 'Wali Kelas VIII-A', 'aini.lutfiyah@mtsasyjtb.sch.id', '6281542260659', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000081104938', '91000081104938', 'TCH-08', 'AMIR SYARIFUDIN', '-', 'Pendidikan Agama Islam', 'PAI', 0, 'Guru Pembina', 'amir.syarifudin@mtsasyjtb.sch.id', '', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000075104250', '91000075104250', 'TCH-09', 'Ana Rodiyana', '-', 'Bimbingan Konseling', 'BK', 0, 'Guru BK', 'ana.rodiyana@mtsasyjtb.sch.id', '', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000085105943', '91000085105943', 'TCH-10', 'ANIS MASRUFATUN SAADAH', '-', 'IPA', 'MIPA', 24, 'Wali Kelas VIII-B', 'anis.masrufatun@mtsasyjtb.sch.id', '6285867477945', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000072105448', '91000072105448', 'TCH-11', 'APRIS DWI PRIYATOMO', '-', 'Bahasa Indonesia', 'Bahasa', 12, 'Guru Mapel', 'apris.dwi@mtsasyjtb.sch.id', '6282328831541', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797196002', '20326797196002', 'TCH-12', 'AYU ROSALITA', '-', 'Bahasa Indonesia', 'Bahasa', 28, 'Wali Kelas VIII-C', 'ayu.rosalita@mtsasyjtb.sch.id', '6285742390604', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797199003', '20326797199003', 'TCH-13', 'BAENY ABDUL FATAH', '-', 'PJOK', 'Olahraga & Kesehatan', 28, 'Wali Kelas VIII-D', 'baeny.abdul@mtsasyjtb.sch.id', '6285934250084', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000066108311', '91000066108311', 'TCH-14', 'DARSONAH SETYOWATI', '-', 'Bimbingan Konseling', 'BK', 0, 'Guru Pembina', 'darsonah.setyowati@mtsasyjtb.sch.id', '', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000080112516', '91000080112516', 'TCH-15', 'DENY PRABOWO', '-', 'Bahasa Inggris', 'Bahasa', 26, 'Wali Kelas IX-A', 'deny.prabowo@mtsasyjtb.sch.id', '6285642504157', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000086111652', '91000086111652', 'TCH-16', 'DETTY TURISHA WIGUNANTI', '-', 'Bahasa Inggris', 'Bahasa', 26, 'Wali Kelas IX-B', 'detty.turisha@mtsasyjtb.sch.id', '62816697488', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000082115252', '91000082115252', 'TCH-17', 'DEWI RACHMAWATI', '-', 'IPA', 'MIPA', 28, 'Wali Kelas IX-C', 'dewi.rachmawati@mtsasyjtb.sch.id', '6281542178006', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797101001', '20326797101001', 'TCH-18', 'ELLA LINTANG AGUSTIN', '-', 'Informatika', 'Teknologi & Keterampilan', 28, 'Wali Kelas IX-D', 'ella.lintang@mtsasyjtb.sch.id', '62816722589', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000082120487', '91000082120487', 'TCH-19', 'ENY ERLINA', '-', 'Matematika', 'MIPA', 24, 'Guru Mapel', 'eny.erlina@mtsasyjtb.sch.id', '6281542054714', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000076113942', '91000076113942', 'TCH-20', 'ETHIK RAHMAWATI', '-', 'IPA', 'MIPA', 28, 'Guru Mapel', 'ethik.rahmawati@mtsasyjtb.sch.id', '628157970850', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20363282185001', '20363282185001', 'TCH-21', 'ETIK SULISTYO RATRI', '-', 'Bahasa Jawa', 'Bahasa', 23, 'Guru Mapel', 'etik.sulistyo@mtsasyjtb.sch.id', '6285600667262', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000081123488', '91000081123488', 'TCH-22', 'HARIYANTO', '-', 'Matematika', 'MIPA', 20, 'Guru Mapel', 'hariyanto@mtsasyjtb.sch.id', '6285866827575', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797191003', '20326797191003', 'TCH-23', 'Ismatul Maula', '-', 'Bahasa Arab', 'Bahasa', 24, 'Guru Mapel', 'ismatul.maula@mtsasyjtb.sch.id', '6285927492177', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000076124272', '91000076124272', 'TCH-24', 'KHASANAH', '-', 'Bahasa Arab', 'Bahasa', 24, 'Guru Mapel', 'khasanah@mtsasyjtb.sch.id', '6285865947049', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797188001', '20326797188001', 'TCH-25', 'Khodijatul Kubro', '-', 'Tahfidz', 'Keagamaan & Muatan Lokal', 26, 'Guru Mapel', 'khodijatul.kubro@mtsasyjtb.sch.id', '6285742603241', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797194002', '20326797194002', 'TCH-26', 'M. AZIZ HIMAWAN AKBAR', '-', 'Tahfidz', 'Keagamaan & Muatan Lokal', 24, 'Guru Mapel', 'aziz.himawan@mtsasyjtb.sch.id', '6285712626267', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797189002', '20326797189002', 'TCH-27', 'Mochammad Aqil Mahfudz', '-', 'Fikih', 'PAI', 22, 'Guru Mapel', 'aqil.mahfudz@mtsasyjtb.sch.id', '6285210785527', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000077131961', '91000077131961', 'TCH-28', 'MOHAMMAD AZAMIN', '-', 'SKI', 'PAI', 24, 'Guru Mapel', 'mohammad.azamin@mtsasyjtb.sch.id', '6285716611167', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797197003', '20326797197003', 'TCH-29', 'MUHAMMAD AKVIN SYARIFUDIN', '-', 'BTQ', 'Keagamaan & Muatan Lokal', 26, 'Guru Mapel', 'akvin.syarifudin@mtsasyjtb.sch.id', '6285693038967', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797196005', '20326797196005', 'TCH-30', 'MUHAMMAD IRSYAD HUSNI', '-', 'Tahfidz', 'Keagamaan & Muatan Lokal', 26, 'Guru Mapel', 'irsyad.husni@mtsasyjtb.sch.id', '6285742226906', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000073129641', '91000073129641', 'TCH-31', 'MUHDI', '-', 'Akidah Akhlak', 'PAI', 27, 'Guru Mapel', 'muhdi@mtsasyjtb.sch.id', '6281542028802', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000077133655', '91000077133655', 'TCH-32', 'MUKHAMAD ARIS', '-', 'Informatika', 'Teknologi & Keterampilan', 12, 'Guru Mapel', 'mukhamad.aris@mtsasyjtb.sch.id', '085229755797', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000076133788', '91000076133788', 'TCH-33', 'MUSTOFA', '-', 'Fikih', 'PAI', 24, 'Guru Mapel', 'mustofa@mtsasyjtb.sch.id', '6285780944439', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000075133679', '91000075133679', 'TCH-34', 'MUZAKKY MIFTAH', '-', 'IPS', 'Sosial & Kewarganegaraan', 21, 'Guru Mapel', 'muzakky.miftah@mtsasyjtb.sch.id', '6281548841706', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000064129055', '91000064129055', 'TCH-35', 'NASARUDIN', '-', 'Matematika', 'MIPA', 24, 'Guru Mapel', 'nasarudin@mtsasyjtb.sch.id', '', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000082154354', '91000082154354', 'TCH-36', 'NOPRIYANI', '-', 'Informatika', 'Teknologi & Keterampilan', 26, 'Guru Mapel', 'nopriyani@mtsasyjtb.sch.id', '6285228732293', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797175001', '20326797175001', 'TCH-37', 'Nur Azizah', '-', 'SKI', 'PAI', 24, 'Guru Mapel', 'nur.azizah@mtsasyjtb.sch.id', '62882008826272', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000083152640', '91000083152640', 'TCH-38', 'NUR KHIKMAH', '-', 'Bahasa Indonesia', 'Bahasa', 28, 'Guru Mapel', 'nur.khikmah@mtsasyjtb.sch.id', '6282224499521', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797199002', '20326797199002', 'TCH-39', 'RAGIL SUSYANTO', '-', 'PJOK', 'Olahraga & Kesehatan', 28, 'Guru Mapel', 'ragil.susyanto@mtsasyjtb.sch.id', '628976999218', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000069143609', '91000069143609', 'TCH-40', 'RAMDLONI', '-', 'Al-Qur''an Hadis', 'PAI', 26, 'Guru Mapel', 'ramdloni@mtsasyjtb.sch.id', '6285786690330', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20363082185001', '20363082185001', 'TCH-41', 'RETNO FAJAR INTAMI', '-', 'Seni Rupa', 'Seni & Budaya', 30, 'Guru Mapel', 'retno.fajar@mtsasyjtb.sch.id', '6282324698120', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797190001', '20326797190001', 'TCH-42', 'Ridlo Alam Nan Asa', '-', 'Akidah Akhlak', 'PAI', 24, 'Guru Mapel', 'ridlo.alam@mtsasyjtb.sch.id', '6285799263027', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797197001', '20326797197001', 'TCH-43', 'RIZQI YUNI ARSIH', '-', 'Bahasa Indonesia', 'Bahasa', 32, 'Guru Mapel', 'rizqi.yuni@mtsasyjtb.sch.id', '6285741747985', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000081160541', '91000081160541', 'TCH-44', 'SILVIA TINDIYAH SUGIARTO', '-', 'Bahasa Indonesia', 'Bahasa', 28, 'Guru Mapel', 'silvia.tindiyah@mtsasyjtb.sch.id', '628156914005', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000071143239', '91000071143239', 'TCH-45', 'SITI ISYUNIATI', '-', 'Matematika', 'MIPA', 24, 'Guru Mapel', 'siti.isyuniati@mtsasyjtb.sch.id', '6289636059040', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000078151658', '91000078151658', 'TCH-46', 'SITI NURJANAH', '-', 'Pendidikan Pancasila', 'Sosial & Kewarganegaraan', 24, 'Guru Mapel', 'siti.nurjanah@mtsasyjtb.sch.id', '6285540141253', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000078154469', '91000078154469', 'TCH-47', 'SUDIYANTO', '-', 'IPS', 'Sosial & Kewarganegaraan', 15, 'Guru Mapel', 'sudiyanto@mtsasyjtb.sch.id', '6285602845241', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000068159822', '91000068159822', 'TCH-48', 'TITIN SOFIYATIN', '-', 'IPS', 'Sosial & Kewarganegaraan', 27, 'Guru Mapel', 'titin.sofiyatin@mtsasyjtb.sch.id', '6285712792600', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000475154699', '91000475154699', 'TCH-49', 'TUTI ALAWIYYAH', '-', 'Al-Qur''an Hadis', 'PAI', 26, 'Guru Mapel', 'tuti.alawiyyah@mtsasyjtb.sch.id', '6285325735885', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('91000068162605', '91000068162605', 'TCH-50', 'WAWAN ERAWAN', '-', 'Bahasa Inggris', 'Bahasa', 24, 'Guru Mapel', 'wawan.erawan@mtsasyjtb.sch.id', '6285870188834', 'Laki-laki', 'Aktif', '123456', '123456', 'Guru Pengajar', ''),
('20326797100002', '20326797100002', 'TCH-51', 'YULITA LISTIA SARI', '-', 'IPS', 'Sosial & Kewarganegaraan', 15, 'Guru BK', 'yulita.listia@mtsasyjtb.sch.id', '6285722041401', 'Perempuan', 'Aktif', '123456', '123456', 'Guru Pengajar', '')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `pin` = VALUES(`pin`), `password` = VALUES(`password`);

SET FOREIGN_KEY_CHECKS = 1;