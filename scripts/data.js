/**
 * HADIR.GURU - Data Store & Master Database Guru Reel (51 Guru)
 * Berdasarkan PRD HADIR.GURU v1.0 (Sistem Absensi Digital Guru MTs)
 */

// Auto-migrate: Bersihkan seluruh riwayat absensi admin & personal
const CURRENT_DATA_VERSION = "2026_real_guru_51_schedules_v10";
try {
  if (typeof localStorage !== "undefined") {
    const curVer = localStorage.getItem("hadir_guru_data_version");
    if (curVer !== CURRENT_DATA_VERSION) {
      localStorage.removeItem("hadir_guru_teachers_60");
      localStorage.removeItem("hadir_guru_all_teachers");
      localStorage.removeItem("hadir_guru_profile");
      localStorage.removeItem("hadir_guru_master_schedules");
      localStorage.removeItem("hadir_guru_welcoming_picket_v2");
      localStorage.removeItem("hadir_guru_welcoming_picket");
      localStorage.removeItem("hadir_guru_rooms_monitoring");
      localStorage.removeItem("hadir_guru_rooms_monitoring_state");
      localStorage.removeItem("hadir_guru_class_checkins");
      localStorage.removeItem("hadir_guru_active_teacher_id");
      localStorage.removeItem("hadir_guru_teaching_logs");
      localStorage.removeItem("hadir_guru_leaves");
      localStorage.removeItem("hadir_guru_today");
      localStorage.removeItem("hadir_guru_history");
      localStorage.removeItem("hadir_guru_admin_feed");
      localStorage.removeItem("hadir_guru_holidays");
      localStorage.setItem("hadir_guru_data_version", CURRENT_DATA_VERSION);
    }
  }
} catch (e) {
  console.warn("Storage auto-migration error", e);
}

const INITIAL_TEACHER_PROFILE = {
  id: "TCH-01",
  name: "ABDUR ROUF",
  nip: "91000074100899",
  nuptk: "-",
  gender: "Laki-laki",
  role: "Pendidik",
  subject: "SKI",
  schoolName: "MTs Asy-Syafi'iyyah Jatibarang",
  schoolNPSN: "20108741",
  classAssigned: "Wali Kelas 7A",
  employmentStatus: "Guru Tetap Kemenag",
  email: "abdur.rouf@mtsasyjtb.sch.id",
  phone: "6281548138852",
  avatarUrl: "",
  joinYear: "2015"
};

const SCHOOL_CONFIG = {
  name: "MTs Asy-Syafi'iyyah Jatibarang",
  npsn: "20108741",
  nsm: "121131740001",
  level: "Madrasah Tsanawiyah (MTs)",
  status: "Swasta Terakreditasi A (Kemenag RI)",
  accreditation: "A (Unggul)",
  principalName: "Drs. H. Akhmad Rosidi",
  principalNip: "9248740641200003",
  nuptk: "9248740641200003",
  adminChannel: "@opmmtsasyjtb",
  address: "Jl. Raya Jatibarang, Brebes, Jawa Tengah",
  email: "kontak@mtsasyjtb.sch.id",
  phone: "(0283) 617-1234 / @opmmtsasyjtb",
  website: "https://mtsasyjtb.sch.id",
  timezone: "Asia/Jakarta (WIB)",
  schedule: {
    checkInStart: "06:00",
    checkInStandard: "07:00",
    checkInLateLimit: "07:15", // Toleransi 15 menit
    checkOutStandard: "14:00", // Fallback umum
    checkOutSeninKamis: "14:00", // Jam pulang Senin - Kamis (sama)
    checkOutJumat: "11:30",      // Jam pulang Jumat (khusus)
    checkOutSabtu: "12:30",      // Jam pulang Sabtu (khusus)
    checkOutMinggu: "12:00",     // Jam pulang Minggu (khusus / kegiatan tambahan)
    workDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    kbmDurationByDay: {
      senin: 30, // 30 Menit per JP (hari senin - upacara bendera)
      selasa_kamis: 40, // 40 Menit per JP (selasa, rabu, kamis - standar)
      jumat: 35, // 35 Menit per JP (hari jumat - kbm dipadatkan)
      sabtu: 40,  // 40 Menit per JP (hari sabtu - mandiri)
      minggu: 40  // 40 Menit per JP (hari minggu - mandiri/ekskul)
    },
    kbmBreaksByDay: {
      senin: [
        { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 4, start: "09:15", end: "09:35", duration: 20, note: "Istirahat Pagi / Snack" },
        { id: "break2", name: "Ishoma / Istirahat 2", active: false, afterPeriod: 8, start: "11:35", end: "12:15", duration: 40, note: "Ishoma / Menjelang Pulang" }
      ],
      selasa_kamis: [
        { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 3, start: "09:15", end: "09:35", duration: 20, note: "Istirahat Pagi 1" },
        { id: "break2", name: "Ishoma (Istirahat 2)", active: true, afterPeriod: 6, start: "11:35", end: "12:35", duration: 60, note: "Sholat Dzuhur Berjamaah & Makan" }
      ],
      jumat: [
        { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 3, start: "09:00", end: "09:15", duration: 15, note: "Istirahat Pagi Singkat" },
        { id: "break2", name: "Ishoma / Sholat Jumat", active: false, afterPeriod: 6, start: "11:00", end: "12:30", duration: 90, note: "Persiapan Sholat Jumat" }
      ],
      sabtu: [
        { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 3, start: "09:15", end: "09:45", duration: 30, note: "Istirahat Pagi / Ekskul" },
        { id: "break2", name: "Ishoma / Kepulangan", active: false, afterPeriod: 6, start: "11:45", end: "12:15", duration: 30, note: "Ishoma Sabtu" }
      ],
      minggu: [
        { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 3, start: "09:15", end: "09:45", duration: 30, note: "Istirahat Pagi / Ekskul" },
        { id: "break2", name: "Ishoma / Kepulangan", active: false, afterPeriod: 6, start: "11:45", end: "12:15", duration: 30, note: "Ishoma Minggu" }
      ]
    },
    kbmPeriodsByDay: {
      senin: [
        { period: 1, start: "07:15", end: "07:45", note: "KBM Sesi Pagi 1 (30 Mnt)" },
        { period: 2, start: "07:45", end: "08:15", note: "KBM Sesi Pagi 2 (30 Mnt)" },
        { period: 3, start: "08:15", end: "08:45", note: "KBM Sesi Pagi 3 (30 Mnt)" },
        { period: 4, start: "08:45", end: "09:15", note: "KBM Sesi Pagi 4 (30 Mnt)" },
        { period: 5, start: "09:35", end: "10:05", note: "KBM Pasca Istirahat 1 (30 Mnt)" },
        { period: 6, start: "10:05", end: "10:35", note: "KBM Menjelang Siang (30 Mnt)" },
        { period: 7, start: "10:35", end: "11:05", note: "KBM Pra Sholat (30 Mnt)" },
        { period: 8, start: "11:05", end: "11:35", note: "KBM Sesi Siang 1 (30 Mnt)" }
      ],
      selasa_kamis: [
        { period: 1, start: "07:15", end: "07:55", note: "KBM Sesi Pagi 1 (40 Mnt)" },
        { period: 2, start: "07:55", end: "08:35", note: "KBM Sesi Pagi 2 (40 Mnt)" },
        { period: 3, start: "08:35", end: "09:15", note: "KBM Sesi Pagi 3 (40 Mnt)" },
        { period: 4, start: "09:35", end: "10:15", note: "KBM Pasca Istirahat 1 (40 Mnt)" },
        { period: 5, start: "10:15", end: "10:55", note: "KBM Menjelang Siang (40 Mnt)" },
        { period: 6, start: "10:55", end: "11:35", note: "KBM Pra Sholat / Dzuhur (40 Mnt)" },
        { period: 7, start: "12:35", end: "13:15", note: "KBM Sesi Siang 1 (40 Mnt)" },
        { period: 8, start: "13:15", end: "13:55", note: "KBM Sesi Siang 2 (40 Mnt)" }
      ],
      jumat: [
        { period: 1, start: "07:15", end: "07:50", note: "KBM Sesi Pagi 1 (35 Mnt)" },
        { period: 2, start: "07:50", end: "08:25", note: "KBM Sesi Pagi 2 (35 Mnt)" },
        { period: 3, start: "08:25", end: "09:00", note: "KBM Sesi Pagi 3 (35 Mnt)" },
        { period: 4, start: "09:15", end: "09:50", note: "KBM Pasca Istirahat (35 Mnt)" },
        { period: 5, start: "09:50", end: "10:25", note: "KBM Menjelang Siang (35 Mnt)" },
        { period: 6, start: "10:25", end: "11:00", note: "KBM Pra Sholat Jumat (35 Mnt)" }
      ],
      sabtu: [
        { period: 1, start: "07:15", end: "07:55", note: "KBM Sesi Pagi 1 (40 Mnt)" },
        { period: 2, start: "07:55", end: "08:35", note: "KBM Sesi Pagi 2 (40 Mnt)" },
        { period: 3, start: "08:35", end: "09:15", note: "KBM Sesi Pagi 3 (40 Mnt)" },
        { period: 4, start: "09:45", end: "10:25", note: "KBM Pasca Istirahat (40 Mnt)" },
        { period: 5, start: "10:25", end: "11:05", note: "KBM Menjelang Siang (40 Mnt)" },
        { period: 6, start: "11:05", end: "11:45", note: "KBM Pra Kepulangan (40 Mnt)" }
      ],
      minggu: [
        { period: 1, start: "07:15", end: "07:55", note: "KBM Sesi Pagi 1 (40 Mnt)" },
        { period: 2, start: "07:55", end: "08:35", note: "KBM Sesi Pagi 2 (40 Mnt)" },
        { period: 3, start: "08:35", end: "09:15", note: "KBM Sesi Pagi 3 (40 Mnt)" },
        { period: 4, start: "09:45", end: "10:25", note: "KBM Pasca Istirahat (40 Mnt)" },
        { period: 5, start: "10:25", end: "11:05", note: "KBM Menjelang Siang (40 Mnt)" },
        { period: 6, start: "11:05", end: "11:45", note: "KBM Pra Kepulangan (40 Mnt)" }
      ]
    },
    kbmPeriods: [
      { period: 1, start: "07:15", end: "07:55", note: "KBM Sesi Pagi 1" },
      { period: 2, start: "07:55", end: "08:35", note: "KBM Sesi Pagi 2" },
      { period: 3, start: "08:35", end: "09:15", note: "KBM Sesi Pagi 3" },
      { period: 4, start: "09:35", end: "10:15", note: "KBM Pasca Istirahat 1" },
      { period: 5, start: "10:15", end: "10:55", note: "KBM Menjelang Siang" },
      { period: 6, start: "10:55", end: "11:35", note: "KBM Pra Sholat / Dzuhur" },
      { period: 7, start: "12:35", end: "13:15", note: "KBM Sesi Siang 1" },
      { period: 8, start: "13:15", end: "13:55", note: "KBM Sesi Siang 2" }
    ]
  },
  geofence: {
    latitude: -6.208842,
    longitude: 106.845612,
    radiusMeters: 50,
    campusName: "Area Utama Kampus MTs Negeri 1 Teladan"
  }
};

const KALDIK_JATENG_HOLIDAYS = [
  // --- HARI LIBUR NASIONAL & KALDIK MADRASAH TAHUN 2026 ---
  {
    id: "HOL-2026-01",
    name: "Tahun Baru Masehi 2026",
    category: "nasional",
    startDate: "2026-01-01",
    endDate: "2026-01-01",
    description: "Hari Libur Nasional Tahun Baru Masehi 2026.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-02",
    name: "Isra Mi'raj Nabi Muhammad SAW 1447 H",
    category: "nasional",
    startDate: "2026-01-16",
    endDate: "2026-01-16",
    description: "Hari Libur Nasional Isra Mi'raj Nabi Muhammad SAW.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-03",
    name: "Tahun Baru Imlek 2577 Kongzili",
    category: "nasional",
    startDate: "2026-02-17",
    endDate: "2026-02-17",
    description: "Hari Libur Nasional Tahun Baru Imlek.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-04",
    name: "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    category: "nasional",
    startDate: "2026-03-19",
    endDate: "2026-03-19",
    description: "Hari Libur Nasional Hari Suci Nyepi.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-05",
    name: "Hari Raya Idul Fitri 1447 H",
    category: "nasional",
    startDate: "2026-03-20",
    endDate: "2026-03-21",
    description: "Hari Libur Nasional Hari Raya Idul Fitri 1447 Hijriah.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-06",
    name: "Cuti Bersama Hari Raya Idul Fitri 1447 H",
    category: "madrasah",
    startDate: "2026-03-23",
    endDate: "2026-03-25",
    description: "Cuti Bersama Hari Raya Idul Fitri Madrasah Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-2026-07",
    name: "Wafat Yesus Kristus (Jumat Agung)",
    category: "nasional",
    startDate: "2026-04-03",
    endDate: "2026-04-03",
    description: "Hari Libur Nasional Wafat Yesus Kristus.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-08",
    name: "Hari Buruh Internasional",
    category: "nasional",
    startDate: "2026-05-01",
    endDate: "2026-05-01",
    description: "Hari Libur Nasional Hari Buruh Internasional.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-09",
    name: "Kenaikan Yesus Kristus",
    category: "nasional",
    startDate: "2026-05-14",
    endDate: "2026-05-14",
    description: "Hari Libur Nasional Kenaikan Yesus Kristus.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-10",
    name: "Hari Raya Idul Adha 1447 H",
    category: "nasional",
    startDate: "2026-05-27",
    endDate: "2026-05-27",
    description: "Hari Libur Nasional Hari Raya Idul Adha 1447 H.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-11",
    name: "Hari Raya Waisak 2570 BE",
    category: "nasional",
    startDate: "2026-05-31",
    endDate: "2026-05-31",
    description: "Hari Libur Nasional Hari Raya Waisak.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-12",
    name: "Hari Lahir Pancasila",
    category: "nasional",
    startDate: "2026-06-01",
    endDate: "2026-06-01",
    description: "Hari Libur Nasional Hari Lahir Pancasila.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-13",
    name: "Tahun Baru Islam (1 Muharram 1448 H)",
    category: "nasional",
    startDate: "2026-06-16",
    endDate: "2026-06-16",
    description: "Hari Libur Nasional Tahun Baru Islam 1448 Hijriah.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-14",
    name: "Hari Kemerdekaan RI ke-81",
    category: "nasional",
    startDate: "2026-08-17",
    endDate: "2026-08-17",
    description: "Hari Libur Nasional Kemerdekaan Republik Indonesia.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-15",
    name: "Maulid Nabi Muhammad SAW 1448 H",
    category: "nasional",
    startDate: "2026-08-25",
    endDate: "2026-08-25",
    description: "Hari Libur Nasional Maulid Nabi Muhammad SAW.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-16",
    name: "Hari Santri Nasional (HSN)",
    category: "madrasah",
    startDate: "2026-10-22",
    endDate: "2026-10-22",
    description: "Peringatan Hari Santri Nasional Madrasah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-2026-17",
    name: "Hari Guru Nasional (HGN) / Hari Guru Madrasah",
    category: "madrasah",
    startDate: "2026-11-25",
    endDate: "2026-11-25",
    description: "Peringatan HGN & apresiasi GTK Madrasah Kanwil Kemenag Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-2026-18",
    name: "Hari Raya Natal",
    category: "nasional",
    startDate: "2026-12-25",
    endDate: "2026-12-25",
    description: "Hari Libur Nasional Hari Raya Natal.",
    isKaldikJateng: false
  },
  {
    id: "HOL-2026-19",
    name: "Libur Akhir Semester Gasal TP 2026/2027",
    category: "madrasah",
    startDate: "2026-12-21",
    endDate: "2027-01-02",
    description: "Libur pembelajaran pasca pembagian rapor Semester Gasal sesuai Kaldik Kanwil Kemenag Jateng.",
    isKaldikJateng: true
  },

  // --- HARI LIBUR & PERINGATAN KHUSUS MADRASAH (KANWIL KEMENAG PROVINSI JAWA TENGAH) 2027 ---
  {
    id: "HOL-KLD-01",
    name: "Hari Amal Bakti (HAB) Kementerian Agama RI ke-81",
    category: "madrasah",
    startDate: "2027-01-03",
    endDate: "2027-01-03",
    description: "Peringatan Hari Lahir Kementerian Agama RI. Upacara bendera & syiar resmi madrasah Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-02",
    name: "Hari Santri Nasional (HSN)",
    category: "madrasah",
    startDate: "2026-10-22",
    endDate: "2026-10-22",
    description: "Peringatan Hari Santri Nasional. Upacara akbar & kegiatan syiar keagamaan madrasah se-Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-03",
    name: "Hari Guru Nasional (HGN) / Hari Guru Madrasah",
    category: "madrasah",
    startDate: "2026-11-25",
    endDate: "2026-11-25",
    description: "Peringatan HGN & apresiasi GTK Madrasah Kanwil Kemenag Provinsi Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-04",
    name: "Libur Akhir Semester Gasal TP 2026/2027",
    category: "madrasah",
    startDate: "2026-12-21",
    endDate: "2027-01-02",
    description: "Libur pembelajaran pasca pembagian rapor Semester Gasal sesuai Kaldik Kanwil Kemenag Jateng.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-05",
    name: "Perkiraan Libur Awal Ramadhan 1448 H",
    category: "madrasah",
    startDate: "2027-02-18",
    endDate: "2027-02-20",
    description: "Libur awal puasa Ramadhan sesuai pedoman Kaldik Madrasah Kanwil Kemenag Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-06",
    name: "Libur Hari Raya Idul Fitri 1448 H & Cuti Bersama Madrasah",
    category: "madrasah",
    startDate: "2027-03-24",
    endDate: "2027-04-06",
    description: "Libur menyambut Hari Raya Idul Fitri dan cuti bersama Idul Fitri madrasah Jawa Tengah.",
    isKaldikJateng: true
  },
  {
    id: "HOL-KLD-07",
    name: "Libur Akhir Semester Genap / Kenaikan Kelas TP 2026/2027",
    category: "madrasah",
    startDate: "2027-06-21",
    endDate: "2027-07-11",
    description: "Libur akhir tahun pelajaran dan persiapan tahun ajaran baru madrasah se-Jawa Tengah.",
    isKaldikJateng: true
  },

  // --- HARI LIBUR NASIONAL RESMI ---
  {
    id: "HOL-NAS-01",
    name: "Tahun Baru Masehi 2027",
    category: "nasional",
    startDate: "2027-01-01",
    endDate: "2027-01-01",
    description: "Hari Libur Nasional Tahun Baru Masehi.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-02",
    name: "Isra Mi'raj Nabi Muhammad SAW 1448 H",
    category: "nasional",
    startDate: "2027-01-06",
    endDate: "2027-01-06",
    description: "Hari Libur Nasional Isra Mi'raj Nabi Muhammad SAW.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-03",
    name: "Tahun Baru Imlek 2578 Kongzili",
    category: "nasional",
    startDate: "2027-02-06",
    endDate: "2027-02-06",
    description: "Hari Libur Nasional Tahun Baru Imlek.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-04",
    name: "Hari Suci Nyepi (Tahun Baru Saka 1949)",
    category: "nasional",
    startDate: "2027-03-09",
    endDate: "2027-03-09",
    description: "Hari Libur Nasional Hari Suci Nyepi.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-05",
    name: "Wafat Yesus Kristus (Jumat Agung)",
    category: "nasional",
    startDate: "2027-03-26",
    endDate: "2027-03-26",
    description: "Hari Libur Nasional Wafat Yesus Kristus.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-06",
    name: "Hari Raya Idul Fitri 1448 H (1-2 Syawal)",
    category: "nasional",
    startDate: "2027-03-30",
    endDate: "2027-03-31",
    description: "Hari Libur Nasional Hari Raya Idul Fitri 1448 Hijriah.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-07",
    name: "Hari Buruh Internasional",
    category: "nasional",
    startDate: "2027-05-01",
    endDate: "2027-05-01",
    description: "Hari Libur Nasional Hari Buruh Internasional (May Day).",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-08",
    name: "Kenaikan Yesus Kristus",
    category: "nasional",
    startDate: "2027-05-06",
    endDate: "2027-05-06",
    description: "Hari Libur Nasional Kenaikan Yesus Kristus.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-09",
    name: "Hari Raya Waisak 2571 BE",
    category: "nasional",
    startDate: "2027-05-20",
    endDate: "2027-05-20",
    description: "Hari Libur Nasional Hari Raya Waisak.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-10",
    name: "Hari Lahir Pancasila",
    category: "nasional",
    startDate: "2027-06-01",
    endDate: "2027-06-01",
    description: "Hari Libur Nasional Hari Lahir Pancasila.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-11",
    name: "Hari Raya Idul Adha 1448 H",
    category: "nasional",
    startDate: "2027-06-06",
    endDate: "2027-06-06",
    description: "Hari Libur Nasional Hari Raya Idul Adha.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-12",
    name: "Tahun Baru Islam (1 Muharram 1449 H)",
    category: "nasional",
    startDate: "2027-06-26",
    endDate: "2027-06-26",
    description: "Hari Libur Nasional Tahun Baru Islam 1449 Hijriah.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-13",
    name: "Hari Proklamasi Kemerdekaan RI ke-81",
    category: "nasional",
    startDate: "2026-08-17",
    endDate: "2026-08-17",
    description: "Hari Libur Nasional Kemerdekaan Republik Indonesia.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-14",
    name: "Maulid Nabi Muhammad SAW 1448 H",
    category: "nasional",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    description: "Hari Libur Nasional Maulid Nabi Muhammad SAW.",
    isKaldikJateng: false
  },
  {
    id: "HOL-NAS-15",
    name: "Hari Raya Natal",
    category: "nasional",
    startDate: "2026-12-25",
    endDate: "2026-12-25",
    description: "Hari Libur Nasional Hari Raya Natal.",
    isKaldikJateng: false
  }
];

const _initNow = new Date();
const _initDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const _initMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const _initDateStr = `${_initNow.getFullYear()}-${String(_initNow.getMonth() + 1).padStart(2, '0')}-${String(_initNow.getDate()).padStart(2, '0')}`;
const _initFormattedDate = `${_initDays[_initNow.getDay()]}, ${_initNow.getDate()} ${_initMonths[_initNow.getMonth()]} ${_initNow.getFullYear()}`;

const INITIAL_TODAY_ATTENDANCE = {
  date: _initDateStr,
  formattedDate: _initFormattedDate,
  status: "Belum Absen", // "Belum Absen" | "Hadir" | "Terlambat" | "Pulang" | "Izin" | "Sakit"
  checkIn: null, // { time: "06:52 WIB", lat: -6.20882, lng: 106.84560, distance: "14m", verified: true, photo: null }
  checkOut: null,
  workDuration: "-",
  note: _initNow.getDay() === 0 ? "Hari Libur Akhir Pekan (Minggu)." : "Hari efektif KBM semester ganjil."
};

const INITIAL_ATTENDANCE_HISTORY = [];

const INITIAL_LEAVE_REQUESTS = [];

