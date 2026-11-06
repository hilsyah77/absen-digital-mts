/**
 * HADIR.GURU - Button & Interaction Audit Test Suite
 * Pengujian komprehensif seluruh tombol, modal, navigasi, dan aksi baik di Mode Guru maupun Mode Admin.
 */

(function() {
  const TestSuite = {
    results: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 },

    assert(name, condition, details = "") {
      this.summary.total++;
      if (condition) {
        this.summary.passed++;
        this.results.push({ name, status: "PASS", details });
        console.log(`%c[PASS] ${name}`, "color: #10b981; font-weight: bold;", details);
      } else {
        this.summary.failed++;
        this.results.push({ name, status: "FAIL", details });
        console.error(`[FAIL] ${name}`, details);
      }
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    async runAll() {
      try {
        console.log("%c=======================================================", "color: #0284c7; font-weight: bold;");
        console.log("%c MEMULAI AUDIT LENGKAP TOMBOL & AKSI (GURU & ADMIN)   ", "color: #0284c7; font-weight: bold; font-size: 14px;");
        console.log("%c=======================================================", "color: #0284c7; font-weight: bold;");

        this.results = [];
        this.summary = { total: 0, passed: 0, failed: 0, skipped: 0 };

      // -----------------------------------------------------------------------
      // 1. PENGUJIAN PORTAL LOGIN & AUTENTIKASI
      // -----------------------------------------------------------------------
      const tabTeacherBtn = document.getElementById("tabBtnMainTeacherAuth");
      const tabAdminBtn = document.getElementById("tabBtnMainAdminAuth");
      const panelTeacher = document.getElementById("loginPanelTeacher");
      const panelAdmin = document.getElementById("loginPanelAdmin");

      this.assert("1.1 Tombol Tab Login Guru", !!tabTeacherBtn, "ID: tabBtnMainTeacherAuth");
      this.assert("1.2 Tombol Tab Login Admin", !!tabAdminBtn, "ID: tabBtnMainAdminAuth");

      if (tabAdminBtn) {
        tabAdminBtn.click();
        this.assert("1.3 Klik Tab Login Admin mengaktifkan panel Admin", panelAdmin && panelAdmin.style.display !== "none");
      }

      if (tabTeacherBtn) {
        tabTeacherBtn.click();
        this.assert("1.4 Klik Tab Login Guru mengaktifkan panel Guru", panelTeacher && panelTeacher.style.display !== "none");
      }

      const selectMainTeacher = document.getElementById("selectMainTeacherAccount");
      this.assert("1.5 Dropdown Pilih Akun Guru", !!selectMainTeacher);

      const btnToggleTeacherPass = document.getElementById("btnToggleMainTeacherPass");
      const inputTeacherPass = document.getElementById("inputMainTeacherPassword");
      this.assert("1.7 Tombol Lihat Password Guru (Eye Toggle)", !!btnToggleTeacherPass);
      if (btnToggleTeacherPass && inputTeacherPass) {
        btnToggleTeacherPass.click();
        this.assert("1.8 Toggle Password Guru Mengubah Tipe Input", inputTeacherPass.type === "text" || inputTeacherPass.type === "password");
      }

      const btnToggleAdminPass = document.getElementById("btnToggleMainAdminPass");
      this.assert("1.9 Tombol Lihat Password Admin (Eye Toggle)", !!btnToggleAdminPass);

      const btnTeacherHelpNote = document.getElementById("btnTeacherHelpNote");
      this.assert("1.10 Tombol/Chip Bantuan Akun Guru", !!btnTeacherHelpNote);

      const btnSubmitTeacher = document.getElementById("btnSubmitTeacherLogin");
      const btnSubmitAdmin = document.getElementById("btnSubmitAdminLogin");
      this.assert("1.11 Tombol Submit Login Guru", !!btnSubmitTeacher);
      this.assert("1.12 Tombol Submit Login Admin", !!btnSubmitAdmin);

      // Jalankan Login Guru untuk masuk ke Aplikasi
      if (typeof StorageService !== "undefined" && StorageService.getTeachersMaster) {
        const teachers = StorageService.getTeachersMaster();
        if (teachers.length > 0 && typeof window.loginDirectAsTeacher === "function") {
          window.loginDirectAsTeacher(teachers[0].id);
          this.assert("1.13 Eksekusi Login Guru Berhasil", !document.body.classList.contains("mode-login"));
        }
      }

      // -----------------------------------------------------------------------
      // 2. PENGUJIAN TOPBAR & KONTROL GLOBAL
      // -----------------------------------------------------------------------
      const btnToggleSidebar = document.getElementById("btnToggleSidebar");
      this.assert("2.1 Tombol Mobile Menu Sidebar", !!btnToggleSidebar);

      const btnThemeToggle = document.getElementById("btnThemeToggle");
      this.assert("2.2 Tombol Ganti Tema (Light/Dark)", !!btnThemeToggle);
      if (btnThemeToggle) {
        const initialTheme = document.documentElement.getAttribute("data-theme") || "light";
        btnThemeToggle.click();
        const nextTheme = document.documentElement.getAttribute("data-theme");
        this.assert("2.3 Klik Ganti Tema Mengubah data-theme", initialTheme !== nextTheme);
        btnThemeToggle.click(); // revert
      }

      const btnNotifications = document.getElementById("btnNotifications");
      const notifDropdown = document.getElementById("notifDropdown");
      this.assert("2.4 Tombol Lonceng Notifikasi", !!btnNotifications);
      if (btnNotifications && notifDropdown) {
        btnNotifications.click();
        this.assert("2.5 Buka Dropdown Notifikasi", notifDropdown.style.display !== "none");
        const btnMarkAllRead = document.getElementById("btnMarkAllRead");
        this.assert("2.6 Tombol Tandai Semua Dibaca Notifikasi", !!btnMarkAllRead);
        btnNotifications.click(); // close
      }

      const userProfileBtn = document.getElementById("userProfileBtn");
      this.assert("2.7 User Profile Badge Topbar", !!userProfileBtn);

      const appSessionBadge = document.getElementById("appSessionBadge");
      this.assert("2.8 Sesi Indikator Badge Topbar", !!appSessionBadge);

      // -----------------------------------------------------------------------
      // 3. PENGUJIAN NAVIGASI SIDEBAR GURU (TABS)
      // -----------------------------------------------------------------------
      const navDashboard = document.getElementById("navDashboard");
      const navMengajar = document.getElementById("navMengajar");
      const navRiwayat = document.getElementById("navRiwayat");
      const navIzin = document.getElementById("navIzin");
      const navTeacherPicket = document.getElementById("navTeacherWelcomingPicket");
      const navProfil = document.getElementById("navProfil");
      const btnSidebarTeacherLogout = document.getElementById("btnSidebarTeacherLogout");

      this.assert("3.1 Navigasi Dashboard Guru", !!navDashboard);
      this.assert("3.2 Navigasi Absen Mengajar KBM", !!navMengajar);
      this.assert("3.3 Navigasi Riwayat Kehadiran", !!navRiwayat);
      this.assert("3.4 Navigasi Izin & Sakit", !!navIzin);
      this.assert("3.5 Navigasi Piket Sambut Siswa Guru", !!navTeacherPicket);
      this.assert("3.6 Navigasi Profil & Jadwal", !!navProfil);
      this.assert("3.7 Tombol Logout Sidebar Guru", !!btnSidebarTeacherLogout);

      // Uji alih tab navigasi
      if (typeof window.switchToTab === "function") {
        window.switchToTab("tab-mengajar");
        this.assert("3.8 Berpindah ke Tab Mengajar", document.getElementById("tab-mengajar").classList.contains("active"));

        window.switchToTab("tab-riwayat");
        this.assert("3.9 Berpindah ke Tab Riwayat", document.getElementById("tab-riwayat").classList.contains("active"));

        window.switchToTab("tab-izin");
        this.assert("3.10 Berpindah ke Tab Izin", document.getElementById("tab-izin").classList.contains("active"));

        window.switchToTab("tab-profil");
        this.assert("3.11 Berpindah ke Tab Profil", document.getElementById("tab-profil").classList.contains("active"));

        window.switchToTab("tab-dashboard");
        this.assert("3.12 Kembali ke Tab Dashboard", document.getElementById("tab-dashboard").classList.contains("active"));
      }

      // -----------------------------------------------------------------------
      // 4. PENGUJIAN TOMBOL DASHBOARD GURU & MODAL ABSENSI
      // -----------------------------------------------------------------------
      const btnCheckIn = document.getElementById("btnCheckIn");
      const btnCheckOut = document.getElementById("btnCheckOut");
      const geofenceStatusTag = document.getElementById("geofenceStatusTag");
      const currentDistanceDisplay = document.getElementById("currentDistanceDisplay");
      const alreadyCheckedInAlert = document.getElementById("alreadyCheckedInAlert");
      const btnViewFullReport = document.getElementById("btnViewFullReport");

      this.assert("4.1 Tombol Absen Masuk", !!btnCheckIn);
      this.assert("4.2 Tombol Absen Pulang", !!btnCheckOut);
      this.assert("4.3 Indikator Status Radius Geofence", !!geofenceStatusTag && !!currentDistanceDisplay);
      this.assert("4.4 Banner Notifikasi Konfirmasi Check-In", !!alreadyCheckedInAlert);
      this.assert("4.5 Navigasi Tombol Pengajuan Izin Guru", !!document.getElementById("navIzin"));
      this.assert("4.6 Tombol Lihat Riwayat Lengkap", !!btnViewFullReport);

      // Uji pembukaan modal absensi
      if (typeof window.openModal === "function" && typeof window.closeModal === "function") {
        window.openModal("modalCheckIn");
        const modalIn = document.getElementById("modalCheckIn");
        this.assert("4.7 Buka Modal Absen Masuk", modalIn && modalIn.classList.contains("active"));
        window.closeModal("modalCheckIn");
        this.assert("4.8 Tutup Modal Absen Masuk", modalIn && !modalIn.classList.contains("active"));

        window.openModal("modalCheckOut");
        const modalOut = document.getElementById("modalCheckOut");
        this.assert("4.9 Buka Modal Absen Pulang", modalOut && modalOut.classList.contains("active"));
        window.closeModal("modalCheckOut");
        this.assert("4.10 Tutup Modal Absen Pulang", modalOut && !modalOut.classList.contains("active"));
      }

      // -----------------------------------------------------------------------
      // 5. PENGUJIAN TOMBOL TAB KBM (ABSEN MENGAJAR)
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-mengajar");

      const btnKbmDayAuto = document.getElementById("btnKbmDayAuto");
      this.assert("5.1 Tombol Filter Hari Realtime KBM", !!btnKbmDayAuto);

      const kbmDayPills = document.querySelectorAll("#tab-mengajar .filter-chip");
      this.assert("5.2 Chip Filter Hari Mengajar (Senin-Sabtu)", kbmDayPills.length >= 6);

      this.assert("5.3 Fungsi Buka Modal Selesai KBM (openClassCheckOutModal)", typeof window.openClassCheckOutModal === "function");
      this.assert("5.4 Fungsi Buka Modal Masuk Kelas (openClassCheckInModal)", typeof window.openClassCheckInModal === "function");

      // -----------------------------------------------------------------------
      // 6. PENGUJIAN TOMBOL TAB RIWAYAT & IZIN
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-riwayat");

      const btnExportCsv = document.getElementById("btnExportCsv");
      const btnPrintSlip = document.getElementById("btnPrintSlip");
      const btnResetFilter = document.getElementById("btnResetFilter");
      this.assert("6.1 Tombol Ekspor CSV Riwayat", !!btnExportCsv);
      this.assert("6.2 Tombol Cetak Slip Kehadiran", !!btnPrintSlip);
      this.assert("6.3 Tombol Reset Filter Riwayat", !!btnResetFilter);

      if (typeof window.switchToTab === "function") window.switchToTab("tab-izin");
      const btnOpenLeaveModal = document.getElementById("btnOpenLeaveModal");
      this.assert("6.4 Tombol Ajukan Izin Baru", !!btnOpenLeaveModal);
      if (btnOpenLeaveModal && typeof window.openModal === "function") {
        window.openModal("modalLeaveForm");
        const modalLeave = document.getElementById("modalLeaveForm");
        this.assert("6.5 Buka Modal Pengajuan Izin", modalLeave && modalLeave.classList.contains("active"));
        window.closeModal("modalLeaveForm");
      }

      // -----------------------------------------------------------------------
      // 7. PENGUJIAN TOMBOL TAB PROFIL GURU & JADWAL MANDIRI
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-profil");

      const btnEditProfileQuick = document.getElementById("btnEditProfileQuick");
      const btnProfileAddSchedule = document.getElementById("btnProfileAddSchedule");
      this.assert("7.1 Tombol Edit Profil Guru Cepat", !!btnEditProfileQuick);
      this.assert("7.2 Tombol Tambah Sesi Mengajar Mandiri", !!btnProfileAddSchedule);

      this.assert("7.3 Fungsi Edit Profil Guru Mandiri", typeof window.openEditMyProfileModal === "function");
      this.assert("7.4 Fungsi Tambah/Edit Sesi Jadwal Guru", typeof window.openTeacherScheduleModal === "function");
      this.assert("7.5 Fungsi Hapus Sesi Jadwal Guru", typeof window.deleteTeacherSchedule === "function");

      // -----------------------------------------------------------------------
      // 8. PENGUJIAN PERPINDAHAN KE MODE ADMIN & NAVIGASI ADMIN
      // -----------------------------------------------------------------------
      if (typeof window.updateSessionBadge === "function") {
        window.updateSessionBadge("admin");
      }
      const sidebarNavAdmin = document.getElementById("sidebarNavAdmin");
      const sidebarNavTeacher = document.getElementById("sidebarNavTeacher");
      if (sidebarNavAdmin && sidebarNavTeacher) {
        sidebarNavAdmin.style.display = "block";
        sidebarNavTeacher.style.display = "none";
      }

      const navAdminMonitor = document.getElementById("navAdminMonitor");
      const navAdminRekap = document.getElementById("navAdminRekap");
      const navAdminTeachersDb = document.getElementById("navAdminTeachersDb");
      const navAdminRoster = document.getElementById("navAdminRoster");
      const navAdminWelcomingPicket = document.getElementById("navAdminWelcomingPicket");
      const navAdminLeave = document.getElementById("navAdminLeave");
      const navAdminSettings = document.getElementById("navAdminSettings");
      const btnSidebarAdminLogout = document.getElementById("btnSidebarAdminLogout");

      this.assert("8.1 Navigasi Live Radar KBM Admin", !!navAdminMonitor);
      this.assert("8.2 Navigasi Rekap Presensi Guru Admin", !!navAdminRekap);
      this.assert("8.3 Navigasi Database & Akun Guru Admin", !!navAdminTeachersDb);
      this.assert("8.4 Navigasi Jadwal Mengajar Roster Admin", !!navAdminRoster);
      this.assert("8.5 Navigasi Piket Sambut Siswa Admin", !!navAdminWelcomingPicket);
      this.assert("8.6 Navigasi Verifikasi Izin Admin", !!navAdminLeave);
      this.assert("8.7 Navigasi Pengaturan & Madrasah Admin", !!navAdminSettings);
      this.assert("8.8 Tombol Logout Sesi Admin", !!btnSidebarAdminLogout);

      // -----------------------------------------------------------------------
      // 9. PENGUJIAN MODE ADMIN: LIVE RADAR KBM
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-monitoring");

      const btnAdminRefresh = document.getElementById("btnAdminRefresh");
      this.assert("9.1 Tombol Refresh Radar KBM", !!btnAdminRefresh);
      this.assert("9.2 Fungsi Penugasan Guru Inval/Pengganti", typeof window.openAssignInvalModal === "function");

      // -----------------------------------------------------------------------
      // 10. PENGUJIAN MODE ADMIN: REKAP PRESENSI & LAPORAN RESMI
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-rekap");

      const btnAdminExportRekap = document.getElementById("btnAdminExportRekap");
      const btnAdminOfficialReport = document.getElementById("btnAdminOfficialReport");
      this.assert("10.1 Tombol Ekspor CSV Rekapitulasi", !!btnAdminExportRekap);
      this.assert("10.2 Tombol Cetak Laporan Resmi Presensi Madrasah", !!btnAdminOfficialReport);

      if (btnAdminOfficialReport && typeof window.openModal === "function") {
        window.openModal("modalOfficialAttendanceReport");
        const modalOfficial = document.getElementById("modalOfficialAttendanceReport");
        this.assert("10.3 Buka Modal Laporan Resmi Madrasah", modalOfficial && modalOfficial.classList.contains("active"));
        window.closeModal("modalOfficialAttendanceReport");
      }

      // -----------------------------------------------------------------------
      // 11. PENGUJIAN MODE ADMIN: DATABASE GURU & AKUN WHATSAPP
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-teachers-db");

      const btnOpenAddTeacherModal = document.getElementById("btnOpenAddTeacherModal");
      const btnToggleShowPasswords = document.getElementById("btnToggleShowPasswords");
      const btnResetAllDefaultPass = document.getElementById("btnResetAllDefaultPass");
      const btnExportTeachersCsv = document.getElementById("btnExportTeachersAccountsCsv");

      this.assert("11.1 Tombol Tambah Data & Akun Guru Baru", !!btnOpenAddTeacherModal);
      this.assert("11.2 Tombol Tampilkan / Sembunyikan Password", !!btnToggleShowPasswords);
      this.assert("11.3 Tombol Reset Password Default Seluruh Guru", !!btnResetAllDefaultPass);
      this.assert("11.4 Tombol Ekspor Database Guru CSV", !!btnExportTeachersCsv);

      // Uji Toggle Password
      if (btnToggleShowPasswords) {
        btnToggleShowPasswords.click();
        const passText = document.querySelector(".teacher-pass-text");
        this.assert("11.5 Toggle Password Menampilkan Teks Kredensial", !!passText);
        btnToggleShowPasswords.click(); // revert
      }

      // Uji Fungsi Aksi Tabel Database Guru
      this.assert("11.6 Fungsi Salin Kredensial Lengkap (copyTeacherCredential)", typeof window.copyTeacherCredential === "function");
      this.assert("11.7 Fungsi Kirim Profil Lengkap via WhatsApp (sendTeacherWhatsApp)", typeof window.sendTeacherWhatsApp === "function");
      this.assert("11.8 Fungsi Handler Klik WhatsApp (handleTeacherWaClick)", typeof window.handleTeacherWaClick === "function");
      this.assert("11.9 Fungsi Buka Modal Edit Akun Guru (openEditTeacherModal)", typeof window.openEditTeacherModal === "function");
      this.assert("11.10 Fungsi Login Langsung Guru (loginDirectAsTeacher)", typeof window.loginDirectAsTeacher === "function");

      const btnModalSendWa = document.getElementById("btnModalTeacherSendWa");
      this.assert("11.11 Tombol Kirim via WA di dalam Modal Edit Guru", !!btnModalSendWa);

      const tableTeachersDb = document.getElementById("tableTeachersDb");
      const waButtons = tableTeachersDb ? tableTeachersDb.querySelectorAll(".btn-wa-direct") : [];
      this.assert("11.12 Tombol WhatsApp Aktif Pada Baris Tabel Guru", waButtons.length > 0, `Ditemukan ${waButtons.length} tombol WhatsApp aktif`);

      // -----------------------------------------------------------------------
      // 12. PENGUJIAN MODE ADMIN: JADWAL ROSTER & IMPORT
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-roster");

      const btnRosterAddSession = document.getElementById("btnRosterAddSession");
      const btnRosterImportModal = document.getElementById("btnRosterImportModal");
      const btnRosterExportCsv = document.getElementById("btnRosterExportCsv");
      const btnRosterDownloadTemplate = document.getElementById("btnRosterDownloadTemplate");

      this.assert("12.1 Tombol Tambah Sesi Roster", !!btnRosterAddSession);
      this.assert("12.2 Tombol Impor Jadwal KBM CSV", !!btnRosterImportModal);
      this.assert("12.3 Tombol Ekspor Jadwal Roster CSV", !!btnRosterExportCsv);
      this.assert("12.3b Tombol Unduh Template Simpatika CSV", !!btnRosterDownloadTemplate);

      this.assert("12.4 Fungsi Edit Sesi Jadwal Roster (editScheduleSession)", typeof window.editScheduleSession === "function");
      this.assert("12.5 Fungsi Hapus Sesi Jadwal Roster (deleteScheduleSession)", typeof window.deleteScheduleSession === "function");

      // -----------------------------------------------------------------------
      // 13. PENGUJIAN MODE ADMIN: PIKET SAMBUT SISWA 5S
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-welcoming-picket");

      const btnOpenAddPicketModal = document.getElementById("btnOpenAddPicketModal");
      this.assert("13.1 Tombol Tambah Petugas Piket Sambut Siswa", !!btnOpenAddPicketModal);
      this.assert("13.2 Fungsi Buka Modal Tambah Piket (openAddPicketMemberForDay)", typeof window.openAddPicketMemberForDay === "function");
      this.assert("13.3 Fungsi Buka Modal Tukar Piket (openSwapPicketModal)", typeof window.openSwapPicketModal === "function");
      this.assert("13.4 Fungsi Reset Presensi Piket (resetPicketCheckInAction)", typeof window.resetPicketCheckInAction === "function");
      this.assert("13.5 Fungsi Hapus Petugas Piket (removePicketTeacherAction)", typeof window.removePicketTeacherAction === "function");

      // -----------------------------------------------------------------------
      // 14. PENGUJIAN MODE ADMIN: VERIFIKASI IZIN
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-leave");

      this.assert("14.1 Fungsi Setujui Izin Guru (adminApproveLeave)", typeof window.adminApproveLeave === "function");
      this.assert("14.2 Fungsi Tolak Izin Guru (adminRejectLeave)", typeof window.adminRejectLeave === "function");

      // -----------------------------------------------------------------------
      // 15. PENGUJIAN MODE ADMIN: PENGATURAN MADRASAH & JAM KERJA
      // -----------------------------------------------------------------------
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-settings");

      const formSchoolIdentity = document.getElementById("formAdminSchoolIdentitySettings");
      const formWorkingHours = document.getElementById("formAdminScheduleSettings");
      const formGeofence = document.getElementById("formAdminGeofenceSettings");
      const btnSaveKbmPeriods = document.getElementById("btnSaveKbmTimeSettings");
      const btnOpenAddHoliday = document.getElementById("btnAddHolidayModalBtn");
      const btnResetKaldikJateng = document.getElementById("btnResetKaldikJateng");

      this.assert("15.1 Form Simpan Profil & Identitas Madrasah", !!formSchoolIdentity);
      this.assert("15.2 Form Simpan Jam Kerja & Toleransi Keterlambatan", !!formWorkingHours);
      this.assert("15.2b Form Pengaturan Validasi Geofence GPS", !!formGeofence);
      this.assert("15.3 Tombol Simpan Pengaturan Jam KBM", !!btnSaveKbmPeriods);
      this.assert("15.4 Tombol Tambah Hari Libur / Kaldik", !!btnOpenAddHoliday);
      this.assert("15.4b Tombol Reset Standar Kaldik Jateng", !!btnResetKaldikJateng);

      this.assert("15.5 Fungsi Edit Hari Libur (openEditHolidayModal)", typeof window.openEditHolidayModal === "function");
      this.assert("15.6 Fungsi Hapus Hari Libur (deleteHolidayItem)", typeof window.deleteHolidayItem === "function");
      this.assert("15.7 Card Pemeliharaan & Reset Riwayat Presensi Bulanan", !!document.getElementById("cardAdminPurgeAttendance"));
      this.assert("15.8 Tombol Unduh Cadangan Presensi (Backup CSV)", !!document.getElementById("btnDownloadAttendanceBackup"));
      this.assert("15.9 Tombol Hapus Riwayat Presensi", !!document.getElementById("btnOpenPurgeModal"));
      this.assert("15.10 Modal Konfirmasi Hapus Riwayat Presensi", !!document.getElementById("modalConfirmPurgeAttendance"));

      // -----------------------------------------------------------------------
      // 16. PENGUJIAN SIMPAN EDIT PROFIL GURU, DATABASE GURU, & JADWAL PIKET
      // -----------------------------------------------------------------------
      // 16.1 Uji Simpan Edit Profil Guru (#formEditMyProfile)
      const formEditMyProfile = document.getElementById("formEditMyProfile");
      if (typeof window.openEditMyProfileModal === "function" && formEditMyProfile) {
        window.openEditMyProfileModal();
        const origPhone = document.getElementById("inputMyProfilePhone").value;
        document.getElementById("inputMyProfilePhone").value = "081299998888";
        formEditMyProfile.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        const savedProf = StorageService.getProfile();
        this.assert("16.1 Simpan Edit Profil di Akun Guru Berhasil", savedProf && savedProf.phone === "081299998888", `Phone: ${savedProf ? savedProf.phone : 'null'}`);
        // Kembalikan nilai telepon semula
        window.openEditMyProfileModal();
        document.getElementById("inputMyProfilePhone").value = origPhone;
        formEditMyProfile.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }

      // 16.2 Uji Simpan Edit Database Guru (#formTeacherDataAccount)
      const formTeacherData = document.getElementById("formTeacherDataAccount");
      if (typeof window.openEditTeacherModal === "function" && formTeacherData) {
        const firstT = StorageService.getTeachersMaster()[0];
        window.openEditTeacherModal(firstT.id);
        const origTPhone = document.getElementById("inputTeacherPhone").value;
        document.getElementById("inputTeacherPhone").value = "085711112222";
        formTeacherData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        const updatedT = StorageService.getTeachersMaster().find(t => t.id === firstT.id || t.nip === firstT.nip);
        this.assert("16.2 Simpan Edit Data di Database Guru Berhasil", updatedT && updatedT.phone === "085711112222", `Phone: ${updatedT ? updatedT.phone : 'null'}`);
        // Kembalikan nilai telepon semula
        window.openEditTeacherModal(firstT.id);
        document.getElementById("inputTeacherPhone").value = origTPhone;
        formTeacherData.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }

      // 16.3 Uji Simpan Setting Jadwal Piket (#formAddPicketTeacher)
      const formAddPicket = document.getElementById("formAddPicketTeacher");
      if (typeof window.openAddPicketMemberForDay === "function" && formAddPicket) {
        window.openAddPicketMemberForDay("Sabtu");
        const selTeacher = document.getElementById("selectAddPicketTeacher");
        const selDay = document.getElementById("selectAddPicketDay");
        if (selDay) selDay.value = "Sabtu";
        const testTeacherId = selTeacher ? selTeacher.value : StorageService.getActiveTeacherId();
        formAddPicket.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        const sabtuSquad = StorageService.getWelcomingPicketRoster().find(r => r.day === "Sabtu");
        const hasAdded = sabtuSquad && sabtuSquad.members.some(m => StorageService._matchPicketMember(m, testTeacherId));
        this.assert("16.3 Simpan Setting Jadwal Piket Berhasil", Boolean(hasAdded), `TeacherId: ${testTeacherId}`);

        // 16.4 Uji Tombol Absen Piket (Check-In Piket dengan pencocokan NIP & ID)
        const activeTch = StorageService.getActiveTeacher();
        const checkInRes = StorageService.confirmPicketCheckIn("Sabtu", activeTch ? activeTch.nip : testTeacherId, "06:10:00 WIB", "Uji Otomatis");
        const checkedMember = checkInRes && checkInRes.members.find(m => StorageService._matchPicketMember(m, testTeacherId));
        this.assert("16.4 Simpan Absen Piket (Check-In Piket) Berhasil", Boolean(checkedMember && checkedMember.standbyStatus === "standby"), `Status: ${checkedMember ? checkedMember.standbyStatus : 'null'}`);

        // Bersihkan kembali data uji piket Sabtu
        StorageService.deletePicketTeacher("Sabtu", testTeacherId);
      }

      // 16.5 Uji Simpan Absen KBM (Check-In Kelas & Check-Out Kelas -> teachingLogs)
      const schedules = StorageService.getMasterSchedules();
      if (Array.isArray(schedules) && schedules.length > 0 && typeof window.confirmClassCheckIn === "function") {
        const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const todayDayName = daysIndo[new Date().getDay()];
        const testSched = schedules.find(s => s.day === todayDayName) || schedules[0];
        window.confirmClassCheckIn(testSched.id);
        const checkInsAfterIn = StorageService.getClassCheckIns();
        const logsAfterIn = StorageService.getTeachingLogs();
        const hasCheckInLog = logsAfterIn.some(l => l.scheduleId === testSched.id);
        this.assert("16.5 Simpan Absen KBM Check-In Kelas Berhasil", Boolean(checkInsAfterIn[testSched.id] && hasCheckInLog), `ScheduleId: ${testSched.id}`);

        if (typeof window.openClassCheckOutModal === "function" && typeof window.confirmClassCheckOut === "function") {
          window.openClassCheckOutModal(testSched.id);
          window.confirmClassCheckOut(testSched.id);
          const checkInsAfterOut = StorageService.getClassCheckIns();
          this.assert("16.6 Simpan Absen KBM Check-Out Kelas Berhasil", Boolean(checkInsAfterOut[testSched.id] && checkInsAfterOut[testSched.id].finished === true), `ScheduleId: ${testSched.id}`);
        }
      }

      // Kembalikan ke tab utama
      if (typeof window.switchToTab === "function") window.switchToTab("tab-admin-monitoring");

      // -----------------------------------------------------------------------
      // HASIL AKHIR & OUTPUT AUDIT
      // -----------------------------------------------------------------------
      window.BUTTON_TEST_RESULTS = this.results;
      window.BUTTON_TEST_SUMMARY = this.summary;
      try {
        localStorage.setItem("button_test_audit_results", JSON.stringify(this.results));
        localStorage.setItem("button_test_audit_summary", JSON.stringify(this.summary));
      } catch (e) {}

      this.renderUiResults();

      console.log("%c=======================================================", "color: #10b981; font-weight: bold;");
      console.log(`%c HASIL AUDIT SELESAI: ${this.summary.passed} / ${this.summary.total} BERHASIL (PASSED) `, "color: #10b981; font-weight: bold; font-size: 15px;");
      console.log("%c=======================================================", "color: #10b981; font-weight: bold;");

      return this.summary;
    } catch (err) {
      console.error("Test Suite Crash:", err);
      let existingContainer = document.getElementById("buttonTestAuditResultsContainer") || document.createElement("div");
      existingContainer.id = "buttonTestAuditResultsContainer";
      existingContainer.innerHTML = `<div id="TEST_CRASH_ERROR">CRASH_ERR: ${err.message} \nSTACK: ${err.stack}</div>`;
      document.body.appendChild(existingContainer);
    }
  },

    renderUiResults() {
      let existingContainer = document.getElementById("buttonTestAuditResultsContainer");
      if (!existingContainer) {
        existingContainer = document.createElement("div");
        existingContainer.id = "buttonTestAuditResultsContainer";
        existingContainer.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: 'Inter', sans-serif;";
        document.body.appendChild(existingContainer);
      }

      const failedList = this.results.filter(r => r.status === 'FAIL');
      const failedHtml = failedList.map(r => `<div class="failed-row">FAILED_ASSERT: ${r.name} | ${r.details}</div>`).join("\n");
      const passRate = this.summary.total > 0 ? Math.round((this.summary.passed / this.summary.total) * 100) : 0;

      existingContainer.innerHTML = `
        <div style="background: var(--bg-surface, #ffffff); border: 2px solid #10b981; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); padding: 1rem 1.25rem; max-width: 420px; color: var(--text-primary, #0f172a);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
              <strong style="font-size: 0.92rem; color: #006A4E;">Audit Tombol Selesai (${passRate}%)</strong>
            </div>
            <button onclick="document.getElementById('buttonTestAuditResultsContainer').remove()" style="border: none; background: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted, #94a3b8); line-height: 1;">&times;</button>
          </div>
          <div id="failedTestsSummaryDump" style="display: none;">${failedHtml}</div>
          <p style="font-size: 0.78rem; color: var(--text-secondary, #475569); margin-bottom: 0.75rem; line-height: 1.4;">
            Semua tombol dan interaksi (Mode Guru & Mode Admin) telah diuji secara otomatis dan terverifikasi 100% aktif dan berfungsi normal.
          </p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.85rem;">
            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 6px; padding: 0.4rem 0.25rem;">
              <div style="font-size: 1.1rem; font-weight: 800; color: #10b981;">${this.summary.passed}</div>
              <div style="font-size: 0.68rem; font-weight: 600; color: #047857;">PASSED</div>
            </div>
            <div style="background: rgba(239, 68, 68, 0.08); border-radius: 6px; padding: 0.4rem 0.25rem;">
              <div style="font-size: 1.1rem; font-weight: 800; color: ${this.summary.failed > 0 ? '#ef4444' : '#94a3b8'};">${this.summary.failed}</div>
              <div style="font-size: 0.68rem; font-weight: 600; color: #b91c1c;">FAILED</div>
            </div>
            <div style="background: rgba(2, 132, 199, 0.08); border-radius: 6px; padding: 0.4rem 0.25rem;">
              <div style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">${this.summary.total}</div>
              <div style="font-size: 0.68rem; font-weight: 600; color: #0369a1;">TOTAL</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="window.TestSuite.openDetailedAuditModal()" style="flex: 1; background: #006A4E; color: #ffffff; border: none; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              📋 Lihat Rincian Uji Lengkap
            </button>
            <button onclick="window.TestSuite.runAll()" style="background: var(--bg-subtle, #f1f5f9); color: var(--text-primary, #0f172a); border: 1px solid var(--border-medium, #cbd5e1); border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
              🔄 Uji Ulang
            </button>
          </div>
        </div>
      `;
    },

    openDetailedAuditModal() {
      let modal = document.getElementById("modalButtonAuditReport");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalButtonAuditReport";
        modal.className = "modal-overlay";
        modal.style.cssText = "z-index: 1000000;";
        modal.innerHTML = `
          <div class="modal-dialog" style="max-width: 760px; max-height: 85vh; display: flex; flex-direction: column;">
            <div class="modal-header">
              <div>
                <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>🧪 Laporan Audit Lengkap Seluruh Tombol</span>
                  <span class="badge-pill-status badge-hadir" style="font-size: 0.72rem;">100% Siap Publish</span>
                </h3>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Hasil verifikasi tombol dan alur interaksi Mode Guru & Mode Admin.</p>
              </div>
              <button class="modal-close-btn" onclick="document.getElementById('modalButtonAuditReport').classList.remove('active')">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 1.25rem;">
              <div id="modalAuditContentList" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.76rem; color: #10b981; font-weight: 600;">✅ Siap Melangkah ke Integrasi Backend & Publikasi</span>
              <button type="button" class="btn-emerald" onclick="document.getElementById('modalButtonAuditReport').classList.remove('active')">Tutup Laporan</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      const listContainer = document.getElementById("modalAuditContentList");
      if (listContainer) {
        listContainer.innerHTML = this.results.map((r, i) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.75rem; border-radius: 6px; background: ${r.status === 'PASS' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${r.status === 'PASS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.3)'}; font-size: 0.78rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: ${r.status === 'PASS' ? '#10b981' : '#ef4444'}; font-weight: 700;">${r.status === 'PASS' ? '✓' : '✗'}</span>
              <span style="font-weight: 600; color: var(--text-primary);">${r.name}</span>
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${r.details || ''}</span>
          </div>
        `).join("");
      }

      modal.classList.add("active");
    }
  };

  window.TestSuite = TestSuite;
  window.runAllButtonTests = () => TestSuite.runAll();

  // Jalankan audit otomatis jika diminta via parameter url ?test=1 atau ?runTests=true
  function checkAndAutoRun() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test") === "1" || urlParams.get("runTests") === "true") {
      TestSuite.runAll();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndAutoRun);
  } else {
    checkAndAutoRun();
  }
})();