let TEACHING_SCHEDULES = [
  {
    id: "SCH-MON-01",
    day: "Senin",
    time: "07:30 - 09:00 WIB",
    startTime: "07:30",
    endTime: "09:00",
    subject: "Matematika",
    class: "Kelas IX-A",
    room: "Ruang Teori 3",
    jtm: 2,
    totalStudents: 32
  },
  {
    id: "SCH-MON-02",
    day: "Senin",
    time: "09:30 - 11:00 WIB",
    startTime: "09:30",
    endTime: "11:00",
    subject: "Matematika",
    class: "Kelas IX-B",
    room: "Ruang Teori 4",
    jtm: 2,
    totalStudents: 30
  },
  {
    id: "SCH-TUE-01",
    day: "Selasa",
    time: "08:15 - 09:45 WIB",
    startTime: "08:15",
    endTime: "09:45",
    subject: "Matematika",
    class: "Kelas VIII-C",
    room: "Ruang Teori 1",
    jtm: 2,
    totalStudents: 31
  },
  {
    id: "SCH-TUE-02",
    day: "Selasa",
    time: "10:15 - 12:30 WIB",
    startTime: "10:15",
    endTime: "12:30",
    subject: "Bimbingan Wali Kelas",
    class: "Kelas IX-A",
    room: "Ruang IX-A",
    jtm: 2,
    totalStudents: 32
  },
  {
    id: "SCH-WED-01",
    day: "Rabu",
    time: "07:30 - 09:45 WIB",
    startTime: "07:30",
    endTime: "09:45",
    subject: "IPA Terpadu (Fisika)",
    class: "Kelas IX-A",
    room: "Lab IPA",
    jtm: 3,
    totalStudents: 32
  },
  {
    id: "SCH-THU-01",
    day: "Kamis",
    time: "08:15 - 10:30 WIB",
    startTime: "08:15",
    endTime: "10:30",
    subject: "Matematika Peminatan",
    class: "Kelas IX-C",
    room: "Ruang Teori 5",
    jtm: 3,
    totalStudents: 30
  },
  {
    id: "SCH-FRI-02",
    day: "Jumat",
    time: "08:45 - 10:15 WIB",
    startTime: "08:45",
    endTime: "10:15",
    subject: "Matematika",
    class: "Kelas IX-A",
    room: "Ruang Teori 3",
    jtm: 2,
    totalStudents: 32
  }
];

const INITIAL_TEACHING_LOGS = [];

const NOTIFICATIONS = [
  {
    id: "NOTIF-01",
    title: "Pengingat Presensi Pulang",
    message: "Pukul 14:00 WIB telah tiba. Jangan lupa untuk melakukan absen pulang sebelum meninggalkan area madrasah.",
    time: "10 menit yang lalu",
    type: "info",
    unread: true
  },
  {
    id: "NOTIF-02",
    title: "Izin Dinas Disetujui",
    message: "Permohonan tugas luar di Balai Diklat Keagamaan telah diverifikasi & disetujui Kepala Madrasah.",
    time: "2 hari yang lalu",
    type: "success",
    unread: false
  },
  {
    id: "NOTIF-03",
    title: "Koreksi Kehadiran Diterapkan",
    message: "Admin H. Musthafa telah memperbarui jam kepulangan Anda pada 19 Okt 2026 sesuai laporan piket.",
    time: "19 Okt 2026",
    type: "warning",
    unread: false
  }
];

// Data Live Monitoring Seluruh Ruang Kelas (Dashboard Admin / Guru Piket) - Dimulai bersih
const INITIAL_ROOMS_MONITORING = [];

const INITIAL_ADMIN_ACTIVITY_FEED = [];

// ==========================================
// MASTER REFERENSI AKADEMIK (26 ROMBEL & RUANGAN)
// ==========================================
const CLASSES_LIST = [
  "7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H",
  "8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H",
  "9A", "9B", "9C", "9D", "9E", "9F", "9G", "9H", "9I", "9J"
];

const ROOMS_LIST = [
  "Ruang Kelas 7A", "Ruang Kelas 7B", "Ruang Kelas 7C", "Ruang Kelas 7D",
  "Ruang Kelas 7E", "Ruang Kelas 7F", "Ruang Kelas 7G", "Ruang Kelas 7H",
  "Ruang Kelas 8A", "Ruang Kelas 8B", "Ruang Kelas 8C", "Ruang Kelas 8D",
  "Ruang Kelas 8E", "Ruang Kelas 8F", "Ruang Kelas 8G", "Ruang Kelas 8H",
  "Ruang Kelas 9A", "Ruang Kelas 9B", "Ruang Kelas 9C", "Ruang Kelas 9D",
  "Ruang Kelas 9E", "Ruang Kelas 9F", "Ruang Kelas 9G", "Ruang Kelas 9H",
  "Ruang Kelas 9I", "Ruang Kelas 9J",
  "Lab Komputer 1", "Lab Komputer 2", "Lab IPA", "Masjid Kampus", "Lapangan Olahraga"
];

const PERIODS_LIST = [
  { period: 1, start: "07:15", end: "07:55", label: "Jam 1 (07:15 - 07:55)" },
  { period: 2, start: "07:55", end: "08:35", label: "Jam 2 (07:55 - 08:35)" },
  { period: 3, start: "08:35", end: "09:15", label: "Jam 3 (08:35 - 09:15)" },
  { period: 4, start: "09:35", end: "10:15", label: "Jam 4 (09:35 - 10:15)" },
  { period: 5, start: "10:15", end: "10:55", label: "Jam 5 (10:15 - 10:55)" },
  { period: 6, start: "10:55", end: "11:35", label: "Jam 6 (10:55 - 11:35)" },
  { period: 7, start: "12:35", end: "13:15", label: "Jam 7 (12:35 - 13:15)" },
  { period: 8, start: "13:15", end: "13:55", label: "Jam 8 (13:15 - 13:55)" }
];

// ==========================================
// MASTER DATABASE 51 GURU REEL LENGKAP
// (Sumber: Data Kepegawaian & Jadwal Mengajar Resmi)
// ==========================================
const INITIAL_TEACHERS_MASTER = [
  { id: "TCH-00", name: "Drs. H. Akhmad Rosidi", nip: "9248740641200003", nuptk: "9248740641200003", subject: "Kepala Madrasah", dept: "Manajemen Madrasah", targetJtm: 0, classAssigned: "Kepala Madrasah", email: "akhmad.rosisi@mtsasyjtb.sch.id", phone: "6281234567890", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Pendidik", position: "Kepala Madrasah" },
  { id: "TCH-01", name: "ABDUR ROUF", nip: "91000074100899", nuptk: "-", subject: "SKI", dept: "PAI", targetJtm: 24, classAssigned: "Wali Kelas VII-A", email: "abdur.rouf@mtsasyjtb.sch.id", phone: "6281548138852", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Pendidik", position: "Wali Kelas VII-A" },
  { id: "TCH-02", name: "ADE AYU NUR TANTRI", nip: "20326797197002", nuptk: "-", subject: "Pendidikan Pancasila", dept: "Sosial & Kewarganegaraan", targetJtm: 26, classAssigned: "Wali Kelas VII-B", email: "ade.ayu@mtsasyjtb.sch.id", phone: "6285869979210", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-03", name: "AENI AFTHINA", nip: "20200613100001", nuptk: "-", subject: "IPA", dept: "MIPA", targetJtm: 26, classAssigned: "Wali Kelas VII-C", email: "aeni.afthina@mtsasyjtb.sch.id", phone: "6287775288140", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-04", name: "AHMAD FARID", nip: "91000080102905", nuptk: "-", subject: "Akidah Akhlak", dept: "PAI", targetJtm: 12, classAssigned: "Guru Mapel", email: "ahmad.farid@mtsasyjtb.sch.id", phone: "6285601633669", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-05", name: "Ahmad Syafi", nip: "20326797185001", nuptk: "-", subject: "Ke-NU-an", dept: "Keagamaan & Muatan Lokal", targetJtm: 26, classAssigned: "Wali Kelas VII-D", email: "ahmad.syafi@mtsasyjtb.sch.id", phone: "", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-06", name: "AHMAD SYAMSUL FALAH", nip: "20326797199001", nuptk: "-", subject: "Ke-NU-an", dept: "Keagamaan & Muatan Lokal", targetJtm: 26, classAssigned: "Guru Mapel", email: "syamsul.falah@mtsasyjtb.sch.id", phone: "6281542130070", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-07", name: "Aini Lutfiyah", nip: "91000081103794", nuptk: "-", subject: "Bahasa Arab", dept: "Bahasa", targetJtm: 24, classAssigned: "Wali Kelas VIII-A", email: "aini.lutfiyah@mtsasyjtb.sch.id", phone: "6281542260659", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-08", name: "AMIR SYARIFUDIN", nip: "91000081104938", nuptk: "-", subject: "Pendidikan Agama Islam", dept: "PAI", targetJtm: 0, classAssigned: "Guru Pembina", email: "amir.syarifudin@mtsasyjtb.sch.id", phone: "", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-09", name: "Ana Rodiyana", nip: "91000075104250", nuptk: "-", subject: "Bimbingan Konseling", dept: "BK", targetJtm: 0, classAssigned: "Guru BK", email: "ana.rodiyana@mtsasyjtb.sch.id", phone: "", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-10", name: "ANIS MASRUFATUN SAADAH", nip: "91000085105943", nuptk: "-", subject: "IPA", dept: "MIPA", targetJtm: 24, classAssigned: "Wali Kelas VIII-B", email: "anis.masrufatun@mtsasyjtb.sch.id", phone: "6285867477945", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-11", name: "APRIS DWI PRIYATOMO", nip: "91000072105448", nuptk: "-", subject: "Bahasa Indonesia", dept: "Bahasa", targetJtm: 12, classAssigned: "Guru Mapel", email: "apris.dwi@mtsasyjtb.sch.id", phone: "6282328831541", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-12", name: "AYU ROSALITA", nip: "20326797196002", nuptk: "-", subject: "Bahasa Indonesia", dept: "Bahasa", targetJtm: 28, classAssigned: "Wali Kelas VIII-C", email: "ayu.rosalita@mtsasyjtb.sch.id", phone: "6285742390604", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-13", name: "BAENY ABDUL FATAH", nip: "20326797199003", nuptk: "-", subject: "PJOK", dept: "Olahraga & Kesehatan", targetJtm: 28, classAssigned: "Wali Kelas VIII-D", email: "baeny.abdul@mtsasyjtb.sch.id", phone: "6285934250084", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-14", name: "DARSONAH SETYOWATI", nip: "91000066108311", nuptk: "-", subject: "Bimbingan Konseling", dept: "BK", targetJtm: 0, classAssigned: "Guru Pembina", email: "darsonah.setyowati@mtsasyjtb.sch.id", phone: "", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-15", name: "DENY PRABOWO", nip: "91000080112516", nuptk: "-", subject: "Bahasa Inggris", dept: "Bahasa", targetJtm: 26, classAssigned: "Wali Kelas IX-A", email: "deny.prabowo@mtsasyjtb.sch.id", phone: "6285642504157", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-16", name: "DETTY TURISHA WIGUNANTI", nip: "91000086111652", nuptk: "-", subject: "Bahasa Inggris", dept: "Bahasa", targetJtm: 26, classAssigned: "Wali Kelas IX-B", email: "detty.turisha@mtsasyjtb.sch.id", phone: "62816697488", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-17", name: "DEWI RACHMAWATI", nip: "91000082115252", nuptk: "-", subject: "IPA", dept: "MIPA", targetJtm: 28, classAssigned: "Wali Kelas IX-C", email: "dewi.rachmawati@mtsasyjtb.sch.id", phone: "6281542178006", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-18", name: "ELLA LINTANG AGUSTIN", nip: "20326797101001", nuptk: "-", subject: "Informatika", dept: "Teknologi & Keterampilan", targetJtm: 28, classAssigned: "Wali Kelas IX-D", email: "ella.lintang@mtsasyjtb.sch.id", phone: "62816722589", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-19", name: "ENY ERLINA", nip: "91000082120487", nuptk: "-", subject: "Matematika", dept: "MIPA", targetJtm: 24, classAssigned: "Guru Mapel", email: "eny.erlina@mtsasyjtb.sch.id", phone: "6281542054714", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-20", name: "ETHIK RAHMAWATI", nip: "91000076113942", nuptk: "-", subject: "IPA", dept: "MIPA", targetJtm: 28, classAssigned: "Guru Mapel", email: "ethik.rahmawati@mtsasyjtb.sch.id", phone: "628157970850", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-21", name: "ETIK SULISTYO RATRI", nip: "20363282185001", nuptk: "-", subject: "Bahasa Jawa", dept: "Bahasa", targetJtm: 23, classAssigned: "Guru Mapel", email: "etik.sulistyo@mtsasyjtb.sch.id", phone: "6285600667262", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-22", name: "HARIYANTO", nip: "91000081123488", nuptk: "-", subject: "Matematika", dept: "MIPA", targetJtm: 20, classAssigned: "Guru Mapel", email: "hariyanto@mtsasyjtb.sch.id", phone: "6285866827575", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-23", name: "Ismatul Maula", nip: "20326797191003", nuptk: "-", subject: "Bahasa Arab", dept: "Bahasa", targetJtm: 24, classAssigned: "Guru Mapel", email: "ismatul.maula@mtsasyjtb.sch.id", phone: "6285927492177", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-24", name: "KHASANAH", nip: "91000076124272", nuptk: "-", subject: "Bahasa Arab", dept: "Bahasa", targetJtm: 24, classAssigned: "Guru Mapel", email: "khasanah@mtsasyjtb.sch.id", phone: "6285865947049", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-25", name: "Khodijatul Kubro", nip: "20326797188001", nuptk: "-", subject: "Tahfidz", dept: "Keagamaan & Muatan Lokal", targetJtm: 26, classAssigned: "Guru Mapel", email: "khodijatul.kubro@mtsasyjtb.sch.id", phone: "6285742603241", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-26", name: "M. AZIZ HIMAWAN AKBAR", nip: "20326797194002", nuptk: "-", subject: "Tahfidz", dept: "Keagamaan & Muatan Lokal", targetJtm: 24, classAssigned: "Guru Mapel", email: "aziz.himawan@mtsasyjtb.sch.id", phone: "6285712626267", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-27", name: "Mochammad Aqil Mahfudz", nip: "20326797189002", nuptk: "-", subject: "Fikih", dept: "PAI", targetJtm: 22, classAssigned: "Guru Mapel", email: "aqil.mahfudz@mtsasyjtb.sch.id", phone: "6285210785527", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-28", name: "MOHAMMAD AZAMIN", nip: "91000077131961", nuptk: "-", subject: "SKI", dept: "PAI", targetJtm: 24, classAssigned: "Guru Mapel", email: "mohammad.azamin@mtsasyjtb.sch.id", phone: "6285716611167", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-29", name: "MUHAMMAD AKVIN SYARIFUDIN", nip: "20326797197003", nuptk: "-", subject: "BTQ", dept: "Keagamaan & Muatan Lokal", targetJtm: 26, classAssigned: "Guru Mapel", email: "akvin.syarifudin@mtsasyjtb.sch.id", phone: "6285693038967", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-30", name: "MUHAMMAD IRSYAD HUSNI", nip: "20326797196005", nuptk: "-", subject: "Tahfidz", dept: "Keagamaan & Muatan Lokal", targetJtm: 26, classAssigned: "Guru Mapel", email: "irsyad.husni@mtsasyjtb.sch.id", phone: "6285742226906", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-31", name: "MUHDI", nip: "91000073129641", nuptk: "-", subject: "Akidah Akhlak", dept: "PAI", targetJtm: 27, classAssigned: "Guru Mapel", email: "muhdi@mtsasyjtb.sch.id", phone: "6281542028802", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-32", name: "MUKHAMAD ARIS", nip: "91000077133655", nuptk: "-", subject: "Informatika", dept: "Teknologi & Keterampilan", targetJtm: 12, classAssigned: "Guru Mapel", email: "mukhamad.aris@mtsasyjtb.sch.id", phone: "085229755797", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-33", name: "MUSTOFA", nip: "91000076133788", nuptk: "-", subject: "Fikih", dept: "PAI", targetJtm: 24, classAssigned: "Guru Mapel", email: "mustofa@mtsasyjtb.sch.id", phone: "6285780944439", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-34", name: "MUZAKKY MIFTAH", nip: "91000075133679", nuptk: "-", subject: "IPS", dept: "Sosial & Kewarganegaraan", targetJtm: 21, classAssigned: "Guru Mapel", email: "muzakky.miftah@mtsasyjtb.sch.id", phone: "6281548841706", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-35", name: "NASARUDIN", nip: "91000064129055", nuptk: "-", subject: "Matematika", dept: "MIPA", targetJtm: 24, classAssigned: "Guru Mapel", email: "nasarudin@mtsasyjtb.sch.id", phone: "", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-36", name: "NOPRIYANI", nip: "91000082154354", nuptk: "-", subject: "Informatika", dept: "Teknologi & Keterampilan", targetJtm: 26, classAssigned: "Guru Mapel", email: "nopriyani@mtsasyjtb.sch.id", phone: "6285228732293", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-37", name: "Nur Azizah", nip: "20326797175001", nuptk: "-", subject: "SKI", dept: "PAI", targetJtm: 24, classAssigned: "Guru Mapel", email: "nur.azizah@mtsasyjtb.sch.id", phone: "62882008826272", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-38", name: "NUR KHIKMAH", nip: "91000083152640", nuptk: "-", subject: "Bahasa Indonesia", dept: "Bahasa", targetJtm: 28, classAssigned: "Guru Mapel", email: "nur.khikmah@mtsasyjtb.sch.id", phone: "6282224499521", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-39", name: "RAGIL SUSYANTO", nip: "20326797199002", nuptk: "-", subject: "PJOK", dept: "Olahraga & Kesehatan", targetJtm: 28, classAssigned: "Guru Mapel", email: "ragil.susyanto@mtsasyjtb.sch.id", phone: "628976999218", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-40", name: "RAMDLONI", nip: "91000069143609", nuptk: "-", subject: "Al-Qur'an Hadis", dept: "PAI", targetJtm: 26, classAssigned: "Guru Mapel", email: "ramdloni@mtsasyjtb.sch.id", phone: "6285786690330", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-41", name: "RETNO FAJAR INTAMI", nip: "20363082185001", nuptk: "-", subject: "Seni Rupa", dept: "Seni & Budaya", targetJtm: 30, classAssigned: "Guru Mapel", email: "retno.fajar@mtsasyjtb.sch.id", phone: "6282324698120", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-42", name: "Ridlo Alam Nan Asa", nip: "20326797190001", nuptk: "-", subject: "Akidah Akhlak", dept: "PAI", targetJtm: 24, classAssigned: "Guru Mapel", email: "ridlo.alam@mtsasyjtb.sch.id", phone: "6285799263027", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-43", name: "RIZQI YUNI ARSIH", nip: "20326797197001", nuptk: "-", subject: "Bahasa Indonesia", dept: "Bahasa", targetJtm: 32, classAssigned: "Guru Mapel", email: "rizqi.yuni@mtsasyjtb.sch.id", phone: "6285741747985", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-44", name: "SILVIA TINDIYAH SUGIARTO", nip: "91000081160541", nuptk: "-", subject: "Bahasa Indonesia", dept: "Bahasa", targetJtm: 28, classAssigned: "Guru Mapel", email: "silvia.tindiyah@mtsasyjtb.sch.id", phone: "628156914005", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-45", name: "SITI ISYUNIATI", nip: "91000071143239", nuptk: "-", subject: "Matematika", dept: "MIPA", targetJtm: 24, classAssigned: "Guru Mapel", email: "siti.isyuniati@mtsasyjtb.sch.id", phone: "6289636059040", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-46", name: "SITI NURJANAH", nip: "91000078151658", nuptk: "-", subject: "Pendidikan Pancasila", dept: "Sosial & Kewarganegaraan", targetJtm: 24, classAssigned: "Guru Mapel", email: "siti.nurjanah@mtsasyjtb.sch.id", phone: "6285540141253", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-47", name: "SUDIYANTO", nip: "91000078154469", nuptk: "-", subject: "IPS", dept: "Sosial & Kewarganegaraan", targetJtm: 15, classAssigned: "Guru Mapel", email: "sudiyanto@mtsasyjtb.sch.id", phone: "6285602845241", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-48", name: "TITIN SOFIYATIN", nip: "91000068159822", nuptk: "-", subject: "IPS", dept: "Sosial & Kewarganegaraan", targetJtm: 27, classAssigned: "Guru Mapel", email: "titin.sofiyatin@mtsasyjtb.sch.id", phone: "6285712792600", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-49", name: "TUTI ALAWIYYAH", nip: "91000475154699", nuptk: "-", subject: "Al-Qur'an Hadis", dept: "PAI", targetJtm: 26, classAssigned: "Guru Mapel", email: "tuti.alawiyyah@mtsasyjtb.sch.id", phone: "6285325735885", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-50", name: "WAWAN ERAWAN", nip: "91000068162605", nuptk: "-", subject: "Bahasa Inggris", dept: "Bahasa", targetJtm: 24, classAssigned: "Guru Mapel", email: "wawan.erawan@mtsasyjtb.sch.id", phone: "6285870188834", avatarUrl: "", gender: "Laki-laki", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" },
  { id: "TCH-51", name: "YULITA LISTIA SARI", nip: "20326797100002", nuptk: "-", subject: "IPS", dept: "Sosial & Kewarganegaraan", targetJtm: 15, classAssigned: "Guru BK", email: "yulita.listia@mtsasyjtb.sch.id", phone: "6285722041401", avatarUrl: "", gender: "Perempuan", status: "Aktif", pin: "123456", password: "123456", role: "Guru Pengajar" }
];

// Alias kompatibilitas
const INITIAL_TEACHERS_MASTER_60 = INITIAL_TEACHERS_MASTER;

// ==========================================
// MASTER JADWAL PIKET PENYAMBUTAN SISWA (5S GERBANG MADRASAH)
// Waktu Pelaksanaan: 06:15 - 07:00 WIB (Senin s/d Sabtu)
// ==========================================
const INITIAL_WELCOMING_PICKET_ROSTER = [
  {
    day: "Senin",
    reguName: "Regu Al-Fatihah",
    squadName: "Regu Al-Fatihah",
    icon: "🌅",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Senyum & Salam Pembuka Pekan",
    members: []
  },
  {
    day: "Selasa",
    reguName: "Regu An-Nur",
    squadName: "Regu An-Nur",
    icon: "✨",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Kedisiplinan & Kesantunan",
    members: []
  },
  {
    day: "Rabu",
    reguName: "Regu Al-Hikmah",
    squadName: "Regu Al-Hikmah",
    icon: "🌿",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Semangat Belajar & Kerapian",
    members: []
  },
  {
    day: "Kamis",
    reguName: "Regu Al-Ikhlas",
    squadName: "Regu Al-Ikhlas",
    icon: "🕌",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Karakter Islami & Kepedulian",
    members: []
  },
  {
    day: "Jumat",
    reguName: "Regu As-Salam",
    squadName: "Regu As-Salam",
    icon: "🌟",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Jumat Berkah & Budaya Bersih",
    members: []
  },
  {
    day: "Sabtu",
    reguName: "Regu Al-Barakah",
    squadName: "Regu Al-Barakah",
    icon: "⚽",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Aktivitas Akhir Pekan & Ekskul",
    members: []
  },
  {
    day: "Minggu",
    reguName: "Regu Khusus Ahad",
    squadName: "Regu Khusus Ahad",
    icon: "🕊️",
    coordinator: "-",
    time: "06:15 - 07:00",
    timeSpan: "06:15 - 07:00 WIB",
    theme: "Kegiatan Khusus & Pelayanan Ekstra",
    members: []
  }
];

// ==========================================
// MASTER JADWAL MENGAJAR GURU REEL
// ==========================================
const INITIAL_MASTER_SCHEDULES = [
  { id: "SCH-32-TUE1", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9G", subject: "Informatika", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-32-WED2", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9F", subject: "Informatika", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-32-THU3", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9I", subject: "Informatika", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-32-FRI4", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:30", endTime: "10:40", time: "09:30 - 10:40 WIB", class: "Kelas 9E", subject: "Informatika", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-32-SAT5", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9H", subject: "Informatika", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-32-SAT6", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 9H", subject: "Informatika", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-32-SAT7", teacherId: "TCH-32", teacherName: "MUKHAMAD ARIS", day: "Sabtu", periodStart: 7, periodEnd: 8, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9J", subject: "Informatika", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-11-TUE1", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9A", subject: "Bahasa Indonesia", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-11-WED2", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9C", subject: "Bahasa Indonesia", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-11-THU3", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9C", subject: "Bahasa Indonesia", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-11-FRI4", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9B", subject: "Bahasa Indonesia", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-11-SAT5", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9A", subject: "Bahasa Indonesia", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-11-SAT6", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 9A", subject: "Bahasa Indonesia", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-11-SAT7", teacherId: "TCH-11", teacherName: "APRIS DWI PRIYATOMO", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9B", subject: "Bahasa Indonesia", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-45-MON1", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7F", subject: "Matematika", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-45-MON2", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7E", subject: "Matematika", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-45-TUE3", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7D", subject: "Matematika", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-45-TUE4", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7C", subject: "Matematika", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-45-WED5", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7C", subject: "Matematika", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-45-WED6", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 7A", subject: "Matematika", room: "Ruang Kelas 7A", jtm: 1 },
  { id: "SCH-45-WED7", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7A", subject: "Matematika", room: "Ruang Kelas 7A", jtm: 1 },
  { id: "SCH-45-THU8", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7D", subject: "Matematika", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-45-THU9", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Kamis", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 7B", subject: "Matematika", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-45-THU10", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Kamis", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7B", subject: "Matematika", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-45-FRI11", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7E", subject: "Matematika", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-45-FRI12", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7B", subject: "Matematika", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-45-FRI13", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:30", endTime: "10:50", time: "09:30 - 10:50 WIB", class: "Kelas 7F", subject: "Matematika", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-45-SAT14", teacherId: "TCH-45", teacherName: "SITI ISYUNIATI", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 7A", subject: "Matematika", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-47-WED1", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7E", subject: "IPS", room: "Ruang Kelas 7E", jtm: 1 },
  { id: "SCH-47-THU2", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7C", subject: "IPS", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-47-THU3", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7F", subject: "IPS", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-47-THU4", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Kamis", periodStart: 7, periodEnd: 7, startTime: "11:45", endTime: "12:25", time: "11:45 - 12:25 WIB", class: "Kelas 7D", subject: "IPS", room: "Ruang Kelas 7D", jtm: 1 },
  { id: "SCH-47-FRI5", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7G", subject: "IPS", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-47-FRI6", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7D", subject: "IPS", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-23-SAT1", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Sabtu", periodStart: 6, periodEnd: 6, startTime: "10:50", endTime: "11:30", time: "10:50 - 11:30 WIB", class: "Kelas 7C", subject: "Bahasa Arab", room: "Ruang Kelas 7C", jtm: 1 },
  { id: "SCH-37-MON1", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8F", subject: "SKI", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-37-MON2", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9A", subject: "Akidah Akhlak", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-37-MON3", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:10", time: "11:40 - 12:10 WIB", class: "Kelas 8B", subject: "Akidah Akhlak", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-37-TUE4", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7D", subject: "SKI", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-37-TUE5", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7C", subject: "SKI", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-37-WED6", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9I", subject: "Fikih", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-37-WED7", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7F", subject: "SKI", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-37-THU8", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7B", subject: "SKI", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-37-THU9", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9J", subject: "Fikih", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-37-FRI10", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7A", subject: "SKI", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-37-SAT11", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7E", subject: "SKI", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-37-SAT12", teacherId: "TCH-37", teacherName: "Nur Azizah", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8A", subject: "Akidah Akhlak", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-15-MON1", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9G", subject: "Bahasa Inggris", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-15-MON2", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9H", subject: "Bahasa Inggris", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-44-TUE1", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9J", subject: "Bahasa Indonesia", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-15-TUE3", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Selasa", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8A", subject: "Bahasa Inggris", room: "Ruang Kelas 8A", jtm: 1 },
  { id: "SCH-15-TUE4", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Selasa", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 9J", subject: "Bahasa Inggris", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-15-TUE5", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Selasa", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9J", subject: "Bahasa Inggris", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-15-WED6", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Rabu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8B", subject: "Bahasa Inggris", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-15-WED7", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Rabu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 9F", subject: "Bahasa Inggris", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-15-WED8", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:50", time: "09:00 - 09:50 WIB", class: "Kelas 9I", subject: "Bahasa Inggris", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-15-WED9", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9I", subject: "Bahasa Inggris", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-15-THU10", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9G", subject: "Bahasa Inggris", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-15-THU11", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8B", subject: "Bahasa Inggris", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-07-FRI1", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9J", subject: "Bahasa Arab", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-15-FRI12", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9H", subject: "Bahasa Inggris", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-15-SAT13", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8A", subject: "Bahasa Inggris", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-15-SAT14", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9J", subject: "Bahasa Inggris", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-15-SAT15", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 9J", subject: "Bahasa Inggris", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-22-MON1", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 8F", subject: "Matematika", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-22-TUE2", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8E", subject: "Matematika", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-22-TUE3", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Selasa", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 9D", subject: "Matematika", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-22-TUE4", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Selasa", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9D", subject: "Matematika", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-30-WED1", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8E", subject: "BTQ", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-48-WED1", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8F", subject: "IPS", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-22-THU5", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9B", subject: "Matematika", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-22-THU6", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9A", subject: "Matematika", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-22-FRI7", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9B", subject: "Matematika", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-22-FRI8", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9A", subject: "Matematika", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-22-SAT9", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9C", subject: "Matematika", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-22-SAT10", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9D", subject: "Matematika", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-22-SAT11", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 9D", subject: "Matematika", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-22-MON12", teacherId: "TCH-22", teacherName: "HARIYANTO", day: "Senin", periodStart: 2, periodEnd: 3, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9C", subject: "Matematika", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-02-MON1", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7B", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-02-MON2", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8E", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-02-MON3", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7C", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-02-MON4", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 7G", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-02-WED5", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 8B", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-02-WED6", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8B", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-02-THU7", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8D", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-02-THU8", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7A", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-02-FRI9", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7H", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-02-FRI10", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7E", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-02-FRI11", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 8C", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-02-SAT12", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7F", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-02-SAT13", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 7D", subject: "Pendidikan Pancasila", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-02-WED14", teacherId: "TCH-02", teacherName: "ADE AYU NUR TANTRI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8F", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-50-MON1", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7C", subject: "Bahasa Inggris", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-50-MON2", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 7A", subject: "Bahasa Inggris", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-50-TUE3", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8G", subject: "Bahasa Inggris", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-50-WED4", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Rabu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7A", subject: "Bahasa Inggris", room: "Ruang Kelas 7A", jtm: 1 },
  { id: "SCH-50-WED5", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7D", subject: "Bahasa Inggris", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-50-WED6", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8E", subject: "Bahasa Inggris", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-50-THU7", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8H", subject: "Bahasa Inggris", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-50-THU8", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8F", subject: "Bahasa Inggris", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-50-THU9", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Kamis", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 7B", subject: "Bahasa Inggris", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-50-THU10", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Kamis", periodStart: 8, periodEnd: 8, startTime: "12:25", endTime: "12:50", time: "12:25 - 12:50 WIB", class: "Kelas 7D", subject: "Bahasa Inggris", room: "Ruang Kelas 7D", jtm: 1 },
  { id: "SCH-50-FRI11", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7B", subject: "Bahasa Inggris", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-50-FRI12", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Jumat", periodStart: 3, periodEnd: 3, startTime: "08:10", endTime: "08:45", time: "08:10 - 08:45 WIB", class: "Kelas 8F", subject: "Bahasa Inggris", room: "Ruang Kelas 8F", jtm: 1 },
  { id: "SCH-50-SAT13", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 7C", subject: "Bahasa Inggris", room: "Ruang Kelas 7C", jtm: 1 },
  { id: "SCH-50-SAT14", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8E", subject: "Bahasa Inggris", room: "Ruang Kelas 8E", jtm: 1 },
  { id: "SCH-50-SAT15", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8H", subject: "Bahasa Inggris", room: "Ruang Kelas 8H", jtm: 1 },
  { id: "SCH-50-SAT16", teacherId: "TCH-50", teacherName: "WAWAN ERAWAN", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 8G", subject: "Bahasa Inggris", room: "Ruang Kelas 8G", jtm: 1 },
  { id: "SCH-16-MON1", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8C", subject: "Bahasa Inggris", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-16-MON2", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 9B", subject: "Bahasa Inggris", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-16-TUE3", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9E", subject: "Bahasa Inggris", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-16-TUE4", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9A", subject: "Bahasa Inggris", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-16-TUE5", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9C", subject: "Bahasa Inggris", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-16-WED6", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9C", subject: "Bahasa Inggris", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-16-WED7", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9D", subject: "Bahasa Inggris", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-16-WED8", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9E", subject: "Bahasa Inggris", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-16-THU9", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9A", subject: "Bahasa Inggris", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-16-THU10", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8D", subject: "Bahasa Inggris", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-16-FRI11", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:35", endTime: "10:45", time: "09:35 - 10:45 WIB", class: "Kelas 9B", subject: "Bahasa Inggris", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-16-SAT12", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8C", subject: "Bahasa Inggris", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-16-SAT13", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9D", subject: "Bahasa Inggris", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-16-SAT14", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Sabtu", periodStart: 6, periodEnd: 6, startTime: "10:50", endTime: "11:30", time: "10:50 - 11:30 WIB", class: "Kelas 9D", subject: "Bahasa Inggris", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-16-SAT15", teacherId: "TCH-16", teacherName: "DETTY TURISHA WIGUNANTI", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 8D", subject: "Bahasa Inggris", room: "Ruang Kelas 8D", jtm: 1 },
  { id: "SCH-43-MON1", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7C", subject: "Bahasa Indonesia", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-43-MON2", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7E", subject: "Bahasa Jawa", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-43-MON3", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7A", subject: "Bahasa Indonesia", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-43-TUE4", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7B", subject: "Bahasa Indonesia", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-43-TUE5", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7A", subject: "Bahasa Indonesia", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-43-TUE6", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8A", subject: "Bahasa Indonesia", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-43-WED7", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7B", subject: "Bahasa Indonesia", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-43-WED8", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7H", subject: "Bahasa Jawa", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-43-WED9", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7F", subject: "Bahasa Jawa", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-28-WED1", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7G", subject: "SKI", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-43-THU10", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7C", subject: "Bahasa Indonesia", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-43-THU11", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7D", subject: "Bahasa Indonesia", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-43-THU12", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8A", subject: "Bahasa Indonesia", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-43-SAT13", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7D", subject: "Bahasa Indonesia", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-43-SAT14", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9E", subject: "Bahasa Jawa", room: "Ruang Kelas 9E", jtm: 1 },
  { id: "SCH-43-SAT15", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9J", subject: "Bahasa Jawa", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-43-SAT16", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8A", subject: "Bahasa Jawa", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-07-MON2", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9H", subject: "Bahasa Arab", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-07-MON3", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Senin", periodStart: 5, periodEnd: 5, startTime: "10:15", endTime: "10:45", time: "10:15 - 10:45 WIB", class: "Kelas 8G", subject: "Bahasa Arab", room: "Ruang Kelas 8G", jtm: 1 },
  { id: "SCH-07-TUE4", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Selasa", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8H", subject: "Bahasa Arab", room: "Ruang Kelas 8H", jtm: 1 },
  { id: "SCH-07-TUE5", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Selasa", periodStart: 8, periodEnd: 8, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 9J", subject: "Bahasa Arab", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-07-WED6", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9G", subject: "Bahasa Arab", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-07-WED7", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Rabu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9I", subject: "Bahasa Arab", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-07-WED8", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8H", subject: "Bahasa Arab", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-07-WED9", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8G", subject: "Bahasa Arab", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-07-THU10", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9F", subject: "Bahasa Arab", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-07-THU11", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Kamis", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9G", subject: "Bahasa Arab", room: "Ruang Kelas 9G", jtm: 1 },
  { id: "SCH-07-FRI12", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9I", subject: "Bahasa Arab", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-07-FRI13", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Jumat", periodStart: 6, periodEnd: 6, startTime: "10:15", endTime: "10:50", time: "10:15 - 10:50 WIB", class: "Kelas 8F", subject: "Bahasa Arab", room: "Ruang Kelas 8F", jtm: 1 },
  { id: "SCH-07-SAT14", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9F", subject: "Bahasa Arab", room: "Ruang Kelas 9F", jtm: 1 },
  { id: "SCH-07-SAT15", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9H", subject: "Bahasa Arab", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-07-SAT16", teacherId: "TCH-07", teacherName: "Aini Lutfiyah", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8F", subject: "Bahasa Arab", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-42-MON1", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8D", subject: "Seni Budaya", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-42-MON2", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:00", endTime: "11:15", time: "10:00 - 11:15 WIB", class: "Kelas 8E", subject: "Seni Budaya", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-42-MON3", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:25", endTime: "12:25", time: "11:25 - 12:25 WIB", class: "Kelas 8G", subject: "Akidah Akhlak", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-42-WED4", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7G", subject: "Akidah Akhlak", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-42-WED5", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 8C", subject: "Akidah Akhlak", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-42-WED6", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8C", subject: "Akidah Akhlak", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-42-WED7", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 8C", subject: "Seni Budaya", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-42-WED8", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Rabu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 8C", subject: "Seni Budaya", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-42-THU9", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8F", subject: "Akidah Akhlak", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-42-THU10", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8D", subject: "Akidah Akhlak", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-42-THU11", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "13:10", time: "11:30 - 13:10 WIB", class: "Kelas 8H", subject: "Akidah Akhlak", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-42-FRI12", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Jumat", periodStart: 4, periodEnd: 4, startTime: "08:45", endTime: "09:20", time: "08:45 - 09:20 WIB", class: "Kelas 8F", subject: "Seni Budaya", room: "Ruang Kelas 8F", jtm: 1 },
  { id: "SCH-42-FRI13", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Jumat", periodStart: 5, periodEnd: 5, startTime: "09:40", endTime: "10:15", time: "09:40 - 10:15 WIB", class: "Kelas 8F", subject: "Seni Budaya", room: "Ruang Kelas 8F", jtm: 1 },
  { id: "SCH-42-SAT14", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8E", subject: "Akidah Akhlak", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-42-SAT15", teacherId: "TCH-42", teacherName: "Ridlo Alam Nan Asa", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:00", time: "10:50 - 12:00 WIB", class: "Kelas 7H", subject: "Akidah Akhlak", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-17-MON1", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7A", subject: "IPA", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-17-MON2", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7B", subject: "IPA", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-17-MON3", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 7D", subject: "IPA", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-17-TUE4", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7A", subject: "IPA", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-17-TUE5", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9H", subject: "IPA", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-17-WED6", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9J", subject: "IPA", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-17-WED7", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9H", subject: "IPA", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-17-WED8", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7B", subject: "IPA", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-17-THU9", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9J", subject: "IPA", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-17-THU10", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9I", subject: "IPA", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-17-FRI11", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7C", subject: "IPA", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-17-FRI12", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7D", subject: "IPA", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-17-SAT13", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 7C", subject: "IPA", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-17-SAT14", teacherId: "TCH-17", teacherName: "DEWI RACHMAWATI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 9I", subject: "IPA", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-20-MON1", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8E", subject: "IPA", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-20-MON2", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8A", subject: "IPA", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-20-MON3", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9B", subject: "IPA", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-20-MON4", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:50", time: "11:40 - 12:50 WIB", class: "Kelas 8C", subject: "IPA", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-20-TUE5", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8C", subject: "IPA", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-20-TUE6", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Selasa", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 8A", subject: "IPA", room: "Ruang Kelas 8A", jtm: 1 },
  { id: "SCH-20-TUE7", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Selasa", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8A", subject: "IPA", room: "Ruang Kelas 8A", jtm: 1 },
  { id: "SCH-20-TUE8", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9B", subject: "IPA", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-20-WED9", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8D", subject: "IPA", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-20-THU10", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8D", subject: "IPA", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-20-FRI11", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9A", subject: "IPA", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-20-FRI12", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8B", subject: "IPA", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-20-SAT13", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9A", subject: "IPA", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-20-SAT14", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8B", subject: "IPA", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-20-SAT15", teacherId: "TCH-20", teacherName: "ETHIK RAHMAWATI", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8E", subject: "IPA", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-19-MON1", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8A", subject: "Matematika", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-19-MON2", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8C", subject: "Matematika", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-19-TUE3", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7H", subject: "Matematika", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-19-TUE4", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8B", subject: "Matematika", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-19-TUE5", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8D", subject: "Matematika", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-19-WED6", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8A", subject: "Matematika", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-19-THU7", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7G", subject: "Matematika", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-19-THU8", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8B", subject: "Matematika", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-19-FRI9", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8D", subject: "Matematika", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-19-FRI10", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8C", subject: "Matematika", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-19-SAT11", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7H", subject: "Matematika", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-19-SAT12", teacherId: "TCH-19", teacherName: "ENY ERLINA", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7G", subject: "Matematika", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-24-MON1", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 8B", subject: "Bahasa Arab", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-24-MON2", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Senin", periodStart: 8, periodEnd: 8, startTime: "12:00", endTime: "12:30", time: "12:00 - 12:30 WIB", class: "Kelas 9E", subject: "Bahasa Arab", room: "Ruang Kelas 9E", jtm: 1 },
  { id: "SCH-24-TUE3", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8D", subject: "Bahasa Arab", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-24-TUE4", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Selasa", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9D", subject: "Bahasa Arab", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-24-TUE5", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Selasa", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8E", subject: "Bahasa Arab", room: "Ruang Kelas 8E", jtm: 1 },
  { id: "SCH-24-TUE6", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8C", subject: "Bahasa Arab", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-24-WED7", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Rabu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8C", subject: "Bahasa Arab", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-24-WED8", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9E", subject: "Bahasa Arab", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-24-WED9", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Rabu", periodStart: 8, periodEnd: 8, startTime: "12:10", endTime: "12:50", time: "12:10 - 12:50 WIB", class: "Kelas 8B", subject: "Bahasa Arab", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-24-THU10", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8E", subject: "Bahasa Arab", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-24-THU11", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Kamis", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9C", subject: "Bahasa Arab", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-24-THU12", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9D", subject: "Bahasa Arab", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-24-FRI13", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9C", subject: "Bahasa Arab", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-24-FRI14", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:50", endTime: "10:55", time: "09:50 - 10:55 WIB", class: "Kelas 8A", subject: "Bahasa Arab", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-24-SAT15", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8D", subject: "Bahasa Arab", room: "Ruang Kelas 8D", jtm: 1 },
  { id: "SCH-24-SAT16", teacherId: "TCH-24", teacherName: "KHASANAH", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8A", subject: "Bahasa Arab", room: "Ruang Kelas 8A", jtm: 1 },
  { id: "SCH-44-MON2", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8D", subject: "Bahasa Indonesia", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-44-MON3", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9I", subject: "Bahasa Indonesia", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-44-TUE4", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8F", subject: "Bahasa Indonesia", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-44-TUE5", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8C", subject: "Bahasa Indonesia", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-44-WED6", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Rabu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 8C", subject: "Bahasa Indonesia", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-44-WED7", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8D", subject: "Bahasa Indonesia", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-44-THU8", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8E", subject: "Bahasa Indonesia", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-44-THU9", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9I", subject: "Bahasa Indonesia", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-44-FRI10", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8E", subject: "Bahasa Indonesia", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-44-FRI11", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9J", subject: "Bahasa Indonesia", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-44-FRI12", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 8B", subject: "Bahasa Indonesia", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-44-SAT13", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8F", subject: "Bahasa Indonesia", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-44-SAT14", teacherId: "TCH-44", teacherName: "SILVIA TINDIYAH SUGIARTO", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8B", subject: "Bahasa Indonesia", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-25-MON1", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8F", subject: "Tahfidz", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-25-MON2", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7H", subject: "Tahfidz", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-25-MON3", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 8H", subject: "BTQ", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-25-TUE4", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:15", time: "07:00 - 08:15 WIB", class: "Kelas 9A", subject: "BTQ", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-25-TUE5", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:15", endTime: "09:45", time: "08:15 - 09:45 WIB", class: "Kelas 7F", subject: "Tahfidz", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-25-TUE6", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "10:00", endTime: "11:45", time: "10:00 - 11:45 WIB", class: "Kelas 8G", subject: "BTQ", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-25-TUE7", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7B", subject: "IPS", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-25-WED8", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:45", time: "07:00 - 08:45 WIB", class: "Kelas 8E", subject: "Tahfidz", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-25-WED9", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9B", subject: "BTQ", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-25-THU10", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:45", time: "07:00 - 08:45 WIB", class: "Kelas 7A", subject: "IPS", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-25-THU11", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8F", subject: "Tahfidz", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-25-SAT12", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 7A", subject: "IPS", room: "Ruang Kelas 7A", jtm: 1 },
  { id: "SCH-25-SAT13", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7B", subject: "IPS", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-25-SAT14", teacherId: "TCH-25", teacherName: "Khodijatul Kubro", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:00", time: "10:50 - 12:00 WIB", class: "Kelas 7G", subject: "Tahfidz", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-46-MON1", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9B", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-46-TUE2", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9F", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-46-TUE3", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9E", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-46-WED4", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8G", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-46-WED5", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 9A", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-46-WED6", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9A", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-46-WED7", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8H", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-46-THU8", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9I", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-46-THU9", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9G", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-46-FRI10", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9D", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-46-FRI11", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:35", endTime: "10:45", time: "09:35 - 10:45 WIB", class: "Kelas 9H", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-46-SAT12", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9J", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-46-SAT13", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9C", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-46-SAT14", teacherId: "TCH-46", teacherName: "SITI NURJANAH", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 9C", subject: "Pendidikan Pancasila", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-38-MON1", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9E", subject: "Bahasa Indonesia", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-38-MON2", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9H", subject: "Bahasa Indonesia", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-38-MON3", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 9D", subject: "Bahasa Indonesia", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-38-TUE4", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9F", subject: "Bahasa Indonesia", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-38-TUE5", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8H", subject: "Bahasa Indonesia", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-38-WED6", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9E", subject: "Bahasa Indonesia", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-38-WED7", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8G", subject: "Bahasa Indonesia", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-38-WED8", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9F", subject: "Bahasa Indonesia", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-38-THU9", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8H", subject: "Bahasa Indonesia", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-38-THU10", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9H", subject: "Bahasa Indonesia", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-38-FRI11", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9G", subject: "Bahasa Indonesia", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-38-FRI12", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9D", subject: "Bahasa Indonesia", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-38-SAT13", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9G", subject: "Bahasa Indonesia", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-38-SAT14", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8G", subject: "Bahasa Indonesia", room: "Ruang Kelas 8G", jtm: 1 },
  { id: "SCH-38-SAT15", teacherId: "TCH-38", teacherName: "NUR KHIKMAH", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 8G", subject: "Bahasa Indonesia", room: "Ruang Kelas 8G", jtm: 1 },
  { id: "SCH-40-MON1", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9J", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-10-MON1", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9D", subject: "IPA", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-10-MON2", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8G", subject: "IPA", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-10-TUE3", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9E", subject: "IPA", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-10-TUE4", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9C", subject: "IPA", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-10-TUE5", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8H", subject: "IPA", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-10-THU6", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9C", subject: "IPA", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-10-THU7", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8G", subject: "IPA", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-10-THU8", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8F", subject: "IPA", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-10-FRI9", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9E", subject: "IPA", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-10-FRI10", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8H", subject: "IPA", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-10-FRI11", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:35", endTime: "10:45", time: "09:35 - 10:45 WIB", class: "Kelas 9D", subject: "IPA", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-10-SAT12", teacherId: "TCH-10", teacherName: "ANIS MASRUFATUN SAADAH", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 8F", subject: "IPA", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-28-MON2", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 8A", subject: "SKI", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-28-MON3", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 8D", subject: "SKI", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-28-TUE4", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8E", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-28-TUE5", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8B", subject: "SKI", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-28-TUE6", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8F", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-28-WED7", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8D", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-28-THU8", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8C", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-28-FRI9", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:35", endTime: "10:45", time: "09:35 - 10:45 WIB", class: "Kelas 7H", subject: "SKI", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-28-SAT10", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8G", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-28-SAT11", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8E", subject: "SKI", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-28-SAT12", teacherId: "TCH-28", teacherName: "MOHAMMAD AZAMIN", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8C", subject: "SKI", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-21-TUE1", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Selasa", periodStart: 2, periodEnd: 2, startTime: "07:40", endTime: "08:20", time: "07:40 - 08:20 WIB", class: "Kelas 9H", subject: "Bahasa Jawa", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-21-TUE2", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8D", subject: "Bahasa Jawa", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-21-TUE3", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Selasa", periodStart: 6, periodEnd: 7, startTime: "10:35", endTime: "12:25", time: "10:35 - 12:25 WIB", class: "Kelas 8E", subject: "Bahasa Jawa", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-21-TUE4", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Selasa", periodStart: 8, periodEnd: 8, startTime: "12:25", endTime: "13:05", time: "12:25 - 13:05 WIB", class: "Kelas 9D", subject: "Bahasa Jawa", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-21-WED5", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8F", subject: "Bahasa Jawa", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-21-WED6", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Rabu", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 9F", subject: "Bahasa Jawa", room: "Ruang Kelas 9F", jtm: 1 },
  { id: "SCH-21-WED7", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7G", subject: "BTQ", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-21-WED8", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Rabu", periodStart: 8, periodEnd: 8, startTime: "12:25", endTime: "13:05", time: "12:25 - 13:05 WIB", class: "Kelas 9I", subject: "Bahasa Jawa", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-21-THU9", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Kamis", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9C", subject: "Bahasa Jawa", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-21-THU10", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8H", subject: "Bahasa Jawa", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-04-THU1", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7B", subject: "Akidah Akhlak", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-21-FRI11", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8C", subject: "Bahasa Jawa", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-21-FRI12", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 8G", subject: "Bahasa Jawa", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-21-SAT13", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9B", subject: "Bahasa Jawa", room: "Ruang Kelas 9B", jtm: 1 },
  { id: "SCH-21-SAT14", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Sabtu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:55", time: "08:20 - 09:55 WIB", class: "Kelas 7H", subject: "BTQ", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-21-SAT15", teacherId: "TCH-21", teacherName: "ETIK SULISTYO RATRI", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 9G", subject: "Bahasa Jawa", room: "Ruang Kelas 9G", jtm: 1 },
  { id: "SCH-23-MON2", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7D", subject: "Bahasa Arab", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-23-TUE3", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7C", subject: "Bahasa Arab", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-23-TUE4", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Selasa", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 7G", subject: "Bahasa Arab", room: "Ruang Kelas 7G", jtm: 1 },
  { id: "SCH-23-TUE5", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7E", subject: "Bahasa Arab", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-23-WED6", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7B", subject: "Bahasa Arab", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-23-WED7", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7E", subject: "Bahasa Arab", room: "Ruang Kelas 7E", jtm: 1 },
  { id: "SCH-23-WED8", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 7A", subject: "Bahasa Arab", room: "Ruang Kelas 7A", jtm: 1 },
  { id: "SCH-23-WED9", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7F", subject: "Bahasa Arab", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-23-THU10", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Kamis", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7B", subject: "Bahasa Arab", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-23-THU11", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Kamis", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 7F", subject: "Bahasa Arab", room: "Ruang Kelas 7F", jtm: 1 },
  { id: "SCH-23-THU12", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7A", subject: "Bahasa Arab", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-23-THU13", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7H", subject: "Bahasa Arab", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-23-FRI14", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7G", subject: "Bahasa Arab", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-23-SAT15", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7D", subject: "Bahasa Arab", room: "Ruang Kelas 7D", jtm: 1 },
  { id: "SCH-15-TUE16", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9I", subject: "Bahasa Inggris", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-34-MON1", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8C", subject: "IPS", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-34-MON2", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9C", subject: "IPS", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-34-TUE3", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9D", subject: "IPS", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-34-TUE4", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Selasa", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 8A", subject: "IPS", room: "Ruang Kelas 8A", jtm: 1 },
  { id: "SCH-34-TUE5", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Selasa", periodStart: 8, periodEnd: 8, startTime: "12:10", endTime: "12:50", time: "12:10 - 12:50 WIB", class: "Kelas 8E", subject: "IPS", room: "Ruang Kelas 8E", jtm: 1 },
  { id: "SCH-34-WED6", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Rabu", periodStart: 8, periodEnd: 8, startTime: "12:10", endTime: "12:50", time: "12:10 - 12:50 WIB", class: "Kelas 8C", subject: "IPS", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-34-THU7", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8B", subject: "IPS", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-34-THU8", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8A", subject: "IPS", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-34-THU9", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 8E", subject: "IPS", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-34-FRI10", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "10:00", endTime: "11:00", time: "10:00 - 11:00 WIB", class: "Kelas 8D", subject: "IPS", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-34-SAT11", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 8B", subject: "IPS", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-34-SAT12", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 8C", subject: "IPS", room: "Ruang Kelas 8C", jtm: 1 },
  { id: "SCH-34-SAT13", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Sabtu", periodStart: 6, periodEnd: 6, startTime: "10:50", endTime: "11:30", time: "10:50 - 11:30 WIB", class: "Kelas 8D", subject: "IPS", room: "Ruang Kelas 8D", jtm: 1 },
  { id: "SCH-34-SAT14", teacherId: "TCH-34", teacherName: "MUZAKKY MIFTAH", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 9D", subject: "IPS", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-03-MON1", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9F", subject: "IPA", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-03-MON2", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7F", subject: "IPA", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-03-TUE3", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7F", subject: "IPA", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-03-TUE4", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Selasa", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 7G", subject: "IPA", room: "Ruang Kelas 7G", jtm: 1 },
  { id: "SCH-03-TUE5", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Selasa", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7G", subject: "IPA", room: "Ruang Kelas 7G", jtm: 1 },
  { id: "SCH-03-WED6", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7E", subject: "IPA", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-03-WED7", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7H", subject: "IPA", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-03-THU8", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7E", subject: "IPA", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-03-THU9", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9G", subject: "IPA", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-03-THU10", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7G", subject: "IPA", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-03-FRI11", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7H", subject: "IPA", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-03-FRI12", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:35", endTime: "10:45", time: "09:35 - 10:45 WIB", class: "Kelas 9G", subject: "IPA", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-03-SAT13", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9F", subject: "IPA", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-29-MON1", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7B", subject: "BTQ", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-29-TUE2", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9C", subject: "BTQ", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-29-TUE3", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7E", subject: "BTQ", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-29-TUE4", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "12:50", time: "11:45 - 12:50 WIB", class: "Kelas 8B", subject: "Tahfidz", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-29-WED5", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7D", subject: "BTQ", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-29-WED6", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8A", subject: "Tahfidz", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-29-WED7", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "12:50", time: "11:45 - 12:50 WIB", class: "Kelas 9D", subject: "BTQ", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-29-THU8", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8C", subject: "Tahfidz", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-29-THU9", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9F", subject: "Ke-NU-an", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-29-THU10", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9E", subject: "Ke-NU-an", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-29-SAT11", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 8D", subject: "Tahfidz", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-29-SAT12", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7C", subject: "BTQ", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-29-SAT13", teacherId: "TCH-29", teacherName: "MUHAMMAD AKVIN SYARIFUDIN", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 7A", subject: "BTQ", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-26-MON1", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9B", subject: "Bahasa Arab", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-26-MON2", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9F", subject: "Tahfidz", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-26-MON3", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 9H", subject: "Ke-NU-an", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-26-TUE4", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9H", subject: "Tahfidz", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-26-TUE5", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9I", subject: "Ke-NU-an", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-26-TUE6", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9I", subject: "Tahfidz", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-26-WED7", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Rabu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9A", subject: "Bahasa Arab", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-26-WED8", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Rabu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9B", subject: "Bahasa Arab", room: "Ruang Kelas 9B", jtm: 1 },
  { id: "SCH-26-WED9", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9G", subject: "Ke-NU-an", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-26-THU10", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9J", subject: "Tahfidz", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-26-THU11", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9A", subject: "Bahasa Arab", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-26-FRI12", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9G", subject: "Tahfidz", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-26-FRI13", teacherId: "TCH-26", teacherName: "M. AZIZ HIMAWAN AKBAR", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 9J", subject: "Ke-NU-an", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-06-MON1", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8B", subject: "Ke-NU-an", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-06-MON2", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 8D", subject: "Ke-NU-an", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-06-MON3", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 9A", subject: "Ke-NU-an", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-06-TUE4", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8F", subject: "Ke-NU-an", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-06-TUE5", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8G", subject: "Ke-NU-an", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-06-TUE6", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9F", subject: "BTQ", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-06-THU7", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9D", subject: "Ke-NU-an", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-06-THU8", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8C", subject: "Ke-NU-an", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-06-FRI9", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9C", subject: "Ke-NU-an", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-06-FRI10", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 9E", subject: "BTQ", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-06-FRI11", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 8E", subject: "Ke-NU-an", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-06-SAT12", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 9B", subject: "Ke-NU-an", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-06-SAT13", teacherId: "TCH-06", teacherName: "AHMAD SYAMSUL FALAH", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 8H", subject: "Ke-NU-an", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-18-MON1", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9J", subject: "Matematika", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-18-MON2", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:25", endTime: "12:40", time: "11:25 - 12:40 WIB", class: "Kelas 9I", subject: "Matematika", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-18-TUE3", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Selasa", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 7G", subject: "Prakarya", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-18-TUE4", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8F", subject: "Informatika", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-18-TUE5", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "13:05", time: "11:30 - 13:05 WIB", class: "Kelas 8G", subject: "Informatika", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-18-WED6", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8H", subject: "Informatika", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-18-WED7", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8D", subject: "Informatika", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-18-WED8", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9J", subject: "Matematika", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-18-WED9", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "13:05", time: "11:30 - 13:05 WIB", class: "Kelas 7H", subject: "Prakarya", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-18-FRI10", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8E", subject: "Informatika", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-18-FRI11", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:30", endTime: "10:50", time: "09:30 - 10:50 WIB", class: "Kelas 9A", subject: "Informatika", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-18-SAT12", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 7F", subject: "Prakarya", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-18-SAT13", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8C", subject: "Informatika", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-18-SAT14", teacherId: "TCH-18", teacherName: "ELLA LINTANG AGUSTIN", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9I", subject: "Matematika", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-49-MON1", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7G", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-49-MON2", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9A", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-49-MON3", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9D", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-49-MON4", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:25", endTime: "12:25", time: "11:25 - 12:25 WIB", class: "Kelas 9J", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-49-TUE5", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8B", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-49-TUE6", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7H", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-49-WED7", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9I", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-49-WED8", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Rabu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:20", time: "11:30 - 12:20 WIB", class: "Kelas 9I", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-49-THU9", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8C", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-49-THU10", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9B", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-49-FRI11", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8A", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-49-FRI12", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 9C", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-49-SAT13", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8H", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-49-SAT14", teacherId: "TCH-49", teacherName: "TUTI ALAWIYYAH", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9E", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-01-MON1", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9I", subject: "SKI", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-01-MON2", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 9G", subject: "SKI", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-01-TUE3", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9B", subject: "SKI", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-01-TUE4", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Selasa", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9J", subject: "SKI", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-01-TUE5", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Selasa", periodStart: 7, periodEnd: 7, startTime: "11:45", endTime: "12:25", time: "11:45 - 12:25 WIB", class: "Kelas 9J", subject: "SKI", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-01-WED6", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9C", subject: "SKI", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-01-WED7", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9A", subject: "SKI", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-01-THU8", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9E", subject: "SKI", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-01-THU9", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9H", subject: "SKI", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-01-THU10", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9D", subject: "SKI", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-01-FRI11", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8H", subject: "SKI", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-01-FRI12", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8G", subject: "SKI", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-01-SAT13", teacherId: "TCH-01", teacherName: "ABDUR ROUF", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9F", subject: "SKI", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-40-MON2", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9G", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-40-MON3", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 7E", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-40-TUE4", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7D", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-40-WED5", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7C", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-40-THU6", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8A", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-40-THU7", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9H", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-40-FRI8", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9I", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-40-FRI9", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7A", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-40-SAT10", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7B", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-40-WED11", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Rabu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 8B", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-40-SAT12", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 9F", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-40-SAT13", teacherId: "TCH-40", teacherName: "RAMDLONI", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 7F", subject: "Al-Qur'an Hadis", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-33-MON1", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9A", subject: "Fikih", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-33-MON2", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 8E", subject: "Fikih", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-33-TUE3", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8A", subject: "Fikih", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-33-TUE4", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8C", subject: "Fikih", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-33-WED5", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9D", subject: "Fikih", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-33-WED6", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9B", subject: "Fikih", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-33-WED7", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 8B", subject: "Fikih", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-33-WED8", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Rabu", periodStart: 7, periodEnd: 7, startTime: "11:45", endTime: "12:25", time: "11:45 - 12:25 WIB", class: "Kelas 8B", subject: "Fikih", room: "Ruang Kelas 8B", jtm: 1 },
  { id: "SCH-33-THU9", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7H", subject: "Fikih", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-33-THU10", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 7F", subject: "Fikih", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-33-FRI11", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7G", subject: "Fikih", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-33-SAT12", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 8D", subject: "Fikih", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-33-SAT13", teacherId: "TCH-33", teacherName: "MUSTOFA", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 9C", subject: "Fikih", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-48-MON2", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9I", subject: "IPS", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-48-MON3", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Senin", periodStart: 5, periodEnd: 5, startTime: "10:15", endTime: "10:45", time: "10:15 - 10:45 WIB", class: "Kelas 9E", subject: "IPS", room: "Ruang Kelas 9E", jtm: 1 },
  { id: "SCH-48-MON4", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Senin", periodStart: 6, periodEnd: 6, startTime: "10:45", endTime: "11:15", time: "10:45 - 11:15 WIB", class: "Kelas 8G", subject: "IPS", room: "Ruang Kelas 8G", jtm: 1 },
  { id: "SCH-48-TUE5", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Selasa", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9H", subject: "IPS", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-48-TUE6", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Selasa", periodStart: 2, periodEnd: 2, startTime: "07:40", endTime: "08:20", time: "07:40 - 08:20 WIB", class: "Kelas 8H", subject: "IPS", room: "Ruang Kelas 8H", jtm: 1 },
  { id: "SCH-48-MON7", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Senin", periodStart: 3, periodEnd: 3, startTime: "09:00", endTime: "09:30", time: "09:00 - 09:30 WIB", class: "Kelas 9J", subject: "IPS", room: "Ruang Kelas 9J", jtm: 1 },
  { id: "SCH-48-TUE8", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9G", subject: "IPS", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-48-WED9", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Rabu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9F", subject: "IPS", room: "Ruang Kelas 9F", jtm: 1 },
  { id: "SCH-48-WED10", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8H", subject: "IPS", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-48-THU11", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9H", subject: "IPS", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-48-THU12", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9J", subject: "IPS", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-48-THU13", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Kamis", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9G", subject: "IPS", room: "Ruang Kelas 9G", jtm: 1 },
  { id: "SCH-48-FRI14", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8G", subject: "IPS", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-48-FRI15", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:20", endTime: "10:50", time: "09:20 - 10:50 WIB", class: "Kelas 9F", subject: "IPS", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-48-SAT16", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8F", subject: "IPS", room: "Ruang Kelas 8F", jtm: 1 },
  { id: "SCH-48-SAT17", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 9I", subject: "IPS", room: "Ruang Kelas 9I", jtm: 1 },
  { id: "SCH-48-SAT18", teacherId: "TCH-48", teacherName: "TITIN SOFIYATIN", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 9E", subject: "IPS", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-43-WED17", teacherId: "TCH-43", teacherName: "RIZQI YUNI ARSIH", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7G", subject: "Bahasa Jawa", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-13-MON1", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:10", endTime: "11:15", time: "10:10 - 11:15 WIB", class: "Kelas 9C", subject: "PJOK", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-13-WED2", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9B", subject: "PJOK", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-13-WED3", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8G", subject: "Seni Budaya", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-13-THU4", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9D", subject: "PJOK", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-13-THU5", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8E", subject: "PJOK", room: "Ruang Kelas 8E", jtm: 2 },
  { id: "SCH-13-FRI6", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8F", subject: "PJOK", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-13-FRI7", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8D", subject: "PJOK", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-13-FRI8", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:30", endTime: "10:40", time: "09:30 - 10:40 WIB", class: "Kelas 8H", subject: "Seni Budaya", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-13-SAT9", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8C", subject: "PJOK", room: "Ruang Kelas 8C", jtm: 2 },
  { id: "SCH-13-SAT10", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Sabtu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8H", subject: "PJOK", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-13-SAT11", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Sabtu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:30", time: "09:55 - 11:30 WIB", class: "Kelas 9A", subject: "PJOK", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-13-MON12", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8G", subject: "PJOK", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-13-MON13", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8B", subject: "PJOK", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-05-MON1", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9G", subject: "Fikih", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-05-MON2", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9E", subject: "Fikih", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-05-MON3", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7G", subject: "Ke-NU-an", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-05-MON4", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:30", time: "11:30 - 12:30 WIB", class: "Kelas 9F", subject: "Fikih", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-05-TUE5", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7B", subject: "Ke-NU-an", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-05-WED6", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7F", subject: "Ke-NU-an", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-05-WED7", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7D", subject: "Ke-NU-an", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-05-WED8", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7C", subject: "Ke-NU-an", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-05-WED9", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 9H", subject: "Fikih", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-05-THU10", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7H", subject: "Ke-NU-an", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-05-THU11", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7E", subject: "Ke-NU-an", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-05-FRI12", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7A", subject: "Ke-NU-an", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-05-FRI13", teacherId: "TCH-05", teacherName: "Ahmad Syafi", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 8A", subject: "Ke-NU-an", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-27-MON1", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 8H", subject: "Fikih", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-27-MON2", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7A", subject: "Fikih", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-27-MON3", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 8H", subject: "Tahfidz", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-27-MON4", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:25", endTime: "12:40", time: "11:25 - 12:40 WIB", class: "Kelas 8F", subject: "Fikih", room: "Ruang Kelas 8F", jtm: 2 },
  { id: "SCH-27-TUE5", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7E", subject: "Fikih", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-27-TUE6", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9B", subject: "Tahfidz", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-27-WED7", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7D", subject: "Fikih", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-27-THU8", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8G", subject: "Tahfidz", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-27-THU9", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8G", subject: "Fikih", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-27-FRI10", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7C", subject: "Fikih", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-27-FRI11", teacherId: "TCH-27", teacherName: "Mochammad Aqil Mahfudz", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7B", subject: "Fikih", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-35-MON1", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 8H", subject: "Matematika", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-35-MON2", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 9F", subject: "Matematika", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-35-TUE3", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9G", subject: "Matematika", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-35-TUE4", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 8H", subject: "Matematika", room: "Ruang Kelas 8H", jtm: 2 },
  { id: "SCH-35-TUE5", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9H", subject: "Matematika", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-35-WED6", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 9H", subject: "Matematika", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-35-WED7", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9G", subject: "Matematika", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-35-THU8", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 8G", subject: "Matematika", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-35-THU9", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9F", subject: "Matematika", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-35-THU10", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9E", subject: "Matematika", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-35-SAT11", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9E", subject: "Matematika", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-35-SAT12", teacherId: "TCH-35", teacherName: "NASARUDIN", day: "Sabtu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:30", time: "09:55 - 11:30 WIB", class: "Kelas 8G", subject: "Matematika", room: "Ruang Kelas 8G", jtm: 2 },
  { id: "SCH-31-MON1", teacherId: "TCH-31", teacherName: "MUHDI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9C", subject: "Akidah Akhlak", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-31-MON2", teacherId: "TCH-31", teacherName: "MUHDI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:25", endTime: "12:40", time: "11:25 - 12:40 WIB", class: "Kelas 7C", subject: "Akidah Akhlak", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-31-TUE3", teacherId: "TCH-31", teacherName: "MUHDI", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9B", subject: "Akidah Akhlak", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-31-TUE4", teacherId: "TCH-31", teacherName: "MUHDI", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9I", subject: "Akidah Akhlak", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-31-TUE5", teacherId: "TCH-31", teacherName: "MUHDI", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7B", subject: "Bahasa Jawa", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-31-WED6", teacherId: "TCH-31", teacherName: "MUHDI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7A", subject: "Bahasa Jawa", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-31-WED7", teacherId: "TCH-31", teacherName: "MUHDI", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9A", subject: "Bahasa Jawa", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-31-WED8", teacherId: "TCH-31", teacherName: "MUHDI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9J", subject: "Akidah Akhlak", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-31-THU9", teacherId: "TCH-31", teacherName: "MUHDI", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9E", subject: "Akidah Akhlak", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-31-THU10", teacherId: "TCH-31", teacherName: "MUHDI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7D", subject: "Bahasa Jawa", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-31-THU11", teacherId: "TCH-31", teacherName: "MUHDI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9F", subject: "Akidah Akhlak", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-31-SAT12", teacherId: "TCH-31", teacherName: "MUHDI", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9D", subject: "Akidah Akhlak", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-31-SAT13", teacherId: "TCH-31", teacherName: "MUHDI", day: "Sabtu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:55", time: "08:20 - 09:55 WIB", class: "Kelas 9G", subject: "Akidah Akhlak", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-31-SAT14", teacherId: "TCH-31", teacherName: "MUHDI", day: "Sabtu", periodStart: 6, periodEnd: 6, startTime: "10:50", endTime: "11:30", time: "10:50 - 11:30 WIB", class: "Kelas 9H", subject: "Akidah Akhlak", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-31-SAT15", teacherId: "TCH-31", teacherName: "MUHDI", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 9H", subject: "Akidah Akhlak", room: "Ruang Kelas 9H", jtm: 1 },
  { id: "SCH-41-MON1", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7E", subject: "Prakarya", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-41-MON2", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Senin", periodStart: 6, periodEnd: 6, startTime: "10:45", endTime: "11:15", time: "10:45 - 11:15 WIB", class: "Kelas 9E", subject: "Seni Rupa", room: "Ruang Kelas 9E", jtm: 1 },
  { id: "SCH-41-MON3", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Senin", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:00", time: "11:30 - 12:00 WIB", class: "Kelas 9E", subject: "Seni Rupa", room: "Ruang Kelas 9E", jtm: 1 },
  { id: "SCH-41-TUE4", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9G", subject: "Seni Rupa", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-41-TUE5", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Selasa", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9D", subject: "Seni Rupa", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-41-TUE6", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Selasa", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:20", time: "11:30 - 12:20 WIB", class: "Kelas 9D", subject: "Seni Rupa", room: "Ruang Kelas 9D", jtm: 1 },
  { id: "SCH-41-WED7", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9C", subject: "Seni Rupa", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-41-WED8", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9J", subject: "Seni Rupa", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-41-WED9", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9H", subject: "Seni Rupa", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-41-WED10", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "13:05", time: "11:30 - 13:05 WIB", class: "Kelas 7B", subject: "Prakarya", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-41-THU11", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9A", subject: "Seni Rupa", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-41-THU12", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7A", subject: "Prakarya", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-41-THU13", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9B", subject: "Seni Rupa", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-41-THU14", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "13:05", time: "11:30 - 13:05 WIB", class: "Kelas 7C", subject: "Prakarya", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-41-FRI15", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7D", subject: "Prakarya", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-41-FRI16", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:25", time: "08:10 - 09:25 WIB", class: "Kelas 9F", subject: "Seni Rupa", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-41-FRI17", teacherId: "TCH-41", teacherName: "RETNO FAJAR INTAMI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 9I", subject: "Seni Rupa", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-36-MON1", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7F", subject: "Informatika", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-36-MON2", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7D", subject: "Informatika", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-36-MON3", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 7B", subject: "Informatika", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-36-TUE4", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9C", subject: "Informatika", room: "Ruang Kelas 9C", jtm: 2 },
  { id: "SCH-36-TUE5", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7G", subject: "Informatika", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-36-WED6", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Rabu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7H", subject: "Informatika", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-36-WED7", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 9D", subject: "Informatika", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-36-WED8", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 8A", subject: "Informatika", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-36-THU9", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7E", subject: "Informatika", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-36-THU10", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7C", subject: "Informatika", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-36-FRI11", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 8B", subject: "Informatika", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-36-SAT12", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Sabtu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 9B", subject: "Informatika", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-36-SAT13", teacherId: "TCH-36", teacherName: "NOPRIYANI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7A", subject: "Informatika", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-13-THU14", teacherId: "TCH-13", teacherName: "BAENY ABDUL FATAH", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8A", subject: "PJOK", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-12-MON1", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 7H", subject: "Bahasa Indonesia", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-12-MON2", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7G", subject: "Bahasa Inggris", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-12-MON3", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 7H", subject: "Bahasa Inggris", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-12-TUE4", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Selasa", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 7G", subject: "Bahasa Inggris", room: "Ruang Kelas 7G", jtm: 1 },
  { id: "SCH-12-TUE5", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7H", subject: "Bahasa Indonesia", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-12-TUE6", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7F", subject: "Bahasa Indonesia", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-12-THU7", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Kamis", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7F", subject: "Bahasa Indonesia", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-12-THU8", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Kamis", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7F", subject: "Bahasa Inggris", room: "Ruang Kelas 7F", jtm: 1 },
  { id: "SCH-12-THU9", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7E", subject: "Bahasa Indonesia", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-12-THU10", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7G", subject: "Bahasa Indonesia", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-12-FRI11", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7F", subject: "Bahasa Inggris", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-12-FRI12", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7E", subject: "Bahasa Inggris", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-12-SAT13", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7G", subject: "Bahasa Indonesia", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-12-SAT14", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7E", subject: "Bahasa Inggris", room: "Ruang Kelas 7E", jtm: 1 },
  { id: "SCH-12-SAT15", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 7H", subject: "Bahasa Inggris", room: "Ruang Kelas 7H", jtm: 1 },
  { id: "SCH-12-SAT16", teacherId: "TCH-12", teacherName: "AYU ROSALITA", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 7E", subject: "Bahasa Indonesia", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-04-TUE2", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:30", time: "07:00 - 08:30 WIB", class: "Kelas 7D", subject: "Akidah Akhlak", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-04-TUE3", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7F", subject: "Akidah Akhlak", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-04-TUE4", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7A", subject: "Akidah Akhlak", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-04-WED5", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 7C", subject: "Akidah Akhlak", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-04-WED6", teacherId: "TCH-04", teacherName: "AHMAD FARID", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:30", endTime: "12:50", time: "11:30 - 12:50 WIB", class: "Kelas 7E", subject: "Akidah Akhlak", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-39-MON1", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Senin", periodStart: 1, periodEnd: 2, startTime: "08:00", endTime: "09:00", time: "08:00 - 09:00 WIB", class: "Kelas 9J", subject: "PJOK", room: "Ruang Kelas 9J", jtm: 2 },
  { id: "SCH-39-MON2", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Senin", periodStart: 5, periodEnd: 6, startTime: "10:15", endTime: "11:15", time: "10:15 - 11:15 WIB", class: "Kelas 7D", subject: "PJOK", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-39-TUE3", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 7C", subject: "PJOK", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-39-TUE4", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Selasa", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7A", subject: "PJOK", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-39-TUE5", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9F", subject: "PJOK", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-39-WED6", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Rabu", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7E", subject: "PJOK", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-39-WED7", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9E", subject: "PJOK", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-39-THU8", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Kamis", periodStart: 3, periodEnd: 4, startTime: "08:20", endTime: "09:40", time: "08:20 - 09:40 WIB", class: "Kelas 7G", subject: "PJOK", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-39-THU9", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7H", subject: "PJOK", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-39-FRI10", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9H", subject: "PJOK", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-39-FRI11", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Jumat", periodStart: 3, periodEnd: 4, startTime: "08:10", endTime: "09:20", time: "08:10 - 09:20 WIB", class: "Kelas 7F", subject: "PJOK", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-39-SAT12", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9I", subject: "PJOK", room: "Ruang Kelas 9I", jtm: 2 },
  { id: "SCH-39-SAT13", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7B", subject: "PJOK", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-39-SAT14", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Sabtu", periodStart: 4, periodEnd: 4, startTime: "09:15", endTime: "09:55", time: "09:15 - 09:55 WIB", class: "Kelas 7B", subject: "PJOK", room: "Ruang Kelas 7B", jtm: 1 },
  { id: "SCH-39-SAT15", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Sabtu", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9G", subject: "PJOK", room: "Ruang Kelas 9G", jtm: 1 },
  { id: "SCH-39-SAT16", teacherId: "TCH-39", teacherName: "RAGIL SUSYANTO", day: "Sabtu", periodStart: 6, periodEnd: 6, startTime: "10:50", endTime: "11:30", time: "10:50 - 11:30 WIB", class: "Kelas 9G", subject: "PJOK", room: "Ruang Kelas 9G", jtm: 1 },
  { id: "SCH-03-THU14", teacherId: "TCH-03", teacherName: "AENI AFTHINA", day: "Kamis", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 7G", subject: "IPA", room: "Ruang Kelas 7G", jtm: 2 },
  { id: "SCH-51-MON1", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Senin", periodStart: 4, periodEnd: 4, startTime: "09:30", endTime: "10:00", time: "09:30 - 10:00 WIB", class: "Kelas 7H", subject: "IPS", room: "Ruang Kelas 7H", jtm: 1 },
  { id: "SCH-51-MON2", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 8A", subject: "Seni Budaya", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-51-TUE3", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7H", subject: "IPS", room: "Ruang Kelas 7H", jtm: 2 },
  { id: "SCH-51-WED4", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Rabu", periodStart: 2, periodEnd: 3, startTime: "07:40", endTime: "09:00", time: "07:40 - 09:00 WIB", class: "Kelas 9A", subject: "IPS", room: "Ruang Kelas 9A", jtm: 2 },
  { id: "SCH-51-WED5", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Rabu", periodStart: 6, periodEnd: 6, startTime: "10:35", endTime: "11:15", time: "10:35 - 11:15 WIB", class: "Kelas 9B", subject: "IPS", room: "Ruang Kelas 9B", jtm: 1 },
  { id: "SCH-51-WED6", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8A", subject: "Pendidikan Pancasila", room: "Ruang Kelas 8A", jtm: 2 },
  { id: "SCH-51-THU7", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Kamis", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 9B", subject: "IPS", room: "Ruang Kelas 9B", jtm: 2 },
  { id: "SCH-51-SAT8", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 8B", subject: "Seni Budaya", room: "Ruang Kelas 8B", jtm: 2 },
  { id: "SCH-51-SAT9", teacherId: "TCH-51", teacherName: "YULITA LISTIA SARI", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 9A", subject: "IPS", room: "Ruang Kelas 9A", jtm: 1 },
  { id: "SCH-15-FRI17", teacherId: "TCH-15", teacherName: "DENY PRABOWO", day: "Jumat", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:10", time: "07:00 - 08:10 WIB", class: "Kelas 9F", subject: "Bahasa Inggris", room: "Ruang Kelas 9F", jtm: 2 },
  { id: "SCH-30-MON2", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Senin", periodStart: 3, periodEnd: 4, startTime: "09:00", endTime: "10:00", time: "09:00 - 10:00 WIB", class: "Kelas 9D", subject: "Tahfidz", room: "Ruang Kelas 9D", jtm: 2 },
  { id: "SCH-30-MON3", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Senin", periodStart: 7, periodEnd: 8, startTime: "11:40", endTime: "12:40", time: "11:40 - 12:40 WIB", class: "Kelas 7F", subject: "BTQ", room: "Ruang Kelas 7F", jtm: 2 },
  { id: "SCH-30-TUE4", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Selasa", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 7E", subject: "Tahfidz", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-30-TUE5", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Selasa", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9E", subject: "Tahfidz", room: "Ruang Kelas 9E", jtm: 2 },
  { id: "SCH-30-TUE6", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Selasa", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 8D", subject: "BTQ", room: "Ruang Kelas 8D", jtm: 2 },
  { id: "SCH-30-WED7", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Rabu", periodStart: 5, periodEnd: 6, startTime: "09:55", endTime: "11:15", time: "09:55 - 11:15 WIB", class: "Kelas 9G", subject: "BTQ", room: "Ruang Kelas 9G", jtm: 2 },
  { id: "SCH-30-WED8", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Rabu", periodStart: 7, periodEnd: 8, startTime: "11:45", endTime: "13:05", time: "11:45 - 13:05 WIB", class: "Kelas 7A", subject: "Tahfidz", room: "Ruang Kelas 7A", jtm: 2 },
  { id: "SCH-30-THU9", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Kamis", periodStart: 4, periodEnd: 4, startTime: "09:00", endTime: "09:40", time: "09:00 - 09:40 WIB", class: "Kelas 9C", subject: "Tahfidz", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-30-THU10", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Kamis", periodStart: 5, periodEnd: 5, startTime: "09:55", endTime: "10:35", time: "09:55 - 10:35 WIB", class: "Kelas 9C", subject: "Tahfidz", room: "Ruang Kelas 9C", jtm: 1 },
  { id: "SCH-30-FRI11", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Jumat", periodStart: 5, periodEnd: 6, startTime: "09:40", endTime: "10:50", time: "09:40 - 10:50 WIB", class: "Kelas 7C", subject: "Tahfidz", room: "Ruang Kelas 7C", jtm: 2 },
  { id: "SCH-30-SAT12", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Sabtu", periodStart: 1, periodEnd: 2, startTime: "07:00", endTime: "08:20", time: "07:00 - 08:20 WIB", class: "Kelas 9H", subject: "BTQ", room: "Ruang Kelas 9H", jtm: 2 },
  { id: "SCH-30-SAT13", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7D", subject: "Tahfidz", room: "Ruang Kelas 7D", jtm: 2 },
  { id: "SCH-30-SAT14", teacherId: "TCH-30", teacherName: "MUHAMMAD IRSYAD HUSNI", day: "Sabtu", periodStart: 6, periodEnd: 7, startTime: "10:50", endTime: "12:10", time: "10:50 - 12:10 WIB", class: "Kelas 7B", subject: "Tahfidz", room: "Ruang Kelas 7B", jtm: 2 },
  { id: "SCH-47-SAT7", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Sabtu", periodStart: 1, periodEnd: 1, startTime: "07:00", endTime: "07:40", time: "07:00 - 07:40 WIB", class: "Kelas 7F", subject: "IPS", room: "Ruang Kelas 7F", jtm: 1 },
  { id: "SCH-47-SAT8", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Sabtu", periodStart: 3, periodEnd: 3, startTime: "08:20", endTime: "09:00", time: "08:20 - 09:00 WIB", class: "Kelas 7G", subject: "IPS", room: "Ruang Kelas 7G", jtm: 1 },
  { id: "SCH-47-SAT9", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Sabtu", periodStart: 4, periodEnd: 5, startTime: "09:15", endTime: "10:35", time: "09:15 - 10:35 WIB", class: "Kelas 7E", subject: "IPS", room: "Ruang Kelas 7E", jtm: 2 },
  { id: "SCH-47-SAT10", teacherId: "TCH-47", teacherName: "SUDIYANTO", day: "Sabtu", periodStart: 7, periodEnd: 7, startTime: "11:30", endTime: "12:10", time: "11:30 - 12:10 WIB", class: "Kelas 7C", subject: "IPS", room: "Ruang Kelas 7C", jtm: 1 },
  { id: "SCH-23-MON16", teacherId: "TCH-23", teacherName: "Ismatul Maula", day: "Senin", periodStart: 3, periodEnd: 3, startTime: "09:00", endTime: "09:30", time: "09:00 - 09:30 WIB", class: "Kelas 7H", subject: "Bahasa Arab", room: "Ruang Kelas 7H", jtm: 1 }
];

// Helper auto-populate seluruh dewan guru ke rekap presensi hari ini (Status awal bersih: Belum Absen)
const INITIAL_ALL_TEACHERS_ATTENDANCE = INITIAL_TEACHERS_MASTER_60.map((t) => ({
  id: t.id,
  name: t.name,
  nip: t.nip,
  subject: t.subject,
  checkIn: "-",
  checkOut: "-",
  status: "Belum Absen",
  statusDetail: "Belum Melakukan Check-In",
  isLate: false,
  phone: t.phone
}));

// Helper functions for storage management & Guru Roster Management
const StorageService = {
  // Authentication & Session Management
  isAdminLoggedIn() {
    return sessionStorage.getItem("hadir_guru_admin_session") === "true" || localStorage.getItem("hadir_guru_admin_remember") === "true";
  },
  verifyAdminCredentials(username, password) {
    const userClean = (username || "").trim();
    const passClean = (password || "").trim();
    if (!userClean || !passClean) return false;
    const config = this.getSchoolConfig();
    const validUser = (config.adminUsername || "admin").trim();
    const validPass = (config.adminPassword || "@aries1977").trim();
    return userClean === validUser && passClean === validPass;
  },
  setAdminLoggedIn(status, remember = false) {
    if (status) {
      sessionStorage.setItem("hadir_guru_admin_session", "true");
      sessionStorage.setItem("hadir_guru_auth_role", "admin");
      if (remember) {
        localStorage.setItem("hadir_guru_admin_remember", "true");
        localStorage.setItem("hadir_guru_auth_role", "admin");
      }
    } else {
      sessionStorage.removeItem("hadir_guru_admin_session");
      localStorage.removeItem("hadir_guru_admin_remember");
      if (sessionStorage.getItem("hadir_guru_auth_role") === "admin") {
        sessionStorage.removeItem("hadir_guru_auth_role");
      }
      if (localStorage.getItem("hadir_guru_auth_role") === "admin") {
        localStorage.removeItem("hadir_guru_auth_role");
      }
    }
  },
  logoutAdmin() {
    this.setAdminLoggedIn(false);
  },
  saveAdminCredentials(newUsername, newPassword) {
    const config = this.getSchoolConfig();
    if (newUsername) config.adminUsername = newUsername.trim();
    if (newPassword) config.adminPassword = newPassword.trim();
    this.saveSchoolConfig(config);
    return true;
  },

  // Teacher Authentication & Session Management
  isTeacherLoggedIn() {
    return sessionStorage.getItem("hadir_guru_teacher_session") === "true" || localStorage.getItem("hadir_guru_teacher_remember") === "true";
  },
  setTeacherLoggedIn(teacherId, remember = false) {
    if (teacherId) {
      this.setActiveTeacherId(teacherId);
      sessionStorage.setItem("hadir_guru_teacher_session", "true");
      sessionStorage.setItem("hadir_guru_auth_role", "teacher");
      if (remember) {
        localStorage.setItem("hadir_guru_teacher_remember", "true");
        localStorage.setItem("hadir_guru_auth_role", "teacher");
      }
    } else {
      sessionStorage.removeItem("hadir_guru_teacher_session");
      localStorage.removeItem("hadir_guru_teacher_remember");
      if (sessionStorage.getItem("hadir_guru_auth_role") === "teacher") {
        sessionStorage.removeItem("hadir_guru_auth_role");
      }
      if (localStorage.getItem("hadir_guru_auth_role") === "teacher") {
        localStorage.removeItem("hadir_guru_auth_role");
      }
    }
  },
  logoutTeacher() {
    this.setTeacherLoggedIn(null);
  },
  verifyTeacherCredentials(identifier, pinOrPassword) {
    if (!identifier) return { success: false, message: "Pilih akun atau masukkan NIP / Username guru." };
    const idClean = identifier.trim().toLowerCase();
    const pinClean = (pinOrPassword || "").trim();

    if (!pinClean) {
      return { success: false, message: "PIN atau Password akun guru wajib diisi." };
    }

    const teachers = this.getTeachersMaster();
    const found = teachers.find(t => {
      if (t.id && t.id.toLowerCase() === idClean) return true;
      if (t.nip && t.nip.replace(/\s+/g, "") === idClean.replace(/\s+/g, "")) return true;
      if (t.username && t.username.toLowerCase() === idClean) return true;
      if (t.email && t.email.toLowerCase() === idClean) return true;
      if (t.name && t.name.toLowerCase() === idClean) return true;
      return false;
    });

    if (!found) {
      return { success: false, message: "Akun guru tidak ditemukan. Periksa kembali NIP, Username, atau pilih dari daftar." };
    }

    const validPin = String(found.pin || "").trim();
    const validPass = String(found.password || validPin).trim();

    if ((validPin && pinClean === validPin) || (validPass && pinClean === validPass)) {
      return { success: true, teacher: found };
    } else {
      return { success: false, message: "Password atau PIN akun guru salah. Silakan periksa kembali sandi Anda." };
    }
  },
  getAuthSession() {
    if (this.isAdminLoggedIn()) {
      return { role: "admin", teacherId: null };
    }
    if (this.isTeacherLoggedIn()) {
      return { role: "teacher", teacherId: this.getActiveTeacherId() };
    }
    return null;
  },
  logoutAll() {
    this.logoutAdmin();
    this.logoutTeacher();
    sessionStorage.removeItem("hadir_guru_auth_role");
    localStorage.removeItem("hadir_guru_auth_role");
  },

  getSchoolConfig() {
    const stored = localStorage.getItem("hadir_guru_school_config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const merged = {
            ...SCHOOL_CONFIG,
            ...parsed,
            schedule: {
              ...SCHOOL_CONFIG.schedule,
              ...(parsed.schedule || {})
            },
            geofence: {
              ...SCHOOL_CONFIG.geofence,
              ...(parsed.geofence || {})
            }
          };
          if (!merged.schedule.checkInStart) {
            merged.schedule.checkInStart = "06:00";
          }
          if (!merged.schedule.checkOutSeninKamis) {
            merged.schedule.checkOutSeninKamis = merged.schedule.checkOutStandard || "14:00";
          }
          if (!merged.schedule.checkOutJumat) {
            merged.schedule.checkOutJumat = "11:30";
          }
          if (!merged.schedule.checkOutSabtu) {
            merged.schedule.checkOutSabtu = "12:30";
          }
          if (!merged.schedule.checkOutMinggu) {
            merged.schedule.checkOutMinggu = "12:00";
          }
          if (!merged.schedule.kbmBreaksByDay) {
            merged.schedule.kbmBreaksByDay = { ...SCHOOL_CONFIG.schedule.kbmBreaksByDay };
          }
          if (!merged.schedule.kbmDurationByDay) {
            merged.schedule.kbmDurationByDay = { ...SCHOOL_CONFIG.schedule.kbmDurationByDay };
          }
          if (merged.schedule.kbmDurationByDay.selasa_kamis_sabtu && !merged.schedule.kbmDurationByDay.selasa_kamis) {
            merged.schedule.kbmDurationByDay.selasa_kamis = merged.schedule.kbmDurationByDay.selasa_kamis_sabtu;
          }
          if (!merged.schedule.kbmDurationByDay.sabtu) {
            merged.schedule.kbmDurationByDay.sabtu = 40;
          }
          if (!merged.schedule.kbmDurationByDay.minggu) {
            merged.schedule.kbmDurationByDay.minggu = 40;
          }
          if (!merged.schedule.kbmPeriodsByDay) {
            merged.schedule.kbmPeriodsByDay = { ...SCHOOL_CONFIG.schedule.kbmPeriodsByDay };
          }
          if (merged.schedule.kbmPeriodsByDay.selasa_kamis_sabtu && !merged.schedule.kbmPeriodsByDay.selasa_kamis) {
            merged.schedule.kbmPeriodsByDay.selasa_kamis = merged.schedule.kbmPeriodsByDay.selasa_kamis_sabtu;
          }
          if (!merged.schedule.kbmPeriodsByDay.sabtu) {
            merged.schedule.kbmPeriodsByDay.sabtu = SCHOOL_CONFIG.schedule.kbmPeriodsByDay.sabtu;
          }
          if (!merged.schedule.kbmPeriodsByDay.minggu) {
            merged.schedule.kbmPeriodsByDay.minggu = SCHOOL_CONFIG.schedule.kbmPeriodsByDay.minggu;
          }
          if (!merged.schedule.kbmBreaksByDay.sabtu) {
            merged.schedule.kbmBreaksByDay.sabtu = SCHOOL_CONFIG.schedule.kbmBreaksByDay.sabtu;
          }
          if (!merged.schedule.kbmBreaksByDay.minggu) {
            merged.schedule.kbmBreaksByDay.minggu = SCHOOL_CONFIG.schedule.kbmBreaksByDay.minggu;
          }
          if (!merged.schedule.kbmBreaksByDay.selasa_kamis) {
            merged.schedule.kbmBreaksByDay.selasa_kamis = SCHOOL_CONFIG.schedule.kbmBreaksByDay.selasa_kamis;
          }
          if (!Array.isArray(merged.schedule.kbmPeriods) || merged.schedule.kbmPeriods.length === 0) {
            merged.schedule.kbmPeriods = SCHOOL_CONFIG.schedule.kbmPeriods;
          }
          return merged;
        }
      } catch (e) { console.error(e); }
    }
    return SCHOOL_CONFIG;
  },
  saveSchoolConfig(data) {
    localStorage.setItem("hadir_guru_school_config", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("school_config", data);
    }
  },
  normalizeKbmDayGroup(dayOrGroup) {
    if (!dayOrGroup) {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      dayOrGroup = days[new Date().getDay()];
    }
    const clean = String(dayOrGroup).trim().toLowerCase();
    if (clean === "senin") return "senin";
    if (clean === "jumat") return "jumat";
    if (clean === "sabtu") return "sabtu";
    if (clean === "minggu") return "minggu";
    if (["selasa", "rabu", "kamis", "selasa_kamis", "selasa_kamis_sabtu"].includes(clean)) {
      return "selasa_kamis";
    }
    return "selasa_kamis";
  },
  getKbmPeriods(dayOrGroup = null) {
    const config = this.getSchoolConfig();
    const group = this.normalizeKbmDayGroup(dayOrGroup);
    if (config.schedule && config.schedule.kbmPeriodsByDay && Array.isArray(config.schedule.kbmPeriodsByDay[group])) {
      return config.schedule.kbmPeriodsByDay[group];
    }
    if (SCHOOL_CONFIG.schedule.kbmPeriodsByDay && Array.isArray(SCHOOL_CONFIG.schedule.kbmPeriodsByDay[group])) {
      return SCHOOL_CONFIG.schedule.kbmPeriodsByDay[group];
    }
    return (config.schedule && Array.isArray(config.schedule.kbmPeriods))
      ? config.schedule.kbmPeriods
      : SCHOOL_CONFIG.schedule.kbmPeriods;
  },
  saveKbmPeriods(periods, dayOrGroup = null) {
    const config = this.getSchoolConfig();
    if (!config.schedule) config.schedule = {};
    if (!config.schedule.kbmPeriodsByDay) {
      config.schedule.kbmPeriodsByDay = { ...SCHOOL_CONFIG.schedule.kbmPeriodsByDay };
    }
    const group = this.normalizeKbmDayGroup(dayOrGroup);
    config.schedule.kbmPeriodsByDay[group] = periods;
    if (group === "selasa_kamis") {
      config.schedule.kbmPeriods = periods;
      config.schedule.kbmPeriodsByDay.selasa_kamis_sabtu = periods;
    }
    this.saveSchoolConfig(config);
  },
  getKbmDurationByDay() {
    const config = this.getSchoolConfig();
    const defaults = SCHOOL_CONFIG.schedule.kbmDurationByDay || { senin: 30, selasa_kamis: 40, jumat: 35, sabtu: 40, minggu: 40 };
    const cur = (config.schedule && config.schedule.kbmDurationByDay) || {};
    return {
      senin: cur.senin || defaults.senin || 30,
      selasa_kamis: cur.selasa_kamis || cur.selasa_kamis_sabtu || defaults.selasa_kamis || 40,
      jumat: cur.jumat || defaults.jumat || 35,
      sabtu: cur.sabtu || defaults.sabtu || 40,
      minggu: cur.minggu || defaults.minggu || 40
    };
  },
  saveKbmDurationByDay(durations) {
    const config = this.getSchoolConfig();
    if (!config.schedule) config.schedule = {};
    config.schedule.kbmDurationByDay = {
      senin: parseInt(durations.senin, 10) || 30,
      selasa_kamis: parseInt(durations.selasa_kamis || durations.selasa_kamis_sabtu, 10) || 40,
      jumat: parseInt(durations.jumat, 10) || 35,
      sabtu: parseInt(durations.sabtu, 10) || 40,
      minggu: parseInt(durations.minggu, 10) || 40
    };
    this.saveSchoolConfig(config);
  },
  getKbmBreaks(dayOrGroup = null) {
    const config = this.getSchoolConfig();
    const group = this.normalizeKbmDayGroup(dayOrGroup);
    const defaults = SCHOOL_CONFIG.schedule.kbmBreaksByDay || {};
    if (config.schedule && config.schedule.kbmBreaksByDay && Array.isArray(config.schedule.kbmBreaksByDay[group])) {
      return config.schedule.kbmBreaksByDay[group];
    }
    if (defaults[group]) {
      return defaults[group];
    }
    return [
      { id: "break1", name: "Istirahat 1", active: true, afterPeriod: 3, start: "09:15", end: "09:35", duration: 20, note: "Istirahat Pagi" },
      { id: "break2", name: "Ishoma", active: false, afterPeriod: 6, start: "11:35", end: "12:35", duration: 60, note: "Ishoma" }
    ];
  },
  saveKbmBreaks(breaks, dayOrGroup = null) {
    const config = this.getSchoolConfig();
    if (!config.schedule) config.schedule = {};
    if (!config.schedule.kbmBreaksByDay) {
      config.schedule.kbmBreaksByDay = { ...SCHOOL_CONFIG.schedule.kbmBreaksByDay };
    }
    const group = this.normalizeKbmDayGroup(dayOrGroup);
    config.schedule.kbmBreaksByDay[group] = breaks;
    this.saveSchoolConfig(config);
  },
  generateKbmPeriodsForDuration(dayOrGroup = "senin", targetDuration = null, customBreaks = null) {
    const group = this.normalizeKbmDayGroup(dayOrGroup);
    const durations = this.getKbmDurationByDay();
    const dur = parseInt(targetDuration, 10) || durations[group] || (group === "senin" ? 30 : (group === "jumat" ? 35 : 40));
    const breaks = (customBreaks && Array.isArray(customBreaks)) ? customBreaks : this.getKbmBreaks(group);
    const activeBreaks = breaks.filter(b => b.active);

    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const parseTime = (timeStr) => {
      if (!timeStr || !timeStr.includes(":")) return 0;
      const [h, m] = timeStr.split(":").map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };

    let totalPeriods = 8;
    if (group === "jumat" || group === "sabtu" || group === "minggu") {
      totalPeriods = 6;
    }

    let curMinutes = 7 * 60 + 15; // 07:15 WIB
    const periods = [];

    for (let p = 1; p <= totalPeriods; p++) {
      const prevPeriod = p - 1;
      const breakObj = activeBreaks.find(b => parseInt(b.afterPeriod, 10) === prevPeriod);
      if (breakObj) {
        let bStart = parseTime(breakObj.start || "09:15");
        let bEnd = parseTime(breakObj.end || "09:35");
        if (bStart < curMinutes) {
          bStart = curMinutes;
        }
        if (bEnd <= bStart) {
          const bDur = parseInt(breakObj.duration, 10) || 20;
          bEnd = bStart + bDur;
        }
        curMinutes = bEnd;
      }

      const pStart = formatTime(curMinutes);
      const pEnd = formatTime(curMinutes + dur);

      let note = `KBM Sesi Jam Ke-${p} (${dur} Mnt)`;
      if (group === "senin") {
        note = p <= 4 ? `KBM Sesi Pagi ${p} (${dur} Mnt)` : `KBM Pasca Istirahat (${dur} Mnt)`;
      } else if (group === "jumat") {
        note = p <= 3 ? `KBM Sesi Pagi ${p} (${dur} Mnt)` : (p === 6 ? `KBM Pra Sholat Jumat (${dur} Mnt)` : `KBM Pasca Istirahat (${dur} Mnt)`);
      } else if (group === "sabtu") {
        note = p <= 3 ? `KBM Sesi Pagi ${p} (${dur} Mnt)` : `KBM Pasca Istirahat (${dur} Mnt)`;
      } else if (group === "minggu") {
        note = p <= 3 ? `KBM/Ekskul Sesi Pagi ${p} (${dur} Mnt)` : `KBM/Ekskul Pasca Istirahat (${dur} Mnt)`;
      } else {
        note = p <= 3 ? `KBM Sesi Pagi ${p} (${dur} Mnt)` : (p <= 6 ? `KBM Menjelang Siang ${p - 3} (${dur} Mnt)` : `KBM Sesi Siang ${p - 6} (${dur} Mnt)`);
      }

      periods.push({
        period: p,
        start: pStart,
        end: pEnd,
        note: note
      });

      curMinutes += dur;
    }

    return periods;
  },
  getTodayCheckOutSchedule(date = new Date()) {
    const config = this.getSchoolConfig();
    const dayIndex = date.getDay(); // 0 = Minggu, 1 = Senin, ... 5 = Jumat, 6 = Sabtu
    const sched = config.schedule || {};
    if (dayIndex === 5) {
      return {
        dayGroup: "Jumat",
        time: sched.checkOutJumat || "11:30",
        label: "Jumat (Ibadah Sholat Jumat)",
        isSpecial: true
      };
    } else if (dayIndex === 6) {
      return {
        dayGroup: "Sabtu",
        time: sched.checkOutSabtu || "12:30",
        label: "Sabtu (Akhir Pekan/Ekskul)",
        isSpecial: true
      };
    } else if (dayIndex === 0) {
      return {
        dayGroup: "Minggu",
        time: sched.checkOutMinggu || "12:00",
        label: "Minggu (Hari Libur / Kegiatan Tambahan)",
        isSpecial: true
      };
    } else {
      return {
        dayGroup: "Senin - Kamis",
        time: sched.checkOutSeninKamis || sched.checkOutStandard || "14:00",
        label: "Senin - Kamis (Standar)",
        isSpecial: false
      };
    }
  },
  getTodayAttendanceTimeStatus(date = new Date()) {
    const config = this.getSchoolConfig();
    const sched = config.schedule || {};
    
    const checkInStart = sched.checkInStart || "06:00";
    const checkInStandard = sched.checkInStandard || "07:00";
    const checkInLateLimit = sched.checkInLateLimit || "07:15";
    
    const todayCheckOut = this.getTodayCheckOutSchedule(date);
    const checkOutTime = todayCheckOut.time || "14:00";

    const parseToMinutes = (str) => {
      if (!str) return 0;
      const parts = str.trim().split(":");
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMins = parseToMinutes(checkInStart);
    const standardMins = parseToMinutes(checkInStandard);
    const lateLimitMins = parseToMinutes(checkInLateLimit);
    const checkOutMins = parseToMinutes(checkOutTime);

    return {
      checkInStart,
      checkInStandard,
      checkInLateLimit,
      checkOutTime,
      dayGroup: todayCheckOut.dayGroup,
      currentMinutes,
      isBeforeCheckInStart: currentMinutes < startMins,
      isCheckInOpen: currentMinutes >= startMins && currentMinutes <= lateLimitMins,
      isCheckInOnTime: currentMinutes >= startMins && currentMinutes <= standardMins,
      isCheckInLateTolerance: currentMinutes > standardMins && currentMinutes <= lateLimitMins,
      isCheckInExpired: currentMinutes > lateLimitMins,
      isCheckOutAllowed: currentMinutes >= checkOutMins
    };
  },

  // Master Database Guru
  getTeachersMaster() {
    const stored = localStorage.getItem("hadir_guru_teachers_60");
    let teachers = INITIAL_TEACHERS_MASTER_60;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) teachers = parsed;
      } catch (e) { console.error(e); }
    }

    // Gabungkan override profil individual dari Cloud jika ada
    let cloudOverrides = {};
    try {
      const ovRaw = localStorage.getItem("hadir_guru_cloud_profile_overrides");
      if (ovRaw) cloudOverrides = JSON.parse(ovRaw) || {};
    } catch (e) {}

    // Pastikan setiap guru memiliki data akun login, penugasan & kepegawaian
    let hasMissing = false;
    const enriched = teachers.map((t, idx) => {
      const ov = cloudOverrides[t.id] || {};
      const mergedT = { ...t, ...ov };
      const initTeacher = INITIAL_TEACHERS_MASTER_60.find(it => it.id === mergedT.id);
      let classAssigned = mergedT.classAssigned || (initTeacher ? initTeacher.classAssigned : "Guru Mapel");
      if (initTeacher && initTeacher.classAssigned && initTeacher.classAssigned !== "Guru Mapel" && (!mergedT.classAssigned || mergedT.classAssigned === "Guru Mapel")) {
        classAssigned = initTeacher.classAssigned;
        hasMissing = true;
      }
      let email = mergedT.email || "";
      if (email.toLowerCase().indexOf("@mtsn.sch.id") !== -1) {
        email = email.replace(/@mtsn\.sch\.id/gi, "@mtsasyjtb.sch.id");
        hasMissing = true;
      }
      const username = mergedT.username || (email ? email.split("@")[0] : ("guru" + (idx + 1)));
      const pin = mergedT.pin || mergedT.password || "123456";
      const password = mergedT.password || pin;
      const kepegawaian = mergedT.kepegawaian || mergedT.employmentStatus || (idx < 35 ? "PNS / ASN" : (idx < 45 ? "PPPK" : "GTT / Honorer"));
      const role = mergedT.role || (classAssigned?.includes("Wali") ? "Wali Kelas" : (classAssigned?.includes("Piket") ? "Guru Piket" : "Guru Pengajar"));
      if (!mergedT.username || !mergedT.password || !mergedT.kepegawaian || !mergedT.role || !mergedT.classAssigned) hasMissing = true;
      return {
        ...mergedT,
        email,
        classAssigned,
        username,
        password,
        pin,
        kepegawaian,
        employmentStatus: kepegawaian,
        role
      };
    });
    if (hasMissing && stored) {
      localStorage.setItem("hadir_guru_teachers_60", JSON.stringify(enriched));
    }
    return enriched;
  },
  saveTeachersMaster(data, changedTeacherId = null) {
    localStorage.setItem("hadir_guru_teachers_60", JSON.stringify(data));

    // Pastikan hadir_guru_profile untuk guru aktif ikut diperbarui secara lokal
    const activeId = this.getActiveTeacherId();
    const activeTeacher = Array.isArray(data) ? data.find(t => t.id === activeId) : null;
    if (activeTeacher) {
      let curProf = {};
      try {
        curProf = JSON.parse(localStorage.getItem("hadir_guru_profile") || "{}") || {};
      } catch (e) {}
      const syncedProf = {
        ...curProf,
        id: activeTeacher.id,
        name: activeTeacher.name,
        nip: activeTeacher.nip,
        nuptk: activeTeacher.nuptk || curProf.nuptk || "-",
        subject: activeTeacher.subject,
        dept: activeTeacher.dept || curProf.dept || "PAI",
        classAssigned: activeTeacher.classAssigned,
        email: activeTeacher.email,
        phone: activeTeacher.phone,
        employmentStatus: activeTeacher.kepegawaian || activeTeacher.employmentStatus || curProf.employmentStatus || "Guru Tetap Kemenag",
        kepegawaian: activeTeacher.kepegawaian || activeTeacher.employmentStatus || curProf.kepegawaian || "Guru Tetap Kemenag",
        password: activeTeacher.password || activeTeacher.pin || "123456",
        pin: activeTeacher.pin || activeTeacher.password || "123456",
        avatarUrl: activeTeacher.avatarUrl !== undefined ? activeTeacher.avatarUrl : (curProf.avatarUrl || "")
      };
      localStorage.setItem("hadir_guru_profile", JSON.stringify(syncedProf));
    }

    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      if (changedTeacherId && Array.isArray(data)) {
        const targetT = data.find(t => t.id === changedTeacherId);
        if (targetT) {
          FirebaseService.pushTeacherProfile(changedTeacherId, targetT);
        }
      }
      FirebaseService.pushSyncState("teachers_master", data);
    }
  },

  // Export database dan akun login guru ke CSV (Sesuai format data guru real)
  exportTeachersToCSV() {
    const teachers = this.getTeachersMaster();
    const headers = ["No", "NIP", "Nama Lengkap", "Nomor WhatsApp", "PIN", "Hak Akses", "Total Jadwal Mengajar", "Mata Pelajaran", "Departemen", "Email"];
    const rows = teachers.map((t, idx) => [
      idx + 1,
      `"${t.nip || ''}"`,
      `"${t.name || ''}"`,
      `"${t.phone || ''}"`,
      `"${t.pin || '123456'}"`,
      `"${t.role || 'Guru Pengajar'}"`,
      t.targetJtm || 0,
      `"${t.subject || ''}"`,
      `"${t.dept || 'Umum'}"`,
      `"${t.email || ''}"`
    ].join(","));
    return [headers.join(","), ...rows].join("\r\n");
  },

  // Reset password seluruh akun guru ke default
  resetAllTeachersPasswords(defaultPass = "Guru@2026!") {
    const teachers = this.getTeachersMaster();
    const updated = teachers.map(t => ({
      ...t,
      password: defaultPass
    }));
    this.saveTeachersMaster(updated);
    return updated;
  },

  // ==========================================
  // Welcoming Picket (Piket Penyambutan Siswa 5S)
  // ==========================================
  getWelcomingPicketRoster() {
    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDayName = daysIndo[now.getDay()];

    const stored = localStorage.getItem("hadir_guru_welcoming_picket_v2");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let dirty = false;
          const hasSunday = parsed.some(r => r.day === "Minggu");
          if (!hasSunday) {
            parsed.push({
              day: "Minggu",
              reguName: "Regu Khusus Ahad",
              squadName: "Regu Khusus Ahad",
              icon: "🕊️",
              coordinator: "-",
              time: "06:15 - 07:00",
              timeSpan: "06:15 - 07:00 WIB",
              theme: "Kegiatan Khusus & Pelayanan Ekstra",
              members: []
            });
            dirty = true;
          }
          // Auto-reset stale check-ins from previous weeks on today's picket squad
          const todaySquad = parsed.find(r => r.day === todayDayName);
          if (todaySquad && Array.isArray(todaySquad.members)) {
            todaySquad.members.forEach(m => {
              if (m && m.standbyStatus === "standby" && m.checkInDate && m.checkInDate !== curDateStr) {
                m.standbyStatus = "terjadwal";
                m.status = "Terjadwal";
                m.checkInTime = "-";
                m.standbyTime = "-";
                m.punctuality = "-";
                m.isLate = false;
                m.checkInDate = "";
                dirty = true;
              }
            });
          }
          if (dirty) {
            this.saveWelcomingPicketRoster(parsed);
          }
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_WELCOMING_PICKET_ROSTER;
  },

  saveWelcomingPicketRoster(data) {
    localStorage.setItem("hadir_guru_welcoming_picket_v2", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("picket", data);
    }
  },

  getTodayWelcomingPicket(date = new Date()) {
    const roster = this.getWelcomingPicketRoster();
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let targetDay = "Jumat";

    if (typeof date === "string") {
      if (daysIndo.includes(date)) {
        targetDay = date;
      } else {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          targetDay = daysIndo[parsed.getDay()];
        }
      }
    } else if (date && typeof date.getDay === "function") {
      targetDay = daysIndo[date.getDay()];
    }

    return roster.find(r => r.day === targetDay) || roster[0];
  },

  isTeacherOnWelcomingDuty(param1, param2) {
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let day = "Jumat";
    let teacherId = "";

    if (daysIndo.includes(param1)) {
      day = param1;
      teacherId = param2;
    } else {
      teacherId = param1;
      if (typeof param2 === "string" && daysIndo.includes(param2)) {
        day = param2;
      } else if (param2 && typeof param2.getDay === "function") {
        day = daysIndo[param2.getDay()];
      }
    }

    const todayPicket = this.getTodayWelcomingPicket(day);
    if (!todayPicket) return null;
    return todayPicket.members.find(m => m.teacherId === teacherId) || null;
  },

  confirmPicketCheckIn(day, teacherId, customTimeStr = null, notes = "") {
    const roster = this.getWelcomingPicketRoster();
    const dayPicket = roster.find(r => r.day === day);
    if (!dayPicket) return null;
    const member = dayPicket.members.find(m => m.teacherId === teacherId);
    if (!member) return null;

    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timeStr = customTimeStr || `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;
    
    // Check punctuality against target 06:15
    const hour = now.getHours();
    const min = now.getMinutes();
    const isLate = (hour > 6) || (hour === 6 && min > 15);
    const lateMinutes = isLate ? ((hour * 60 + min) - (6 * 60 + 15)) : 0;
    const punctuality = isLate ? `Terlambat ${lateMinutes} Mnt` : "Tepat Waktu";

    member.standbyStatus = "standby";
    member.status = "Standby di Gerbang";
    member.checkInTime = timeStr;
    member.standbyTime = timeStr;
    member.checkInDate = curDateStr;
    member.checkInTimestamp = now.toISOString();
    member.punctuality = punctuality;
    member.isLate = isLate;
    if (notes) member.notes = notes;

    this.saveWelcomingPicketRoster(roster);

    const teacher = this.getTeachersMaster().find(t => t.id === teacherId);
    const teacherName = member.teacherName || (teacher ? teacher.name : teacherId);
    this.addAdminActivityFeed(
      `[Piket Sambut] ${teacherName} Check-In di ${member.location} pukul ${timeStr} (${punctuality}).`,
      isLate ? "warning" : "success"
    );
    return dayPicket;
  },

  resetPicketCheckIn(day, teacherId) {
    const roster = this.getWelcomingPicketRoster();
    const dayPicket = roster.find(r => r.day === day);
    if (!dayPicket) return null;
    const member = dayPicket.members.find(m => m.teacherId === teacherId);
    if (!member) return null;

    member.standbyStatus = "terjadwal";
    member.status = "Terjadwal";
    member.checkInTime = "-";
    member.standbyTime = "-";
    member.checkInDate = "";
    member.punctuality = "-";
    member.isLate = false;
    member.checkInTimestamp = null;

    this.saveWelcomingPicketRoster(roster);

    const teacher = this.getTeachersMaster().find(t => t.id === teacherId);
    const teacherName = member.teacherName || (teacher ? teacher.name : teacherId);
    this.addAdminActivityFeed(`[Piket Sambut] Status kehadiran ${teacherName} di-reset ke Terjadwal.`, "info");
    return dayPicket;
  },

  swapPicketTeacher(day, memberId, newTeacherId, reason = "Inval / Tugas Pengganti") {
    const roster = this.getWelcomingPicketRoster();
    const dayPicket = roster.find(r => r.day === day);
    if (!dayPicket) return false;
    const member = dayPicket.members.find(m => m.id === memberId || m.teacherId === memberId);
    if (!member) return false;

    const oldTeacherId = member.teacherId;
    member.teacherId = newTeacherId;
    member.status = "Terjadwal (Inval)";
    member.standbyStatus = "terjadwal";
    member.checkInTime = "-";
    member.standbyTime = "-";
    member.punctuality = "-";
    member.isSubstituted = true;
    member.substituteReason = reason;

    const teachers = this.getTeachersMaster();
    const oldTeacher = teachers.find(t => t.id === oldTeacherId);
    const newTeacher = teachers.find(t => t.id === newTeacherId);
    const oldName = oldTeacher ? oldTeacher.name : oldTeacherId;
    const newName = newTeacher ? newTeacher.name : newTeacherId;

    member.originalTeacherName = oldName;
    member.teacherName = newName;
    if (newTeacher) {
      member.subject = newTeacher.subject;
      member.phone = newTeacher.phone;
    }

    this.saveWelcomingPicketRoster(roster);
    this.addAdminActivityFeed(`Inval Piket Gerbang: ${newName} menggantikan ${oldName} untuk piket ${day} (${member.location}).`, "correction");
    return true;
  },

  addPicketTeacher(day, data) {
    const roster = this.getWelcomingPicketRoster();
    const dayPicket = roster.find(r => r.day === day);
    if (!dayPicket) return { success: false, error: "Jadwal hari tidak ditemukan" };

    const teachers = this.getTeachersMaster();
    const teacher = teachers.find(t => t.id === data.teacherId) || {};
    const teacherName = data.teacherName || teacher.name || "Guru Piket";

    // Cek apakah guru sudah terdaftar di hari tersebut
    const alreadyExists = dayPicket.members.find(m => m.teacherId === data.teacherId);
    if (alreadyExists) {
      return { success: false, error: `Guru ${teacherName} sudah terdaftar dalam jadwal piket hari ${day}.` };
    }

    // Cek kuota kapasitas hari (maksimal 4 petugas sambut per hari untuk pendaftaran guru)
    if (!data.isAdmin && dayPicket.members.length >= 4) {
      return { success: false, error: `Jadwal piket hari ${day} sudah penuh (maksimal 4 petugas). Silakan pilih hari lain yang masih kosong.` };
    }

    const uniqueId = `PKT-${day.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const isInstant = Boolean(data.isInstantCheckIn);
    const now = new Date();
    const timeStr = data.checkInTime || `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

    const newMember = {
      id: uniqueId,
      teacherId: data.teacherId,
      teacherName: teacherName,
      subject: teacher.subject || "-",
      phone: teacher.phone || "",
      role: data.role || "Petugas 5S Salam Siswa",
      roleInPicket: data.role || "Petugas 5S Salam Siswa",
      location: data.location || "Gerbang Utama (Gedung A)",
      timeRange: data.timeRange || "06:15 - 07:00 WIB",
      status: isInstant ? "Standby di Gerbang" : "Terjadwal",
      standbyStatus: isInstant ? "standby" : "terjadwal",
      checkInTime: isInstant ? timeStr : "-",
      standbyTime: isInstant ? timeStr : "-",
      punctuality: isInstant ? "Tepat Waktu" : "-",
      isLate: false,
      notes: data.notes || "",
      addedByAdmin: data.addedByAdmin !== undefined ? Boolean(data.addedByAdmin) : true,
      addedBySelf: Boolean(data.addedBySelf)
    };

    dayPicket.members.push(newMember);

    // Update koordinator regu jika belum ada atau dipilih peran koordinator
    if (dayPicket.coordinator === "-" || !dayPicket.coordinator || dayPicket.coordinator === "Belum Ditentukan" || (data.role && data.role.includes("Koordinator"))) {
      dayPicket.coordinator = teacherName;
    }

    this.saveWelcomingPicketRoster(roster);

    const logStatus = isInstant ? `dan langsung presensi masuk (${timeStr})` : `(Status: Terjadwal)`;
    const actionLabel = data.addedBySelf ? "mendaftarkan diri mandiri di" : "ditugaskan di";
    this.addAdminActivityFeed(`[Piket Sambut] Guru ${teacherName} ${actionLabel} ${newMember.location} untuk hari ${day} ${logStatus}.`, "correction");

    return { success: true, member: newMember, squad: dayPicket };
  },

  deletePicketTeacher(day, teacherId) {
    const roster = this.getWelcomingPicketRoster();
    const dayPicket = roster.find(r => r.day === day);
    if (!dayPicket) return false;

    const idx = dayPicket.members.findIndex(m => m.id === teacherId || m.teacherId === teacherId);
    if (idx === -1) return false;

    const removed = dayPicket.members.splice(idx, 1)[0];

    // Perbarui koordinator jika yang dihapus adalah koordinator
    if (dayPicket.coordinator === removed.teacherName) {
      const remainingCoord = dayPicket.members.find(m => (m.role || "").includes("Koordinator"));
      dayPicket.coordinator = remainingCoord ? remainingCoord.teacherName : (dayPicket.members[0] ? dayPicket.members[0].teacherName : "-");
    }

    this.saveWelcomingPicketRoster(roster);

    this.addAdminActivityFeed(`[Piket Sambut] Guru ${removed.teacherName} dihapus dari penugasan piket hari ${day}.`, "info");
    return true;
  },

  getAttendanceCount() {
    const list = this.getHistory();
    return Array.isArray(list) ? list.length : 0;
  },

  purgeAttendanceHistory(options = { mode: "all" }) {
    const all = this.getHistory();
    if (!Array.isArray(all) || all.length === 0) {
      return { countDeleted: 0, remainingCount: 0 };
    }

    const initialCount = all.length;
    let retained = [];

    if (options.mode === "all") {
      retained = [];
      localStorage.removeItem("hadir_guru_today");
    } else if (options.mode === "month" && options.month) {
      retained = all.filter(item => {
        const itemDate = (item.date || "").substring(0, 7);
        return itemDate !== options.month;
      });
      const curMonth = new Date().toISOString().substring(0, 7);
      if (options.month === curMonth) {
        localStorage.removeItem("hadir_guru_today");
      }
    } else if (options.mode === "beforeMonth" && options.month) {
      const cutoff = `${options.month}-01`;
      retained = all.filter(item => {
        const itemDate = (item.date || "").substring(0, 10);
        return itemDate >= cutoff;
      });
    } else {
      retained = all;
    }

    this.saveHistory(retained);
    const countDeleted = initialCount - retained.length;
    return { countDeleted, remainingCount: retained.length };
  },

  exportAttendanceBackupCsv(filterMonth = null) {
    const all = this.getHistory();
    if (!Array.isArray(all) || all.length === 0) {
      return { success: false, message: "Tidak ada data riwayat presensi untuk diunduh." };
    }

    let exportData = all;
    let fileName = `backup_absensi_semua_${new Date().toISOString().substring(0, 10)}.csv`;

    if (filterMonth) {
      exportData = all.filter(item => (item.date || "").substring(0, 7) === filterMonth);
      fileName = `backup_absensi_bulan_${filterMonth}.csv`;
    }

    if (exportData.length === 0) {
      return { success: false, message: `Tidak ada data presensi pada bulan ${filterMonth}.` };
    }

    const headers = ["ID", "NIP", "Nama Guru", "Tanggal", "Hari", "Jam Masuk", "Status Masuk", "Jam Pulang", "Status Pulang", "Lokasi", "Keterangan"];
    const rows = exportData.map(item => [
      `"${item.id || ''}"`,
      `"${item.nip || ''}"`,
      `"${(item.teacherName || item.name || '').replace(/"/g, '""')}"`,
      `"${item.date || ''}"`,
      `"${item.day || ''}"`,
      `"${item.checkInTime || item.time || '-'}"`,
      `"${item.status || 'Hadir'}"`,
      `"${item.checkOutTime || '-'}"`,
      `"${item.checkOutStatus || '-'}"`,
      `"${(item.location || 'Kampus MTs').replace(/"/g, '""')}"`,
      `"${(item.notes || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: exportData.length, fileName };
  },

  clearAttendanceHistory() {
    localStorage.removeItem("hadir_guru_history");
    localStorage.removeItem("hadir_guru_today");
  },

  clearWelcomingPicketRoster() {
    localStorage.removeItem("hadir_guru_welcoming_picket_v2");
    return INITIAL_WELCOMING_PICKET_ROSTER;
  },


  // Active Teacher Profile & Multi-Account Switcher
  getActiveTeacherId() {
    return localStorage.getItem("hadir_guru_active_teacher_id") || "TCH-01";
  },
  setActiveTeacherId(id) {
    localStorage.setItem("hadir_guru_active_teacher_id", id);
    const teacher = this.getActiveTeacher();
    if (teacher) {
      let currentProfile = {};
      try {
        currentProfile = JSON.parse(localStorage.getItem("hadir_guru_profile") || "{}") || {};
      } catch (e) {}
      const updated = {
        ...INITIAL_TEACHER_PROFILE,
        ...currentProfile,
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        nuptk: teacher.nuptk || "-",
        gender: teacher.gender || currentProfile.gender || "Laki-laki",
        role: teacher.role || "Pendidik",
        position: teacher.position || teacher.classAssigned || "Pendidik",
        subject: teacher.subject,
        dept: teacher.dept || "PAI",
        classAssigned: teacher.classAssigned,
        employmentStatus: teacher.kepegawaian || teacher.employmentStatus || "Guru Tetap Kemenag",
        kepegawaian: teacher.kepegawaian || teacher.employmentStatus || "Guru Tetap Kemenag",
        email: teacher.email,
        phone: teacher.phone,
        password: teacher.password || teacher.pin || "123456",
        pin: teacher.pin || teacher.password || "123456",
        avatarUrl: teacher.avatarUrl || ""
      };
      // Hanya simpan ke localStorage saat berpindah akun agar tidak menimpa data Cloud sebelum sinkronisasi selesai
      localStorage.setItem("hadir_guru_profile", JSON.stringify(updated));
    }
    this.syncActiveTeachingSchedules();
  },
  getActiveTeacher() {
    const activeId = this.getActiveTeacherId();
    const teachers = this.getTeachersMaster();
    return teachers.find(t => t.id === activeId) || teachers[0];
  },

  getProfile() {
    const activeTeacher = this.getActiveTeacher();
    const stored = localStorage.getItem("hadir_guru_profile");
    let parsed = null;
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (e) { console.error(e); }
    }

    if (activeTeacher) {
      const isMatchingActive = parsed && parsed.id === activeTeacher.id;
      const base = isMatchingActive ? { ...INITIAL_TEACHER_PROFILE, ...parsed } : { ...INITIAL_TEACHER_PROFILE };
      const merged = {
        ...base,
        id: activeTeacher.id,
        name: activeTeacher.name || base.name,
        nip: activeTeacher.nip || base.nip,
        nuptk: activeTeacher.nuptk || base.nuptk || "-",
        gender: activeTeacher.gender || base.gender || "Laki-laki",
        role: activeTeacher.role || base.role || "Pendidik",
        position: activeTeacher.position || activeTeacher.classAssigned || base.position || "Pendidik",
        subject: activeTeacher.subject || base.subject,
        dept: activeTeacher.dept || base.dept || "PAI",
        classAssigned: activeTeacher.classAssigned || base.classAssigned,
        employmentStatus: activeTeacher.kepegawaian || activeTeacher.employmentStatus || base.employmentStatus || "Guru Tetap Kemenag",
        kepegawaian: activeTeacher.kepegawaian || activeTeacher.employmentStatus || base.kepegawaian || "Guru Tetap Kemenag",
        email: activeTeacher.email || base.email,
        phone: activeTeacher.phone !== undefined ? activeTeacher.phone : base.phone,
        password: activeTeacher.password || activeTeacher.pin || base.password || "123456",
        pin: activeTeacher.pin || activeTeacher.password || base.pin || "123456",
        avatarUrl: activeTeacher.avatarUrl || base.avatarUrl || ""
      };
      if (merged.email && merged.email.toLowerCase().indexOf("@mtsn.sch.id") !== -1) {
        merged.email = merged.email.replace(/@mtsn\.sch\.id/gi, "@mtsasyjtb.sch.id");
      }
      return merged;
    }

    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return INITIAL_TEACHER_PROFILE;
  },
  saveProfile(data) {
    localStorage.setItem("hadir_guru_profile", JSON.stringify(data));

    const targetId = (data && data.id) ? data.id : this.getActiveTeacherId();
    const teachers = this.getTeachersMaster();
    const idx = teachers.findIndex(t => t.id === targetId);
    let updatedTeacherObj = null;

    if (idx !== -1 && data) {
      teachers[idx] = {
        ...teachers[idx],
        name: data.name || teachers[idx].name,
        nip: data.nip || teachers[idx].nip,
        nuptk: data.nuptk || teachers[idx].nuptk,
        subject: data.subject || teachers[idx].subject,
        dept: data.dept || teachers[idx].dept,
        classAssigned: data.classAssigned || teachers[idx].classAssigned,
        email: data.email !== undefined ? data.email : teachers[idx].email,
        phone: data.phone !== undefined ? data.phone : teachers[idx].phone,
        kepegawaian: data.employmentStatus || data.kepegawaian || teachers[idx].kepegawaian,
        employmentStatus: data.employmentStatus || data.kepegawaian || teachers[idx].employmentStatus,
        password: data.password || data.pin || teachers[idx].password,
        pin: data.pin || data.password || teachers[idx].pin,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : (teachers[idx].avatarUrl || "")
      };
      updatedTeacherObj = teachers[idx];
      localStorage.setItem("hadir_guru_teachers_60", JSON.stringify(teachers));
    }

    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      const payloadToPush = updatedTeacherObj || { ...data, id: targetId };
      FirebaseService.pushTeacherProfile(targetId, payloadToPush);
      if (updatedTeacherObj) {
        FirebaseService.pushSyncState("teachers_master", teachers);
      }
    }
  },

  // Master Jadwal Mengajar Guru
  getMasterSchedules() {
    const stored = localStorage.getItem("hadir_guru_master_schedules");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const oldClash = parsed.find(s => s.id === "SCH-30-MON1" && s.periodStart !== 1);
          if (oldClash) {
            oldClash.periodStart = 1;
            oldClash.periodEnd = 2;
            oldClash.startTime = "07:15";
            oldClash.endTime = "08:35";
            oldClash.time = "07:15 - 08:35 WIB";
            localStorage.setItem("hadir_guru_master_schedules", JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_MASTER_SCHEDULES;
  },
  saveMasterSchedules(data) {
    localStorage.setItem("hadir_guru_master_schedules", JSON.stringify(data));
    this.syncActiveTeachingSchedules();
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("schedules", data);
    }
  },

  // Filter jadwal khusus untuk guru yang sedang aktif/login
  getActiveTeacherSchedules() {
    const activeId = this.getActiveTeacherId();
    const schedules = this.getMasterSchedules();
    return schedules.filter(s => s.teacherId === activeId);
  },

  // Sinkronisasi memory TEACHING_SCHEDULES array agar kompatibel 100% dengan KBM check-in
  syncActiveTeachingSchedules() {
    const mySchedules = this.getActiveTeacherSchedules();
    if (typeof TEACHING_SCHEDULES !== "undefined") {
      TEACHING_SCHEDULES.length = 0;
      TEACHING_SCHEDULES.push(...mySchedules);
    }
    return mySchedules;
  },

  // Deteksi Bentrok Jadwal (Guru yang sama di 2 kelas berbeda, atau Ruang yang sama diisi 2 sesi berbeda)
  findScheduleClashes(schedules) {
    const list = schedules || this.getMasterSchedules();
    const clashes = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.day !== b.day) continue;

        const aStart = Number(a.periodStart || 1);
        const aEnd = Number(a.periodEnd || (aStart + (a.jtm || 1) - 1));
        const bStart = Number(b.periodStart || 1);
        const bEnd = Number(b.periodEnd || (bStart + (b.jtm || 1) - 1));

        const isOverlap = (aStart <= bEnd && aEnd >= bStart);
        if (isOverlap) {
          // Bentrok 1: Guru yang sama
          if (a.teacherId === b.teacherId) {
            clashes.push({
              type: "teacher",
              scheduleA: a,
              scheduleB: b,
              reason: `Bentrok Guru: ${a.teacherName || a.teacherId} terjadwal di dua kelas (${a.class} & ${b.class}) pada hari ${a.day} jam ke-${Math.max(aStart, bStart)}`
            });
          }
          // Bentrok 2: Ruangan yang sama
          if (a.room && b.room && a.room === b.room) {
            clashes.push({
              type: "room",
              scheduleA: a,
              scheduleB: b,
              reason: `Bentrok Ruang: '${a.room}' digunakan bersamaan oleh ${a.teacherName || a.class} & ${b.teacherName || b.class} pada hari ${a.day} jam ke-${Math.max(aStart, bStart)}`
            });
          }
        }
      }
    }
    return clashes;
  },

  // Ekspor Jadwal ke CSV (Excel Compatible)
  exportSchedulesToCSV() {
    const schedules = this.getMasterSchedules();
    const headers = ["ID Sesi", "ID Guru", "Nama Guru", "Hari", "Jam Ke Mulai", "Jam Ke Selesai", "Waktu Mulai", "Waktu Selesai", "Kelas", "Mata Pelajaran", "Ruang", "JTM"];
    const rows = schedules.map(s => [
      `"${s.id || ''}"`,
      `"${s.teacherId || ''}"`,
      `"${(s.teacherName || '').replace(/"/g, '""')}"`,
      `"${s.day || ''}"`,
      s.periodStart || 1,
      s.periodEnd || 2,
      `"${s.startTime || ''}"`,
      `"${s.endTime || ''}"`,
      `"${s.class || ''}"`,
      `"${(s.subject || '').replace(/"/g, '""')}"`,
      `"${(s.room || '').replace(/"/g, '""')}"`,
      s.jtm || 2
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    return csvContent;
  },

  // Impor Jadwal dari CSV String
  importSchedulesFromCSV(csvText) {
    if (!csvText || typeof csvText !== "string") {
      throw new Error("File CSV kosong atau format tidak valid.");
    }
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV harus memiliki minimal baris header dan 1 baris data.");
    }

    const cleanField = str => (str || "").replace(/^"(.*)"$/, "$1").trim();
    const newSchedules = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex parsing for CSV handling commas inside quotes
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      if (!values || values.length < 5) continue;

      const id = cleanField(values[0]) || `SCH-${Date.now()}-${i}`;
      const teacherId = cleanField(values[1]) || "TCH-01";
      const teacherName = cleanField(values[2]) || "";
      const day = cleanField(values[3]) || "Senin";
      const periodStart = parseInt(cleanField(values[4]), 10) || 1;
      const periodEnd = parseInt(cleanField(values[5]), 10) || (periodStart + 1);
      const startTime = cleanField(values[6]) || "07:15";
      const endTime = cleanField(values[7]) || "08:35";
      const className = cleanField(values[8]) || "Kelas VII-A";
      const subject = cleanField(values[9]) || "Mata Pelajaran";
      const room = cleanField(values[10]) || "Ruang Teori 1";
      const jtm = parseInt(cleanField(values[11]), 10) || (periodEnd - periodStart + 1);

      newSchedules.push({
        id,
        teacherId,
        teacherName,
        day,
        periodStart,
        periodEnd,
        startTime,
        endTime,
        time: `${startTime} - ${endTime} WIB`,
        class: className,
        subject,
        room,
        jtm
      });
    }

    if (newSchedules.length === 0) {
      throw new Error("Tidak ada data jadwal valid yang dapat diimpor.");
    }

    this.saveMasterSchedules(newSchedules);
    const clashes = this.findScheduleClashes(newSchedules);
    return {
      success: true,
      count: newSchedules.length,
      clashes: clashes
    };
  },

  getAllTeachersAttendance() {
    const teachers = this.getTeachersMaster();
    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const stored = localStorage.getItem("hadir_guru_all_teachers");
    let map = {};
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.id) {
              // If stored record is from a previous day, ignore its daily check-in status so each day resets cleanly
              if (p.date && p.date !== curDateStr) {
                return;
              }
              map[p.id] = p;
            }
          });
        }
      } catch (e) { console.error(e); }
    }

    // Check approved leave requests covering today's date
    const leaves = this.getLeaveRequests() || [];
    const activeLeavesMap = {};
    leaves.forEach(lv => {
      if (lv && lv.status === "Disetujui" && lv.teacherId && lv.startDate && lv.endDate) {
        if (curDateStr >= lv.startDate && curDateStr <= lv.endDate) {
          activeLeavesMap[lv.teacherId] = lv;
        }
      }
    });

    const all = teachers.map((t, idx) => {
      const approvedLeave = activeLeavesMap[t.id];
      if (map[t.id]) {
        const rec = {
          ...map[t.id],
          name: t.name,
          nip: t.nip,
          subject: t.subject,
          phone: t.phone
        };
        if (approvedLeave && (!rec.status || rec.status === "Belum Absen")) {
          rec.status = String(approvedLeave.type || "").toLowerCase().includes("sakit") ? "Sakit" : "Izin";
          rec.statusDetail = `Disetujui: ${approvedLeave.type} (${approvedLeave.reason || "-"})`;
        }
        return rec;
      }
      if (approvedLeave) {
        return {
          id: t.id,
          name: t.name,
          nip: t.nip,
          subject: t.subject,
          checkIn: "-",
          checkOut: "-",
          status: String(approvedLeave.type || "").toLowerCase().includes("sakit") ? "Sakit" : "Izin",
          statusDetail: `Disetujui: ${approvedLeave.type} (${approvedLeave.reason || "-"})`,
          isLate: false,
          date: curDateStr,
          phone: t.phone
        };
      }
      return {
        id: t.id,
        name: t.name,
        nip: t.nip,
        subject: t.subject,
        checkIn: "-",
        checkOut: "-",
        status: "Belum Absen",
        statusDetail: "Belum Melakukan Check-In",
        isLate: false,
        date: curDateStr,
        phone: t.phone
      };
    });
    return all;
  },
  saveAllTeachersAttendance(data) {
    localStorage.setItem("hadir_guru_all_teachers", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("all_teachers_attendance", data);
    }
  },

  getTodayAttendance() {
    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const stored = localStorage.getItem("hadir_guru_today");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.date === curDateStr) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_TODAY_ATTENDANCE;
  },
  saveTodayAttendance(data, skipCloud = false) {
    localStorage.setItem("hadir_guru_today", JSON.stringify(data));
    if (!skipCloud && typeof FirebaseService !== "undefined" && FirebaseService.isReady() && !FirebaseService.isApplyingCloud()) {
      const activeTeacher = this.getActiveTeacher();
      if (activeTeacher && data && data.status && data.status !== "Belum Absen") {
        FirebaseService.recordAttendance({
          ...data,
          teacherId: activeTeacher.id,
          teacherName: activeTeacher.name,
          nip: activeTeacher.nip
        }).catch(err => console.warn("[Firebase] Background sync error:", err));
      }
    }
  },
  getHistory() {
    const stored = localStorage.getItem("hadir_guru_history");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return INITIAL_ATTENDANCE_HISTORY;
  },
  saveHistory(data) {
    localStorage.setItem("hadir_guru_history", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("attendance_history", data);
    }
  },
  getLeaveRequests() {
    const stored = localStorage.getItem("hadir_guru_leaves");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return INITIAL_LEAVE_REQUESTS;
  },
  saveLeaveRequests(data) {
    localStorage.setItem("hadir_guru_leaves", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("leaves", data);
      if (FirebaseService.isReady()) {
        const activeTeacher = this.getActiveTeacher();
        const firstRequest = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (firstRequest && firstRequest.id && !firstRequest._synced) {
          firstRequest._synced = true;
          localStorage.setItem("hadir_guru_leaves", JSON.stringify(data));
          FirebaseService.submitLeaveRequest({
            ...firstRequest,
            teacherId: activeTeacher ? activeTeacher.id : (firstRequest.teacherId || "TCH-01")
          }).catch(err => console.warn("[Firebase] Leave sync error:", err));
        }
      }
    }
  },
  getTeachingLogs() {
    const stored = localStorage.getItem("hadir_guru_teaching_logs");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_TEACHING_LOGS || [];
  },
  saveTeachingLogs(data) {
    localStorage.setItem("hadir_guru_teaching_logs", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("teaching_logs", data);
    }
  },

  // Real-time Classroom Check-In & Admin Radar Storage
  getClassCheckIns() {
    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const stored = localStorage.getItem("hadir_guru_class_checkins");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const valid = {};
          let hadStale = false;
          Object.keys(parsed).forEach(k => {
            const rec = parsed[k];
            if (rec && (!rec.date || rec.date === curDateStr)) {
              valid[k] = rec;
            } else {
              hadStale = true;
            }
          });
          if (hadStale) {
            localStorage.setItem("hadir_guru_class_checkins", JSON.stringify(valid));
          }
          return valid;
        }
      } catch (e) { console.error(e); }
    }
    return {};
  },
  saveClassCheckIns(data) {
    localStorage.setItem("hadir_guru_class_checkins", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("class_checkins", data);
    }
  },

  // --- Kalender Pendidikan (Kaldik) & Hari Libur Madrasah Jawa Tengah ---
  getHolidays() {
    const stored = localStorage.getItem("hadir_guru_holidays");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return KALDIK_JATENG_HOLIDAYS;
  },
  saveHolidays(holidays) {
    localStorage.setItem("hadir_guru_holidays", JSON.stringify(holidays));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("holidays", holidays);
    }
  },
  resetHolidaysToKaldik() {
    localStorage.setItem("hadir_guru_holidays", JSON.stringify(KALDIK_JATENG_HOLIDAYS));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("holidays", KALDIK_JATENG_HOLIDAYS);
    }
    return KALDIK_JATENG_HOLIDAYS;
  },
  getHolidayForDate(dateInput = new Date()) {
    let dateStr = "";
    if (typeof dateInput === "string") {
      dateStr = dateInput.substring(0, 10);
    } else if (dateInput instanceof Date) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, "0");
      const d = String(dateInput.getDate()).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }
    const holidays = this.getHolidays();
    const found = holidays.find(h => {
      const s = (h.startDate || "").substring(0, 10);
      const e = (h.endDate || h.startDate || "").substring(0, 10);
      return dateStr >= s && dateStr <= e;
    });
    if (found) {
      return { isHoliday: true, holiday: found };
    }
    return { isHoliday: false, holiday: null };
  },

  // Live Monitor Radar KBM (26 Rombel/Ruang Kelas tersinkron Master Jadwal)
  getRoomsMonitoring(day = null, period = null) {
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const now = new Date();
    const curRealDay = daysIndo[now.getDay()];
    let targetDay = day || curRealDay;
    const isToday = (targetDay === curRealDay);

    const curH = now.getHours();
    const curM = now.getMinutes();
    const curClock = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`;

    // Ambil state live dari localStorage jika ada
    let liveState = {};
    try {
      const stored = localStorage.getItem("hadir_guru_rooms_monitoring_state");
      if (stored) liveState = JSON.parse(stored) || {};
    } catch(e) {}

    const masterSchedules = this.getMasterSchedules();
    const teachers = this.getTeachersMaster();
    const checkIns = this.getClassCheckIns();

    const classesList = (typeof CLASSES_LIST !== "undefined") ? CLASSES_LIST : [
      "7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H",
      "8A", "8B", "8C", "8D", "8E", "8F", "8G", "8H",
      "9A", "9B", "9C", "9D", "9E", "9F", "9G", "9H", "9I", "9J"
    ];

    // 1. Deteksi Kalender Libur Jawa Tengah & Libur Nasional
    const holidayCheck = this.getHolidayForDate(now);
    const isHolidayToday = isToday && holidayCheck.isHoliday;
    const isHolidayActive = isHolidayToday && period !== "1-2" && period !== "3-4" && period !== "5-6" && period !== "7-8" && period !== "istirahat" && period !== "selesai";

    // 2. Deteksi Jam Istirahat Sesuai Settingan Istirahat Admin untuk targetDay
    const dayBreaks = this.getKbmBreaks(targetDay);
    const activeBreaks = (dayBreaks || []).filter(b => b.active);
    
    let isBreakTime = false;
    let currentBreak = null;

    if (period === "istirahat") {
      isBreakTime = true;
      currentBreak = activeBreaks[0] || { name: "Istirahat 1", start: "09:15", end: "09:35", duration: 20, note: "Waktu Istirahat KBM" };
    } else if (isToday && period !== "1-2" && period !== "3-4" && period !== "5-6" && period !== "7-8" && period !== "selesai") {
      currentBreak = activeBreaks.find(b => curClock >= b.start && curClock < b.end) || null;
      if (currentBreak) isBreakTime = true;
    }

    // 3. Deteksi Selesai KBM Jam Terakhir Selesai
    const dayPeriods = this.getKbmPeriods(targetDay);
    const lastPeriod = (dayPeriods && dayPeriods.length > 0) ? dayPeriods[dayPeriods.length - 1] : null;
    let isKbmFinished = false;

    if (period === "selesai") {
      isKbmFinished = true;
    } else if (isToday && lastPeriod && period !== "1-2" && period !== "3-4" && period !== "5-6" && period !== "7-8" && period !== "istirahat") {
      if (curClock >= lastPeriod.end) {
        isKbmFinished = true;
      }
    }

    const rooms = classesList.map((cls, idx) => {
      const classSchedules = masterSchedules.filter(s => 
        s.day === targetDay && (s.class === `Kelas ${cls}` || s.class === cls)
      );

      const grade = cls.charAt(0);
      const building = grade === "7" ? "Gedung VII (Lt. 1)" : (grade === "8" ? "Gedung VIII (Lt. 1)" : "Gedung IX (Lt. 2)");
      const roomName = `Ruang Kelas ${cls}`;
      const roomId = `ROOM-${cls}`;

      // KASUS A: HARI LIBUR NASIONAL / LIBUR MADRASAH SESUAI KALDIK JATENG
      if (isHolidayActive) {
        const hol = holidayCheck.holiday;
        const catLabel = hol.category === "madrasah" ? "Libur Madrasah (Kaldik Jateng)" : "Libur Nasional";
        return {
          id: roomId,
          classId: cls,
          grade: grade,
          roomName: roomName,
          building: building,
          roomCode: `KLS-${cls}-HOL`,
          scheduleId: `SCH-HOL-${cls}`,
          scheduleTime: `${hol.startDate} s/d ${hol.endDate}`,
          startTime: "-",
          endTime: "-",
          periodStart: 0,
          periodEnd: 0,
          jamKe: "Libur",
          day: targetDay,
          subject: `Hari Libur (${hol.name})`,
          teacherId: "-",
          teacherName: `Libur: ${catLabel}`,
          teacherPhone: "",
          invalTeacher: null,
          status: "libur",
          statusLabel: `Libur: ${hol.name}`,
          statusClass: "status-holiday",
          checkInTime: null,
          punctuality: "Hari Libur Madrasah",
          studentsTotal: 32,
          studentsPresent: 0,
          topic: hol.description || `Hari libur resmi sesuai Kalender Pendidikan Madrasah Kanwil Kemenag Jawa Tengah.`,
          alertMinutes: 0,
          note: `Hari libur ${catLabel}. Tidak ada kegiatan belajar mengajar (KBM) tatap muka.`,
          allDaySessions: []
        };
      }

      // KASUS B: WAKTU ISTIRAHAT KBM SESUAI SETTINGAN DARI ADMIN
      if (isBreakTime && currentBreak) {
        return {
          id: roomId,
          classId: cls,
          grade: grade,
          roomName: roomName,
          building: building,
          roomCode: `KLS-${cls}-IST`,
          scheduleId: `SCH-BREAK-${cls}-${targetDay}`,
          scheduleTime: `${currentBreak.start} - ${currentBreak.end} WIB (${currentBreak.name})`,
          startTime: currentBreak.start,
          endTime: currentBreak.end,
          periodStart: currentBreak.afterPeriod || 3,
          periodEnd: currentBreak.afterPeriod || 3,
          jamKe: currentBreak.name,
          day: targetDay,
          subject: `Waktu Istirahat KBM (${currentBreak.name})`,
          teacherId: "-",
          teacherName: "Tidak Ada Jam Mengajar",
          teacherPhone: "",
          invalTeacher: null,
          status: "istirahat",
          statusLabel: `Jam Istirahat (${currentBreak.name})`,
          statusClass: "status-break",
          checkInTime: `${currentBreak.start} WIB`,
          punctuality: "Jam Istirahat KBM",
          studentsTotal: 32,
          studentsPresent: 32,
          topic: `Waktu Istirahat Siswa & Dewan Guru Sesuai Setingan Admin (${currentBreak.name})`,
          alertMinutes: 0,
          note: currentBreak.note || `Waktu istirahat resmi sesuai jadwal KBM madrasah (${currentBreak.start} - ${currentBreak.end} WIB).`,
          allDaySessions: classSchedules
        };
      }

      // KASUS C: SELESAI KBM JAM TERAKHIR (TIDAK ADA KEGIATAN KBM)
      if (isKbmFinished) {
        const lastEnd = lastPeriod ? lastPeriod.end : "13:55";
        return {
          id: roomId,
          classId: cls,
          grade: grade,
          roomName: roomName,
          building: building,
          roomCode: `KLS-${cls}-END`,
          scheduleId: `SCH-END-${cls}-${targetDay}`,
          scheduleTime: `KBM Selesai Pukul ${lastEnd} WIB`,
          startTime: lastEnd,
          endTime: "-",
          periodStart: dayPeriods.length,
          periodEnd: dayPeriods.length,
          jamKe: "Selesai",
          day: targetDay,
          subject: "Tidak ada kegiatan KBM",
          teacherId: "-",
          teacherName: "KBM Hari Ini Tuntas",
          teacherPhone: "",
          invalTeacher: null,
          status: "selesai",
          statusLabel: "Tidak ada kegiatan KBM",
          statusClass: "status-finished",
          checkInTime: null,
          punctuality: "KBM Tuntas",
          studentsTotal: 32,
          studentsPresent: 32,
          topic: `KBM hari ${targetDay} telah selesai. Seluruh jam pelajaran telah tuntas dilaksanakan.`,
          alertMinutes: 0,
          note: `Jam pelajaran terakhir untuk hari ${targetDay} telah selesai pada pukul ${lastEnd} WIB. Tidak ada kegiatan KBM.`,
          allDaySessions: classSchedules
        };
      }

      // KASUS D: KBM AKTIF BERJALAN SESUAI JADWAL REAL-TIME
      let activeSched = null;
      if (period && period !== "all") {
        activeSched = classSchedules.find(s => {
          const jam = s.periodStart === s.periodEnd ? `${s.periodStart}` : `${s.periodStart}-${s.periodEnd}`;
          return jam === period || `${s.periodStart}` === period || `${s.periodEnd}` === period;
        });
      }

      if (!activeSched && classSchedules.length > 0) {
        // Mode Real-Time: Sinkronkan dengan jam sekarang (curClock)
        // 1. Cek sesi yang sedang berlangsung saat ini
        activeSched = classSchedules.find(s => s.startTime && s.endTime && curClock >= s.startTime && curClock < s.endTime);

        // 2. Jika tidak ada yang pas menitnya, cek pemetaan jam sesi KBM
        if (!activeSched && dayPeriods && dayPeriods.length > 0) {
          const curPeriodObj = dayPeriods.find(p => curClock >= p.start && curClock < p.end);
          if (curPeriodObj) {
            activeSched = classSchedules.find(s => s.periodStart <= curPeriodObj.period && s.periodEnd >= curPeriodObj.period);
          }
        }

        // 3. Jika sebelum jam KBM pertama hari ini, tampilkan sesi jam pertama
        if (!activeSched) {
          const firstSched = classSchedules[0];
          if (firstSched && curClock < firstSched.startTime) {
            activeSched = firstSched;
          }
        }

        // 4. Jika di sela-sela pergantian jam atau sesi berikutnya, cari sesi terdekat
        if (!activeSched) {
          activeSched = classSchedules.find(s => s.startTime > curClock) || classSchedules[0];
        }
      }

      if (!activeSched) {
        const isSunday = (targetDay === "Minggu");
        return {
          id: roomId,
          classId: cls,
          grade: grade,
          roomName: roomName,
          building: building,
          roomCode: `KLS-${cls}`,
          scheduleId: `SCH-NONE-${cls}-${targetDay}`,
          scheduleTime: isSunday ? "Libur Akhir Pekan (Minggu)" : "Tidak ada jadwal KBM",
          startTime: "-",
          endTime: "-",
          periodStart: 0,
          periodEnd: 0,
          jamKe: isSunday ? "Libur" : "-",
          day: targetDay,
          subject: isSunday ? "Libur Akhir Pekan (Hari Minggu)" : "Tidak ada kegiatan KBM",
          teacherId: "-",
          teacherName: isSunday ? "Libur Akhir Pekan (KBM Tutup)" : "Tidak Ada Jadwal",
          teacherPhone: "",
          status: isSunday ? "libur" : "selesai",
          statusLabel: isSunday ? "Libur Akhir Pekan (Minggu)" : "Tidak Ada KBM",
          statusClass: isSunday ? "status-holiday" : "status-finished",
          checkInTime: null,
          punctuality: isSunday ? "Libur Akhir Pekan" : null,
          studentsTotal: 32,
          studentsPresent: isSunday ? 0 : 32,
          topic: isSunday ? "Hari libur akhir pekan resmi madrasah. Seluruh rombel standby terpantau server." : "Tidak ada pembelajaran tatap muka terjadwal",
          alertMinutes: 0,
          note: isSunday ? `Hari Minggu terpantau real-time sesuai kalender server madrasah (Libur Akhir Pekan).` : `Tidak ada sesi KBM untuk ${cls} pada ${targetDay}.`,
          allDaySessions: classSchedules
        };
      }

      const teacherObj = teachers.find(t => t.id === activeSched.teacherId) || {};
      const subCode = (activeSched.subject || "").replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
      const roomCode = `KLS-${cls}-${subCode}`;

      // Live state key for this room & schedule
      const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const stateKeyBySched = `${roomId}_${activeSched.id}`;
      const stateKeyByDay = `${roomId}_${targetDay}`;
      const rawRoomState = liveState[stateKeyBySched] || liveState[stateKeyByDay] || {};
      const savedRoomState = (!rawRoomState.date || rawRoomState.date === curDateStr) ? rawRoomState : {};

      // Check if actual check-in occurred for this session
      const checkInRec = checkIns[activeSched.id] || (savedRoomState.checkInTime ? savedRoomState : null);

      let status = "hadir_tepat";
      let statusLabel = "Hadir Tepat Waktu";
      let statusClass = "status-on-time";
      let checkInTime = `${activeSched.startTime} WIB`;
      let punctuality = "Tepat Waktu";
      let alertMinutes = 0;
      let note = "Guru aktif mengajar di kelas. KBM kondusif.";
      let invalTeacher = savedRoomState.invalTeacher || null;

      if (checkInRec && (checkInRec.time || checkInRec.checkInTime)) {
        const puncObj = (checkInRec.punctuality && typeof checkInRec.punctuality === "object") ? checkInRec.punctuality : null;
        const isLate = puncObj ? Boolean(puncObj.isLate) : Boolean(checkInRec.isLate);
        checkInTime = checkInRec.time || checkInRec.checkInTime;
        punctuality = puncObj ? (puncObj.detail || puncObj.statusLabel || (isLate ? "Terlambat" : "Tepat Waktu")) : (typeof checkInRec.punctuality === "string" ? checkInRec.punctuality : (isLate ? "Terlambat" : "Tepat Waktu"));

        if (checkInRec.finished) {
          status = "selesai";
          statusLabel = "KBM Selesai";
          statusClass = "status-finished";
          note = `Sesi KBM telah diselesaikan (Check-Out pukul ${checkInRec.checkOutTime || "-"}).`;
        } else {
          status = isLate ? "terlambat" : "hadir_tepat";
          statusLabel = (puncObj && puncObj.statusLabel) || checkInRec.statusLabel || (isLate ? "Hadir Terlambat" : "Hadir Tepat Waktu");
          statusClass = isLate ? "status-late" : "status-on-time";
          note = isLate
            ? `Guru hadir mengajar di kelas (${punctuality}).`
            : `Guru aktif mengajar di kelas tepat waktu (Check-In ${checkInTime}).`;
        }
      } else if (savedRoomState.status) {
        status = savedRoomState.status;
        statusLabel = savedRoomState.statusLabel;
        statusClass = savedRoomState.statusClass;
        checkInTime = savedRoomState.checkInTime;
        punctuality = typeof savedRoomState.punctuality === "object" && savedRoomState.punctuality
          ? (savedRoomState.punctuality.detail || savedRoomState.punctuality.statusLabel || "Tepat Waktu")
          : (savedRoomState.punctuality || "-");
        alertMinutes = savedRoomState.alertMinutes || 0;
        note = savedRoomState.note || note;
      } else {
        // Evaluasi kehadiran real-time jika hari ini dan jam KBM telah berjalan
        let alertMins = 0;
        if (isToday && activeSched.startTime && curClock > activeSched.startTime) {
          const [sh, sm] = activeSched.startTime.split(":").map(Number);
          const [ch, cm] = curClock.split(":").map(Number);
          alertMins = Math.max(0, (ch * 60 + cm) - (sh * 60 + sm));
        }

        if (alertMins > 15) {
          status = "kosong_kritis";
          statusLabel = `KOSONG DARURAT (+${alertMins} Mnt)`;
          statusClass = "status-critical";
          note = `Kelas kosong darurat! Guru belum hadir setelah ${alertMins} menit jam KBM dimulai. Segera kirim guru inval.`;
        } else if (alertMins > 5) {
          status = "terlambat";
          statusLabel = `Belum Hadir (+${alertMins} Mnt)`;
          statusClass = "status-late";
          note = `Guru belum check-in masuk kelas (terlambat ${alertMins} menit).`;
        } else {
          status = "menunggu_guru";
          statusLabel = "Belum Check-In";
          statusClass = "status-waiting";
          note = "Menunggu guru pengampu melakukan check-in kelas.";
        }
        checkInTime = null;
        punctuality = "-";
        alertMinutes = alertMins;
      }

      const jamStr = activeSched.periodStart === activeSched.periodEnd ? `Jam ${activeSched.periodStart}` : `Jam ${activeSched.periodStart}-${activeSched.periodEnd}`;

      return {
        id: roomId,
        classId: cls,
        grade: grade,
        roomName: roomName,
        building: building,
        roomCode: roomCode,
        scheduleId: activeSched.id,
        scheduleTime: `${activeSched.startTime} - ${activeSched.endTime} WIB (${jamStr})`,
        startTime: activeSched.startTime,
        endTime: activeSched.endTime,
        periodStart: activeSched.periodStart,
        periodEnd: activeSched.periodEnd,
        jamKe: jamStr,
        day: activeSched.day,
        subject: activeSched.subject,
        teacherId: activeSched.teacherId,
        teacherName: activeSched.teacherName,
        invalTeacher: invalTeacher,
        teacherPhone: teacherObj.phone || "",
        status: status,
        statusLabel: statusLabel,
        statusClass: statusClass,
        checkInTime: checkInTime,
        punctuality: punctuality,
        studentsTotal: 32,
        studentsPresent: 32,
        topic: `Pembelajaran Tatap Muka ${activeSched.subject} Kelas ${cls}`,
        alertMinutes: alertMinutes,
        note: note,
        allDaySessions: classSchedules
      };
    });

    return rooms;
  },
  saveRoomsMonitoring(data) {
    localStorage.setItem("hadir_guru_rooms_monitoring", JSON.stringify(data));
  },
  saveRoomState(roomId, day, stateObj, scheduleId = null) {
    let liveState = {};
    try {
      const stored = localStorage.getItem("hadir_guru_rooms_monitoring_state");
      if (stored) liveState = JSON.parse(stored) || {};
    } catch(e) {}
    const now = new Date();
    const curDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const enrichedState = {
      ...stateObj,
      date: curDateStr
    };
    const stateKey = `${roomId}_${day}`;
    liveState[stateKey] = {
      ...(liveState[stateKey] || {}),
      ...enrichedState
    };
    const targetSchedId = scheduleId || (stateObj && stateObj.scheduleId);
    if (targetSchedId) {
      const schedKey = `${roomId}_${targetSchedId}`;
      liveState[schedKey] = {
        ...(liveState[schedKey] || {}),
        ...enrichedState
      };
    }
    localStorage.setItem("hadir_guru_rooms_monitoring_state", JSON.stringify(liveState));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("rooms_state", liveState);
    }
  },
  resetRoomMonitoringState() {
    localStorage.removeItem("hadir_guru_rooms_monitoring");
    localStorage.removeItem("hadir_guru_rooms_monitoring_state");
    localStorage.removeItem("hadir_guru_class_checkins");
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("rooms_state", {});
      FirebaseService.pushSyncState("class_checkins", {});
    }
  },
  getAdminActivityFeed() {
    const stored = localStorage.getItem("hadir_guru_admin_feed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_ADMIN_ACTIVITY_FEED;
  },
  saveAdminActivityFeed(data) {
    localStorage.setItem("hadir_guru_admin_feed", JSON.stringify(data));
    if (typeof FirebaseService !== "undefined" && !FirebaseService.isApplyingCloud()) {
      FirebaseService.pushSyncState("admin_feed", data);
    }
  },
  addAdminActivity(text, type = "info") {
    const feed = this.getAdminActivityFeed();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
    const newEntry = {
      id: "LOG-" + Date.now(),
      time: timeStr,
      text: text,
      type: type
    };
    feed.unshift(newEntry);
    if (feed.length > 25) feed.pop();
    this.saveAdminActivityFeed(feed);
    return newEntry;
  },
  addAdminActivityFeed(text, type = "info") {
    return this.addAdminActivity(text, type);
  },

  // Helper untuk evaluasi ketepatan waktu masuk kelas
  evaluateClassPunctuality(scheduleStartTimeStr, actualDate = new Date()) {
    const [schedH, schedM] = scheduleStartTimeStr.split(":").map(Number);
    const schedTime = new Date(actualDate);
    schedTime.setHours(schedH, schedM, 0, 0);

    const diffMs = actualDate.getTime() - schedTime.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes <= 0) {
      const earlyM = Math.abs(diffMinutes);
      return {
        isLate: false,
        statusLabel: "Tepat Waktu",
        statusClass: "status-on-time",
        detail: earlyM === 0 ? "Tepat Waktu di Jam Mulai" : `Tepat Waktu (${earlyM} mnt lebih awal)`,
        diffMinutes: diffMinutes
      };
    } else if (diffMinutes <= 5) {
      return {
        isLate: false,
        statusLabel: "Tepat Waktu (Toleransi 5 mnt)",
        statusClass: "status-on-time",
        detail: `Hadir dalam batas toleransi (${diffMinutes} mnt setelah bel)`,
        diffMinutes: diffMinutes
      };
    } else {
      return {
        isLate: true,
        statusLabel: `Terlambat ${diffMinutes} Menit`,
        statusClass: "status-late",
        detail: `Terlambat ${diffMinutes} menit dari jadwal masuk (${scheduleStartTimeStr} WIB)`,
        diffMinutes: diffMinutes
      };
    }
  },

  clearAllAdminHistory() {
    localStorage.removeItem("hadir_guru_all_teachers");
    localStorage.removeItem("hadir_guru_leaves");
    localStorage.removeItem("hadir_guru_teaching_logs");
    localStorage.removeItem("hadir_guru_class_checkins");
    localStorage.removeItem("hadir_guru_rooms_monitoring");
    localStorage.removeItem("hadir_guru_rooms_monitoring_state");
    localStorage.removeItem("hadir_guru_admin_feed");
  },

  resetAll() {
    localStorage.removeItem("hadir_guru_today");
    localStorage.removeItem("hadir_guru_history");
    localStorage.removeItem("hadir_guru_leaves");
    localStorage.removeItem("hadir_guru_teaching_logs");
    localStorage.removeItem("hadir_guru_class_checkins");
    localStorage.removeItem("hadir_guru_rooms_monitoring");
    localStorage.removeItem("hadir_guru_rooms_monitoring_state");
    localStorage.removeItem("hadir_guru_admin_feed");
    localStorage.removeItem("hadir_guru_school_config");
    localStorage.removeItem("hadir_guru_profile");
    localStorage.removeItem("hadir_guru_all_teachers");
    localStorage.removeItem("hadir_guru_teachers_60");
    localStorage.removeItem("hadir_guru_master_schedules");
    localStorage.removeItem("hadir_guru_welcoming_picket");
    localStorage.removeItem("hadir_guru_welcoming_picket_v2");
    localStorage.removeItem("hadir_guru_active_teacher_id");
    localStorage.removeItem("hadir_guru_holidays");
    location.reload();
  }
};

window.StorageService = StorageService;
if (typeof KALDIK_JATENG_HOLIDAYS !== "undefined") window.KALDIK_JATENG_HOLIDAYS = KALDIK_JATENG_HOLIDAYS;
if (typeof TEACHING_SCHEDULES !== "undefined") window.TEACHING_SCHEDULES = TEACHING_SCHEDULES;
if (typeof INITIAL_ROOMS_MONITORING !== "undefined") window.INITIAL_ROOMS_MONITORING = INITIAL_ROOMS_MONITORING;
if (typeof CLASSES_LIST !== "undefined") window.CLASSES_LIST = CLASSES_LIST;
if (typeof ROOMS_LIST !== "undefined") window.ROOMS_LIST = ROOMS_LIST;

// Initial in-memory sync on script load
try {
  StorageService.syncActiveTeachingSchedules();
} catch (e) {
  // Ignored if executed before TEACHING_SCHEDULES declared
}

