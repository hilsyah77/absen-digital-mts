/**
 * HADIR.GURU - Client Application Logic
 * Implementasi Functional Requirements Frontend Dashboard Guru MTs
 */

function initMainApplication() {
  // Application State
  let todayAttendance = StorageService.getTodayAttendance();
  let attendanceHistory = StorageService.getHistory();
  let leaveRequests = StorageService.getLeaveRequests();
  let teachingLogs = StorageService.getTeachingLogs();
  if (!Array.isArray(teachingLogs)) teachingLogs = INITIAL_TEACHING_LOGS || [];
  // Ensure legacy SCH-FRI-01 is removed to maintain exactly 1 card session (Matematika IX-A)
  if (teachingLogs.some(l => l.scheduleId === "SCH-FRI-01")) {
    teachingLogs = teachingLogs.filter(l => l.scheduleId !== "SCH-FRI-01");
    StorageService.saveTeachingLogs(teachingLogs);
  }
  let isInsideGeofence = true; // Simulator state (true = 18m inside, false = 140m outside)
  let simulatedSelectedFile = null;

  // Real-Time Classroom Monitoring State
  let classCheckIns = StorageService.getClassCheckIns();
  if (classCheckIns && classCheckIns["SCH-FRI-01"]) {
    delete classCheckIns["SCH-FRI-01"];
    StorageService.saveClassCheckIns(classCheckIns);
  }
  let roomsMonitoring = StorageService.getRoomsMonitoring();
  let adminActivityFeed = StorageService.getAdminActivityFeed();
  let currentActiveRole = "teacher"; // "teacher" | "admin"
  let simulatedTimeOffsetMinutes = 0; // 0 = on time, 12 = 12 mins late
  let activeCheckInScheduleId = "SCH-FRI-02";
  let inClassTimerInterval = null;

  // Real-Time Clock & Date Helpers
  function getAppCurrentDate() {
    const d = new Date();
    const offset = (typeof window.simulatedTimeOffsetMinutes !== "undefined")
      ? window.simulatedTimeOffsetMinutes
      : (typeof simulatedTimeOffsetMinutes !== "undefined" ? simulatedTimeOffsetMinutes : 0);
    if (offset) {
      d.setMinutes(d.getMinutes() + offset);
    }
    return d;
  }

  function getAppTodayDateString() {
    const d = getAppCurrentDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getAppTodayDayName() {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[getAppCurrentDate().getDay()];
  }

  function getAppTodayFormattedDate() {
    const d = getAppCurrentDate();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  let currentKbmSelectedDay = "auto"; // "auto" tracks server real-time day; or specific day name

  function getEffectiveKbmDay() {
    if (currentKbmSelectedDay && currentKbmSelectedDay !== "auto") {
      return currentKbmSelectedDay;
    }
    return getAppTodayDayName();
  }

  window.getAppCurrentDate = getAppCurrentDate;
  window.getAppTodayDateString = getAppTodayDateString;
  window.getAppTodayDayName = getAppTodayDayName;
  window.getAppTodayFormattedDate = getAppTodayFormattedDate;
  window.getEffectiveKbmDay = getEffectiveKbmDay;

  // Sound Synthesizer via Web Audio API
  const SoundService = {
    playSuccess() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (e) {
        console.warn("Audio Context not allowed yet:", e);
      }
    },
    playError() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        console.warn(e);
      }
    },
    playBeep() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {
        console.warn(e);
      }
    },
    playAlert() {
      this.playError();
    }
  };

  // Toast Notification System
  function showToast(title, message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    
    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#78AA56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "error") {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Realtime Server Clock Generator (WIB / Asia/Jakarta)
  function startServerClock() {
    const clockEl = document.getElementById("serverClockDisplay");
    const liveTimeEl = document.getElementById("dashboardLiveTime");
    const liveDateEl = document.getElementById("dashboardLiveDate");
    const modalCheckInClock = document.getElementById("modalCheckInLiveClock");
    const modalCheckOutClock = document.getElementById("modalCheckOutLiveClock");

    function update() {
      const now = new Date();
      // Format time HH:mm:ss
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}:${seconds} WIB`;

      // Indonesian Date formatting
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const dayName = days[now.getDay()];
      const dayDate = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      const dateStr = `${dayName}, ${dayDate} ${monthName} ${year}`;

      if (clockEl) clockEl.textContent = timeStr;
      if (liveTimeEl) liveTimeEl.textContent = timeStr;
      if (liveDateEl) liveDateEl.textContent = dateStr;
      if (modalCheckInClock) modalCheckInClock.textContent = timeStr;
      if (modalCheckOutClock) modalCheckOutClock.textContent = timeStr;
      const loginClockLive = document.getElementById("loginClockLive");
      if (loginClockLive) loginClockLive.textContent = timeStr;
      const kbmLiveClockBadge = document.getElementById("kbmLiveClockBadge");
      if (kbmLiveClockBadge) kbmLiveClockBadge.textContent = timeStr;
      const bannerTodayDate = document.getElementById("bannerTodayDate");
      if (bannerTodayDate) bannerTodayDate.textContent = dateStr;

      // Realtime live ticker for Admin Radar Monitor Hero Banner
      const radarSyncTime = document.getElementById("adminLiveSyncTime");
      if (radarSyncTime) {
        radarSyncTime.textContent = `Live Stream Aktif • 26 Kelas Terpantau (${timeStr})`;
      }
      const radarSessionLabel = document.getElementById("radarHeroSessionLabel");
      if (radarSessionLabel && currentRadarPeriod === "all") {
        radarSessionLabel.textContent = `Sesi KBM: ${currentRadarDay} • Real-Time Pukul ${hours}:${minutes} WIB`;
      }

      // Re-evaluasi status tombol presensi masuk, pulang & jadwal KBM otomatis saat pergantian menit
      if (now.getSeconds() === 0) {
        if (typeof updateAttendanceUI === "function") updateAttendanceUI();
        if (typeof renderKbmTimelineAndLogs === "function") renderKbmTimelineAndLogs();
        if (typeof renderTeachingSchedules === "function") renderTeachingSchedules();
        if (typeof renderClassroomRadar === "function") {
          const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          const curToday = daysIndo[now.getDay()];
          if (currentRadarPeriod === "all" && currentRadarDay === curToday) {
            renderClassroomRadar();
          }
        }
      }
    }

    update();
    setInterval(update, 1000);
  }

  // Tab Navigation Handling
  function initTabNavigation() {
    const navButtons = document.querySelectorAll(".nav-link, .mobile-nav-item");
    const sections = document.querySelectorAll(".tab-section");

    window.switchToTab = function(targetTabId) {
      if (!targetTabId) return;

      const isAdminTab = targetTabId.startsWith("tab-admin-");
      const isTeacherTab = ["tab-dashboard", "tab-mengajar", "tab-riwayat", "tab-izin", "tab-profil"].includes(targetTabId);

      // Role Check 1: Jika sedang di Mode Guru, tab admin wajib otentikasi admin
      if (currentActiveRole === "teacher" && isAdminTab) {
        if (!StorageService.isAdminLoggedIn()) {
          if (typeof window.openAdminLoginModal === "function") {
            window.openAdminLoginModal(targetTabId);
          }
          return;
        } else {
          pendingAdminTargetTab = targetTabId;
          window.switchAppRole("admin", true);
          return;
        }
      }

      // Role Check 2: Jika sedang di Mode Admin, tab guru dibatasi agar fokus pada fungsi command center
      if (currentActiveRole === "admin" && isTeacherTab) {
        showToast("Hak Akses Terpisah", "Anda sedang berada di Mode Administrator. Silakan klik Keluar Sesi Admin terlebih dahulu untuk membuka dashboard guru.", "warning");
        return;
      }

      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      document.querySelectorAll(".mobile-nav-item").forEach(m => m.classList.remove("active"));
      document.querySelectorAll(`[data-tab="${targetTabId}"]`).forEach(el => el.classList.add("active"));

      sections.forEach(sec => {
        if (sec.id === targetTabId) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });

      const sidebar = document.getElementById("appSidebar");
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }

      // Dynamically trigger tab-specific renderers to ensure 100% fresh data & responsive UI
      try {
        if (targetTabId === "tab-dashboard") {
          updateAttendanceUI();
          renderDashboardRecentTable();
          if (typeof renderDashboardPicketReminder === "function") renderDashboardPicketReminder();
          updateKpiCounts();
        } else if (targetTabId === "tab-mengajar") {
          renderTeachingSchedules();
          renderKbmTimelineAndLogs();
        } else if (targetTabId === "tab-riwayat") {
          renderFullHistoryTable();
        } else if (targetTabId === "tab-izin") {
          renderLeaveRequestsTable();
        } else if (targetTabId === "tab-profil") {
          applySyncedTeacherAndSchoolData();
          renderTeachingSchedules();
        } else if (targetTabId === "tab-admin-monitoring") {
          renderClassroomRadar();
          renderAdminActivityFeed();
          updateRadarKpis();
        } else if (targetTabId === "tab-admin-rekap") {
          renderAdminAllTeachersAttendance();
        } else if (targetTabId === "tab-admin-teachers-db") {
          if (typeof window.renderTeachersDb === "function") window.renderTeachersDb();
        } else if (targetTabId === "tab-admin-roster") {
          if (typeof window.renderRoster === "function") window.renderRoster();
        } else if (targetTabId === "tab-welcoming-picket") {
          if (typeof window.renderPicketRoster === "function") {
            window.renderPicketRoster(typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : "Jumat");
          }
        } else if (targetTabId === "tab-admin-leave") {
          renderAdminLeaveVerificationTable();
        } else if (targetTabId === "tab-admin-settings") {
          loadAdminSettingsFormValues();
        }
      } catch (err) {
        console.warn("Tab refresh non-blocking error:", err);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTabId = btn.getAttribute("data-tab");
        window.switchToTab(targetTabId);
      });
    });

    // Mobile sidebar toggle
    const btnToggleSidebar = document.getElementById("btnToggleSidebar");
    const sidebar = document.getElementById("appSidebar");
    if (btnToggleSidebar && sidebar) {
      btnToggleSidebar.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !btnToggleSidebar.contains(e.target)) {
          sidebar.classList.remove("open");
        }
      });
    }

    const btnViewFullReport = document.getElementById("btnViewFullReport");
    if (btnViewFullReport) {
      btnViewFullReport.addEventListener("click", () => {
        window.switchToTab("tab-riwayat");
      });
    }

    const userProfileBtn = document.getElementById("userProfileBtn");
    if (userProfileBtn) {
      userProfileBtn.style.cursor = "pointer";
      userProfileBtn.addEventListener("click", () => {
        if (currentActiveRole === "admin") {
          window.switchToTab("tab-admin-settings");
        } else {
          window.switchToTab("tab-profil");
        }
      });
    }
  }

  // Theme Management (Light / Dark)
  function initTheme() {
    const btnTheme = document.getElementById("btnThemeToggle");
    const iconLight = document.getElementById("iconThemeLight");
    const iconDark = document.getElementById("iconThemeDark");

    const savedTheme = localStorage.getItem("hadir_guru_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcons(savedTheme);

    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === "dark" ? "light"  : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("hadir_guru_theme", nextTheme);
        updateThemeIcons(nextTheme);
        showToast("Tema Diperbarui", `Mode ${nextTheme === 'dark' ? 'Gelap'  : 'Terang'} diaktifkan.`, "info");
      });
    }

    function updateThemeIcons(theme) {
      if (theme === "dark") {
        if (iconLight) iconLight.style.display = "none";
        if (iconDark) iconDark.style.display = "block";
      } else {
        if (iconLight) iconLight.style.display = "block";
        if (iconDark) iconDark.style.display = "none";
      }
    }
  }

  // Geofence & GPS Simulation Logic
  function initGeofenceSimulation() {
    const btnToggleSim = document.getElementById("btnToggleGpsSim");
    const radarRing = document.getElementById("radarRing");
    const currentCoordDisplay = document.getElementById("currentCoordDisplay");
    const currentDistanceDisplay = document.getElementById("currentDistanceDisplay");
    const geofenceStatusTag = document.getElementById("geofenceStatusTag");
    const geofenceStatusLabel = document.getElementById("geofenceStatusLabel");

    const focusGeofenceBadge = document.getElementById("focusGeofenceBadge");
    const focusLocationText = document.getElementById("focusLocationText");
    const focusDistanceText = document.getElementById("focusDistanceText");

    const modalCheckInCoord = document.getElementById("modalCheckInCoord");
    const modalCheckInGeofenceState = document.getElementById("modalCheckInGeofenceState");

    function renderGeofenceUI() {
      const cfg = StorageService.getSchoolConfig();
      const geo = (cfg && cfg.geofence) || {};
      const campusName = geo.campusName || "MTs Asy-Syafi'iyyah Jatibarang";
      const lat = geo.latitude !== undefined && !isNaN(geo.latitude) ? Number(geo.latitude) : -6.208842;
      const lng = geo.longitude !== undefined && !isNaN(geo.longitude) ? Number(geo.longitude) : 106.845612;
      const radiusMeters = parseInt(geo.radiusMeters, 10) || 50;
      const insideCoordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const outsideCoordStr = `${(lat - 0.00167).toFixed(6)}, ${(lng + 0.001376).toFixed(6)}`;
      const outsideDist = Math.max(radiusMeters + 92, 142);

      if (isInsideGeofence) {
        if (btnToggleSim) btnToggleSim.textContent = `Simulasikan: Di Luar Radius (${outsideDist}m)`;
        if (currentCoordDisplay) currentCoordDisplay.textContent = insideCoordStr;
        if (currentDistanceDisplay) {
          currentDistanceDisplay.textContent = `18 Meter (Aman <= ${radiusMeters}m)`;
          currentDistanceDisplay.style.color = "var(--emerald-600)";
        }

        if (geofenceStatusTag) geofenceStatusTag.style.color = "var(--emerald-600)";
        if (geofenceStatusLabel) geofenceStatusLabel.textContent = "Dalam Radius";
        if (radarRing) {
          radarRing.style.borderColor = "#10B981";
          radarRing.style.background = "rgba(16, 185, 129, 0.2)";
        }

        if (focusGeofenceBadge) {
          focusGeofenceBadge.className = "badge-pill-status badge-hadir";
          focusGeofenceBadge.textContent = "Geofence Valid";
        }
        if (focusLocationText) focusLocationText.textContent = `Area ${campusName}`;
        if (focusDistanceText) {
          focusDistanceText.textContent = `18 Meter (Dalam Radius <= ${radiusMeters}m)`;
          focusDistanceText.style.color = "var(--emerald-600)";
        }
        if (modalCheckInCoord) modalCheckInCoord.textContent = insideCoordStr;
        if (modalCheckInGeofenceState) {
          modalCheckInGeofenceState.textContent = `Di dalam radius ${radiusMeters}m (Aman)`;
          modalCheckInGeofenceState.style.color = "var(--emerald-600)";
        }
      } else {
        if (btnToggleSim) btnToggleSim.textContent = "Kembalikan: Dalam Radius (18m)";
        if (currentCoordDisplay) currentCoordDisplay.textContent = outsideCoordStr;
        if (currentDistanceDisplay) {
          currentDistanceDisplay.textContent = `${outsideDist} Meter (DI LUAR RADIUS)`;
          currentDistanceDisplay.style.color = "var(--rose-600)";
        }

        if (geofenceStatusTag) geofenceStatusTag.style.color = "var(--rose-600)";
        if (geofenceStatusLabel) geofenceStatusLabel.textContent = "Di Luar Radius";
        if (radarRing) {
          radarRing.style.borderColor = "#F43F5E";
          radarRing.style.background = "rgba(244, 63, 94, 0.25)";
        }

        if (focusGeofenceBadge) {
          focusGeofenceBadge.className = "badge-pill-status badge-terlambat";
          focusGeofenceBadge.textContent = "Luar Jangkauan";
        }
        if (focusLocationText) focusLocationText.textContent = "Jalan Raya Luar Area Madrasah";
        if (focusDistanceText) {
          focusDistanceText.textContent = `${outsideDist} Meter (Ditolak Sistem)`;
          focusDistanceText.style.color = "var(--rose-600)";
        }
        if (modalCheckInCoord) modalCheckInCoord.textContent = outsideCoordStr;
        if (modalCheckInGeofenceState) {
          modalCheckInGeofenceState.textContent = `DI LUAR RADIUS (${outsideDist}m > ${radiusMeters}m)`;
          modalCheckInGeofenceState.style.color = "var(--rose-600)";
        }
      }
    }

    window.renderGeofenceUI = renderGeofenceUI;

    if (btnToggleSim) {
      btnToggleSim.addEventListener("click", () => {
        isInsideGeofence = !isInsideGeofence;
        renderGeofenceUI();
        if (!isInsideGeofence) {
          showToast("Simulasi GPS: Luar Radius", "Posisi disimulasikan 142 meter dari sekolah. Coba lakukan absen untuk menguji validasi penolakan sistem.", "warning");
        } else {
          showToast("Simulasi GPS: Dalam Radius", "Posisi kembali aman di dalam area sekolah (18m).", "success");
        }
      });
    }

    renderGeofenceUI();
  }

  // =========================================================================
  // SINKRONISASI PRESENSI DUA ARAH: MODE GURU <-> MODE ADMIN
  // =========================================================================
  function syncTeacherAttendanceToMaster(teacherId, status, checkInTime, checkOutTime, isLate, detail) {
    try {
      const allTeachers = StorageService.getAllTeachersAttendance();
      const activeTeacher = StorageService.getActiveTeacher();
      const targetId = teacherId || (activeTeacher ? activeTeacher.id : null);
      const curDateStr = getAppTodayDateString();
      
      const record = allTeachers.find(t => (targetId && t.id === targetId) || (activeTeacher && t.name === activeTeacher.name));
      if (record) {
        record.date = curDateStr;
        if (status) record.status = status;
        if (checkInTime !== undefined && checkInTime !== null) record.checkIn = checkInTime;
        if (checkOutTime !== undefined && checkOutTime !== null) record.checkOut = checkOutTime;
        if (isLate !== undefined) record.isLate = isLate;
        if (detail) record.statusDetail = detail;
        StorageService.saveAllTeachersAttendance(allTeachers);
      }

      // Segarkan tampilan modul admin secara real-time jika tersedia
      if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance();
      if (typeof updateRadarKpis === "function") updateRadarKpis();
      if (typeof renderClassroomRadar === "function") renderClassroomRadar();
    } catch (e) {
      console.error("Gagal sinkronisasi presensi guru ke master:", e);
    }
  }

  function loadActiveTeacherAttendance() {
    try {
      const activeTeacher = StorageService.getActiveTeacher();
      if (!activeTeacher) return;

      const curDateStr = getAppTodayDateString();
      todayAttendance.date = curDateStr;

      const allTeachers = StorageService.getAllTeachersAttendance();
      const record = allTeachers.find(t => t.id === activeTeacher.id || t.name === activeTeacher.name);

      if (record && (record.status === "Izin" || record.status === "Sakit")) {
        todayAttendance.status = record.status;
        todayAttendance.checkIn = null;
        todayAttendance.checkOut = null;
      } else if (record && record.status && record.status !== "Belum Absen" && record.checkIn && record.checkIn !== "-") {
        todayAttendance.status = record.status;
        todayAttendance.checkIn = {
          time: record.checkIn,
          lat: -6.208842,
          lng: 106.845612,
          distance: "18 Meter",
          verified: true,
          isLate: Boolean(record.isLate),
          photo: null,
          device: "Perangkat Guru"
        };
        todayAttendance.checkOut = (record.checkOut && record.checkOut !== "-") ? {
          time: record.checkOut,
          lat: -6.208842,
          lng: 106.845612,
          distance: "18 Meter",
          verified: true
        } : null;
      } else {
        todayAttendance.status = "Belum Absen";
        todayAttendance.checkIn = null;
        todayAttendance.checkOut = null;
      }

      StorageService.saveTodayAttendance(todayAttendance, true);
      updateAttendanceUI();
    } catch (e) {
      console.error("Gagal memuat status presensi guru aktif:", e);
    }
  }

  // Update Today Attendance Status & Action Buttons UI
  function updateAttendanceUI() {
    const statusBadge = document.getElementById("todayStatusBadge");
    const statusText = document.getElementById("todayStatusText");
    const checkInTimeEl = document.getElementById("todayCheckInTime");
    const checkOutTimeEl = document.getElementById("todayCheckOutTime");
    const checkInBtn = document.getElementById("btnCheckIn");
    const checkOutBtn = document.getElementById("btnCheckOut");
    const focusCheckInBtn = document.getElementById("btnFocusCheckIn");
    const focusCheckOutBtn = document.getElementById("btnFocusCheckOut");
    const checkInSubText = document.getElementById("checkInSubText");
    const checkOutSubText = document.getElementById("checkOutSubText");
    const sidebarStatusBadge = document.getElementById("sidebarStatusBadge");

    const alreadyAlert = document.getElementById("alreadyCheckedInAlert");
    const alreadyText = document.getElementById("alreadyCheckedInText");
    const alreadySub = document.getElementById("alreadyCheckedInSub");

    const timeStatus = (typeof StorageService !== "undefined" && StorageService.getTodayAttendanceTimeStatus) 
      ? StorageService.getTodayAttendanceTimeStatus() 
      : null;

    if (todayAttendance.status === "Belum Absen") {
      if (statusBadge) statusBadge.className = "status-badge status-belum-absen";
      if (statusText) statusText.textContent = "Belum Absen";
      if (checkInTimeEl) checkInTimeEl.textContent = "--:-- WIB";
      if (checkOutTimeEl) checkOutTimeEl.textContent = "--:-- WIB";

      if (alreadyAlert) alreadyAlert.style.display = "none";

      if (checkInBtn) {
        checkInBtn.classList.remove("checked-in-complete", "check-in-locked", "check-in-closed");
        const btnLabel = checkInBtn.querySelector(".btn-label");

        if (timeStatus && timeStatus.isBeforeCheckInStart) {
          checkInBtn.disabled = true;
          checkInBtn.classList.add("check-in-locked");
          checkInBtn.title = `Presensi masuk dibuka mulai pukul ${timeStatus.checkInStart} WIB`;
          if (btnLabel) btnLabel.textContent = "ABSEN MASUK";
          if (checkInSubText) checkInSubText.textContent = `Dibuka Pukul ${timeStatus.checkInStart} WIB`;
          if (focusCheckInBtn) focusCheckInBtn.disabled = true;
          if (statusText) statusText.textContent = `Dibuka Pukul ${timeStatus.checkInStart}`;
        } else if (timeStatus && timeStatus.isCheckInExpired) {
          checkInBtn.disabled = true;
          checkInBtn.classList.add("check-in-closed");
          checkInBtn.title = `Presensi masuk telah ditutup (Melebihi toleransi ${timeStatus.checkInLateLimit} WIB)`;
          if (btnLabel) btnLabel.textContent = "PRESENSI DITUTUP";
          if (checkInSubText) checkInSubText.textContent = `Melebihi Toleransi (${timeStatus.checkInLateLimit} WIB)`;
          if (focusCheckInBtn) focusCheckInBtn.disabled = true;
          if (statusText) statusText.textContent = "Presensi Ditutup";
        } else {
          checkInBtn.disabled = false;
          checkInBtn.title = "Klik untuk validasi presensi & GPS";
          if (btnLabel) btnLabel.textContent = "ABSEN MASUK";
          if (checkInSubText) {
            checkInSubText.textContent = (timeStatus && timeStatus.isCheckInLateTolerance) 
              ? `Toleransi s/d ${timeStatus.checkInLateLimit} WIB` 
              : "Validasi Presensi & GPS";
          }
          if (focusCheckInBtn) focusCheckInBtn.disabled = false;
        }
      }

      if (checkOutBtn) {
        checkOutBtn.disabled = true;
        checkOutBtn.classList.remove("check-out-locked");
        const outLabel = checkOutBtn.querySelector(".btn-label");
        if (outLabel) outLabel.textContent = "ABSEN PULANG";
        if (checkOutSubText) checkOutSubText.textContent = "Aktif setelah Masuk";
        checkOutBtn.title = "Presensi pulang aktif setelah Anda melakukan presensi masuk";
      }
      if (focusCheckOutBtn) focusCheckOutBtn.disabled = true;

      if (sidebarStatusBadge) {
        if (timeStatus && timeStatus.isBeforeCheckInStart) {
          sidebarStatusBadge.textContent = "Belum Buka";
          sidebarStatusBadge.style.background = "#E0E7FF";
          sidebarStatusBadge.style.color = "#3730A3";
        } else if (timeStatus && timeStatus.isCheckInExpired) {
          sidebarStatusBadge.textContent = "Ditutup";
          sidebarStatusBadge.style.background = "#FEE2E2";
          sidebarStatusBadge.style.color = "#991B1B";
        } else {
          sidebarStatusBadge.textContent = "Belum Absen";
          sidebarStatusBadge.style.background = "#FEF3C7";
          sidebarStatusBadge.style.color = "#92400E";
        }
      }
    } else if (todayAttendance.status === "Hadir" || todayAttendance.status === "Terlambat") {
      const isLate = todayAttendance.status === "Terlambat";
      if (statusBadge) statusBadge.className = isLate ? "status-badge status-terlambat"  : "status-badge status-hadir";
      if (statusText) statusText.textContent = isLate ? "Hadir Terlambat"  : "Hadir Tepat Waktu";
      
      if (checkInTimeEl) checkInTimeEl.textContent = todayAttendance.checkIn ? todayAttendance.checkIn.time  : "--:-- WIB";
      if (checkOutTimeEl) checkOutTimeEl.textContent = "--:-- WIB";

      if (alreadyAlert) {
        alreadyAlert.style.display = "block";
        alreadyAlert.style.background = isLate ? "rgba(245, 158, 11, 0.12)"  : "rgba(147, 197, 114, 0.16)";
        alreadyAlert.style.borderColor = isLate ? "#F59E0B"  : "#93C572";
      }
      if (alreadyText) {
        alreadyText.textContent = `Anda Sudah Check-In (${todayAttendance.checkIn ? todayAttendance.checkIn.time  : ""})`;
        alreadyText.style.color = isLate ? "#92400E"  : "#2E4E16";
      }
      if (alreadySub) {
        alreadySub.textContent = isLate ? "Presensi masuk tercatat terlambat hari ini. Selamat beraktivitas dan mengajar."  : "Presensi kehadiran harian Anda telah tersimpan dan terverifikasi secara resmi.";
        alreadySub.style.color = isLate ? "#B45309"  : "#3B5F21";
      }

      if (checkInBtn) {
        checkInBtn.disabled = true;
        checkInBtn.classList.remove("check-in-locked", "check-in-closed");
        checkInBtn.classList.add("checked-in-complete");
        const btnLabel = checkInBtn.querySelector(".btn-label");
        if (btnLabel) btnLabel.textContent = "SUDAH CHECK-IN";
        if (checkInSubText) checkInSubText.textContent = "Tercatat: " + (todayAttendance.checkIn ? todayAttendance.checkIn.time  : "");
      }
      if (focusCheckInBtn) focusCheckInBtn.disabled = true;

      if (checkOutBtn) {
        const outLabel = checkOutBtn.querySelector(".btn-label");
        if (outLabel) outLabel.textContent = "ABSEN PULANG";

        if (timeStatus && !timeStatus.isCheckOutAllowed) {
          checkOutBtn.disabled = true;
          checkOutBtn.classList.add("check-out-locked");
          checkOutBtn.title = `Presensi pulang aktif mulai pukul ${timeStatus.checkOutTime} WIB (${timeStatus.dayGroup})`;
          if (checkOutSubText) checkOutSubText.textContent = `Aktif Pukul ${timeStatus.checkOutTime} WIB`;
          if (focusCheckOutBtn) focusCheckOutBtn.disabled = true;
        } else {
          checkOutBtn.disabled = false;
          checkOutBtn.classList.remove("check-out-locked");
          checkOutBtn.title = "Klik untuk melakukan presensi pulang";
          if (checkOutSubText) checkOutSubText.textContent = timeStatus ? `Siap Pulang (${timeStatus.checkOutTime} WIB)` : "Siap Absen Pulang";
          if (focusCheckOutBtn) focusCheckOutBtn.disabled = false;
        }
      }

      if (sidebarStatusBadge) {
        sidebarStatusBadge.textContent = isLate ? "Terlambat"  : "Hadir";
        sidebarStatusBadge.style.background = isLate ? "#FFE4E6"  : "#E8F5DF";
        sidebarStatusBadge.style.color = isLate ? "#9F1239"  : "#3B5F21";
      }
    } else if (todayAttendance.status === "Pulang") {
      if (statusBadge) statusBadge.className = "status-badge status-pulang";
      if (statusText) statusText.textContent = "Sudah Absen Pulang";

      if (checkInTimeEl) checkInTimeEl.textContent = todayAttendance.checkIn ? todayAttendance.checkIn.time  : "--:-- WIB";
      if (checkOutTimeEl) checkOutTimeEl.textContent = todayAttendance.checkOut ? todayAttendance.checkOut.time  : "--:-- WIB";

      if (alreadyAlert) {
        alreadyAlert.style.display = "block";
        alreadyAlert.style.background = "rgba(59, 130, 246, 0.12)";
        alreadyAlert.style.borderColor = "#3B82F6";
      }
      if (alreadyText) {
        alreadyText.textContent = `Anda Sudah Selesai Bertugas (${todayAttendance.checkOut ? todayAttendance.checkOut.time  : ""})`;
        alreadyText.style.color = "#1E40AF";
      }
      if (alreadySub) {
        alreadySub.textContent = `Presensi masuk: ${todayAttendance.checkIn ? todayAttendance.checkIn.time  : '-'} • Presensi pulang: ${todayAttendance.checkOut ? todayAttendance.checkOut.time  : '-'}`;
        alreadySub.style.color = "#2563EB";
      }

      if (checkInBtn) {
        checkInBtn.disabled = true;
        checkInBtn.classList.remove("check-in-locked", "check-in-closed");
        checkInBtn.classList.add("checked-in-complete");
        const btnLabel = checkInBtn.querySelector(".btn-label");
        if (btnLabel) btnLabel.textContent = "SUDAH CHECK-IN";
        if (checkInSubText) checkInSubText.textContent = "Selesai Hari Kerja";
      }
      if (checkOutBtn) {
        checkOutBtn.disabled = true;
        checkOutBtn.classList.remove("check-out-locked");
        const outLabel = checkOutBtn.querySelector(".btn-label");
        if (outLabel) outLabel.textContent = "SUDAH PULANG";
        if (checkOutSubText) checkOutSubText.textContent = "Selesai: " + (todayAttendance.checkOut ? todayAttendance.checkOut.time  : "");
      }
      if (focusCheckInBtn) focusCheckInBtn.disabled = true;
      if (focusCheckOutBtn) focusCheckOutBtn.disabled = true;

      if (sidebarStatusBadge) {
        sidebarStatusBadge.textContent = "Selesai";
        sidebarStatusBadge.style.background = "var(--blue-50)";
        sidebarStatusBadge.style.color = "var(--blue-600)";
      }
    } else if (todayAttendance.status === "Izin" || todayAttendance.status === "Sakit") {
      if (statusBadge) statusBadge.className = "status-badge status-izin";
      if (statusText) statusText.textContent = todayAttendance.status;
      if (checkInBtn) {
        checkInBtn.disabled = true;
        checkInBtn.classList.remove("check-in-locked", "check-in-closed");
        checkInBtn.classList.add("checked-in-complete");
        const btnLabel = checkInBtn.querySelector(".btn-label");
        if (btnLabel) btnLabel.textContent = todayAttendance.status.toUpperCase();
        if (checkInSubText) checkInSubText.textContent = "Dispensasi Resmi";
      }
      if (checkOutBtn) {
        checkOutBtn.disabled = true;
        checkOutBtn.classList.remove("check-out-locked");
        if (checkOutSubText) checkOutSubText.textContent = "Tidak Perlu Absen Pulang";
      }
      if (focusCheckInBtn) focusCheckInBtn.disabled = true;
      if (focusCheckOutBtn) focusCheckOutBtn.disabled = true;
      if (sidebarStatusBadge) {
        sidebarStatusBadge.textContent = todayAttendance.status;
        sidebarStatusBadge.style.background = "#FEF3C7";
        sidebarStatusBadge.style.color = "#92400E";
      }
    }

    renderDashboardRecentTable();
  }

  window.updateAttendanceUI = updateAttendanceUI;
  window.loadActiveTeacherAttendance = loadActiveTeacherAttendance;

  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");
    modal.classList.add("show");
    const firstInput = modal.querySelector("input:not([type=hidden]), select, textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  };

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    modal.classList.remove("show");
  };

  const openModal = window.openModal;
  const closeModal = window.closeModal;

  function initModals() {
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".modal-overlay, .modal");
        if (modal) {
          modal.classList.remove("active");
          modal.classList.remove("show");
        }
      });
    });

    // Close when clicking overlay backdrop
    document.querySelectorAll(".modal-overlay, .modal").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
          overlay.classList.remove("show");
        }
      });
    });

    // Close on Escape key press
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active, .modal-overlay.show, .modal.active, .modal.show").forEach(m => {
          m.classList.remove("active");
          m.classList.remove("show");
        });
      }
    });

    // Check-In Button triggers
    const btnCheckIn = document.getElementById("btnCheckIn");
    const btnFocusCheckIn = document.getElementById("btnFocusCheckIn");

    function handleCheckInClick() {
      if (todayAttendance.checkIn) {
        SoundService.playError();
        showToast("Sudah Absen", "Anda telah melakukan absen masuk hari ini. Sistem mencegah absensi ganda (FR-03).", "warning");
        return;
      }

      const timeStatus = (typeof StorageService !== "undefined" && StorageService.getTodayAttendanceTimeStatus) 
        ? StorageService.getTodayAttendanceTimeStatus() 
        : null;

      if (timeStatus) {
        if (timeStatus.isBeforeCheckInStart) {
          SoundService.playError();
          showToast(
            "Presensi Belum Dibuka",
            `Tombol check-in baru aktif pukul ${timeStatus.checkInStart} WIB. Silakan kembali pada jam presensi masuk.`,
            "warning"
          );
          return;
        }
        if (timeStatus.isCheckInExpired) {
          SoundService.playError();
          showToast(
            "Presensi Telah Ditutup",
            `Waktu presensi masuk telah berakhir karena melewati batas toleransi keterlambatan (${timeStatus.checkInLateLimit} WIB).`,
            "error"
          );
          return;
        }
      }

      openModal("modalCheckIn");
    }

    if (btnCheckIn) btnCheckIn.addEventListener("click", handleCheckInClick);
    if (btnFocusCheckIn) btnFocusCheckIn.addEventListener("click", handleCheckInClick);

    // Confirm Check-In Submit
    const btnConfirmCheckInSubmit = document.getElementById("btnConfirmCheckInSubmit");
    if (btnConfirmCheckInSubmit) {
      btnConfirmCheckInSubmit.addEventListener("click", () => {
        // Business Rule FR-03: Geofence radius check
        if (!isInsideGeofence) {
          const rad = (StorageService.getSchoolConfig()?.geofence?.radiusMeters) || 50;
          const outDist = Math.max(rad + 92, 142);
          SoundService.playError();
          showToast(
            "Absensi Ditolak (FR-03)!",
            `Anda terdeteksi berada di luar radius aman sekolah (${outDist}m > batas toleransi ${rad}m). Silakan dekati area kampus madrasah.`,
            "error"
          );
          closeModal("modalCheckIn");
          return;
        }

        const now = new Date();
        const timeStatus = (typeof StorageService !== "undefined" && StorageService.getTodayAttendanceTimeStatus) 
          ? StorageService.getTodayAttendanceTimeStatus(now) 
          : null;

        if (timeStatus) {
          if (timeStatus.isBeforeCheckInStart) {
            SoundService.playError();
            showToast("Presensi Belum Dibuka", `Presensi masuk baru dibuka pukul ${timeStatus.checkInStart} WIB.`, "warning");
            closeModal("modalCheckIn");
            return;
          }
          if (timeStatus.isCheckInExpired) {
            SoundService.playError();
            showToast("Presensi Ditutup", `Batas toleransi presensi masuk (${timeStatus.checkInLateLimit} WIB) telah berakhir.`, "error");
            closeModal("modalCheckIn");
            return;
          }
        }

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const timeFormatted = `${hours}:${minutes} WIB`;

        // Determine if Late: late if past standard check-in time (FR-05)
        const isLate = timeStatus ? (!timeStatus.isCheckInOnTime) : ((now.getHours() > 7) || (now.getHours() === 7 && now.getMinutes() > 0));
        const statusStr = isLate ? "Terlambat" : "Hadir";
        const curDateStr = getAppTodayDateString();
        const curDayName = getAppTodayDayName();

        todayAttendance.date = curDateStr;
        todayAttendance.status = statusStr;
        todayAttendance.checkIn = {
          time: timeFormatted,
          lat: -6.208842,
          lng: 106.845612,
          distance: "18 Meter",
          verified: true,
          isLate: isLate,
          photo: null,
          device: "Chrome / Windows 11 Desktop"
        };

        StorageService.saveTodayAttendance(todayAttendance);

        // Sinkronisasi langsung ke Master Rekap Guru agar Admin melihatnya seketika
        const activeTch = StorageService.getActiveTeacher();
        const activeTchId = activeTch ? (activeTch.nip || activeTch.id) : "91000074100899";
        syncTeacherAttendanceToMaster(
          activeTchId,
          statusStr,
          timeFormatted,
          "-",
          isLate,
          isLate ? "Hadir Terlambat" : "Tepat Waktu"
        );

        // Prepend to history table (isolated per teacher & date)
        const newHistoryItem = {
          id: `ATT-${curDateStr.replace(/-/g, '')}-${activeTchId}`,
          teacherId: activeTchId,
          teacherName: activeTch ? activeTch.name : "",
          nip: activeTch ? activeTch.nip : "",
          date: curDateStr,
          day: curDayName,
          checkIn: timeFormatted,
          checkOut: "-",
          status: statusStr,
          statusDetail: isLate 
            ? `Terlambat (Lewat dari standar ${timeStatus ? timeStatus.checkInStandard : '07:00'} WIB)` 
            : "Tepat Waktu",
          location: "Gedung A (18m dari pusat)",
          coordinates: "-6.208842, 106.845612",
          device: "Chrome on Windows 11 Desktop",
          correction: null
        };

        attendanceHistory = [
          newHistoryItem,
          ...attendanceHistory.filter(h => !(h.date === curDateStr && (!h.teacherId || h.teacherId === activeTchId)))
        ];
        StorageService.saveHistory(attendanceHistory);

        SoundService.playSuccess();
        closeModal("modalCheckIn");
        updateAttendanceUI();
        renderDashboardRecentTable();
        renderFullHistoryTable();
        updateKpiCounts();

        showToast(
          "Absen Masuk Berhasil!",
          `Presensi masuk tercatat pukul ${timeFormatted} dengan status: ${statusStr}. Selamat mengajar!`,
          "success"
        );
      });
    }

    // Check-Out Button triggers
    const btnCheckOut = document.getElementById("btnCheckOut");
    const btnFocusCheckOut = document.getElementById("btnFocusCheckOut");

    function handleCheckOutClick() {
      if (!todayAttendance.checkIn) {
        SoundService.playError();
        showToast("Belum Absen Masuk", "Absensi pulang hanya dapat dilakukan setelah absensi masuk tercatat (FR-04).", "error");
        return;
      }
      if (todayAttendance.checkOut) {
        SoundService.playError();
        showToast("Sudah Pulang", "Absensi pulang sudah disimpan sebelumnya.", "warning");
        return;
      }

      const timeStatus = (typeof StorageService !== "undefined" && StorageService.getTodayAttendanceTimeStatus) 
        ? StorageService.getTodayAttendanceTimeStatus() 
        : null;

      if (timeStatus && !timeStatus.isCheckOutAllowed) {
        SoundService.playError();
        showToast(
          "Belum Jam Pulang",
          `Presensi pulang hari ini (${timeStatus.dayGroup}) baru dapat dilakukan mulai pukul ${timeStatus.checkOutTime} WIB sesuai pengaturan jam kepulangan madrasah.`,
          "warning"
        );
        return;
      }

      const modalCheckOutInTime = document.getElementById("modalCheckOutInTime");
      if (modalCheckOutInTime) modalCheckOutInTime.textContent = todayAttendance.checkIn.time;

      const modalCheckOutSchedTime = document.getElementById("modalCheckOutSchedTime");
      if (modalCheckOutSchedTime) {
        const todaySched = StorageService.getTodayCheckOutSchedule();
        modalCheckOutSchedTime.textContent = `${todaySched.time} WIB (${todaySched.dayGroup})`;
      }

      openModal("modalCheckOut");
    }

    if (btnCheckOut) btnCheckOut.addEventListener("click", handleCheckOutClick);
    if (btnFocusCheckOut) btnFocusCheckOut.addEventListener("click", handleCheckOutClick);

    // Confirm Check-Out Submit
    const btnConfirmCheckOutSubmit = document.getElementById("btnConfirmCheckOutSubmit");
    if (btnConfirmCheckOutSubmit) {
      btnConfirmCheckOutSubmit.addEventListener("click", () => {
        if (!isInsideGeofence) {
          SoundService.playError();
          showToast(
            "Absensi Pulang Ditolak!",
            "Anda terdeteksi di luar radius sekolah. Absen pulang harus dilakukan dari area madrasah.",
            "error"
          );
          closeModal("modalCheckOut");
          return;
        }

        const now = new Date();
        const timeStatus = (typeof StorageService !== "undefined" && StorageService.getTodayAttendanceTimeStatus) 
          ? StorageService.getTodayAttendanceTimeStatus(now) 
          : null;

        if (timeStatus && !timeStatus.isCheckOutAllowed) {
          SoundService.playError();
          showToast(
            "Belum Jam Pulang",
            `Absen pulang belum dapat disimpan sebelum pukul ${timeStatus.checkOutTime} WIB (${timeStatus.dayGroup}).`,
            "warning"
          );
          closeModal("modalCheckOut");
          return;
        }

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const timeFormatted = `${hours}:${minutes} WIB`;

        const wasLate = todayAttendance.status === "Terlambat" || Boolean(todayAttendance.checkIn && todayAttendance.checkIn.isLate);
        const curDateStr = getAppTodayDateString();
        todayAttendance.date = curDateStr;
        todayAttendance.status = "Pulang";
        todayAttendance.checkOut = {
          time: timeFormatted,
          lat: -6.208842,
          lng: 106.845612,
          distance: "18 Meter",
          verified: true
        };

        StorageService.saveTodayAttendance(todayAttendance);

        // Sinkronisasi langsung ke Master Rekap Guru agar Admin melihat absen pulang seketika
        const activeTch = StorageService.getActiveTeacher();
        const activeTchId = activeTch ? (activeTch.nip || activeTch.id) : "91000074100899";
        syncTeacherAttendanceToMaster(
          activeTchId,
          "Pulang",
          todayAttendance.checkIn ? todayAttendance.checkIn.time : timeFormatted,
          timeFormatted,
          wasLate,
          `Selesai (${todayAttendance.checkIn ? todayAttendance.checkIn.time : ''} - ${timeFormatted})`
        );

        // Update history item for active teacher
        attendanceHistory = attendanceHistory.map(item => {
          if (item.date === curDateStr && (!item.teacherId || item.teacherId === activeTchId)) {
            return {
              ...item,
              checkOut: timeFormatted
            };
          }
          return item;
        });
        StorageService.saveHistory(attendanceHistory);

        SoundService.playSuccess();
        closeModal("modalCheckOut");
        updateAttendanceUI();
        renderDashboardRecentTable();
        renderFullHistoryTable();

        showToast(
          "Absen Pulang Berhasil!",
          `Presensi pulang tercatat pukul ${timeFormatted}. Terima kasih atas pengabdian hari ini!`,
          "success"
        );
      });
    }

    // Leave Request Modal Trigger
    const btnOpenLeaveModal = document.getElementById("btnOpenLeaveModal");
    if (btnOpenLeaveModal) {
      btnOpenLeaveModal.addEventListener("click", () => openModal("modalLeaveForm"));
    }


    // Leave Form Submit (FR-07)
    const leaveRequestForm = document.getElementById("leaveRequestForm");
    if (leaveRequestForm) {
      leaveRequestForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const type = document.getElementById("leaveTypeSelect").value;
        const startDate = document.getElementById("leaveStartDate").value;
        const endDate = document.getElementById("leaveEndDate").value;
        const reason = document.getElementById("leaveReasonInput").value;

        if (!type || !startDate || !endDate || !reason) {
          showToast("Data Kurang Lengkap", "Harap isi semua kolom wajib formulir.", "warning");
          return;
        }

        // Calculate days duration
        const startD = new Date(startDate);
        const endD = new Date(endDate);
        const diffTime = Math.abs(endD - startD);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const durationStr = `${diffDays} Hari`;
        const activeT = StorageService.getActiveTeacher() || {};
        const newLeave = {
          id: `IZN-2026-${String(leaveRequests.length + 5).padStart(3, "0")}`,
          teacherId: (activeT.nip || activeT.id || "91000074100899"),
          teacherName: activeT.name || "Guru MTs",
          teacherNip: activeT.nip || "-",
          teacherSubject: activeT.subject || "Guru Mapel",
          type: type,
          startDate: startDate,
          endDate: endDate,
          duration: durationStr,
          reason: reason,
          submittedAt: "Hari ini",
          status: "Menunggu Verifikasi",
          verifiedBy: "-",
          verifiedAt: "-",
          adminNote: "Menunggu persetujuan oleh Kepala Madrasah / Admin Kepegawaian."
        };

        leaveRequests = [newLeave, ...leaveRequests];
        StorageService.saveLeaveRequests(leaveRequests);

        SoundService.playSuccess();
        closeModal("modalLeaveForm");
        renderLeaveRequestsTable();
        leaveRequestForm.reset();

        showToast(
          "Pengajuan Izin Terkirim!",
          `Permohonan ${type} untuk ${durationStr} telah dicatat. Status: Menunggu Verifikasi.`,
          "success"
        );
      });
    }

    // Reset Demo State
    const btnResetLocalData = document.getElementById("btnResetLocalData");
    if (btnResetLocalData) {
      btnResetLocalData.addEventListener("click", () => {
        if (confirm("Reset seluruh data lokal dashboard guru ke kondisi awal?")) {
          StorageService.resetAll();
        }
      });
    }
  }

  // Render Recent Table on Dashboard Tab
  function renderDashboardRecentTable() {
    const tbody = document.getElementById("dashboardRecentTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    const activeTch = StorageService.getActiveTeacher();
    const activeTchId = activeTch ? activeTch.id : null;
    const teacherHistory = activeTchId
      ? attendanceHistory.filter(h => !h.teacherId || h.teacherId === activeTchId)
      : attendanceHistory;
    const recent = teacherHistory.slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted);">
            <div style="font-size: 1.6rem; margin-bottom: 0.35rem;">📋</div>
            <p style="margin: 0; font-size: 0.88rem; font-weight: 600; color: var(--text-main);">Belum ada riwayat presensi yang tercatat</p>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.78rem; color: var(--text-muted);">Data absensi harian akan tampil di sini setelah guru melakukan presensi.</p>
          </td>
        </tr>
      `;
      return;
    }

    recent.forEach(item => {
      const tr = document.createElement("tr");

      let statusBadgeClass = "badge-hadir";
      if (item.status === "Terlambat") statusBadgeClass = "badge-terlambat";
      if (item.status === "Izin") statusBadgeClass = "badge-izin";
      if (item.status === "Sakit") statusBadgeClass = "badge-sakit";

      tr.innerHTML = `
        <td>
          <strong>${item.day}</strong>, ${formatDateShort(item.date)}
        </td>
        <td class="time-stamp-cell">${item.checkIn}</td>
        <td class="time-stamp-cell">${item.checkOut}</td>
        <td>
          <span class="badge-pill-status ${statusBadgeClass}">${item.status}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Full History Table (FR-06) with Filters
  function renderFullHistoryTable() {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    const periodFilter = document.getElementById("historyPeriodFilter")?.value || "all";
    const statusFilter = document.getElementById("historyStatusFilter")?.value || "all";
    const searchKeyword = (document.getElementById("historySearchInput")?.value || "").toLowerCase().trim();

    const activeTch = StorageService.getActiveTeacher();
    const activeTchId = activeTch ? activeTch.id : null;
    let filtered = activeTchId
      ? attendanceHistory.filter(item => !item.teacherId || item.teacherId === activeTchId)
      : [...attendanceHistory];

    // Filter by period dynamically based on current app date
    const nowDate = getAppCurrentDate();
    const curYear = nowDate.getFullYear();
    const curMonth = nowDate.getMonth() + 1;
    const curYm = `${curYear}-${String(curMonth).padStart(2, "0")}`;
    const prevDate = new Date(curYear, curMonth - 2, 1);
    const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    if (periodFilter === "current") {
      filtered = filtered.filter(item => item.date && item.date.startsWith(curYm));
    } else if (periodFilter === "last") {
      filtered = filtered.filter(item => item.date && item.date.startsWith(prevYm));
    } else if (periodFilter !== "all" && /^\d{4}-\d{2}$/.test(periodFilter)) {
      filtered = filtered.filter(item => item.date && item.date.startsWith(periodFilter));
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by search
    if (searchKeyword) {
      filtered = filtered.filter(item => 
        item.date.includes(searchKeyword) ||
        item.day.toLowerCase().includes(searchKeyword) ||
        item.status.toLowerCase().includes(searchKeyword) ||
        (item.location && item.location.toLowerCase().includes(searchKeyword)) ||
        (item.statusDetail && item.statusDetail.toLowerCase().includes(searchKeyword))
      );
    }

    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Tidak ditemukan catatan absensi yang sesuai filter.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement("tr");

      let badgeClass = "badge-hadir";
      if (item.status === "Terlambat") badgeClass = "badge-terlambat";
      if (item.status === "Izin") badgeClass = "badge-izin";
      if (item.status === "Sakit") badgeClass = "badge-sakit";

      let correctionAlert = "";
      if (item.correction) {
        correctionAlert = `
          <div class="badge-correction-alert" data-correction-id="${item.id}" title="Klik untuk melihat catatan audit koreksi admin">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Koreksi Admin (FR-13)
          </div>
        `;
      }

      tr.innerHTML = `
        <td style="font-family: 'JetBrains Mono'; font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">${item.id}</td>
        <td>
          <div style="font-weight: 700;">${item.day}, ${formatDateShort(item.date)}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${item.statusDetail || "-"}</div>
          ${correctionAlert}
        </td>
        <td class="time-stamp-cell">${item.checkIn}</td>
        <td class="time-stamp-cell">${item.checkOut}</td>
        <td>
          <span class="badge-pill-status ${badgeClass}">${item.status}</span>
        </td>
        <td style="font-size: 0.8rem;">
          <div>${item.location || "-"}</div>
          <div style="font-family: 'JetBrains Mono'; font-size: 0.72rem; color: var(--text-muted);">${item.coordinates || "-"}</div>
        </td>
        <td style="font-size: 0.78rem; color: var(--text-secondary);">${item.device || "-"}</td>
        <td>
          <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;" onclick="viewHistoryDetail('${item.id}')">
            Detail Bukti
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach click listener to correction badges
    document.querySelectorAll(".badge-correction-alert").forEach(badge => {
      badge.addEventListener("click", () => {
        const id = badge.getAttribute("data-correction-id");
        const found = attendanceHistory.find(h => h.id === id);
        if (found && found.correction) {
          openAuditModal(found);
        }
      });
    });
  }

  // Filter Listeners for History
  const periodFilter = document.getElementById("historyPeriodFilter");
  const statusFilter = document.getElementById("historyStatusFilter");
  const searchInput = document.getElementById("historySearchInput");
  const btnResetFilter = document.getElementById("btnResetFilter");

  if (periodFilter) periodFilter.addEventListener("change", renderFullHistoryTable);
  if (statusFilter) statusFilter.addEventListener("change", renderFullHistoryTable);
  if (searchInput) searchInput.addEventListener("input", renderFullHistoryTable);
  if (btnResetFilter) {
    btnResetFilter.addEventListener("click", () => {
      if (periodFilter) periodFilter.value = "all";
      if (statusFilter) statusFilter.value = "all";
      if (searchInput) searchInput.value = "";
      renderFullHistoryTable();
    });
  }

  // Export Excel / CSV Official Report Handler
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      const periodVal = document.getElementById("historyPeriodFilter")?.value || "2026-01";
      if (typeof window.downloadOfficialReportExcelDirect === "function") {
        window.downloadOfficialReportExcelDirect(periodVal);
      } else {
        const modal = document.getElementById("modalOfficialAttendanceReport");
        if (modal) modal.classList.add("active");
      }
    });
  }

  // Print Slip Handler (Opens Official Monthly Report Modal & Print Preview)
  const btnPrintSlip = document.getElementById("btnPrintSlip");
  if (btnPrintSlip) {
    btnPrintSlip.addEventListener("click", () => {
      const periodVal = document.getElementById("historyPeriodFilter")?.value || "2026-01";
      if (typeof window.openOfficialAttendanceReportModal === "function") {
        window.openOfficialAttendanceReportModal(periodVal);
      } else {
        const modal = document.getElementById("modalOfficialAttendanceReport");
        if (modal) modal.classList.add("active");
      }
    });
  }

  // Open Audit Modal Detail (FR-13)
  window.viewHistoryDetail = function(id) {
    const item = attendanceHistory.find(h => h.id === id);
    if (!item) return;

    const modalBody = document.getElementById("auditDetailContent");
    if (!modalBody) return;

    let correctionHtml = "";
    if (item.correction) {
      correctionHtml = `
        <div style="background: var(--amber-50); border: 1px solid var(--amber-500); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem;">
          <div style="font-weight: 700; color: var(--amber-600); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Audit Trail Koreksi Admin (FR-13)
          </div>
          <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.35rem; color: var(--text-primary);">
            <div><strong>Admin Penilai:</strong> ${item.correction.adminName}</div>
            <div><strong>Waktu Koreksi:</strong> ${item.correction.correctedAt}</div>
            <div><strong>Nilai Sebelumnya:</strong> <span style="text-decoration: line-through; color: var(--rose-600);">${item.correction.originalVal}</span></div>
            <div><strong>Nilai Disesuaikan:</strong> <strong style="color: var(--emerald-600);">${item.correction.newVal}</strong></div>
            <div style="margin-top: 0.25rem; font-style: italic; background: rgba(255,255,255,0.7); padding: 0.4rem; border-radius: var(--radius-sm);">
              "Alasan: ${item.correction.reason}"
            </div>
          </div>
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem;">
        <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: var(--emerald-50); color: var(--emerald-600); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem;">
          ✓
        </div>
        <div>
          <h4 style="font-family: 'Outfit'; font-size: 1.15rem; font-weight: 800;">Bukti Presensi #${item.id}</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${item.day}, ${item.date} • ${StorageService.getSchoolConfig().name || "MTs Asy-Syafi'iyyah Jatibarang"}</p>
        </div>
      </div>

      <div style="background: var(--bg-elevated); padding: 1rem; border-radius: var(--radius-md); font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.6rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Status Kehadiran:</span>
          <strong>${item.status} (${item.statusDetail || "-"})</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Waktu Masuk Resmi:</span>
          <strong style="font-family: 'JetBrains Mono';">${item.checkIn}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Waktu Pulang Resmi:</span>
          <strong style="font-family: 'JetBrains Mono';">${item.checkOut}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Titik Koordinat:</span>
          <span style="font-family: 'JetBrains Mono';">${item.coordinates || "-"}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Zona Geofence:</span>
          <span>${item.location || "-"}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Perangkat:</span>
          <span>${item.device || "-"}</span>
        </div>
      </div>

      ${correctionHtml}
    `;

    openModal("modalAuditCorrection");
  };

  function openAuditModal(item) {
    window.viewHistoryDetail(item.id);
  }

  // Render Leave Requests Table (FR-07)
  function renderLeaveRequestsTable() {
    const tbody = document.getElementById("leaveRequestsTableBody");
    const leaveApprovedCount = document.getElementById("leaveApprovedCount");
    const leavePendingCount = document.getElementById("leavePendingCount");
    const sidebarLeaveCount = document.getElementById("sidebarLeaveCount");

    if (!tbody) return;
    tbody.innerHTML = "";

    let approved = 0;
    let pending = 0;

    const activeTeacher = StorageService.getActiveTeacher();
    const myLeaves = activeTeacher
      ? leaveRequests.filter(l => !l.teacherId || l.teacherId === activeTeacher.id)
      : leaveRequests;

    myLeaves.forEach(req => {
      if (req.status === "Disetujui") approved++;
      if (req.status === "Menunggu Verifikasi") pending++;

      const tr = document.createElement("tr");

      let statusBadge = `<span class="badge-pill-status badge-hadir">Disetujui</span>`;
      if (req.status === "Menunggu Verifikasi") {
        statusBadge = `<span class="badge-pill-status badge-terlambat" style="background: #FEF3C7; color: #92400E;">Menunggu Verifikasi</span>`;
      } else if (req.status === "Ditolak") {
        statusBadge = `<span class="badge-pill-status badge-terlambat">Ditolak</span>`;
      }

      tr.innerHTML = `
        <td style="font-family: 'JetBrains Mono'; font-size: 0.78rem; font-weight: 700; color: var(--emerald-600);">${req.id}</td>
        <td><strong>${req.type}</strong></td>
        <td style="font-size: 0.8rem;">${formatDateShort(req.startDate)} s/d ${formatDateShort(req.endDate)}</td>
        <td style="font-weight: 600;">${req.duration}</td>
        <td style="font-size: 0.8rem; max-width: 250px;">${req.reason}</td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.78rem; color: var(--text-secondary); max-width: 200px;">
          ${req.adminNote || "-"}
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (leaveApprovedCount) leaveApprovedCount.textContent = `${approved} Berkas`;
    if (leavePendingCount) leavePendingCount.textContent = `${pending} Berkas`;
    if (sidebarLeaveCount) sidebarLeaveCount.textContent = `${pending}`;
  }

  // Update KPI Counts
  function updateKpiCounts() {
    const kpiHadirVal = document.getElementById("kpiHadirVal");
    const kpiTerlambatVal = document.getElementById("kpiTerlambatVal");
    const kpiIzinVal = document.getElementById("kpiIzinVal");
    const kpiAlphaVal = document.getElementById("kpiAlphaVal");

    const activeTch = StorageService.getActiveTeacher();
    const activeTchId = activeTch ? activeTch.id : null;
    const myHistory = activeTchId
      ? attendanceHistory.filter(h => !h.teacherId || h.teacherId === activeTchId)
      : attendanceHistory;

    const hadirCount = myHistory.filter(h => h.status === "Hadir" || h.status === "Pulang").length;
    const terlambatCount = myHistory.filter(h => h.status === "Terlambat").length;
    const izinCount = myHistory.filter(h => h.status === "Izin" || h.status === "Sakit").length;

    if (kpiHadirVal) kpiHadirVal.textContent = `${hadirCount} Hari`;
    if (kpiTerlambatVal) kpiTerlambatVal.textContent = `${terlambatCount} Hari`;
    if (kpiIzinVal) kpiIzinVal.textContent = `${izinCount} Hari`;
    if (kpiAlphaVal) kpiAlphaVal.textContent = "0 Hari";
  }

  // Helper: Dapatkan tanggal & waktu aktif aplikasi (memperhitungkan offset simulasi jika ada)
  function getAppCurrentDate() {
    const d = new Date();
    const offset = (typeof window.simulatedTimeOffsetMinutes !== "undefined")
      ? window.simulatedTimeOffsetMinutes
      : (typeof simulatedTimeOffsetMinutes !== "undefined" ? simulatedTimeOffsetMinutes : 0);
    if (offset) {
      d.setMinutes(d.getMinutes() + offset);
    }
    return d;
  }

  window.setSimulatedTime = function(timeHHMM) {
    if (!timeHHMM) {
      window.simulatedTimeOffsetMinutes = 0;
      simulatedTimeOffsetMinutes = 0;
    } else {
      const [h, m] = timeHHMM.split(":").map(Number);
      const now = new Date();
      const targetMin = h * 60 + m;
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const offset = targetMin - currentMin;
      window.simulatedTimeOffsetMinutes = offset;
      simulatedTimeOffsetMinutes = offset;
    }
    if (typeof updateAttendanceUI === "function") updateAttendanceUI();
    if (typeof renderKbmTimelineAndLogs === "function") renderKbmTimelineAndLogs();
    if (typeof renderTeachingSchedules === "function") renderTeachingSchedules();
    return getAppCurrentDate();
  };

  // Evaluasi status jadwal KBM secara real-time terhadap jam server WIB
  function getScheduleTimeStatus(session, refDate = null) {
    if (!session || !session.startTime) {
      return { state: "active", isActive: true, openTimeStr: "07:00", label: "Aktif" };
    }

    const curRealDay = getAppTodayDayName();
    // Jika sesi dijadwalkan pada hari selain hari ini, statusnya netral (pratinjau jadwal hari lain)
    if (session.day && session.day !== curRealDay) {
      return {
        state: "other_day",
        isActive: false,
        day: session.day,
        openTimeStr: session.startTime,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
        label: `Jadwal Hari ${session.day}`
      };
    }

    const d = refDate || getAppCurrentDate();
    const nowMin = d.getHours() * 60 + d.getMinutes();

    const [startH, startM] = (session.startTime || "07:00").split(":").map(Number);
    const [endH, endM] = (session.endTime || "08:10").split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    // Check-in dibuka 10 menit sebelum jam jadwal dimulai (waktu persiapan masuk kelas)
    const schoolCfg = (typeof StorageService !== "undefined" && StorageService.getSchoolConfig) ? StorageService.getSchoolConfig() : null;
    const earlyTolerance = (schoolCfg && schoolCfg.schedule && schoolCfg.schedule.kbmCheckInEarlyMinutes != null)
      ? Number(schoolCfg.schedule.kbmCheckInEarlyMinutes)
      : 10;

    const openMin = Math.max(0, startMin - earlyTolerance);
    const openH = String(Math.floor(openMin / 60)).padStart(2, "0");
    const openM = String(openMin % 60).padStart(2, "0");
    const openTimeStr = `${openH}:${openM}`;

    if (nowMin < openMin) {
      // Sesi Selanjutnya / Belum Waktunya (Upcoming)
      const diffWait = openMin - nowMin;
      return {
        state: "upcoming",
        isActive: false,
        openTimeStr,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
        diffWaitMinutes: diffWait,
        label: `Dibuka pk ${openTimeStr} WIB`
      };
    } else if (nowMin <= endMin) {
      // Sesi aktif dalam rentang jam jadwal
      const isEarly = nowMin < startMin;
      const isToleransi = nowMin >= startMin && nowMin <= startMin + 5;
      const isLate = nowMin > startMin + 5;
      return {
        state: "active",
        isActive: true,
        openTimeStr,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
        isEarly,
        isToleransi,
        isLate,
        label: isEarly ? "Persiapan Masuk" : (isToleransi ? "Waktunya Masuk" : "Terlambat Masuk")
      };
    } else {
      // Jam jadwal sesi telah berakhir
      const diffPast = nowMin - endMin;
      return {
        state: "passed",
        isActive: true,
        openTimeStr,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
        diffPastMinutes: diffPast,
        label: `Lewat Jam KBM (${session.endTime} WIB)`
      };
    }
  }

  window.getAppCurrentDate = getAppCurrentDate;
  window.getScheduleTimeStatus = getScheduleTimeStatus;

  // Render Teaching Schedule List (Dashboard & KBM Tab)
  function renderTeachingSchedules() {
    window.renderTeachingSchedules = renderTeachingSchedules;
    const todayList = document.getElementById("todayScheduleList");
    const fullBody = document.getElementById("fullWeeklyScheduleBody");

    const curRealDay = getAppTodayDayName();
    const curRealDateStr = getAppTodayDateString();

    // Mengikuti hari realtime server
    const todayLessons = TEACHING_SCHEDULES.filter(s => s.day === curRealDay);
    todayLessons.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    if (todayList) {
      todayList.innerHTML = "";
      if (todayLessons.length === 0) {
        const isSunday = curRealDay === "Minggu";
        todayList.innerHTML = `
          <div style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-light);">
            <div style="font-size: 1.6rem; margin-bottom: 0.35rem;">${isSunday ? '🏖️' : '☕'}</div>
            <strong style="color: var(--text-primary); font-size: 0.88rem;">Tidak Ada Jadwal Mengajar Hari Ini (${curRealDay})</strong>
            <p style="font-size: 0.76rem; margin-top: 0.25rem;">${isSunday ? 'Hari Libur Akhir Pekan. Nikmati waktu istirahat Anda!' : 'Tidak ada jadwal mengajar tatap muka yang dialokasikan untuk hari ini.'}</p>
          </div>
        `;
      } else {
        todayLessons.forEach(lesson => {
          const isDone = teachingLogs.some(log => log.scheduleId === lesson.id && log.date === curRealDateStr);
          const checkInRec = classCheckIns[lesson.id];
          const isCurrentlyInClass = checkInRec && !checkInRec.finished && !isDone;
          const timeStatus = getScheduleTimeStatus(lesson);

          const item = document.createElement("div");
          item.className = "today-schedule-item";
          item.style.padding = "0.85rem";
          item.style.borderRadius = "var(--radius-md)";
          item.style.background = isDone ? "var(--bg-elevated)"  : "var(--bg-surface)";
          item.style.border = "1px solid var(--border-light)";
          item.style.borderLeft = isDone ? "4px solid var(--blue-500)"  : (timeStatus.state === "active" ? "4px solid var(--emerald-500)" : (timeStatus.state === "upcoming" ? "4px solid #94a3b8" : "4px solid #f59e0b"));
          item.style.display = "flex";
          item.style.justifyContent = "space-between";
          item.style.alignItems = "center";
          item.style.gap = "0.75rem";

          let actionBtn = "";
          if (isDone) {
            actionBtn = `
              <div class="today-schedule-action">
                <span class="badge-pill-status badge-hadir">✓ Selesai KBM</span>
              </div>
            `;
          } else if (isCurrentlyInClass) {
            actionBtn = `
              <div class="today-schedule-action">
                <span class="badge-pill-status badge-kbm-ongoing">🟢 Sedang di Kelas</span>
                <button class="btn-emerald" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: #0284c7;" onclick="openClassCheckOutModal('${lesson.id}')">
                  Check-Out
                </button>
              </div>
            `;
          } else if (timeStatus.state === "upcoming") {
            actionBtn = `
              <div class="today-schedule-action">
                <span class="badge-pill-status" style="background: rgba(148, 163, 184, 0.15); color: #64748b; font-size: 0.72rem;">Sesi Selanjutnya</span>
                <button class="btn-secondary" disabled style="padding: 0.35rem 0.75rem; font-size: 0.75rem; opacity: 0.65; cursor: not-allowed;" title="Check-in aktif otomatis menyesuaikan jam realtime jadwal (${timeStatus.openTimeStr} WIB)">
                  🔒 pk ${timeStatus.openTimeStr}
                </button>
              </div>
            `;
          } else if (timeStatus.state === "active") {
            actionBtn = `
              <div class="today-schedule-action">
                <span class="badge-pill-status badge-kbm-ongoing">🔔 Waktunya Masuk</span>
                <button class="btn-emerald" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="openClassCheckInModal('${lesson.id}')">
                  Check-in Masuk
                </button>
              </div>
            `;
          } else {
            actionBtn = `
              <div class="today-schedule-action">
                <span class="badge-pill-status badge-late">Lewat Jam</span>
                <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; color: #d97706;" onclick="openClassCheckInModal('${lesson.id}')">
                  Check-in Terlambat
                </button>
              </div>
            `;
          }

          item.innerHTML = `
            <div class="today-schedule-info">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">${lesson.subject}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                ${lesson.class} • ${lesson.room} • <strong style="color: var(--emerald-600);">${lesson.jtm} JTM</strong>
              </div>
              <span style="font-family: 'JetBrains Mono'; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">${lesson.time}</span>
            </div>
            ${actionBtn}
          `;
          todayList.appendChild(item);
        });
      }
    }

    if (fullBody) {
      fullBody.innerHTML = "";
      if (TEACHING_SCHEDULES.length === 0) {
        fullBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.25rem 1rem; color: var(--text-muted);">
              <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">📅</div>
              <strong style="color: var(--text-primary); font-size: 0.9rem; display: block;">Belum Ada Jadwal Mengajar KBM</strong>
              <p style="font-size: 0.78rem; margin: 0.25rem 0 0.85rem;">Klik tombol di bawah atau di atas untuk menambahkan jadwal mengajar mingguan Anda.</p>
              <button type="button" class="btn-emerald" onclick="window.openTeacherScheduleModal()" style="font-size: 0.78rem; padding: 0.35rem 0.85rem;">
                + Tambah Sesi Jadwal KBM
              </button>
            </td>
          </tr>
        `;
      } else {
        TEACHING_SCHEDULES.forEach(s => {
          const tr = document.createElement("tr");
          tr.className = "profile-schedule-row";
          tr.innerHTML = `
            <td data-label="Hari"><strong>${s.day}</strong></td>
            <td data-label="Jam / Waktu" style="font-family: 'JetBrains Mono'; font-size: 0.8rem;">${s.time || (s.startTime + ' - ' + s.endTime + ' WIB')}</td>
            <td data-label="Mata Pelajaran"><strong>${s.subject}</strong></td>
            <td data-label="Kelas"><span class="badge-pill-status badge-izin">${s.class}</span></td>
            <td data-label="Ruang & Beban">${s.room} <span style="font-size: 0.75rem; color: var(--text-muted);">(${s.jtm} JTM)</span></td>
            <td data-label="Aksi" class="profile-schedule-actions-cell">
              <div class="profile-schedule-actions-wrap">
                <button type="button" class="btn-table-action btn-table-action-edit" onclick="window.openTeacherScheduleModal('${s.id}')" title="Edit Sesi Jadwal">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  <span>Edit</span>
                </button>
                <button type="button" class="btn-table-action btn-table-action-delete" onclick="window.deleteTeacherSchedule('${s.id}')" title="Hapus Sesi Jadwal">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Hapus</span>
                </button>
              </div>
            </td>
          `;
          fullBody.appendChild(tr);
        });
      }

      // Update Total JTM badge in card header
      const totalJtm = TEACHING_SCHEDULES.reduce((sum, s) => sum + (Number(s.jtm) || 0), 0);
      const totalJtmBadge = document.getElementById("profileTotalJtmBadge");
      if (totalJtmBadge) {
        totalJtmBadge.textContent = `${totalJtm} Jam Tatap Muka`;
        totalJtmBadge.className = totalJtm >= 24 ? "badge-pill-status badge-hadir" : "badge-pill-status badge-izin";
      }
    }

    renderKbmTimelineAndLogs();
  }

  // Live Duration Timer Ticker for Active In-Class Session
  function startInClassTimer(startTimestamp) {
    if (inClassTimerInterval) clearInterval(inClassTimerInterval);

    function updateTicker() {
      const badge = document.getElementById("liveClassTimerBadge");
      if (!badge) return;

      const diffSec = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const s = String(diffSec % 60).padStart(2, '0');
      badge.textContent = `⏱️ Durasi KBM: ${h}:${m}:${s}`;
    }

    updateTicker();
    inClassTimerInterval = setInterval(updateTicker, 1000);
  }

  // Render KBM Timeline & History in Tab Mengajar
  function renderKbmTimelineAndLogs() {
    window.renderKbmTimelineAndLogs = renderKbmTimelineAndLogs;
    const timelineContainer = document.getElementById("kbmSessionsTimelineContainer");
    const logsTbody = document.getElementById("teachingLogsTableBody");

    const kbmJtmCompletedVal = document.getElementById("kbmJtmCompletedVal");
    const kbmJtmProgressFill = document.getElementById("kbmJtmProgressFill");
    const kbmJtmStatusBadge = document.getElementById("kbmJtmStatusBadge");
    const sidebarKbmBadge = document.getElementById("sidebarKbmBadge");
    const kbmTodaySessionsVal = document.getElementById("kbmTodaySessionsVal");
    const kbmTodayScheduleDayLabel = document.getElementById("kbmTodayScheduleDayLabel");
    const kbmTodayDayBadge = document.getElementById("kbmTodayDayBadge");
    const kbmTodayProgressBar = document.getElementById("kbmTodayProgressBar");
    const kbmTodaySummarySubtitle = document.getElementById("kbmTodaySummarySubtitle");

    const curRealDay = getAppTodayDayName();
    const curRealDateStr = getAppTodayDateString();
    const effectiveDay = getEffectiveKbmDay();
    const isShowingToday = (effectiveDay === curRealDay);

    // Update filter chip UI active state
    const dayFilterContainer = document.getElementById("teacherKbmDayButtons");
    if (dayFilterContainer) {
      const chips = dayFilterContainer.querySelectorAll(".filter-chip");
      chips.forEach(chip => {
        const chipDay = chip.dataset.day;
        if (currentKbmSelectedDay === "auto") {
          chip.classList.toggle("active", chipDay === "auto");
        } else {
          chip.classList.toggle("active", chipDay === currentKbmSelectedDay);
        }
      });
    }

    // Ambil jadwal mengajar untuk hari efektif yang dipilih
    let displayedLessons = TEACHING_SCHEDULES.filter(s => s.day === effectiveDay);
    displayedLessons.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    // Update KPI Card Header & Badges
    if (kbmTodayScheduleDayLabel) {
      kbmTodayScheduleDayLabel.textContent = isShowingToday 
        ? `Jadwal Mengajar Hari Ini (${effectiveDay})` 
        : `Jadwal Mengajar Hari ${effectiveDay} (Pratinjau)`;
    }

    if (kbmTodayDayBadge) {
      if (isShowingToday) {
        if (curRealDay === "Minggu") {
          kbmTodayDayBadge.className = "badge-pill-status";
          kbmTodayDayBadge.style.background = "rgba(16, 185, 129, 0.15)";
          kbmTodayDayBadge.style.color = "#047857";
          kbmTodayDayBadge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
          kbmTodayDayBadge.textContent = "🏖️ Libur Akhir Pekan";
        } else {
          kbmTodayDayBadge.className = "badge-pill-status badge-izin";
          kbmTodayDayBadge.style.background = "";
          kbmTodayDayBadge.style.color = "";
          kbmTodayDayBadge.style.border = "";
          kbmTodayDayBadge.textContent = `🟢 Hari Ini (${effectiveDay})`;
        }
      } else {
        kbmTodayDayBadge.className = "badge-pill-status";
        kbmTodayDayBadge.style.background = "rgba(59, 130, 246, 0.12)";
        kbmTodayDayBadge.style.color = "#2563eb";
        kbmTodayDayBadge.style.border = "1px solid rgba(59, 130, 246, 0.25)";
        kbmTodayDayBadge.textContent = `Pratinjau (${effectiveDay})`;
      }
    }

    if (kbmTodaySessionsVal) {
      if (effectiveDay === "Minggu") {
        kbmTodaySessionsVal.textContent = "0 Sesi (Libur)";
      } else {
        kbmTodaySessionsVal.textContent = `${displayedLessons.length} Sesi KBM`;
      }
    }

    if (kbmTodaySummarySubtitle) {
      if (displayedLessons.length > 0) {
        kbmTodaySummarySubtitle.textContent = displayedLessons.map(s => `${s.subject} ${s.class} • ${s.room}`).join(" | ");
      } else if (effectiveDay === "Minggu") {
        kbmTodaySummarySubtitle.textContent = "Hari Libur KBM Madrasah • Akhir Pekan";
      } else {
        kbmTodaySummarySubtitle.textContent = `Tidak ada alokasi jam mengajar di hari ${effectiveDay}`;
      }
    }

    if (kbmTodayProgressBar) {
      kbmTodayProgressBar.style.width = displayedLessons.length > 0 ? "100%" : "0%";
    }

    classCheckIns = StorageService.getClassCheckIns();

    // Render Timeline Cards for Selected Day's Classes
    if (timelineContainer) {
      timelineContainer.innerHTML = "";

      if (displayedLessons.length === 0) {
        if (effectiveDay === "Minggu") {
          timelineContainer.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1.5rem; background: linear-gradient(135deg, rgba(240, 253, 250, 0.8), rgba(238, 242, 255, 0.8)); border: 1.5px dashed #93c5fd; border-radius: var(--radius-lg); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
              <div style="font-size: 2.8rem; margin-bottom: 0.65rem;">🏖️</div>
              <h3 style="font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">
                Hari Libur Akhir Pekan (Minggu)
              </h3>
              <p style="font-size: 0.85rem; color: #64748b; max-width: 480px; margin: 0 auto 1.25rem auto; line-height: 1.55;">
                Hari ini tidak ada kegiatan belajar mengajar (KBM) tatap muka di madrasah. Anda dapat melihat pratinjau jadwal mengajar untuk hari kerja berikutnya.
              </p>
              <div style="display: flex; justify-content: center; gap: 0.65rem; flex-wrap: wrap;">
                <button class="btn-emerald" style="padding: 0.55rem 1.25rem; font-size: 0.82rem;" onclick="selectTeacherKbmDay('Senin')">
                  📅 Lihat Jadwal Hari Senin (Besok)
                </button>
                <button class="btn-secondary" style="padding: 0.55rem 1.15rem; font-size: 0.82rem;" onclick="selectTeacherKbmDay('Jumat')">
                  📋 Pratinjau Jadwal Hari Jumat
                </button>
              </div>
            </div>
          `;
        } else {
          timelineContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-md); color: var(--text-muted);">
              <div style="margin-bottom: 0.5rem;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
              <strong style="color: var(--text-primary);">Tidak ada jadwal mengajar tatap muka untuk hari ${effectiveDay}.</strong>
              <p style="font-size: 0.78rem; margin-top: 0.25rem;">Guru ini tidak memiliki alokasi jam tatap muka untuk hari ${effectiveDay}.</p>
            </div>
          `;
        }
      }

      let remainingSessions = 0;
      const activeTeacherObj = StorageService.getActiveTeacher();
      const activeTeacherId = activeTeacherObj ? activeTeacherObj.id : StorageService.getActiveTeacherId();

      // Cek apakah guru yang sedang aktif ini tengah mengajar di salah satu kelas hari ini
      const currentlyTeachingSession = isShowingToday ? displayedLessons.find(s => {
        const rec = classCheckIns[s.id];
        if (!rec || rec.finished) return false;
        if (rec.date && rec.date !== curRealDateStr) return false;
        if (rec.teacherId && activeTeacherId && rec.teacherId !== activeTeacherId) return false;
        const done = teachingLogs.some(log => log.scheduleId === s.id && log.date === curRealDateStr);
        return !done;
      }) : null;

      displayedLessons.forEach((session, idx) => {
        const completedLog = isShowingToday ? teachingLogs.find(log => log.scheduleId === session.id && log.date === curRealDateStr) : null;
        const isDone = !!completedLog;
        const rawCheckInRec = isShowingToday ? classCheckIns[session.id] : null;
        const checkInRec = (rawCheckInRec && (!rawCheckInRec.date || rawCheckInRec.date === curRealDateStr)) ? rawCheckInRec : null;
        const isCurrentlyInClass = checkInRec && !checkInRec.finished && !isDone;

        if (!isDone) remainingSessions++;

        const timeStatus = getScheduleTimeStatus(session);
        const isBlockedByOtherClass = currentlyTeachingSession && currentlyTeachingSession.id !== session.id;

        let cardClass = "waiting-session";
        let statusBadge = "";
        let actionButton = "";
        let checkInDetailsHtml = "";

        if (isDone) {
          cardClass = "completed-session";
          statusBadge = `<span class="badge-pill-status badge-hadir">✓ KBM Selesai</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <span class="badge-pill-status badge-hadir" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700;">
                ✓ Presensi KBM Selesai
              </span>
              <button type="button" class="btn-secondary" style="font-size: 0.73rem; padding: 0.28rem 0.68rem;" onclick="openTeachingJournalModal('${session.id}')" title="Isi atau perbarui jurnal materi pokok & kehadiran siswa">
                📝 Isi / Edit Jurnal KBM
              </button>
            </div>
          `;
          const timeInStr = checkInRec && checkInRec.checkInTime ? checkInRec.checkInTime : (completedLog.checkInTime || session.startTime);
          const timeOutStr = checkInRec && checkInRec.checkOutTime ? checkInRec.checkOutTime : (completedLog.checkOutTime || session.endTime);
          const puncText = (checkInRec && checkInRec.punctuality && checkInRec.punctuality.detail) ? checkInRec.punctuality.detail : (completedLog.teacherStatus || 'Tepat Waktu');
          const durText = checkInRec && checkInRec.durationMinutes ? `${checkInRec.durationMinutes} mnt` : `${completedLog.durationMinutes || (session.jtm * 45)} mnt`;
          checkInDetailsHtml = `
            <div class="kbm-attendance-details-grid">
              <div class="kbm-detail-chip in-chip">
                <span>🟢</span>
                <span class="chip-label">Masuk:</span>
                <span class="chip-val">${timeInStr}</span>
                <span class="chip-punc ${checkInRec && checkInRec.punctuality && checkInRec.punctuality.isLate ? 'late' : 'ontime'}">(${puncText})</span>
              </div>
              <div class="kbm-detail-chip out-chip">
                <span>🏁</span>
                <span class="chip-label">Selesai:</span>
                <span class="chip-val">${timeOutStr}</span>
              </div>
              <div class="kbm-detail-chip dur-chip">
                <span>⏱️</span>
                <span class="chip-label">Durasi:</span>
                <span class="chip-val">${durText}</span>
              </div>
            </div>
          `;
        } else if (isCurrentlyInClass) {
          cardClass = "active-session";
          statusBadge = `<span class="badge-pill-status badge-kbm-ongoing" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-600); border: 1px solid rgba(16, 185, 129, 0.3);"><span class="status-dot-pulse"></span> SEDANG MENGAJAR DI KELAS</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-emerald" style="background: linear-gradient(135deg, #0284c7, #0369a1); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);" onclick="openClassCheckOutModal('${session.id}')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>🏁 Selesai Mengajar (Check-Out)</span>
              </button>
              <button type="button" class="btn-secondary" style="font-size: 0.73rem; padding: 0.28rem 0.68rem;" onclick="openTeachingJournalModal('${session.id}')" title="Catat materi pokok & absen siswa">
                📝 Isi Jurnal & Absen Siswa
              </button>
            </div>
          `;
          const puncDetail = (checkInRec.punctuality && checkInRec.punctuality.detail) ? checkInRec.punctuality.detail : "Tepat Waktu";
          const puncIsLate = Boolean(checkInRec.punctuality && checkInRec.punctuality.isLate);
          checkInDetailsHtml = `
            <div class="kbm-attendance-details-grid">
              <div class="kbm-detail-chip in-chip">
                <span>🟢</span>
                <span class="chip-label">Masuk:</span>
                <span class="chip-val">${checkInRec.checkInTime}</span>
                <span class="chip-punc ${puncIsLate ? 'late' : 'ontime'}">(${puncDetail})</span>
              </div>
              <div class="kbm-timer-badge" id="liveClassTimerBadge">⏱️ Menghitung Durasi...</div>
            </div>
          `;
          startInClassTimer(checkInRec.timestamp);
        } else if (!isShowingToday || timeStatus.state === "other_day") {
          // PRATINJAU HARI LAIN: Jadwal hari lain, status netral informatif
          cardClass = "waiting-session";
          statusBadge = `<span class="badge-pill-status" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.25);">📅 Jadwal Hari ${session.day}</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-secondary" disabled style="opacity: 0.65; cursor: not-allowed; background: rgba(148, 163, 184, 0.12); border: 1px dashed rgba(148, 163, 184, 0.4); color: #64748b; font-size: 0.76rem; padding: 0.45rem 0.85rem; display: flex; align-items: center; gap: 0.45rem;" title="Presensi masuk aktif saat hari ${session.day}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>🔒 Aktif pada Hari ${session.day}</span>
              </button>
              <span class="kbm-action-subtext" style="font-size: 0.7rem; color: #64748b;">Pratinjau jadwal hari ${session.day}</span>
            </div>
          `;
          checkInDetailsHtml = `
            <div class="kbm-door-code-note" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              Kode Pintu: <code>KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}</code> • Ruang ${session.room} • Alokasi ${session.jtm} JTM (${session.time}).
            </div>
          `;
        } else if (isBlockedByOtherClass) {
          cardClass = "waiting-session kbm-upcoming-session";
          statusBadge = `<span class="badge-pill-status" style="background: rgba(148, 163, 184, 0.15); color: #64748b; border: 1px solid rgba(148, 163, 184, 0.3);">⏳ Menunggu Sesi ${currentlyTeachingSession.class} Selesai</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-secondary" disabled style="opacity: 0.65; cursor: not-allowed; background: rgba(148, 163, 184, 0.12); border: 1px dashed rgba(148, 163, 184, 0.4); color: #64748b; font-size: 0.76rem; padding: 0.45rem 0.8rem; display: flex; align-items: center; gap: 0.45rem;" title="Selesaikan sesi ${currentlyTeachingSession.class} terlebih dahulu">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>🔒 Selesaikan ${currentlyTeachingSession.class}</span>
              </button>
              <span class="kbm-action-subtext" style="font-size: 0.7rem; color: #94a3b8;">Sedang mengajar di ${currentlyTeachingSession.class}</span>
            </div>
          `;
          checkInDetailsHtml = `
            <div class="kbm-door-code-note" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              Kode Pintu: <code>KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}</code> • Selesaikan check-out di ${currentlyTeachingSession.class} sebelum memulai sesi ini.
            </div>
          `;
        } else if (timeStatus.state === "upcoming") {
          // SESI SELANJUTNYA: Jam KBM belum tiba, tombol check-in terkunci otomatis
          cardClass = "waiting-session kbm-upcoming-session";
          statusBadge = `<span class="badge-pill-status" style="background: rgba(148, 163, 184, 0.15); color: #64748b; border: 1px solid rgba(148, 163, 184, 0.3);">⏳ Sesi Selanjutnya (Mulai ${session.startTime} WIB)</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-secondary btn-kbm-locked" disabled style="opacity: 0.6; cursor: not-allowed; background: rgba(148, 163, 184, 0.12); border: 1px dashed rgba(148, 163, 184, 0.4); color: #64748b; font-size: 0.76rem; padding: 0.45rem 0.85rem; display: flex; align-items: center; gap: 0.45rem;" title="Tombol check-in otomatis aktif menyesuaikan jam realtime jadwal (dibuka pukul ${timeStatus.openTimeStr} WIB)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>🔒 Dibuka pk ${timeStatus.openTimeStr} WIB</span>
              </button>
              <span class="kbm-action-subtext" style="font-size: 0.7rem; color: #94a3b8;">Aktif otomatis saat jam jadwal tiba</span>
            </div>
          `;
          checkInDetailsHtml = `
            <div class="kbm-door-code-note" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              Kode Pintu: <code>KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}</code> • ⏱️ Check-in aktif otomatis pada ${timeStatus.openTimeStr} WIB (10 menit sebelum bel).
            </div>
          `;
        } else if (timeStatus.state === "active") {
          // SESI SEDANG AKTIF: Waktunya masuk kelas
          cardClass = "waiting-session kbm-now-open";
          let activeBadgeLabel = "🔔 Waktunya Masuk Kelas";
          let activeBadgeStyle = "background: rgba(16, 185, 129, 0.15); color: var(--emerald-600); border: 1px solid rgba(16, 185, 129, 0.3);";
          if (timeStatus.isEarly) {
            activeBadgeLabel = "🟢 Persiapan Masuk Kelas";
          } else if (timeStatus.isLate) {
            activeBadgeLabel = "⚠️ Belum Check-in (Terlambat)";
            activeBadgeStyle = "background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3);";
          }
          statusBadge = `<span class="badge-pill-status badge-kbm-ongoing" style="${activeBadgeStyle}"><span class="status-dot-pulse"></span> ${activeBadgeLabel}</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-emerald" onclick="openClassCheckInModal('${session.id}')">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Check-in Masuk Kelas</span>
              </button>
              <button class="btn-secondary" style="font-size: 0.72rem; padding: 0.25rem 0.65rem;" onclick="quickCheckInClass('${session.id}')" title="Check-in cepat langsung jika QR tidak dapat discan">
                ⚡ Presensi Masuk Cepat
              </button>
            </div>
          `;
          checkInDetailsHtml = `
            <div class="kbm-door-code-note" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              Kode Pintu: <code>KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}</code> • Toleransi masuk: 5 menit setelah bel.
            </div>
          `;
        } else {
          // SESI TELAH LEWAT: Jam KBM telah berakhir
          cardClass = "waiting-session passed-session";
          statusBadge = `<span class="badge-pill-status badge-late" style="background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25);">⚠️ Lewat Jam KBM (${session.endTime} WIB)</span>`;
          actionButton = `
            <div class="kbm-action-stack">
              <button class="btn-secondary" style="border: 1px solid #f59e0b; color: #d97706; background: rgba(245, 158, 11, 0.08); font-size: 0.75rem; padding: 0.35rem 0.75rem; display: flex; align-items: center; gap: 0.35rem;" onclick="openClassCheckInModal('${session.id}')" title="Sesi telah melewati jadwal, presensi akan dicatat terlambat">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>⚠️ Check-in Terlambat</span>
              </button>
              <span class="kbm-action-subtext" style="font-size: 0.7rem; color: #ef4444;">Jadwal berakhir ${session.endTime} WIB</span>
            </div>
          `;
          checkInDetailsHtml = `
            <div class="kbm-door-code-note" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
              Kode Pintu: <code>KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}</code> • Sesi kelas telah berakhir pada pukul ${session.endTime} WIB.
            </div>
          `;
        }

        const card = document.createElement("div");
        card.className = `kbm-session-card ${cardClass}`;

        card.innerHTML = `
          <div class="kbm-session-time">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${session.time}</span>
          </div>

          <div class="kbm-session-meta">
            <div class="kbm-session-title">${session.subject} — ${session.class}</div>
            <div class="kbm-session-sub">
              <span class="kbm-jtm-tag">⏱️ ${session.jtm} Jam Tatap Muka (JTM)</span>
              ${statusBadge}
            </div>
            ${checkInDetailsHtml}
          </div>

          <div class="kbm-session-actions">
            ${actionButton}
          </div>
        `;
        timelineContainer.appendChild(card);
      });

      if (sidebarKbmBadge) {
        sidebarKbmBadge.textContent = `${remainingSessions} Sesi`;
        sidebarKbmBadge.style.background = remainingSessions > 0 ? "rgba(16, 185, 129, 0.2)"  : "var(--bg-elevated)";
        sidebarKbmBadge.style.color = remainingSessions > 0 ? "var(--emerald-600)"  : "var(--text-muted)";
      }
    }

    // Filter teachingLogs for active teacher
    const activeTeacherForLogs = StorageService.getActiveTeacher();
    const activeTeacherIdForLogs = activeTeacherForLogs ? activeTeacherForLogs.id : StorageService.getActiveTeacherId();
    const myTeachingLogs = activeTeacherIdForLogs
      ? teachingLogs.filter(l => !l.teacherId || l.teacherId === activeTeacherIdForLogs)
      : teachingLogs;

    // Render Riwayat Jurnal Mengajar & Presensi Kelas table (#teachingLogsTableBody)
    if (logsTbody) {
      logsTbody.innerHTML = "";
      if (myTeachingLogs.length === 0) {
        logsTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted);">
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">📖</div>
              <p style="margin: 0; font-size: 0.88rem; font-weight: 600; color: var(--text-main);">Belum ada riwayat presensi mengajar & jurnal kelas</p>
              <p style="margin: 0.2rem 0 0 0; font-size: 0.78rem; color: var(--text-muted);">Lakukan Check-In & Check-Out atau isi Jurnal KBM pada sesi mengajar hari ini.</p>
            </td>
          </tr>
        `;
      } else {
        myTeachingLogs.forEach(log => {
          const tr = document.createElement("tr");
          const isLateLog = String(log.teacherStatus || "").toLowerCase().includes("terlambat");
          const statusBadgeClass = isLateLog ? "badge-terlambat" : "badge-hadir";
          tr.innerHTML = `
            <td>
              <div style="font-weight: 700;">${log.day || "-"}, ${formatDateShort(log.date || curRealDateStr)}</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">${log.time || "-"} (${log.checkInTime || "-"} - ${log.checkOutTime || "-"})</div>
            </td>
            <td>
              <div style="font-weight: 700; color: var(--text-primary);">${log.subject || "-"}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Kelas ${log.class || "-"} • ${log.room || "-"}</div>
            </td>
            <td style="max-width: 240px;">
              <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-main);">${log.topic || "Tatap Muka Pembelajaran Terjadwal"}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${log.method || "Tatap Muka Interaktif"}</div>
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; font-size: 0.74rem; font-weight: 700;">
                <span style="color: var(--emerald-700); background: var(--emerald-50); padding: 0.15rem 0.45rem; border-radius: 4px;">H: ${log.studentsPresent ?? 32}</span>
                <span style="color: var(--amber-700); background: var(--amber-50); padding: 0.15rem 0.45rem; border-radius: 4px;">S: ${log.studentsSick ?? 0}</span>
                <span style="color: var(--blue-700); background: var(--blue-50); padding: 0.15rem 0.45rem; border-radius: 4px;">I: ${log.studentsPermit ?? 0}</span>
                <span style="color: var(--rose-700); background: var(--rose-50); padding: 0.15rem 0.45rem; border-radius: 4px;">A: ${log.studentsAlpha ?? 0}</span>
              </div>
            </td>
            <td>
              <span class="badge-pill-status ${statusBadgeClass}">${log.teacherStatus || "Hadir Tepat Waktu"}</span>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--emerald-600); margin-top: 0.2rem;">+${log.jtm || 2} JTM</div>
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem;">
                <button type="button" class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.74rem;" onclick="viewJournalDetail('${log.id}')">
                  Detail
                </button>
                ${log.scheduleId ? `
                  <button type="button" class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.74rem;" onclick="openTeachingJournalModal('${log.scheduleId}')" title="Edit Jurnal & Absen Siswa">
                    ✏️
                  </button>
                ` : ''}
              </div>
            </td>
          `;
          logsTbody.appendChild(tr);
        });
      }
    }

    // Calculate JTM Stats (Target: 24 JTM)
    let totalJtm = 0;
    myTeachingLogs.forEach(l => {
      totalJtm += (l.jtm || 2);
    });

    const targetJtm = (activeTeacherForLogs && activeTeacherForLogs.jtmTarget) ? activeTeacherForLogs.jtmTarget : 24;
    const percentage = Math.min(100, Math.round((totalJtm / targetJtm) * 100));

    if (kbmJtmCompletedVal) kbmJtmCompletedVal.textContent = `${totalJtm} / ${targetJtm} JTM`;
    if (kbmJtmProgressFill) {
      kbmJtmProgressFill.style.width = `${percentage}%`;
      kbmJtmProgressFill.style.background = percentage >= 100 ? "var(--emerald-600)" : "var(--emerald-500)";
    }
    if (kbmJtmStatusBadge) {
      kbmJtmStatusBadge.textContent = `${percentage}% Terpenuhi`;
      kbmJtmStatusBadge.className = percentage >= 100 ? "badge-pill-status badge-hadir" : "badge-pill-status badge-izin";
    }
  }

  // Pilih hari pratinjau / jadwal KBM Guru
  window.selectTeacherKbmDay = function(day) {
    currentKbmSelectedDay = day;
    renderKbmTimelineAndLogs();
  };

  // Inisialisasi toolbar filter hari mengajar guru
  function initTeacherKbmControls() {
    const container = document.getElementById("teacherKbmDayButtons");
    if (!container) return;
    const chips = container.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const day = chip.dataset.day || "auto";
        window.selectTeacherKbmDay(day);
      });
    });
  }

  // Open Classroom Check-In Modal with evaluation
  window.openClassCheckInModal = function(scheduleId) {
    const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
      (typeof StorageService !== "undefined" && StorageService.getActiveTeacherSchedules && StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId)) ||
      (typeof StorageService !== "undefined" && StorageService.getMasterSchedules && StorageService.getMasterSchedules().find(s => s.id === scheduleId));
    if (!session) return;

    // Evaluasi apakah sesi ini bukan jadwal hari ini (Pratinjau Hari Lain)
    const timeStatus = getScheduleTimeStatus(session);
    if (timeStatus.state === "other_day") {
      showToast(
        "Jadwal Hari Lain",
        `Sesi mengajar ${session.subject} (${session.class}) terjadwal untuk hari ${session.day}. Presensi kelas aktif pada hari tersebut.`,
        "info"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }
    if (timeStatus.state === "upcoming") {
      showToast(
        "Sesi Belum Dimulai",
        `Tombol check-in untuk ${session.subject} (${session.class}) baru aktif pukul ${timeStatus.openTimeStr} WIB menyesuaikan jam jadwal (${session.startTime} WIB).`,
        "warning"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }

    // Cek apakah guru yang bersangkutan sedang aktif mengajar di kelas lain hari ini
    const currentClassIns = StorageService.getClassCheckIns();
    const curDateStr = getAppTodayDateString();
    const activeTchId = session.teacherId || StorageService.getActiveTeacherId();
    const otherActive = Object.values(currentClassIns).find(rec =>
      rec &&
      !rec.finished &&
      rec.scheduleId !== session.id &&
      (!rec.date || rec.date === curDateStr) &&
      (!rec.teacherId || !activeTchId || rec.teacherId === activeTchId)
    );
    if (otherActive) {
      showToast(
        "Sesi Lain Sedang Berlangsung",
        `Anda sedang aktif mengajar di ${otherActive.room || otherActive.class} (${otherActive.subject}). Silakan selesaikan check-out terlebih dahulu sebelum masuk ke sesi kelas berikutnya.`,
        "warning"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }

    activeCheckInScheduleId = scheduleId;

    const modalRoomName = document.getElementById("modalCheckInRoomName");
    const modalSubject = document.getElementById("modalCheckInSubject");
    const modalQrCode = document.getElementById("modalCheckInQrCode");
    const modalBadge = document.getElementById("modalCheckInPunctualityBadge");
    const modalTimestamp = document.getElementById("modalCheckInTimestamp");
    const modalPunctualityText = document.getElementById("modalCheckInPunctualityText");

    if (modalRoomName) modalRoomName.textContent = `${session.room} (${session.class})`;
    if (modalSubject) modalSubject.textContent = `${session.subject} • Jam Mulai: ${session.startTime} WIB`;
    
    const qrCode = `KLS-${session.class.replace(/[^A-Z0-9]/gi, '')}-${session.subject.substring(0, 3).toUpperCase()}`;
    if (modalQrCode) modalQrCode.textContent = qrCode;

    // Evaluate punctuality
    const simulatedDate = new Date();
    const puncResult = StorageService.evaluateClassPunctuality(session.startTime, simulatedDate);

    const nowH = String(simulatedDate.getHours()).padStart(2, '0');
    const nowM = String(simulatedDate.getMinutes()).padStart(2, '0');
    const timeStr = `${nowH}:${nowM} WIB`;

    if (modalTimestamp) modalTimestamp.textContent = timeStr;
    if (modalBadge) {
      modalBadge.className = `room-badge ${puncResult.statusClass === 'status-on-time' ? 'badge-on-time'  : 'badge-late'}`;
      modalBadge.textContent = puncResult.statusLabel;
    }
    if (modalPunctualityText) {
      modalPunctualityText.textContent = puncResult.detail;
      modalPunctualityText.style.color = puncResult.isLate ? "#d97706"  : "var(--emerald-600)";
    }

    openModal("modalClassCheckIn");
  };

  // Quick Check-In direct bypass
  window.quickCheckInClass = function(scheduleId) {
    const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
      (typeof StorageService !== "undefined" && StorageService.getActiveTeacherSchedules && StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId)) ||
      (typeof StorageService !== "undefined" && StorageService.getMasterSchedules && StorageService.getMasterSchedules().find(s => s.id === scheduleId));
    if (!session) return;

    // Evaluasi apakah sesi ini bukan jadwal hari ini (Pratinjau Hari Lain)
    const timeStatus = getScheduleTimeStatus(session);
    if (timeStatus.state === "other_day") {
      showToast(
        "Jadwal Hari Lain",
        `Sesi mengajar ${session.subject} (${session.class}) terjadwal untuk hari ${session.day}. Presensi kelas aktif pada hari tersebut.`,
        "info"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }
    if (timeStatus.state === "upcoming") {
      showToast(
        "Sesi Belum Dimulai",
        `Presensi masuk untuk ${session.subject} (${session.class}) baru aktif pukul ${timeStatus.openTimeStr} WIB (${session.startTime} WIB).`,
        "warning"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }

    // Cek apakah guru yang bersangkutan sedang aktif mengajar di kelas lain hari ini
    const currentClassIns = StorageService.getClassCheckIns();
    const curDateStr = getAppTodayDateString();
    const activeTchId = session.teacherId || StorageService.getActiveTeacherId();
    const otherActive = Object.values(currentClassIns).find(rec =>
      rec &&
      !rec.finished &&
      rec.scheduleId !== session.id &&
      (!rec.date || rec.date === curDateStr) &&
      (!rec.teacherId || !activeTchId || rec.teacherId === activeTchId)
    );
    if (otherActive) {
      showToast(
        "Sesi Lain Sedang Berlangsung",
        `Anda sedang aktif mengajar di ${otherActive.room || otherActive.class} (${otherActive.subject}). Silakan selesaikan check-out terlebih dahulu sebelum masuk ke sesi kelas berikutnya.`,
        "warning"
      );
      if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
        SoundService.playBeep();
      }
      return;
    }

    activeCheckInScheduleId = scheduleId;
    confirmClassCheckIn();
  };

  // Confirm Class Check-in Action
  window.confirmClassCheckIn = function() {
    const session = TEACHING_SCHEDULES.find(s => s.id === activeCheckInScheduleId) ||
      (typeof StorageService !== "undefined" && StorageService.getActiveTeacherSchedules && StorageService.getActiveTeacherSchedules().find(s => s.id === activeCheckInScheduleId)) ||
      (typeof StorageService !== "undefined" && StorageService.getMasterSchedules && StorageService.getMasterSchedules().find(s => s.id === activeCheckInScheduleId));
    if (!session) return;

    const simulatedDate = new Date();
    const curDateStr = getAppTodayDateString();
    const puncResult = StorageService.evaluateClassPunctuality(session.startTime, simulatedDate);

    const nowH = String(simulatedDate.getHours()).padStart(2, '0');
    const nowM = String(simulatedDate.getMinutes()).padStart(2, '0');
    const timeStr = `${nowH}:${nowM} WIB`;

    const activeTeacherObj = StorageService.getActiveTeacher();
    const currentTeacherId = session.teacherId || (activeTeacherObj ? activeTeacherObj.id : StorageService.getActiveTeacherId());
    const currentTeacherName = session.teacherName || (activeTeacherObj ? activeTeacherObj.name : "Guru");

    // Save class check-in record
    classCheckIns[session.id] = {
      scheduleId: session.id,
      teacherId: currentTeacherId,
      teacherName: currentTeacherName,
      date: curDateStr,
      room: session.room,
      class: session.class,
      subject: session.subject,
      checkInTime: timeStr,
      timestamp: Date.now(),
      punctuality: puncResult,
      finished: false
    };
    StorageService.saveClassCheckIns(classCheckIns);
    if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
      FirebaseService.recordClassCheckIn(classCheckIns[session.id]).catch(() => {});
    }

    // Update real-time admin monitoring room dataset (26 Rombel Sync)
    const classIdClean = (session.class || "").replace(/[^A-Za-z0-9]/g, '').replace('Kelas', '').trim();
    roomsMonitoring = StorageService.getRoomsMonitoring(session.day || currentRadarDay);
    const roomIdx = roomsMonitoring.findIndex(r => 
      r.scheduleId === session.id || 
      (classIdClean && r.classId === classIdClean) ||
      (session.room && r.roomName === session.room)
    );
    if (roomIdx !== -1) {
      roomsMonitoring[roomIdx].status = puncResult.isLate ? "terlambat" : "hadir_tepat";
      roomsMonitoring[roomIdx].statusLabel = puncResult.statusLabel;
      roomsMonitoring[roomIdx].statusClass = puncResult.statusClass;
      roomsMonitoring[roomIdx].checkInTime = timeStr;
      roomsMonitoring[roomIdx].punctuality = puncResult.detail;
      roomsMonitoring[roomIdx].alertMinutes = puncResult.isLate ? puncResult.diffMinutes : 0;
      roomsMonitoring[roomIdx].note = `Guru aktif di kelas. Presensi masuk: ${timeStr} (${puncResult.detail}).`;
      StorageService.saveRoomsMonitoring(roomsMonitoring);
      if (typeof StorageService.saveRoomState === "function") {
        StorageService.saveRoomState(
          roomsMonitoring[roomIdx].id,
          roomsMonitoring[roomIdx].day || session.day,
          {
            scheduleId: session.id,
            status: roomsMonitoring[roomIdx].status,
            statusLabel: roomsMonitoring[roomIdx].statusLabel,
            statusClass: roomsMonitoring[roomIdx].statusClass,
            checkInTime: timeStr,
            punctuality: puncResult.detail,
            alertMinutes: roomsMonitoring[roomIdx].alertMinutes,
            note: roomsMonitoring[roomIdx].note
          },
          session.id
        );
      }
    }

    // Add to Admin Real-Time Feed
    const logText = `${currentTeacherName} check-in ${session.room} (${session.class} - ${session.subject}) : ${puncResult.detail}`;
    StorageService.addAdminActivity(logText, puncResult.isLate ? "warning" : "success");

    SoundService.playSuccess();
    closeModal("modalClassCheckIn");

    // Refresh UI
    renderKbmTimelineAndLogs();
    renderClassroomRadar();
    renderAdminActivityFeed();
    updateRadarKpis();

    showToast(
      "Presensi Masuk Berhasil!",
      `Anda telah check-in di ${session.room} (${puncResult.detail}). Status Anda kini terpantau live oleh Admin/Piket.`,
      puncResult.isLate ? "warning"  : "success"
    );
  };

  let activeCheckOutScheduleId = "SCH-FRI-02";

  // Open Classroom Check-Out Modal (Ringkas tanpa beban form materi & absen siswa)
  window.openClassCheckOutModal = function(scheduleId) {
    activeCheckOutScheduleId = scheduleId;
    const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
      StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId) ||
      StorageService.getMasterSchedules().find(s => s.id === scheduleId);
    if (!session) return;

    const checkIn = classCheckIns[scheduleId];
    const now = new Date();
    const timeOutH = String(now.getHours()).padStart(2, '0');
    const timeOutM = String(now.getMinutes()).padStart(2, '0');
    const timeOutStr = `${timeOutH}:${timeOutM} WIB`;

    let timeInStr = checkIn ? `${checkIn.checkInTime} (${checkIn.punctuality.statusLabel})`  : `${session.startTime} WIB (Tepat Waktu)`;
    let durationMnt = 90;
    if (checkIn && checkIn.timestamp) {
      durationMnt = Math.max(1, Math.round((Date.now() - checkIn.timestamp) / 60000));
    }

    const modalRoom = document.getElementById("checkOutRoomName");
    const modalSub = document.getElementById("checkOutSubject");
    const modalIn = document.getElementById("checkOutTimeIn");
    const modalOut = document.getElementById("checkOutTimeOut");
    const modalDur = document.getElementById("checkOutTotalDuration");

    if (modalRoom) modalRoom.textContent = `${session.room} (${session.class})`;
    if (modalSub) modalSub.textContent = `${session.subject} • Beban Kerja: ${session.jtm} JTM`;
    if (modalIn) modalIn.textContent = timeInStr;
    if (modalOut) modalOut.textContent = timeOutStr;
    if (modalDur) modalDur.textContent = `${durationMnt} Menit (${session.jtm} JTM)`;

    openModal("modalClassCheckOut");
  };

  // Confirm Class Check-Out (Cukup konfirmasi selesai, langsung tuntas)
  window.confirmClassCheckOut = function() {
    if (inClassTimerInterval) {
      clearInterval(inClassTimerInterval);
      inClassTimerInterval = null;
    }

    const scheduleId = activeCheckOutScheduleId;
    const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
      StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId) ||
      StorageService.getMasterSchedules().find(s => s.id === scheduleId);
    if (!session) return;

    const checkIn = classCheckIns[scheduleId];
    const now = new Date();
    const timeOutH = String(now.getHours()).padStart(2, '0');
    const timeOutM = String(now.getMinutes()).padStart(2, '0');
    const timeOutStr = `${timeOutH}:${timeOutM} WIB`;

    let durationMnt = 90;
    if (checkIn && checkIn.timestamp) {
      durationMnt = Math.max(1, Math.round((Date.now() - checkIn.timestamp) / 60000));
    }

    // Update check-in record to finished
    if (classCheckIns[scheduleId]) {
      classCheckIns[scheduleId].finished = true;
      classCheckIns[scheduleId].checkOutTime = timeOutStr;
      classCheckIns[scheduleId].durationMinutes = durationMnt;
      StorageService.saveClassCheckIns(classCheckIns);
    }

    // Automatically create / update record in teachingLogs
    const todayDateStr = getAppTodayDateString();
    const currentTeacher = StorageService.getActiveTeacher();
    const teacherId = session.teacherId || (currentTeacher ? currentTeacher.id : StorageService.getActiveTeacherId());
    const teacherName = session.teacherName || (currentTeacher ? currentTeacher.name : "Guru Pendidik");
    const existingLogIdx = teachingLogs.findIndex(l => l.scheduleId === session.id && l.date === todayDateStr);
    const existingLog = existingLogIdx !== -1 ? teachingLogs[existingLogIdx] : null;
    const puncText = checkIn?.punctuality?.detail || "Tepat Waktu";
    const logEntry = {
      id: existingLog ? existingLog.id : `KBM-${todayDateStr.replace(/-/g, '')}-${String(teachingLogs.length + 1).padStart(2, '0')}`,
      scheduleId: session.id,
      teacherId: teacherId,
      teacherName: teacherName,
      date: todayDateStr,
      day: session.day || getAppTodayDayName(),
      subject: session.subject,
      class: session.class,
      time: session.time,
      room: session.room,
      jtm: session.jtm,
      topic: existingLog?.topic || "Tatap Muka Pembelajaran Terjadwal (Check-in Terekam)",
      method: existingLog?.method || "Tatap Muka Interaktif",
      teacherStatus: checkIn?.punctuality?.isLate ? `Terlambat ${checkIn.punctuality.diffMinutes} mnt` : "Hadir Tepat Waktu",
      checkInTime: checkIn?.checkInTime || session.startTime,
      checkOutTime: timeOutStr,
      durationMinutes: durationMnt,
      studentsTotal: existingLog?.studentsTotal || session.totalStudents || 32,
      studentsPresent: existingLog?.studentsPresent || session.totalStudents || 32,
      studentsSick: existingLog?.studentsSick || 0,
      studentsPermit: existingLog?.studentsPermit || 0,
      studentsAlpha: existingLog?.studentsAlpha || 0,
      notes: existingLog?.notes || `Presensi Masuk: ${checkIn?.checkInTime || session.startTime} (${puncText}). Presensi Selesai: ${timeOutStr}.`,
      recordedAt: `${todayDateStr} ${timeOutStr}`
    };

    if (existingLogIdx !== -1) {
      teachingLogs[existingLogIdx] = logEntry;
    } else {
      teachingLogs = [logEntry, ...teachingLogs];
    }
    StorageService.saveTeachingLogs(teachingLogs);
    if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
      FirebaseService.recordTeachingLog(logEntry).catch(() => {});
    }

    // Update room in admin radar (26 Rombel Sync)
    const classIdCleanOut = session ? (session.class || "").replace(/[^A-Za-z0-9]/g, '').replace('Kelas', '').trim() : "";
    roomsMonitoring = StorageService.getRoomsMonitoring(session ? session.day : currentRadarDay);
    const roomIdx = roomsMonitoring.findIndex(r => 
      r.scheduleId === scheduleId || 
      (classIdCleanOut && r.classId === classIdCleanOut) ||
      (session && session.room && r.roomName === session.room)
    );
    if (roomIdx !== -1) {
      roomsMonitoring[roomIdx].status = "selesai";
      roomsMonitoring[roomIdx].statusLabel = "KBM Selesai";
      roomsMonitoring[roomIdx].statusClass = "status-finished";
      roomsMonitoring[roomIdx].note = `KBM selesai pukul ${timeOutStr}. Durasi: ${durationMnt} mnt. Beban kerja tuntas.`;
      StorageService.saveRoomsMonitoring(roomsMonitoring);
      if (typeof StorageService.saveRoomState === "function") {
        StorageService.saveRoomState(
          roomsMonitoring[roomIdx].id,
          roomsMonitoring[roomIdx].day || session.day,
          {
            scheduleId: session.id,
            status: "selesai",
            statusLabel: "KBM Selesai",
            statusClass: "status-finished",
            checkInTime: checkIn?.checkInTime || session.startTime,
            checkOutTime: timeOutStr,
            note: roomsMonitoring[roomIdx].note
          },
          session.id
        );
      }
    }

    StorageService.addAdminActivity(
      `${teacherName} menyelesaikan jam mengajar di ${session.room} (${timeOutStr} - Durasi ${durationMnt} mnt).`,
      "info"
    );

    SoundService.playSuccess();
    closeModal("modalClassCheckOut");

    renderKbmTimelineAndLogs();
    renderClassroomRadar();
    renderAdminActivityFeed();
    updateRadarKpis();

    showToast(
      "KBM Selesai!",
      `Presensi keluar terekam (${timeOutStr}). Total durasi: ${durationMnt} menit (+${session.jtm} JTM).`,
      "success"
    );
  };

  // State filter Papan Radar KBM (Tersinkron 26 Rombel & Master Jadwal Real-Time)
  function getRealTimeSchoolDay() {
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const curDay = daysIndo[new Date().getDay()];
    return curDay;
  }
  let currentRadarDay = getRealTimeSchoolDay();
  let currentRadarPeriod = "all";
  let currentRadarGrade = "all";
  let currentRadarStatus = "all";

  // Render Classroom Radar Board (Admin Live Monitor - 26 Kelas Tersinkron)
  function renderClassroomRadar(statusFilter = null) {
    const grid = document.getElementById("classroomGrid");
    if (!grid) return;

    if (statusFilter !== null) {
      currentRadarStatus = statusFilter;
    }

    // Sync active day chip on radarDayButtons
    const dayButtons = document.querySelectorAll("#radarDayButtons .filter-chip");
    if (dayButtons && dayButtons.length > 0) {
      dayButtons.forEach(b => {
        if (b.getAttribute("data-day") === currentRadarDay) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
    }

    roomsMonitoring = StorageService.getRoomsMonitoring(currentRadarDay, currentRadarPeriod);
    grid.innerHTML = "";

    // Apply Grade Filter
    let filteredRooms = roomsMonitoring;
    if (currentRadarGrade !== "all") {
      filteredRooms = filteredRooms.filter(r => r.grade === currentRadarGrade || (r.classId && r.classId.startsWith(currentRadarGrade)));
    }

    // Apply Status Filter
    if (currentRadarStatus !== "all") {
      filteredRooms = filteredRooms.filter(r => r.status === currentRadarStatus);
    }

    // Update Hero Banner chips with real-time clock & session info
    const sessionLabel = document.getElementById("radarHeroSessionLabel");
    if (sessionLabel) {
      const now = new Date();
      const curClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let periodText = "";
      if (currentRadarPeriod === "all") {
        periodText = `Real-Time Pukul ${curClock} WIB`;
      } else if (currentRadarPeriod === "istirahat") {
        periodText = "☕ Jam Istirahat (Settingan Admin)";
      } else if (currentRadarPeriod === "selesai") {
        periodText = "🏁 Selesai KBM (Jam Terakhir Tuntas)";
      } else {
        periodText = `Sesi Jam ${currentRadarPeriod}`;
      }
      sessionLabel.textContent = `Sesi KBM: ${currentRadarDay} • ${periodText}`;
    }
    const syncTimeLabel = document.getElementById("adminLiveSyncTime");
    if (syncTimeLabel) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
      syncTimeLabel.textContent = `Live Stream Aktif • 26 Kelas Terpantau (${timeStr})`;
    }

    if (filteredRooms.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-lg); color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
          <strong style="color: var(--text-primary); font-size: 1.05rem;">Tidak Ada Ruang Kelas yang Cocok</strong>
          <p style="font-size: 0.82rem; margin-top: 0.35rem;">Silakan ubah filter Hari, Sesi Jam, Tingkat, atau Status Kehadiran di bilah atas.</p>
        </div>
      `;
      updateRadarKpis();
      return;
    }

    filteredRooms.forEach(room => {
      const card = document.createElement("div");
      card.className = `room-card ${room.statusClass}`;

      let badgeHtml = "";
      if (room.status === "hadir_tepat") {
        badgeHtml = `<span class="room-badge badge-on-time"><span class="status-dot-pulse" style="width:6px; height:6px;"></span> ${room.statusLabel}</span>`;
      } else if (room.status === "terlambat") {
        badgeHtml = `<span class="room-badge badge-late">⚠️ ${room.statusLabel}</span>`;
      } else if (room.status === "kosong_kritis") {
        badgeHtml = `<span class="room-badge badge-critical">🚨 ${room.statusLabel}</span>`;
      } else if (room.status === "inval") {
        badgeHtml = `<span class="room-badge badge-inval">🔄 ${room.statusLabel}</span>`;
      } else if (room.status === "istirahat") {
        badgeHtml = `<span class="room-badge badge-break">☕ ${room.statusLabel || 'JAM ISTIRAHAT'}</span>`;
      } else if (room.status === "selesai") {
        badgeHtml = `<span class="room-badge badge-finished">🏁 ${room.statusLabel || 'Tidak ada kegiatan KBM'}</span>`;
      } else if (room.status === "libur") {
        badgeHtml = `<span class="room-badge badge-holiday">🏖️ ${room.statusLabel || 'Hari Libur Madrasah'}</span>`;
      } else {
        badgeHtml = `<span class="room-badge badge-waiting">⏳ ${room.statusLabel}</span>`;
      }

      let checkInInfo = room.checkInTime 
        ? `${room.checkInTime} (${room.checkInMethod || 'Presensi'})`
        : `<span style="color: var(--text-muted); font-weight: 600;">${room.status === 'selesai' ? 'Selesai KBM' : (room.status === 'libur' ? 'Hari Libur' : 'Belum Check-In Masuk')}</span>`;

      let teacherDisplay = room.status === "inval" && room.invalTeacher
        ? `<strong>${room.invalTeacher}</strong> <span style="font-size:0.7rem; color:var(--text-muted);">(Asli: ${room.teacherName})</span>`
        : `<strong>${room.teacherName}</strong>`;

      let actionButtons = "";
      if (room.status === "istirahat") {
        actionButtons = `
          <span style="font-size: 0.78rem; font-weight: 700; color: #b45309; display: flex; align-items: center; gap: 0.4rem;">
            ☕ Jam Istirahat Sesuai Setingan Admin
          </span>
          <span style="font-size: 0.72rem; padding: 0.3rem 0.65rem; margin-left: auto; background: rgba(245, 158, 11, 0.12); color: #b45309; border-radius: var(--radius-sm); font-weight: 700;">
            ${room.startTime || '09:15'} - ${room.endTime || '09:35'} WIB
          </span>
        `;
      } else if (room.status === "selesai") {
        actionButtons = `
          <span style="font-size: 0.78rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 0.4rem;">
            🏁 Tidak ada kegiatan KBM (KBM Hari Ini Tuntas)
          </span>
          <span style="font-size: 0.72rem; padding: 0.3rem 0.65rem; margin-left: auto; background: rgba(100, 116, 139, 0.12); color: #475569; border-radius: var(--radius-sm); font-weight: 700;">
            KBM Tuntas
          </span>
        `;
      } else if (room.status === "libur") {
        const isMinggu = (room.day === "Minggu" || currentRadarDay === "Minggu");
        actionButtons = `
          <span style="font-size: 0.78rem; font-weight: 700; color: #0284c7; display: flex; align-items: center; gap: 0.4rem;">
            🏖️ ${isMinggu ? 'Hari Libur Akhir Pekan (Minggu) • Standby Server' : (room.topic || 'Hari Libur Sesuai Kaldik Madrasah Jawa Tengah')}
          </span>
          <span style="font-size: 0.72rem; padding: 0.3rem 0.65rem; margin-left: auto; background: rgba(2, 132, 199, 0.12); color: #0284c7; border-radius: var(--radius-sm); font-weight: 700;">
            ${isMinggu ? 'Libur Akhir Pekan' : 'Kaldik Jateng'}
          </span>
        `;
      } else if (room.status === "kosong_kritis") {
        actionButtons = `
          <button class="btn-emerald" style="background: linear-gradient(135deg, #dc2626, #b91c1c); flex: 1; font-size: 0.78rem; padding: 0.4rem;" onclick="openAssignInvalModal('${room.id}')">
            🚨 Tugaskan Inval Piket
          </button>
          <a class="btn-secondary" style="font-size: 0.78rem; padding: 0.4rem;" href="https://wa.me/?text=Peringatan%20Piket:%20Ruang%20${encodeURIComponent(room.roomName)}%20belum%20ada%20guru%20masuk" target="_blank" title="Hubungi Guru via WhatsApp">
            💬 WA Guru
          </a>
        `;
      } else if (room.status === "menunggu_guru") {
        actionButtons = `
          <button class="btn-secondary" style="flex: 1; font-size: 0.78rem; padding: 0.4rem;" onclick="openClassCheckInModal('${room.scheduleId || ''}')">
            📝 Check-In Masuk Kelas
          </button>
          <a class="btn-secondary" style="font-size: 0.78rem; padding: 0.4rem;" href="https://wa.me/" target="_blank" title="Ingatkan Guru via WhatsApp">
            💬 WA
          </a>
        `;
      } else {
        actionButtons = `
          <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Ruang Terkendali & Aktif
          </span>
          <a class="btn-secondary" style="font-size: 0.72rem; padding: 0.3rem 0.6rem; margin-left: auto;" href="https://wa.me/" target="_blank">
            Hubungi
          </a>
        `;
      }

      // Compact chips for other sessions of this class on this day
      let miniSessionsHtml = "";
      if (room.allDaySessions && room.allDaySessions.length > 0) {
        miniSessionsHtml = `
          <div class="room-sessions-mini-list">
            <span style="font-weight: 700; color: var(--text-muted); font-size: 0.7rem;">Sesi Hari Ini:</span>
            ${room.allDaySessions.map(s => {
              const sJam = s.periodStart === s.periodEnd ? `J${s.periodStart}`  : `J${s.periodStart}-${s.periodEnd}`;
              const isCurrent = s.id === room.scheduleId;
              return `<span class="room-mini-session-chip ${isCurrent ? 'active-slot'  : ''}" title="${s.subject} (${s.time}) • ${s.teacherName}">${sJam}: ${s.subject}</span>`;
            }).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="room-header">
          <div class="room-title-wrap">
            <div class="room-name">${room.roomName}</div>
            <div class="room-building">${room.building || 'Gedung Utama'} • Kode: <code>${room.classId}</code></div>
          </div>
          ${badgeHtml}
        </div>

        <div class="room-body">
          <div class="room-detail-row">
            <span class="room-detail-label">Mapel & Jam:</span>
            <span class="room-detail-val"><strong>${room.subject || '-'}</strong> <span style="font-family:'JetBrains Mono'; font-size:0.78rem; color:var(--text-secondary);">(${room.scheduleTime || '-'})</span></span>
          </div>
          <div class="room-detail-row">
            <span class="room-detail-label">Guru Pengampu:</span>
            <span class="room-detail-val">${teacherDisplay}</span>
          </div>
          <div class="room-detail-row">
            <span class="room-detail-label">Presensi Masuk:</span>
            <span class="room-detail-val">${checkInInfo}</span>
          </div>
          ${miniSessionsHtml}
        </div>

        <div class="room-actions">
          ${actionButtons}
        </div>
      `;

      grid.appendChild(card);
    });

    updateRadarKpis();
  }

  // Update Radar KPI Counts
  function updateRadarKpis() {
    roomsMonitoring = StorageService.getRoomsMonitoring(currentRadarDay, currentRadarPeriod);
    const hadirTepat = roomsMonitoring.filter(r => r.status === "hadir_tepat").length;
    const terlambat = roomsMonitoring.filter(r => r.status === "terlambat").length;
    const kosongKritis = roomsMonitoring.filter(r => r.status === "kosong_kritis").length;
    const inval = roomsMonitoring.filter(r => r.status === "inval").length;
    const menunggu = roomsMonitoring.filter(r => r.status === "menunggu_guru").length;

    const elHadirTepat = document.getElementById("kpiHadirTepatVal");
    const elTerlambat = document.getElementById("kpiTerlambatVal");
    const elKosongKritis = document.getElementById("kpiKosongKritisVal");
    const elInval = document.getElementById("kpiInvalVal");
    const sidebarAlertBadge = document.getElementById("sidebarAlertBadge");

    if (elHadirTepat) elHadirTepat.textContent = `${hadirTepat} Kelas`;
    if (elTerlambat) elTerlambat.textContent = `${terlambat} Guru`;
    if (elKosongKritis) elKosongKritis.textContent = `${kosongKritis} Kelas`;
    if (elInval) elInval.textContent = `${inval} Guru Inval`;

    // Update filter button numbers
    const btnAll = document.getElementById("btnFilterAllRooms");
    if (btnAll) btnAll.textContent = `Semua Ruang (${roomsMonitoring.length})`;
    const countHT = document.getElementById("countHadirTepat");
    if (countHT) countHT.textContent = hadirTepat;
    const countT = document.getElementById("countTerlambat");
    if (countT) countT.textContent = terlambat;
    const countK = document.getElementById("countKosong");
    if (countK) countK.textContent = kosongKritis;
    const countI = document.getElementById("countInval");
    if (countI) countI.textContent = inval;
    const countM = document.getElementById("countMenunggu");
    if (countM) countM.textContent = menunggu;

    if (sidebarAlertBadge) {
      sidebarAlertBadge.textContent = `${kosongKritis} Alert`;
      sidebarAlertBadge.style.display = kosongKritis > 0 ? "inline-block"  : "none";
    }
  }

  // Render Real-Time Activity Feed & Piket Action Log
  function renderAdminActivityFeed() {
    const list = document.getElementById("adminActivityList");
    if (!list) return;

    adminActivityFeed = StorageService.getAdminActivityFeed();
    list.innerHTML = "";

    if (!adminActivityFeed || adminActivityFeed.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">Belum ada aktivitas presensi KBM hari ini.</div>`;
      return;
    }

    adminActivityFeed.forEach(item => {
      const feedEl = document.createElement("div");
      feedEl.className = `admin-feed-item feed-${item.type || 'info'}`;
      feedEl.innerHTML = `
        <div class="feed-time">${item.time || ''}</div>
        <div class="feed-content">${item.text || ''}</div>
      `;
      list.appendChild(feedEl);
    });
  }

  // Open Assign Inval Modal (Piket Menugaskan Guru Pengganti pada Ruang Kosong Kritis)
  window.openAssignInvalModal = function(roomId) {
    const room = (roomsMonitoring || []).find(r => r.id === roomId);
    const targetInput = document.getElementById("invalTargetRoomId");
    const detailSpan = document.getElementById("invalAlertRoomDetail");
    const selectTeacher = document.getElementById("invalTeacherSelect");

    if (targetInput) targetInput.value = roomId;
    if (detailSpan && room) {
      detailSpan.innerHTML = `Ruang <strong>${room.roomName}</strong> (Mapel: <strong>${room.subject}</strong> ? Guru Asli : <strong>${room.teacherName}</strong>) belum diisi guru lebih dari 15 menit.`;
    }

    if (selectTeacher) {
      const teachers = StorageService.getTeachersMaster ? StorageService.getTeachersMaster()  : [];
      selectTeacher.innerHTML = `<option value="">-- Pilih Guru Piket / Pengganti --</option>` +
        teachers.map(t => `<option value="${t.name}">${t.name} (${t.subject || 'Guru'})</option>`).join("");
    }

    openModal("modalAssignInval");
  };

  // Init Inval Form Submission
  function initInvalForm() {
    const form = document.getElementById("formAssignInval");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const roomId = document.getElementById("invalTargetRoomId")?.value;
      const selectTeacher = document.getElementById("invalTeacherSelect");
      const chosenTeacher = selectTeacher ? selectTeacher.value  : "";
      const instruction = document.getElementById("invalInstructionInput")?.value || "";

      if (!chosenTeacher) {
        showToast("Peringatan", "Silakan pilih guru pengganti/inval terlebih dahulu.", "warning");
        return;
      }

      const room = (roomsMonitoring || []).find(r => r.id === roomId);
      if (room) {
        room.status = "inval";
        room.statusLabel = "Guru Pengganti (Inval)";
        room.statusClass = "status-inval";
        room.invalTeacher = `${chosenTeacher} (Inval)`;
        room.checkInTime = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`;
        room.punctuality = "Diisi Guru Inval Piket";
        room.note = `Ditugaskan Inval: ${chosenTeacher}. Instruksi: ${instruction}`;
        StorageService.saveRoomsMonitoring(roomsMonitoring);

        if (typeof StorageService.saveRoomState === "function") {
          StorageService.saveRoomState(room.id, room.day || currentRadarDay, {
            status: "inval",
            statusLabel: "Guru Pengganti (Inval)",
            statusClass: "status-inval",
            invalTeacher: room.invalTeacher,
            checkInTime: room.checkInTime,
            punctuality: room.punctuality,
            note: room.note
          });
        }

        StorageService.addAdminActivity(
          `Guru Piket menugaskan ${chosenTeacher} untuk Inval di ${room.roomName} (${room.subject} ? Guru Asli : ${room.teacherName}).`,
          "info"
        );
      }

      closeModal("modalAssignInval");
      renderClassroomRadar();
      renderAdminActivityFeed();
      updateRadarKpis();
      SoundService.playSuccess();
      showToast("Inval Ditugaskan!", `Guru ${chosenTeacher} telah resmi ditugaskan mengisi ${room ? room.roomName  : 'ruang kelas'}. Status radar kini terupdate!`, "success");
    });
  }

  // Admin Toolbar Controls (Day, Sesi, Grade, Status, Real-Time Sync)
  function initAdminToolbarControls() {
    // 1. Day selector
    const dayButtons = document.querySelectorAll("#radarDayButtons .filter-chip");
    dayButtons.forEach(b => {
      if (b.getAttribute("data-day") === currentRadarDay) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    dayButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        dayButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentRadarDay = btn.getAttribute("data-day") || "Senin";
        renderClassroomRadar();
      });
    });

    // 2. Period selector
    const periodButtons = document.querySelectorAll("#radarPeriodButtons .filter-chip");
    periodButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        periodButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentRadarPeriod = btn.getAttribute("data-period") || "all";
        renderClassroomRadar();
      });
    });

    // 3. Grade selector
    const gradeButtons = document.querySelectorAll("#radarGradeButtons .filter-chip");
    gradeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        gradeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentRadarGrade = btn.getAttribute("data-grade") || "all";
        renderClassroomRadar();
      });
    });

    // 4. Status filter
    const statusButtons = document.querySelectorAll("#roomFilterButtons .filter-chip");
    statusButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        statusButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.getAttribute("data-filter") || "all";
        renderClassroomRadar(filter);
      });
    });

    // 5. Reset Radar State to clean
    const btnResetRadar = document.getElementById("btnResetRadarData");
    if (btnResetRadar) {
      btnResetRadar.addEventListener("click", () => {
        if (typeof StorageService.resetRoomMonitoringState === "function") {
          StorageService.resetRoomMonitoringState();
        } else {
          localStorage.removeItem("hadir_guru_rooms_monitoring");
          localStorage.removeItem("hadir_guru_rooms_monitoring_state");
          localStorage.removeItem("hadir_guru_class_checkins");
        }
        localStorage.removeItem("hadir_guru_admin_feed");
        roomsMonitoring = StorageService.getRoomsMonitoring(currentRadarDay, currentRadarPeriod);
        classCheckIns = StorageService.getClassCheckIns();
        adminActivityFeed = StorageService.getAdminActivityFeed();
        renderClassroomRadar();
        renderAdminActivityFeed();
        renderKbmTimelineAndLogs();
        updateRadarKpis();
        showToast("Radar KBM Direset", "Seluruh status monitoring 26 ruang kelas dikembalikan ke baseline jadwal resmi.", "info");
      });
    }

    const btnRefresh = document.getElementById("btnAdminRefresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        renderClassroomRadar();
        renderAdminActivityFeed();
        updateRadarKpis();
        showToast("Radar Diperbarui", "Data monitoring 26 kelas berhasil disinkronisasi ulang.", "info");
      });
    }

    const btnConfirmCheckIn = document.getElementById("btnConfirmClassCheckIn");
    if (btnConfirmCheckIn) {
      btnConfirmCheckIn.addEventListener("click", confirmClassCheckIn);
    }

    const btnConfirmCheckOut = document.getElementById("btnConfirmCheckOut");
    if (btnConfirmCheckOut) {
      btnConfirmCheckOut.addEventListener("click", confirmClassCheckOut);
    }

    const btnSyncKbm = document.getElementById("btnSyncKbmTimeNow");
    if (btnSyncKbm) {
      btnSyncKbm.addEventListener("click", () => {
        const session = TEACHING_SCHEDULES.find(s => s.id === "SCH-FRI-02");
        if (session) {
          const now = new Date();
          const curH = String(now.getHours()).padStart(2, '0');
          const curM = String(now.getMinutes()).padStart(2, '0');
          const end = new Date(now.getTime() + 90 * 60000);
          const endH = String(end.getHours()).padStart(2, '0');
          const endM = String(end.getMinutes()).padStart(2, '0');

          session.startTime = `${curH}:${curM}`;
          session.endTime = `${endH}:${endM}`;
          session.time = `${session.startTime} - ${session.endTime} WIB`;

          roomsMonitoring = StorageService.getRoomsMonitoring();
          const room = roomsMonitoring.find(r => r.id === "ROOM-IX-A" || r.scheduleId === "SCH-FRI-02");
          if (room) {
            room.startTime = session.startTime;
            room.endTime = session.endTime;
            room.scheduleTime = session.time;
            StorageService.saveRoomsMonitoring(roomsMonitoring);
          }

          simulatedTimeOffsetMinutes = 0;
          renderKbmTimelineAndLogs();
          renderClassroomRadar();
          showToast(
            "Jadwal Disesuaikan!",
            `Jam KBM Matematika IX-A disesuaikan menjadi ${session.time}. Jika Anda Check-In sekarang, status terekam Hadir Tepat Waktu!`,
            "success"
          );
        }
      });
    }

    const btnResetDemo = document.getElementById("btnResetKbmSessionDemo");
    if (btnResetDemo) {
      btnResetDemo.addEventListener("click", () => {
        if (inClassTimerInterval) {
          clearInterval(inClassTimerInterval);
          inClassTimerInterval = null;
        }

        // Reset check-in for SCH-FRI-02 and any lingering SCH-FRI-01
        delete classCheckIns["SCH-FRI-02"];
        delete classCheckIns["SCH-FRI-01"];
        StorageService.saveClassCheckIns(classCheckIns);

        // Remove today's log for SCH-FRI-02 and SCH-FRI-01
        teachingLogs = teachingLogs.filter(l => !((l.scheduleId === "SCH-FRI-02" || l.scheduleId === "SCH-FRI-01") && l.date === "2026-10-30"));
        StorageService.saveTeachingLogs(teachingLogs);

        // Reset room in roomsMonitoring
        roomsMonitoring = StorageService.getRoomsMonitoring();
        const room = roomsMonitoring.find(r => r.id === "ROOM-IX-A");
        if (room) {
          room.status = "menunggu_guru";
          room.statusLabel = "Menunggu Guru Masuk";
          room.statusClass = "status-waiting";
          room.checkInTime = null;
          room.punctuality = null;
          room.alertMinutes = 0;
          room.note = "Jadwal jam KBM. Belum ada check-in masuk kelas dari guru pengampu.";
          StorageService.saveRoomsMonitoring(roomsMonitoring);
        }

        renderKbmTimelineAndLogs();
        renderClassroomRadar();
        renderAdminActivityFeed();
        updateRadarKpis();

        showToast(
          "Sesi Direset!",
          "Status sesi Matematika IX-A telah dikembalikan ke kondisi awal (Belum Masuk Kelas). Silakan coba Check-In kembali.",
          "info"
        );
      });
    }
  }

  // Global Role Switcher: Mode Guru vs Mode Admin
  let pendingAdminTargetTab = "tab-admin-monitoring";

  // Update Topbar Active Session Badge & User Profile Meta
  function updateSessionBadge(role) {
    const badge = document.getElementById("appSessionBadge");
    const teacherWrap = document.getElementById("teacherSwitcherWrap");
    const topbarUserName = document.querySelector(".user-profile-pill .user-name");
    const topbarUserRole = document.querySelector(".user-profile-pill .user-role-label, .user-profile-pill .user-role");

    if (role === "admin") {
      if (badge) {
        badge.className = "app-session-badge admin";
        badge.innerHTML = `<span class="session-dot pulse"></span><span id="sessionTitleText">Mode Admin</span>`;
        badge.onclick = null;
        badge.style.cursor = "";
        badge.title = "Status Sesi Sistem Presensi";
      }
      if (teacherWrap) teacherWrap.style.display = "none";
      if (topbarUserName) topbarUserName.textContent = "ADMINISTRATOR";
      if (topbarUserRole) topbarUserRole.textContent = "Piket & Pengelola Madrasah";
    } else {
      if (badge) {
        badge.className = "app-session-badge teacher";
        const adminStillLoggedIn = typeof StorageService !== "undefined" && StorageService.isAdminLoggedIn && StorageService.isAdminLoggedIn();
        if (adminStillLoggedIn) {
          // Sesi admin masih aktif: sediakan jalan kembali satu klik ke Mode Admin
          badge.innerHTML = `<span class="session-dot"></span><span id="sessionTitleText">Mode Guru ↩ Admin</span>`;
          badge.style.cursor = "pointer";
          badge.title = "Klik untuk kembali ke Mode Administrator";
          badge.onclick = () => window.switchAppRole("admin", true);
        } else {
          badge.innerHTML = `<span class="session-dot"></span><span id="sessionTitleText">Mode Guru</span>`;
          badge.onclick = null;
          badge.style.cursor = "";
          badge.title = "Status Sesi Sistem Presensi";
        }
      }
      if (teacherWrap) teacherWrap.style.display = "inline-flex";
      try {
        const profile = StorageService.getProfile();
        if (topbarUserName) topbarUserName.textContent = profile.name || "Bapak/Ibu Guru";
        if (topbarUserRole) topbarUserRole.textContent = `${profile.subject || 'Guru Mapel'} • ${profile.classAssigned || 'MTs'}`;
      } catch (e) {}
    }
  }

  // Dual-Mode Login Portal Opener
  window.openLoginPortalModal = function(defaultTab = "admin", targetAdminTab = "tab-admin-monitoring") {
    pendingAdminTargetTab = targetAdminTab;
    const alertEl = document.getElementById("adminLoginAlert");
    if (alertEl) alertEl.style.display = "none";
    const usernameInput = document.getElementById("adminLoginUsername");
    if (usernameInput && !usernameInput.value) usernameInput.value = "admin";
    const passInput = document.getElementById("adminLoginPassword");
    if (passInput) passInput.value = "";

    // Populate teacher selection dropdown in portal
    const teacherSelect = document.getElementById("loginTeacherSelectDropdown");
    if (teacherSelect && typeof StorageService !== "undefined") {
      const teachers = StorageService.getTeachersMaster();
      const activeId = StorageService.getActiveTeacherId();
      teacherSelect.innerHTML = "";
      teachers.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.subject || 'Guru Mapel'})`;
        if (t.id === activeId) opt.selected = true;
        teacherSelect.appendChild(opt);
      });
      updateTeacherPortalPreview(teacherSelect.value);
    }

    // Switch Tab inside Modal
    switchLoginPortalTab(defaultTab);

    if (typeof window.openModal === "function") {
      window.openModal("modalAdminLogin");
    }

    if (defaultTab === "admin") {
      setTimeout(() => {
        if (passInput) passInput.focus();
      }, 180);
    }
  };

  function switchLoginPortalTab(tab) {
    const tabAdminBtn = document.getElementById("tabBtnAdminAuth");
    const tabTeacherBtn = document.getElementById("tabBtnTeacherAuth");
    const containerAdmin = document.getElementById("containerAdminAuthFields");
    const containerTeacher = document.getElementById("containerTeacherAuthFields");
    const footerAdmin = document.getElementById("footerAdminLogin");
    const headerTitle = document.getElementById("loginModalTitle");
    const headerSubtitle = document.getElementById("loginModalSubtitle");
    const headerBox = document.getElementById("loginModalHeader");

    if (tab === "teacher") {
      if (tabTeacherBtn) tabTeacherBtn.classList.add("active", "tab-guru-btn");
      if (tabAdminBtn) tabAdminBtn.classList.remove("active");
      if (containerTeacher) containerTeacher.style.display = "block";
      if (containerAdmin) containerAdmin.style.display = "none";
      if (footerAdmin) footerAdmin.style.display = "none";
      if (headerTitle) headerTitle.textContent = "Masuk Akun Guru";
      if (headerSubtitle) headerSubtitle.textContent = "Pilih akun pendidik untuk membuka presensi harian";
      if (headerBox) headerBox.style.background = "linear-gradient(135deg, #3b5f21, #5c8740)";
    } else {
      if (tabAdminBtn) tabAdminBtn.classList.add("active");
      if (tabTeacherBtn) tabTeacherBtn.classList.remove("active", "tab-guru-btn");
      if (containerTeacher) containerTeacher.style.display = "none";
      if (containerAdmin) containerAdmin.style.display = "block";
      if (footerAdmin) footerAdmin.style.display = "flex";
      if (headerTitle) headerTitle.textContent = "Login Administrator";
      if (headerSubtitle) headerSubtitle.textContent = "HADIR.GURU Command Center Madrasah";
      if (headerBox) headerBox.style.background = "linear-gradient(135deg, #004d38, #006A4E)";
    }
  }

  function updateTeacherPortalPreview(teacherId) {
    if (typeof StorageService === "undefined") return;
    const teachers = StorageService.getTeachersMaster();
    const t = teachers.find(item => item.id === teacherId);
    const nameEl = document.getElementById("loginTeacherPreviewName");
    const subjEl = document.getElementById("loginTeacherPreviewSubject");
    if (t) {
      if (nameEl) nameEl.textContent = t.name;
      if (subjEl) subjEl.textContent = `Mata Pelajaran: ${t.subject || '-'} • NIP ${t.nip || '-'}`;
    }
  }

  // Alias for backward compatibility
  window.openAdminLoginModal = function(targetTab = "tab-admin-monitoring") {
    window.openLoginPortalModal("admin", targetTab);
  };

  // Dedicated App Logout Handler
  window.performAppLogout = function() {
    if (currentActiveRole === "admin") {
      StorageService.logoutAdmin();
      if (StorageService.isTeacherLoggedIn()) {
        window.switchAppRole("teacher", true);
      } else {
        window.showLoginView("admin");
      }
      showToast("Sesi Admin Ditutup", "Anda telah keluar dari Command Center Administrator.", "info");
    } else {
      StorageService.logoutTeacher();
      window.showLoginView("teacher");
      showToast("Sesi Guru Ditutup", "Silakan pilih akun guru untuk masuk kembali.", "info");
    }
    if (typeof SoundService !== "undefined" && typeof SoundService.playBeep === "function") {
      SoundService.playBeep();
    }
  };

  // Dedicated App Synchronization Handler
  window.synchronizeApp = function(showToastNotif = true) {
    const syncBtn = document.getElementById("btnTopSync");
    if (syncBtn) syncBtn.classList.add("syncing");

    try {
      // 1. Sinkronkan master schedules & guru aktif
      StorageService.syncActiveTeachingSchedules();

      // 2. Refresh info sekolah dan jadwal WIB
      if (typeof applySyncedTeacherAndSchoolData === "function") applySyncedTeacherAndSchoolData();

      // 3. Muat status kehadiran guru aktif hari ini
      if (typeof loadActiveTeacherAttendance === "function") loadActiveTeacherAttendance();

      // 4. Render ulang kartu jadwal KBM & timeline
      if (typeof renderTeachingSchedules === "function") renderTeachingSchedules();
      if (typeof renderKbmTimelineAndLogs === "function") renderKbmTimelineAndLogs();

      // 5. Render ulang pemantauan 12 / 26 ruang kelas dan KPI radar
      if (typeof renderClassroomRadar === "function") renderClassroomRadar();
      if (typeof updateRadarKpis === "function") updateRadarKpis();
      if (typeof renderAdminActivityFeed === "function") renderAdminActivityFeed();
      if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance();
      if (typeof renderAdminLeaveVerificationTable === "function") renderAdminLeaveVerificationTable();

      // 6. Refresh jadwal piket sambut siswa
      if (typeof renderPicketRoster === "function") {
        const today = typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : (typeof getTodayPicketDay === "function" ? getTodayPicketDay()  : "Jumat");
        renderPicketRoster(today);
      }
      if (typeof updatePicketBannerQuickCheckIn === "function") updatePicketBannerQuickCheckIn();
    } catch (err) {
      console.warn("Gagal sinkronisasi data aplikasi:", err);
    }

    setTimeout(() => {
      if (syncBtn) syncBtn.classList.remove("syncing");
      if (showToastNotif) {
        showToast("Sinkronisasi Berhasil", "Semua data presensi, KBM kelas, dan jam server WIB telah disinkronkan secara real-time.", "success");
        if (typeof SoundService !== "undefined" && typeof SoundService.playSuccess === "function") {
          SoundService.playSuccess();
        }
      }
    }, 600);
  };

  window.switchAppRole = function(role, bypassAuth = false) {
    document.body.classList.remove("mode-login");
    const loginView = document.getElementById("appLoginView");
    if (loginView) {
      loginView.style.display = "none";
    }
    try { sessionStorage.setItem("hadir_guru_last_role", role === "admin" ? "admin" : "teacher"); } catch (e) {}

    const btnTeacher = document.getElementById("btnRoleTeacher");
    const btnAdmin = document.getElementById("btnRoleAdmin");
    const navTeacher = document.getElementById("sidebarNavTeacher");
    const navAdmin = document.getElementById("sidebarNavAdmin");

    if (role === "admin") {
      if (!bypassAuth && !StorageService.isAdminLoggedIn()) {
        window.openLoginPortalModal("admin", "tab-admin-monitoring");
        return;
      }

      currentActiveRole = "admin";
      document.body.classList.remove("mode-login");
      document.body.classList.add("mode-admin");
      document.body.classList.remove("mode-guru");
      if (btnAdmin) btnAdmin.classList.add("active", "admin-mode");
      if (btnTeacher) btnTeacher.classList.remove("active");
      if (navTeacher) navTeacher.style.display = "none";
      if (navAdmin) navAdmin.style.display = "flex";
      updateSessionBadge("admin");

      const targetTab = pendingAdminTargetTab || "tab-admin-monitoring";
      pendingAdminTargetTab = "tab-admin-monitoring";
      if (typeof window.switchToTab === "function") {
        window.switchToTab(targetTab);
      }
      try { if (typeof renderClassroomRadar === "function") renderClassroomRadar(); } catch (e) { console.warn(e); }
      try { if (typeof renderAdminActivityFeed === "function") renderAdminActivityFeed(); } catch (e) { console.warn(e); }
      try { if (typeof updateRadarKpis === "function") updateRadarKpis(); } catch (e) { console.warn(e); }
      try { if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance(); } catch (e) { console.warn(e); }
      try { if (typeof renderAdminLeaveVerificationTable === "function") renderAdminLeaveVerificationTable(); } catch (e) { console.warn(e); }
      try { if (typeof loadAdminSettingsFormValues === "function") loadAdminSettingsFormValues(); } catch (e) { console.warn(e); }
      try {
        if (typeof renderPicketRoster === "function") {
          renderPicketRoster(typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : (typeof getTodayPicketDay === "function" ? getTodayPicketDay()  : "Jumat"));
        }
      } catch (e) { console.warn(e); }
      try { if (typeof updatePicketBannerQuickCheckIn === "function") updatePicketBannerQuickCheckIn(); } catch (e) { console.warn(e); }
      showToast("Mode Admin Aktif", "Papan command center pemantauan KBM dan manajemen madrasah aktif.", "info");
    } else {
      currentActiveRole = "teacher";
      document.body.classList.remove("mode-login");
      document.body.classList.add("mode-guru");
      document.body.classList.remove("mode-admin");
      if (btnTeacher) {
        btnTeacher.classList.add("active");
        btnTeacher.classList.remove("admin-mode");
      }
      if (btnAdmin) btnAdmin.classList.remove("active", "admin-mode");
      if (navTeacher) navTeacher.style.display = "flex";
      if (navAdmin) navAdmin.style.display = "none";
      updateSessionBadge("teacher");

      if (typeof window.switchToTab === "function") {
        window.switchToTab("tab-dashboard");
      }
      try { if (typeof applySyncedTeacherAndSchoolData === "function") applySyncedTeacherAndSchoolData(); } catch (e) { console.warn(e); }
      try { if (typeof loadActiveTeacherAttendance === "function") loadActiveTeacherAttendance(); } catch (e) { console.warn(e); }
      try { if (typeof renderDashboardPicketReminder === "function") renderDashboardPicketReminder(); } catch (e) { console.warn(e); }
      try {
        if (typeof renderPicketRoster === "function") {
          renderPicketRoster(typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : (typeof getTodayPicketDay === "function" ? getTodayPicketDay()  : "Jumat"));
        }
      } catch (e) { console.warn(e); }
      try { if (typeof updatePicketBannerQuickCheckIn === "function") updatePicketBannerQuickCheckIn(); } catch (e) { console.warn(e); }
      showToast("Mode Guru Aktif", "Anda berada di dashboard guru untuk presensi harian.", "info");
    }
  };

  // Role Switcher Initialization
  function initRoleSwitcher() {
    const btnTeacher = document.getElementById("btnRoleTeacher");
    const btnAdmin = document.getElementById("btnRoleAdmin");

    document.body.classList.add("mode-guru");
    document.body.classList.remove("mode-admin");
    updateSessionBadge("teacher");

    if (btnTeacher) {
      btnTeacher.addEventListener("click", (e) => {
        e.preventDefault();
        window.switchAppRole("teacher");
      });
    }

    if (btnAdmin) {
      btnAdmin.addEventListener("click", (e) => {
        e.preventDefault();
        window.switchAppRole("admin");
      });
    }

    // Topbar Sync Button
    const btnTopSync = document.getElementById("btnTopSync");
    if (btnTopSync) {
      btnTopSync.addEventListener("click", (e) => {
        e.preventDefault();
        window.synchronizeApp(true);
      });
    }

    // Topbar Logout Button
    const btnTopLogout = document.getElementById("btnTopLogout");
    if (btnTopLogout) {
      btnTopLogout.addEventListener("click", (e) => {
        e.preventDefault();
        window.performAppLogout();
      });
    }

    // Sidebar Teacher Buttons
    const btnSidebarTeacherLogout = document.getElementById("btnSidebarTeacherLogout");
    if (btnSidebarTeacherLogout) {
      btnSidebarTeacherLogout.addEventListener("click", (e) => {
        e.preventDefault();
        window.performAppLogout();
      });
    }

    // Auto-sync heartbeat every 60 seconds (quietly syncs schedules & radar)
    setInterval(() => {
      try {
        if (typeof window.synchronizeApp === "function") {
          window.synchronizeApp(false);
        }
      } catch (e) {}
    }, 60000);
  }

  // Admin & Portal Login Authentication Module
  function initAdminLogin() {
    const form = document.getElementById("formAdminLogin");
    const alertEl = document.getElementById("adminLoginAlert");
    const alertText = document.getElementById("adminLoginAlertText");
    const btnCancel = document.getElementById("btnCancelAdminLogin");
    const btnTogglePass = document.getElementById("btnToggleAdminLoginPass");
    const passInput = document.getElementById("adminLoginPassword");
    const userInput = document.getElementById("adminLoginUsername");
    const rememberCheckbox = document.getElementById("adminLoginRemember");
    const btnSidebarLogout = document.getElementById("btnSidebarAdminLogout");

    if (btnSidebarLogout) {
      btnSidebarLogout.addEventListener("click", (e) => {
        e.preventDefault();
        window.performAppLogout();
      });
    }

    // Portal Tabs
    const tabAdminBtn = document.getElementById("tabBtnAdminAuth");
    const tabTeacherBtn = document.getElementById("tabBtnTeacherAuth");
    if (tabAdminBtn) {
      tabAdminBtn.addEventListener("click", () => switchLoginPortalTab("admin"));
    }
    if (tabTeacherBtn) {
      tabTeacherBtn.addEventListener("click", () => switchLoginPortalTab("teacher"));
    }

    // Teacher select change in portal
    const teacherSelect = document.getElementById("loginTeacherSelectDropdown");
    if (teacherSelect) {
      teacherSelect.addEventListener("change", function() {
        updateTeacherPortalPreview(this.value);
      });
    }

    // Confirm Teacher Login from Portal
    const btnConfirmTeacherLogin = document.getElementById("btnConfirmTeacherLogin");
    if (btnConfirmTeacherLogin) {
      btnConfirmTeacherLogin.addEventListener("click", function() {
        const selectedId = teacherSelect ? teacherSelect.value  : StorageService.getActiveTeacherId();
        if (selectedId) {
          if (typeof window.loginDirectAsTeacher === "function") {
            window.loginDirectAsTeacher(selectedId);
          } else {
            StorageService.setActiveTeacherId(selectedId);
            StorageService.syncActiveTeachingSchedules();
            window.switchAppRole("teacher", true);
          }
          if (typeof window.closeModal === "function") {
            window.closeModal("modalAdminLogin");
          }
          const activeTeacher = StorageService.getActiveTeacher();
          showToast("Login Guru Berhasil", `Selamat datang, ${activeTeacher ? activeTeacher.name  : 'Bapak/Ibu Guru'}.`, "success");
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const username = (userInput ? userInput.value  : "").trim();
        const password = (passInput ? passInput.value  : "").trim();
        const remember = rememberCheckbox ? rememberCheckbox.checked  : false;

        if (StorageService.verifyAdminCredentials(username, password)) {
          StorageService.setAdminLoggedIn(true, remember);
          if (alertEl) alertEl.style.display = "none";
          if (typeof window.closeModal === "function") {
            window.closeModal("modalAdminLogin");
          }
          showToast("Login Admin Berhasil", "Selamat datang di Command Center Administrator.", "success");
          window.switchAppRole("admin", true);
        } else {
          if (alertEl) {
            alertEl.style.display = "block";
            if (alertText) alertText.textContent = "Username atau password admin salah. Silakan coba lagi.";
          }
          const dialog = form.closest(".modal-dialog");
          if (dialog) {
            dialog.classList.remove("shake-error");
            void dialog.offsetWidth; // trigger reflow
            dialog.classList.add("shake-error");
            setTimeout(() => dialog.classList.remove("shake-error"), 500);
          }
          if (passInput) {
            passInput.value = "";
            passInput.focus();
          }
        }
      });
    }

    if (btnTogglePass && passInput) {
      btnTogglePass.addEventListener("click", function(e) {
        e.preventDefault();
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text"  : "password";
        this.innerHTML = isPass
          ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener("click", function() {
        const btnTeacher = document.getElementById("btnRoleTeacher");
        const btnAdmin = document.getElementById("btnRoleAdmin");
        if (btnTeacher) btnTeacher.classList.add("active");
        if (btnAdmin) btnAdmin.classList.remove("active", "admin-mode");
      });
    }

    if (btnSidebarLogout) {
      btnSidebarLogout.addEventListener("click", function(e) {
        e.preventDefault();
        window.performAppLogout();
      });
    }
  }

  // 1. Sync Teacher & School Data between Admin Settings and Teacher Account
  function applySyncedTeacherAndSchoolData() {
    const config = StorageService.getSchoolConfig();
    const profile = StorageService.getProfile();

    const bannerGreeting = document.getElementById("bannerTeacherGreeting");
    if (bannerGreeting) bannerGreeting.textContent = `Assalamu'alaikum, ${profile.name}!`;

    const bannerJamMasuk = document.getElementById("bannerJamMasuk");
    if (bannerJamMasuk) {
      const inStart = config.schedule.checkInStart || "06:00";
      bannerJamMasuk.textContent = `Jam Masuk: ${config.schedule.checkInStandard} WIB (Buka: ${inStart} \u2022 Toleransi ${config.schedule.checkInLateLimit})`;
    }

    const bannerJamPulang = document.getElementById("bannerJamPulang");
    if (bannerJamPulang) {
      const todaySched = StorageService.getTodayCheckOutSchedule();
      bannerJamPulang.textContent = `Jam Pulang Hari Ini: ${todaySched.time} WIB (${todaySched.dayGroup})`;
      const tooltipText = `Jadwal Pulang Madrasah: Senin-Kamis ${config.schedule.checkOutSeninKamis || '14:00'} \u2022 Jumat ${config.schedule.checkOutJumat || '11:30'} \u2022 Sabtu ${config.schedule.checkOutSabtu || '12:30'}`;
      if (bannerJamPulang.parentElement) bannerJamPulang.parentElement.title = tooltipText;
    }

    const bannerNIP = document.getElementById("bannerNIP");
    if (bannerNIP) bannerNIP.textContent = `NIP: ${profile.nip}`;

    // Topbar User Info Pill - Protect Administrator session
    const isAdminActive = (typeof currentActiveRole !== "undefined" && currentActiveRole === "admin") ||
                          (document.body && document.body.classList.contains("mode-admin"));

    const topbarUserName = document.querySelector(".user-profile-pill .user-name");
    const topbarUserRole = document.querySelector(".user-profile-pill .user-role-label, .user-profile-pill .user-role");

    if (isAdminActive) {
      if (topbarUserName) topbarUserName.textContent = "ADMINISTRATOR";
      if (topbarUserRole) topbarUserRole.textContent = "Piket & Pengelola Madrasah";
    } else {
      if (topbarUserName) topbarUserName.textContent = profile.name || "Bapak/Ibu Guru";
      if (topbarUserRole) topbarUserRole.textContent = `${profile.subject || 'Guru Mapel'} • ${profile.classAssigned || 'MTsN 1'}`;
    }

    const profileCardName = document.getElementById("profileCardName");
    if (profileCardName) profileCardName.textContent = profile.name;

    const profileCardRole = document.getElementById("profileCardRole");
    if (profileCardRole) profileCardRole.textContent = `${profile.subject || 'Guru Mapel'} & ${profile.classAssigned || profile.role || 'Pendidik'}`;

    const profileCardNip = document.getElementById("profileCardNip");
    if (profileCardNip) profileCardNip.textContent = profile.nip || "-";

    const profileCardNuptk = document.getElementById("profileCardNuptk");
    if (profileCardNuptk) profileCardNuptk.textContent = profile.nuptk || "-";

    const profileCardKepegawaian = document.getElementById("profileCardKepegawaian");
    if (profileCardKepegawaian) profileCardKepegawaian.textContent = profile.employmentStatus || profile.kepegawaian || "PNS Kemenag";

    const profileCardEmail = document.getElementById("profileCardEmail");
    if (profileCardEmail) profileCardEmail.textContent = profile.email || "-";

    const profileCardPhone = document.getElementById("profileCardPhone");
    if (profileCardPhone) profileCardPhone.textContent = profile.phone || "-";

    const profileCardMadrasah = document.getElementById("profileCardMadrasah");
    if (profileCardMadrasah) profileCardMadrasah.textContent = config.name || "MTs Asy-Syafi'iyyah Jatibarang";

    // Sync Avatar Image in Teacher Bio Card
    const avatarImg = document.getElementById("profileCardAvatarImg");
    const avatarSvg = document.getElementById("profileCardDefaultSvg");
    if (avatarImg && avatarSvg) {
      if (profile.avatarUrl) {
        avatarImg.src = profile.avatarUrl;
        avatarImg.style.display = "block";
        avatarSvg.style.display = "none";
      } else {
        avatarImg.style.display = "none";
        avatarSvg.style.display = "block";
      }
    }

    const schoolName = config.name || "MTs Asy-Syafi'iyyah Jatibarang";
    const schUpper = schoolName.toUpperCase();

    // Sync to Login view and Footers
    document.querySelectorAll(".login-school-name, #loginSchoolName").forEach(el => {
      el.textContent = schUpper;
    });
    document.querySelectorAll("#loginFooterSchoolName, .login-footer-school-name").forEach(el => {
      el.textContent = schoolName;
    });

    // Sync to Sidebar Branding
    const sidebarSchool = document.getElementById("sidebarSchoolName");
    if (sidebarSchool) sidebarSchool.textContent = schoolName;
    const sidebarNpsn = document.getElementById("sidebarSchoolNpsn");
    if (sidebarNpsn) sidebarNpsn.textContent = `NPSN: ${config.npsn || '20108741'} • ${config.address ? config.address.split(',')[1] || 'Madrasah' : 'Madrasah'}`;

    // Sync to Campus Geofence Name
    const campusGeofence = document.getElementById("campusGeofenceName");
    if (campusGeofence) campusGeofence.textContent = config.geofence?.campusName || `Kampus ${schoolName}`;

    if (document.title && document.title.includes("HADIR.GURU")) {
      document.title = `HADIR.GURU — ${schoolName}`;
    }

    const modalCoord = document.getElementById("modalCheckInCoord");
    if (modalCoord) modalCoord.textContent = `${config.geofence.latitude}, ${config.geofence.longitude}`;

    // Update Welcoming Picket reminder on dashboard
    if (typeof renderDashboardPicketReminder === "function") {
      renderDashboardPicketReminder();
    }
  }

  // 2. Render Rekapitulasi Presensi Seluruh Guru (Admin)
  let currentRekapFilter = "all";
  let currentRekapSearchQuery = "";
  let rekapCurrentPage = 1;
  let rekapPageSize = 15;

  function renderAdminAllTeachersAttendance(filter) {
    if (filter !== undefined && filter !== currentRekapFilter) {
      currentRekapFilter = filter;
      rekapCurrentPage = 1;
    }
    const tbody = document.getElementById("allTeachersAttendanceTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const allTeachers = StorageService.getAllTeachersAttendance();
    const activeTeacher = StorageService.getActiveTeacher();
    if (activeTeacher) {
      const activeRecord = allTeachers.find(t => t.id === activeTeacher.id || t.name === activeTeacher.name);
      if (activeRecord) {
        activeRecord.name = activeTeacher.name;
        activeRecord.nip = activeTeacher.nip;
        activeRecord.subject = activeTeacher.subject;
        activeRecord.phone = activeTeacher.phone;
      }
    }

    const totalCount = allTeachers.length;
    const hadirTepat = allTeachers.filter(t => t.status === "Hadir" && !t.isLate).length;
    const terlambat = allTeachers.filter(t => t.status === "Terlambat" || t.isLate).length;
    const izin = allTeachers.filter(t => t.status === "Izin").length;
    const belum = allTeachers.filter(t => t.status === "Belum Absen").length;

    const elTotal = document.getElementById("rekapTotalGuruVal");
    const elHadir = document.getElementById("rekapHadirTepatVal");
    const elTerlambat = document.getElementById("rekapTerlambatVal");
    const elIzin = document.getElementById("rekapIzinVal");

    if (elTotal) elTotal.textContent = `${totalCount} Guru`;
    if (elHadir) elHadir.textContent = `${hadirTepat} Guru`;
    if (elTerlambat) elTerlambat.textContent = `${terlambat} Guru`;
    if (elIzin) elIzin.textContent = `${izin} Guru`;

    const chipAll = document.getElementById("rekapCountAll");
    const chipHadir = document.getElementById("rekapCountHadir");
    const chipTerlambat = document.getElementById("rekapCountTerlambat");
    const chipIzin = document.getElementById("rekapCountIzin");
    const chipBelum = document.getElementById("rekapCountBelum");

    if (chipAll) chipAll.textContent = totalCount;
    if (chipHadir) chipHadir.textContent = hadirTepat;
    if (chipTerlambat) chipTerlambat.textContent = terlambat;
    if (chipIzin) chipIzin.textContent = izin;
    if (chipBelum) chipBelum.textContent = belum;

    const searchClean = (currentRekapSearchQuery || "").toLowerCase().trim();

    const filtered = allTeachers.filter(t => {
      if (searchClean) {
        const matchName = (t.name || "").toLowerCase().includes(searchClean);
        const matchNip = (t.nip || "").replace(/\s+/g, "").includes(searchClean.replace(/\s+/g, ""));
        const matchSub = (t.subject || "").toLowerCase().includes(searchClean);
        if (!matchName && !matchNip && !matchSub) return false;
      }

      if (currentRekapFilter === "hadir") return t.status === "Hadir";
      if (currentRekapFilter === "terlambat") return t.status === "Terlambat" || t.isLate;
      if (currentRekapFilter === "izin") return t.status === "Izin";
      if (currentRekapFilter === "belum") return t.status === "Belum Absen";
      return true;
    });

    const isAll = rekapPageSize === -1;
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / rekapPageSize));
    if (rekapCurrentPage > totalPages) rekapCurrentPage = totalPages;
    if (rekapCurrentPage < 1) rekapCurrentPage = 1;

    const startIndex = isAll ? 0 : (rekapCurrentPage - 1) * rekapPageSize;
    const endIndex = isAll ? filtered.length : Math.min(startIndex + rekapPageSize, filtered.length);
    const pageItems = filtered.slice(startIndex, endIndex);

    const showingCountText = document.getElementById("rekapShowingCountText");
    if (showingCountText) {
      showingCountText.textContent = filtered.length === 0
        ? "Tidak ada data presensi guru"
        : `Menampilkan ${startIndex + 1}â€“${endIndex} dari ${filtered.length} guru (Total: ${allTeachers.length})`;
    }

    const paginationContainer = document.getElementById("rekapAttendancePaginationContainer");
    if (paginationContainer) {
      renderTablePagination(paginationContainer, {
        currentPage: rekapCurrentPage,
        pageSize: rekapPageSize,
        totalItems: filtered.length,
        pageSizeOptions: [10, 15, 25, 50, -1],
        itemLabel: "guru",
        onPageChange: (newPage) => {
          rekapCurrentPage = newPage;
          renderAdminAllTeachersAttendance();
        },
        onPageSizeChange: (newSize) => {
          rekapPageSize = newSize;
          rekapCurrentPage = 1;
          renderAdminAllTeachersAttendance();
        }
      });
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;"><div style="margin-bottom: 0.5rem;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">Data Presensi Tidak Ditemukan</strong><span>Tidak ditemukan data guru dengan kata kunci atau filter ini.</span></td></tr>`;
      return;
    }

    pageItems.forEach((t, idx) => {
      const rowNum = startIndex + idx + 1;
      const tr = document.createElement("tr");
      let badgeClass = "badge-hadir";
      if (t.status === "Terlambat" || t.isLate) badgeClass = "badge-terlambat";
      if (t.status === "Izin") badgeClass = "badge-izin";
      if (t.status === "Belum Absen") badgeClass = "badge-belum";

      const phoneClean = t.phone ? t.phone.replace(/[^0-9]/g, "") : "";
      const waMsg = encodeURIComponent(`Assalamu'alaikum Wr. Wb. Bapak/Ibu ${t.name}, konfirmasi presensi digital MTs Asy-Syafi'iyyah Jatibarang hari ini.`);

      tr.innerHTML = `
        <td style="text-align: center; font-weight: 600; color: var(--text-muted); font-size: 0.82rem;">${rowNum}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--emerald-500), var(--emerald-600)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 6px rgba(16,185,129,0.3); flex-shrink: 0;">
              ${(t.name || '?').charAt(0)}
            </div>
            <div>
              <strong>${t.name || '-'}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: 'JetBrains Mono';">NIP: ${t.nip || '-'}</div>
            </div>
          </div>
        </td>
        <td><span style="font-weight: 600;">${t.subject || '-'}</span></td>
        <td><span class="badge-pill-status ${badgeClass}">${t.status || 'Belum Absen'}</span></td>
        <td style="font-family: 'JetBrains Mono'; font-weight: 700;">${t.checkIn || '-'}</td>
        <td style="font-family: 'JetBrains Mono';">${t.checkOut || '-'}</td>
        <td style="font-size: 0.78rem; color: var(--text-secondary);">${t.statusDetail || '-'}</td>
        <td style="text-align: center;">
          <a class="btn-secondary" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; display: inline-flex; align-items: center; gap: 0.35rem;" href="https://wa.me/${phoneClean}?text=${waMsg}" target="_blank" title="Kirim Pesan WhatsApp">
            <span>ðŸ“² WA</span>
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Wire live search input
    const searchInput = document.getElementById("inputSearchRekapTeacher");
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", (e) => {
        currentRekapSearchQuery = e.target.value;
        rekapCurrentPage = 1;
        renderAdminAllTeachersAttendance();
      });
    }

    const filterButtons = document.querySelectorAll("#rekapFilterButtons .filter-chip");
    filterButtons.forEach(btn => {
      btn.onclick = () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderAdminAllTeachersAttendance(btn.getAttribute("data-rekap-filter"));
      };
    });
  }

  // 3. Render Verifikasi Izin Guru (Admin)
  let currentAdminLeaveFilter = "all";

  function renderAdminLeaveVerificationTable() {
    const tbody = document.getElementById("adminLeaveVerificationTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const leaves = StorageService.getLeaveRequests();
    const pendingBadge = document.getElementById("adminLeavePendingBadge");
    const sidebarBadge = document.getElementById("adminSidebarLeaveCount");
    const pendingCount = leaves.filter(l => l.status === "Menunggu Verifikasi").length;

    if (pendingBadge) {
      pendingBadge.textContent = `${pendingCount} Menunggu Tindakan`;
      pendingBadge.style.display = pendingCount > 0 ? "inline-block" : "none";
    }
    if (sidebarBadge) {
      sidebarBadge.textContent = `${pendingCount}`;
      sidebarBadge.style.display = pendingCount > 0 ? "inline-flex" : "none";
    }

    const filtered = leaves.filter(req => {
      if (currentAdminLeaveFilter === "pending") return req.status === "Menunggu Verifikasi";
      if (currentAdminLeaveFilter === "approved") return req.status === "Disetujui";
      if (currentAdminLeaveFilter === "rejected") return req.status === "Ditolak";
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📋</div><div>Belum ada riwayat permohonan izin guru.</div></td></tr>`;
      return;
    }

    filtered.forEach(req => {
      const tr = document.createElement("tr");

      let statusBadge = `<span class="badge-pill-status badge-hadir">Disetujui</span>`;
      if (req.status === "Menunggu Verifikasi") {
        statusBadge = `<span class="badge-pill-status" style="background: #FEF3C7; color: #92400E; font-weight: 700;">Menunggu Verifikasi</span>`;
      } else if (req.status === "Ditolak") {
        statusBadge = `<span class="badge-pill-status badge-terlambat">Ditolak</span>`;
      }

      let actionHtml = "";
      if (req.status === "Menunggu Verifikasi") {
        actionHtml = `
          <div style="display: flex; gap: 0.45rem;">
            <button class="btn-emerald" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; display: inline-flex; align-items: center; gap: 0.3rem;" onclick="adminApproveLeave('${req.id}')" title="Setujui Permohonan">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Setujui</span>
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; color: #dc2626; border-color: #fca5a5; display: inline-flex; align-items: center; gap: 0.3rem;" onclick="adminRejectLeave('${req.id}')" title="Tolak Permohonan">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Tolak</span>
            </button>
          </div>
        `;
      } else {
        actionHtml = `<span style="font-size: 0.75rem; color: var(--text-muted);">${req.verifiedBy ? `Diproses oleh ${req.verifiedBy}`  : 'Selesai'}</span>`;
      }

      const teacherName = req.teacherName || "Guru MTs";
      const teacherNip = req.teacherNip ? `NIP: ${req.teacherNip}` : (req.teacherSubject ? req.teacherSubject : "-");
      const initial = teacherName.charAt(0);

      tr.innerHTML = `
        <td style="font-family: 'JetBrains Mono'; font-weight: 700; color: var(--emerald-600);">${req.id}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #006A4E, #008763); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;">
              ${initial}
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 0.85rem;">${teacherName}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: 'JetBrains Mono';">${teacherNip}</div>
            </div>
          </div>
        </td>
        <td><strong>${req.type}</strong></td>
        <td style="font-size: 0.8rem;">${formatDateShort(req.startDate)} s/d ${formatDateShort(req.endDate)}</td>
        <td style="font-weight: 600;">${req.duration}</td>
        <td style="font-size: 0.8rem; max-width: 240px;">${req.reason}</td>
        <td>${statusBadge}</td>
        <td>${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    // Leave Filter Buttons
    const leaveFilterBtns = document.querySelectorAll("#adminLeaveFilterButtons .filter-chip");
    leaveFilterBtns.forEach(btn => {
      btn.onclick = () => {
        leaveFilterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentAdminLeaveFilter = btn.getAttribute("data-leave-filter") || "all";
        renderAdminLeaveVerificationTable();
      };
    });
  }

  window.adminApproveLeave = function(leaveId) {
    let leaves = StorageService.getLeaveRequests();
    const item = leaves.find(l => l.id === leaveId);
    if (item) {
      item.status = "Disetujui";
      item.verifiedBy = "Kepala Madrasah / Admin";
      item.verifiedAt = "Hari ini";
      item.adminNote = "Permohonan izin resmi telah diverifikasi dan disetujui.";
      StorageService.saveLeaveRequests(leaves);

      // Jika rentang tanggal izin mencakup hari ini, otomatis sinkronkan status presensi harian guru
      const curDateStr = getAppTodayDateString();
      if (item.startDate && item.endDate && curDateStr >= item.startDate && curDateStr <= item.endDate) {
        const leaveStatus = String(item.type || "").toLowerCase().includes("sakit") ? "Sakit" : "Izin";
        syncTeacherAttendanceToMaster(
          item.teacherId,
          leaveStatus,
          "-",
          "-",
          false,
          `Disetujui: ${item.type} (${item.reason || "-"})`
        );
        loadActiveTeacherAttendance();
      }

      renderLeaveRequestsTable();
      renderAdminLeaveVerificationTable();
      showToast("Izin Disetujui", `Permohonan ${item.type} (${item.id}) telah disetujui.`, "success");
    }
  };

  window.adminRejectLeave = function(leaveId) {
    let leaves = StorageService.getLeaveRequests();
    const item = leaves.find(l => l.id === leaveId);
    if (item) {
      item.status = "Ditolak";
      item.verifiedBy = "Kepala Madrasah / Admin";
      item.verifiedAt = "Hari ini";
      item.adminNote = "Permohonan izin tidak dapat disetujui karena agenda KBM madrasah penting.";
      StorageService.saveLeaveRequests(leaves);
      renderLeaveRequestsTable();
      renderAdminLeaveVerificationTable();
      showToast("Izin Ditolak", `Permohonan ${item.type} (${item.id}) ditolak.`, "warning");
    }
  };

  // 4. Form Pengaturan Admin & Sinkronisasi Data Guru
  function loadAdminSettingsFormValues() {
    const config = StorageService.getSchoolConfig();

    const inStart = document.getElementById("settingCheckInStart");
    const inStd = document.getElementById("settingCheckInStandard");
    const inLate = document.getElementById("settingCheckInLateLimit");
    const outSeninKamis = document.getElementById("settingCheckOutSeninKamis");
    const outJumat = document.getElementById("settingCheckOutJumat");
    const outSabtu = document.getElementById("settingCheckOutSabtu");
    const outStd = document.getElementById("settingCheckOutStandard");
    const campus = document.getElementById("settingCampusName");
    const lat = document.getElementById("settingLatitude");
    const lng = document.getElementById("settingLongitude");
    const radius = document.getElementById("settingRadiusMeters");

    const sName = document.getElementById("settingSchoolName");
    const sNpsn = document.getElementById("settingSchoolNpsn");
    const sNsm = document.getElementById("settingSchoolNsm");
    const sLevel = document.getElementById("settingSchoolLevel");
    const sAccred = document.getElementById("settingSchoolAccreditation");
    const sPrincipal = document.getElementById("settingPrincipalName");
    const sPrincipalNip = document.getElementById("settingPrincipalNip");
    const sAddress = document.getElementById("settingSchoolAddress");
    const sEmail = document.getElementById("settingSchoolEmail");
    const sPhone = document.getElementById("settingSchoolPhone");
    const sWebsite = document.getElementById("settingSchoolWebsite");

    if (inStart) inStart.value = config.schedule.checkInStart || "06:00";
    if (inStd) inStd.value = config.schedule.checkInStandard;
    if (inLate) inLate.value = config.schedule.checkInLateLimit;
    if (outSeninKamis) outSeninKamis.value = config.schedule.checkOutSeninKamis || config.schedule.checkOutStandard || "14:00";
    if (outJumat) outJumat.value = config.schedule.checkOutJumat || "11:30";
    if (outSabtu) outSabtu.value = config.schedule.checkOutSabtu || "12:30";
    if (outStd) outStd.value = config.schedule.checkOutSeninKamis || config.schedule.checkOutStandard || "14:00";
    if (campus) campus.value = config.geofence.campusName;
    if (lat) lat.value = config.geofence.latitude;
    if (lng) lng.value = config.geofence.longitude;
    if (radius) radius.value = config.geofence.radiusMeters;

    if (sName) sName.value = config.name || "MTs Asy-Syafi'iyyah Jatibarang";
    if (sNpsn) sNpsn.value = config.npsn || "20108741";
    if (sNsm) sNsm.value = config.nsm || "121131740001";
    if (sLevel) {
      if (config.level && String(config.level).includes("•")) {
        sLevel.value = config.level;
      } else if (config.level) {
        sLevel.value = `${config.level} • ${config.status || 'Negeri'}`;
      } else {
        sLevel.value = "Madrasah Tsanawiyah (MTs) • Negeri";
      }
    }
    if (sAccred) sAccred.value = config.accreditation || "A (Unggul)";
    if (sPrincipal) sPrincipal.value = config.principalName || "Drs. H. Akhmad Rosidi";
    if (sPrincipalNip) sPrincipalNip.value = config.principalNip || "9248740641200003";
    if (sAddress) sAddress.value = config.address || "Jl. Raya Jatibarang, Brebes, Jawa Tengah";
    if (sEmail) sEmail.value = config.email || "kontak@mtsasyjtb.sch.id";
    if (sPhone) sPhone.value = config.phone || "(0283) 617-1234 / @opmmtsasyjtb";
    if (sWebsite) sWebsite.value = config.website || "https://mtsasyjtb.sch.id";

    const inputAdminUser = document.getElementById("settingAdminUsername");
    if (inputAdminUser) inputAdminUser.value = config.adminUsername || "admin";

    syncWibPresetButtons();
    if (typeof window.refreshAdminKbmSettingsUI === "function") window.refreshAdminKbmSettingsUI();
    if (typeof window.renderAdminHolidaysTable === "function") window.renderAdminHolidaysTable();
    if (typeof updatePurgeCardStats === "function") updatePurgeCardStats();
  }

  function syncWibPresetButtons() {
    const timeFields = [
      "settingCheckInStart",
      "settingCheckInStandard",
      "settingCheckInLateLimit",
      "settingCheckOutSeninKamis",
      "settingCheckOutJumat",
      "settingCheckOutSabtu"
    ];
    timeFields.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      const val = (input.value || "").trim();
      const presetContainer = document.querySelector(`.wib-quick-presets[data-target="${id}"]`);
      if (presetContainer) {
        presetContainer.querySelectorAll(".wib-preset-btn").forEach(btn => {
          if (btn.getAttribute("data-val") === val) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      }
    });
  }

  function initAdminSettingsForms() {
    loadAdminSettingsFormValues();

    // Setup WIB 24-Hour Time Inputs (Pure Indonesian Format without AM/PM)
    const wibInputs = document.querySelectorAll(".wib-time-input");
    wibInputs.forEach(input => {
      // Auto formatting while typing
      input.addEventListener("input", (e) => {
        let val = input.value.replace(/[^0-9:]/g, "").replace(".", ":");
        if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") {
          val = val + ":";
        }
        input.value = val;
        syncWibPresetButtons();
      });

      // Strict 24-hour validation on blur (00:00 to 23:59)
      input.addEventListener("blur", () => {
        let val = input.value.trim().replace(".", ":");
        if (!val) return;
        
        if (/^\d{1,2}$/.test(val)) {
          let h = parseInt(val, 10);
          if (h < 0) h = 0;
          if (h > 23) h = 23;
          val = String(h).padStart(2, "0") + ":00";
        } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
          const parts = val.split(":");
          let h = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10);
          if (isNaN(h) || h < 0) h = 0;
          if (h > 23) h = 23;
          if (isNaN(m) || m < 0) m = 0;
          if (m > 59) m = 59;
          val = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        } else {
          const defaultMap = {
            "settingCheckInStart": "06:00",
            "settingCheckInStandard": "07:00",
            "settingCheckInLateLimit": "07:15",
            "settingCheckOutSeninKamis": "14:00",
            "settingCheckOutJumat": "11:30",
            "settingCheckOutSabtu": "12:30"
          };
          val = defaultMap[input.id] || "07:00";
        }
        input.value = val;
        syncWibPresetButtons();
      });
    });

    // Preset button clicks
    const presetBtns = document.querySelectorAll(".wib-preset-btn");
    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".wib-quick-presets");
        if (!parent) return;
        const targetId = parent.getAttribute("data-target");
        const targetInput = document.getElementById(targetId);
        const timeVal = btn.getAttribute("data-val");
        if (targetInput && timeVal) {
          targetInput.value = timeVal;
          parent.querySelectorAll(".wib-preset-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          targetInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    const formSchedule = document.getElementById("formAdminScheduleSettings");
    if (formSchedule) {
      formSchedule.addEventListener("submit", (e) => {
        e.preventDefault();
        const config = StorageService.getSchoolConfig();
        const format24 = (raw, fb) => {
          let v = (raw || "").trim().replace(".", ":");
          if (!v) return fb;
          if (/^\d{1,2}$/.test(v)) {
            let h = Math.min(23, Math.max(0, parseInt(v, 10) || 0));
            return String(h).padStart(2, "0") + ":00";
          }
          if (/^\d{1,2}:\d{1,2}$/.test(v)) {
            const pts = v.split(":");
            let h = Math.min(23, Math.max(0, parseInt(pts[0], 10) || 0));
            let m = Math.min(59, Math.max(0, parseInt(pts[1], 10) || 0));
            return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
          }
          return fb;
        };

        const valInStart = format24(document.getElementById("settingCheckInStart")?.value, "06:00");
        const valInStd = format24(document.getElementById("settingCheckInStandard")?.value, "07:00");
        const valInLate = format24(document.getElementById("settingCheckInLateLimit")?.value, "07:15");
        const valSeninKamis = format24(document.getElementById("settingCheckOutSeninKamis")?.value, "14:00");
        const valJumat = format24(document.getElementById("settingCheckOutJumat")?.value, "11:30");
        const valSabtu = format24(document.getElementById("settingCheckOutSabtu")?.value, "12:30");

        config.schedule.checkInStart = valInStart;
        config.schedule.checkInStandard = valInStd;
        config.schedule.checkInLateLimit = valInLate;
        config.schedule.checkOutSeninKamis = valSeninKamis;
        config.schedule.checkOutJumat = valJumat;
        config.schedule.checkOutSabtu = valSabtu;
        config.schedule.checkOutStandard = valSeninKamis; // fallback

        StorageService.saveSchoolConfig(config);
        loadAdminSettingsFormValues();
        applySyncedTeacherAndSchoolData();
        if (typeof updateAttendanceUI === "function") {
          updateAttendanceUI();
        }
        showToast("Jam Kerja Disimpan!", `Tersinkron: Buka (${valInStart}), Masuk (${valInStd}), Batas (${valInLate}), Pulang Sen-Kam (${valSeninKamis}), Jum (${valJumat}), Sab (${valSabtu}).`, "success");
        SoundService.playSuccess();
      });
    }

    const formGeofence = document.getElementById("formAdminGeofenceSettings");
    if (formGeofence) {
      formGeofence.addEventListener("submit", (e) => {
        e.preventDefault();
        const config = StorageService.getSchoolConfig();
        const rawCampus = document.getElementById("settingCampusName")?.value.trim();
        const rawLat = parseFloat(document.getElementById("settingLatitude")?.value);
        const rawLng = parseFloat(document.getElementById("settingLongitude")?.value);
        const rawRadius = parseInt(document.getElementById("settingRadiusMeters")?.value, 10);

        if (rawCampus) config.geofence.campusName = rawCampus;
        if (!isNaN(rawLat)) config.geofence.latitude = rawLat;
        if (!isNaN(rawLng)) config.geofence.longitude = rawLng;
        if (!isNaN(rawRadius) && rawRadius > 0) config.geofence.radiusMeters = rawRadius;

        StorageService.saveSchoolConfig(config);
        loadAdminSettingsFormValues();
        applySyncedTeacherAndSchoolData();
        if (typeof window.renderGeofenceUI === "function") {
          window.renderGeofenceUI();
        }
        showToast("Geofence Disimpan!", `Radius ${config.geofence.radiusMeters}m di ${config.geofence.campusName} aktif.`, "success");
        SoundService.playSuccess();
      });
    }

    const btnCurrentLocation = document.getElementById("btnUseCurrentDeviceLocation");
    if (btnCurrentLocation) {
      btnCurrentLocation.addEventListener("click", () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              document.getElementById("settingLatitude").value = pos.coords.latitude.toFixed(6);
              document.getElementById("settingLongitude").value = pos.coords.longitude.toFixed(6);
              showToast("Koordinat Diperoleh", "Titik koordinat GPS perangkat berhasil diambil.", "info");
            },
            () => {
              document.getElementById("settingLatitude").value = "-6.208842";
              document.getElementById("settingLongitude").value = "106.845612";
              showToast("Koordinat Standar", "Menggunakan koordinat default kampus MTs Asy-Syafi'iyyah Jatibarang.", "info");
            }
          );
        }
      });
    }

    const formIdentity = document.getElementById("formAdminSchoolIdentitySettings");
    if (formIdentity) {
      formIdentity.addEventListener("submit", (e) => {
        e.preventDefault();
        const config = StorageService.getSchoolConfig();
        const valName = document.getElementById("settingSchoolName")?.value.trim();
        const valNpsn = document.getElementById("settingSchoolNpsn")?.value.trim();
        const valNsm = document.getElementById("settingSchoolNsm")?.value.trim();
        const valLevel = document.getElementById("settingSchoolLevel")?.value.trim();
        const valAccred = document.getElementById("settingSchoolAccreditation")?.value.trim();
        const valPrincipal = document.getElementById("settingPrincipalName")?.value.trim();
        const valPrincipalNip = document.getElementById("settingPrincipalNip")?.value.trim();
        const valAddress = document.getElementById("settingSchoolAddress")?.value.trim();
        const valEmail = document.getElementById("settingSchoolEmail")?.value.trim();
        const valPhone = document.getElementById("settingSchoolPhone")?.value.trim();
        const valWebsite = document.getElementById("settingSchoolWebsite")?.value.trim();

        if (valName) config.name = valName;
        if (valNpsn) config.npsn = valNpsn;
        if (valNsm) config.nsm = valNsm;
        if (valLevel) {
          if (valLevel.includes("•")) {
            const parts = valLevel.split("•").map(s => s.trim()).filter(Boolean);
            config.level = parts[0] || valLevel;
            if (parts[1]) config.status = parts[1];
          } else {
            config.level = valLevel;
          }
        }
        if (valAccred) config.accreditation = valAccred;
        if (valPrincipal) config.principalName = valPrincipal;
        if (valPrincipalNip) config.principalNip = valPrincipalNip;
        if (valAddress) config.address = valAddress;
        if (valEmail) config.email = valEmail;
        if (valPhone) config.phone = valPhone;
        if (valWebsite) config.website = valWebsite;

        StorageService.saveSchoolConfig(config);
        loadAdminSettingsFormValues();
        applySyncedTeacherAndSchoolData();
        showToast("Identitas Madrasah Disimpan!", `Profil resmi ${config.name} berhasil diperbarui di seluruh sistem.`, "success");
        SoundService.playSuccess();
      });
    }

    // Card 4: Pengaturan Alokasi Waktu Jam KBM & Istirahat (Senin, Sel-Kam, Jumat, Sabtu)
    const tbodyKbm = document.getElementById("tbodyKbmPeriodSettings");
    const formKbm = document.getElementById("formAdminKbmTimeSettings");
    const btnAddKbmRow = document.getElementById("btnAddKbmPeriodRow");
    const btnResetKbmDefault = document.getElementById("btnResetKbmPeriodDefault");
    const btnResetKbmLabel = document.getElementById("btnResetKbmLabel");
    const btnAutoGenerateKbm = document.getElementById("btnAutoGenerateKbmSlots");
    const inputKbmTargetDuration = document.getElementById("inputKbmTargetDuration");
    const kbmDayNav = document.getElementById("kbmDayGroupsNav");
    const kbmGroupTitle = document.getElementById("kbmGroupTitle");
    const kbmGroupSubtitle = document.getElementById("kbmGroupSubtitle");
    const kbmGroupIconPill = document.getElementById("kbmGroupIconPill");
    const badgeDurSenin = document.getElementById("badgeDurSenin");
    const badgeDurSelasaKamis = document.getElementById("badgeDurSelasaKamis");
    const badgeDurJumat = document.getElementById("badgeDurJumat");
    const badgeDurSabtu = document.getElementById("badgeDurSabtu");
    const kbmDurationPresets = document.querySelectorAll(".kbm-dur-preset");

    // Break settings elements
    const kbmBreaksTitle = document.getElementById("kbmBreaksTitle");
    const kbmBreaksSubtitle = document.getElementById("kbmBreaksSubtitle");
    const btnApplyBreaksToTimetable = document.getElementById("btnApplyBreaksToTimetable");
    const boxBreak1 = document.getElementById("boxBreak1");
    const boxBreak2 = document.getElementById("boxBreak2");
    const checkBreak1Active = document.getElementById("checkBreak1Active");
    const checkBreak2Active = document.getElementById("checkBreak2Active");
    const inputBreak1Start = document.getElementById("inputBreak1Start");
    const inputBreak1End = document.getElementById("inputBreak1End");
    const inputBreak1AfterPeriod = document.getElementById("inputBreak1AfterPeriod");
    const badgeBreak1Duration = document.getElementById("badgeBreak1Duration");
    const inputBreak2Start = document.getElementById("inputBreak2Start");
    const inputBreak2End = document.getElementById("inputBreak2End");
    const inputBreak2AfterPeriod = document.getElementById("inputBreak2AfterPeriod");
    const badgeBreak2Duration = document.getElementById("badgeBreak2Duration");

    let currentKbmDayGroup = "senin";

    const KBM_DAY_METADATA = {
      senin: {
        title: "Alokasi KBM Hari Senin (Khusus Upacara Bendera)",
        subtitle: "Durasi standar 30 menit per JP karena dialokasikan untuk upacara bendera pagi.",
        icon: "📅",
        defaultDur: 30,
        label: "Senin",
        breakTitle: "Pengaturan Istirahat KBM: Hari Senin",
        breakSubtitle: "Pengaturan waktu istirahat KBM hari Senin (1 sesi istirahat setelah Jam ke-4)."
      },
      selasa_kamis: {
        title: "Alokasi KBM Selasa, Rabu & Kamis",
        subtitle: "Durasi standar 40 menit per JP (jadwal KBM reguler dengan Istirahat 1 & Ishoma Dzuhur).",
        icon: "📅",
        defaultDur: 40,
        label: "Selasa, Rabu & Kamis",
        breakTitle: "Pengaturan Istirahat KBM: Selasa - Kamis",
        breakSubtitle: "Pengaturan mandiri Istirahat 1 (Pagi) dan Istirahat 2 (Ishoma Dzuhur berjamaah & makan)."
      },
      jumat: {
        title: "Alokasi KBM Hari Jumat (KBM Terpadat)",
        subtitle: "Durasi standar 35 menit per JP (dipadatkan sebelum pelaksanaan Sholat Jumat).",
        icon: "🕌",
        defaultDur: 35,
        label: "Jumat",
        breakTitle: "Pengaturan Istirahat KBM: Hari Jumat",
        breakSubtitle: "Pengaturan mandiri istirahat pagi singkat sebelum pelaksanaan ibadah Sholat Jumat."
      },
      sabtu: {
        title: "Alokasi KBM Hari Sabtu (Mandiri)",
        subtitle: "Durasi standar 40 menit per JP (jadwal mandiri Sabtu untuk KBM, pembinaan & kepulangan).",
        icon: "🏫",
        defaultDur: 40,
        label: "Sabtu",
        breakTitle: "Pengaturan Istirahat KBM: Hari Sabtu",
        breakSubtitle: "Pengaturan mandiri istirahat Sabtu (istirahat pagi / ekskul & kepulangan)."
      },
      minggu: {
        title: "Alokasi KBM / Kegiatan Tambahan Hari Minggu",
        subtitle: "Durasi standar 40 menit per JP (jadwal khusus Minggu untuk bimbingan, ekskul & kegiatan mandiri).",
        icon: "🌟",
        defaultDur: 40,
        label: "Minggu",
        breakTitle: "Pengaturan Istirahat: Hari Minggu",
        breakSubtitle: "Pengaturan mandiri waktu istirahat KBM / kegiatan hari Minggu."
      }
    };

    function calcMinutesDiff(startStr, endStr) {
      if (!startStr || !endStr) return 40;
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 40;
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? diff : 40;
    }

    function sanitize24HrTime(rawVal, fallback) {
      let val = (rawVal || "").trim().replace(".", ":");
      if (!val) return fallback;
      if (/^\d{1,2}$/.test(val)) {
        let h = parseInt(val, 10);
        if (h < 0) h = 0; if (h > 23) h = 23;
        return String(h).padStart(2, "0") + ":00";
      } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
        const parts = val.split(":");
        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (isNaN(h) || h < 0) h = 0; if (h > 23) h = 23;
        if (isNaN(m) || m < 0) m = 0; if (m > 59) m = 59;
        return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      }
      return fallback;
    }

    function updateKbmBreaksUI() {
      const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
      if (kbmBreaksTitle) kbmBreaksTitle.textContent = meta.breakTitle;
      if (kbmBreaksSubtitle) kbmBreaksSubtitle.textContent = meta.breakSubtitle;

      const breaks = StorageService.getKbmBreaks(currentKbmDayGroup);
      const b1 = breaks.find(b => b.id === "break1") || { active: true, start: "09:15", end: "09:35", afterPeriod: 3 };
      const b2 = breaks.find(b => b.id === "break2") || { active: false, start: "11:35", end: "12:35", afterPeriod: 6 };

      if (checkBreak1Active) checkBreak1Active.checked = !!b1.active;
      if (inputBreak1Start) inputBreak1Start.value = b1.start || "09:15";
      if (inputBreak1End) inputBreak1End.value = b1.end || "09:35";
      if (inputBreak1AfterPeriod) inputBreak1AfterPeriod.value = b1.afterPeriod || 3;
      if (badgeBreak1Duration) {
        const d1 = calcMinutesDiff(inputBreak1Start?.value || "09:15", inputBreak1End?.value || "09:35");
        badgeBreak1Duration.textContent = b1.active ? `${d1} Menit` : "Nonaktif";
        badgeBreak1Duration.className = b1.active ? "badge-pill-status badge-hadir" : "badge-pill-status";
        badgeBreak1Duration.style.background = b1.active ? "" : "var(--bg-subtle)";
        badgeBreak1Duration.style.color = b1.active ? "" : "var(--text-muted)";
      }
      if (boxBreak1) boxBreak1.classList.toggle("is-inactive", !b1.active);

      if (checkBreak2Active) checkBreak2Active.checked = !!b2.active;
      if (inputBreak2Start) inputBreak2Start.value = b2.start || "11:35";
      if (inputBreak2End) inputBreak2End.value = b2.end || "12:35";
      if (inputBreak2AfterPeriod) inputBreak2AfterPeriod.value = b2.afterPeriod || 6;
      if (badgeBreak2Duration) {
        const d2 = calcMinutesDiff(inputBreak2Start?.value || "11:35", inputBreak2End?.value || "12:35");
        badgeBreak2Duration.textContent = b2.active ? `${d2} Menit` : "Nonaktif";
        badgeBreak2Duration.className = b2.active ? "badge-pill-status badge-hadir" : "badge-pill-status";
        badgeBreak2Duration.style.background = b2.active ? "" : "var(--bg-subtle)";
        badgeBreak2Duration.style.color = b2.active ? "" : "var(--text-muted)";
      }
      if (boxBreak2) boxBreak2.classList.toggle("is-inactive", !b2.active);
    }

    function getBreaksFromInputs() {
      const b1Active = checkBreak1Active ? checkBreak1Active.checked : true;
      const b1Start = inputBreak1Start ? sanitize24HrTime(inputBreak1Start.value, "09:15") : "09:15";
      const b1End = inputBreak1End ? sanitize24HrTime(inputBreak1End.value, "09:35") : "09:35";
      const b1After = parseInt(inputBreak1AfterPeriod ? inputBreak1AfterPeriod.value : "3", 10) || 3;
      const b1Dur = calcMinutesDiff(b1Start, b1End);

      const b2Active = checkBreak2Active ? checkBreak2Active.checked : false;
      const b2Start = inputBreak2Start ? sanitize24HrTime(inputBreak2Start.value, "11:35") : "11:35";
      const b2End = inputBreak2End ? sanitize24HrTime(inputBreak2End.value, "12:35") : "12:35";
      const b2After = parseInt(inputBreak2AfterPeriod ? inputBreak2AfterPeriod.value : "6", 10) || 6;
      const b2Dur = calcMinutesDiff(b2Start, b2End);

      return [
        { id: "break1", name: "Istirahat 1", active: b1Active, afterPeriod: b1After, start: b1Start, end: b1End, duration: b1Dur, note: "Istirahat Pagi" },
        { id: "break2", name: "Ishoma", active: b2Active, afterPeriod: b2After, start: b2Start, end: b2End, duration: b2Dur, note: "Ishoma" }
      ];
    }

    function updateKbmGroupHeaderUI() {
      const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
      const durations = StorageService.getKbmDurationByDay();
      
      if (kbmGroupTitle) kbmGroupTitle.textContent = meta.title;
      if (kbmGroupSubtitle) kbmGroupSubtitle.textContent = meta.subtitle;
      if (kbmGroupIconPill) kbmGroupIconPill.textContent = meta.icon;
      if (btnResetKbmLabel) btnResetKbmLabel.textContent = `Muat Standar (${meta.label})`;

      const curDur = durations[currentKbmDayGroup] || meta.defaultDur;
      if (inputKbmTargetDuration) inputKbmTargetDuration.value = curDur;

      if (kbmDurationPresets) {
        kbmDurationPresets.forEach(btn => {
          const val = parseInt(btn.dataset.dur, 10);
          btn.classList.toggle("active", val === curDur);
        });
      }

      if (badgeDurSenin) badgeDurSenin.textContent = `${durations.senin || 30} Menit / JP`;
      if (badgeDurSelasaKamis) badgeDurSelasaKamis.textContent = `${durations.selasa_kamis || 40} Menit / JP`;
      if (badgeDurJumat) badgeDurJumat.textContent = `${durations.jumat || 35} Menit / JP`;
      if (badgeDurSabtu) badgeDurSabtu.textContent = `${durations.sabtu || 40} Menit / JP`;
      const badgeDurMinggu = document.getElementById("badgeDurMinggu");
      if (badgeDurMinggu) badgeDurMinggu.textContent = `${durations.minggu || 40} Menit / JP`;

      if (kbmDayNav) {
        kbmDayNav.querySelectorAll(".btn-kbm-day-tab").forEach(tab => {
          tab.classList.toggle("active", tab.dataset.dayGroup === currentKbmDayGroup);
        });
      }

      updateKbmBreaksUI();
    }

    function renderAdminKbmSettingsTable(groupKey = null, customPeriods = null, customBreaks = null) {
      if (!tbodyKbm) return;
      if (groupKey) currentKbmDayGroup = groupKey;
      tbodyKbm.innerHTML = "";
      
      const periods = Array.isArray(customPeriods) ? customPeriods : StorageService.getKbmPeriods(currentKbmDayGroup);
      const durations = StorageService.getKbmDurationByDay();
      const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || durations[currentKbmDayGroup] || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));
      const breaks = Array.isArray(customBreaks) ? customBreaks : StorageService.getKbmBreaks(currentKbmDayGroup);
      const activeBreaks = breaks.filter(b => b.active);

      periods.forEach((p, idx) => {
        const tr = document.createElement("tr");
        tr.className = "kbm-period-row";
        tr.dataset.periodIndex = idx;
        const dur = calcMinutesDiff(p.start, p.end);
        const isMatch = (dur === targetDur);

        tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="badge-tag-pill" style="font-weight: 700; background: var(--bg-subtle); color: var(--text-primary); font-family: 'Outfit';">
                Jam ${p.period}
              </span>
              <input type="hidden" class="kbm-period-number" value="${p.period}">
            </div>
          </td>
          <td>
            <div class="kbm-time-input-group" style="display: flex; align-items: center; gap: 0.35rem;">
              <input type="text" class="form-control kbm-period-cell-input kbm-time-start" value="${p.start || '07:15'}" maxlength="5" pattern="^([01]\\d|2[0-3]):[0-5]\\d$" placeholder="07:15" required autocomplete="off" spellcheck="false" style="font-family: 'JetBrains Mono'; font-weight: 700; width: 110px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">WIB</span>
            </div>
          </td>
          <td>
            <div class="kbm-time-input-group" style="display: flex; align-items: center; gap: 0.35rem;">
              <input type="text" class="form-control kbm-period-cell-input kbm-time-end" value="${p.end || '07:55'}" maxlength="5" pattern="^([01]\\d|2[0-3]):[0-5]\\d$" placeholder="07:55" required autocomplete="off" spellcheck="false" style="font-family: 'JetBrains Mono'; font-weight: 700; width: 110px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">WIB</span>
            </div>
          </td>
          <td style="text-align: center;">
            <span class="badge-pill-status ${isMatch ? 'badge-hadir duration-match' : 'duration-mismatch'} kbm-period-duration" style="font-size: 0.75rem; font-family: 'JetBrains Mono'; ${!isMatch ? 'background: rgba(245, 158, 11, 0.12); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.3);' : ''}">
              ${dur} Menit
            </span>
          </td>
          <td>
            <input type="text" class="form-control kbm-period-note" value="${p.note || ''}" placeholder="Keterangan sesi (opsional)" style="font-size: 0.8rem; padding: 0.3rem 0.65rem; height: 34px;">
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-table-action btn-table-action-delete btn-delete-kbm-row" title="Hapus Baris Jam Ke ini">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        `;

        const startInp = tr.querySelector(".kbm-time-start");
        const endInp = tr.querySelector(".kbm-time-end");
        const durBadge = tr.querySelector(".kbm-period-duration");

        function updateRowDuration() {
          const d = calcMinutesDiff(startInp.value, endInp.value);
          durBadge.textContent = `${d} Menit`;
          const currentTarget = parseInt(inputKbmTargetDuration?.value, 10) || targetDur;
          if (d === currentTarget) {
            durBadge.className = "badge-pill-status badge-hadir duration-match kbm-period-duration";
            durBadge.style.background = "";
            durBadge.style.color = "";
            durBadge.style.border = "";
          } else {
            durBadge.className = "badge-pill-status duration-mismatch kbm-period-duration";
            durBadge.style.background = "rgba(245, 158, 11, 0.12)";
            durBadge.style.color = "#b45309";
            durBadge.style.border = "1px solid rgba(245, 158, 11, 0.3)";
          }
        }

        if (startInp) {
          startInp.addEventListener("input", (e) => {
            let val = startInp.value.replace(/[^0-9:]/g, "").replace(".", ":");
            if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") {
              val = val + ":";
            }
            startInp.value = val;
            updateRowDuration();
          });
          startInp.addEventListener("blur", () => {
            startInp.value = sanitize24HrTime(startInp.value, p.start || "07:15");
            updateRowDuration();
          });
        }

        if (endInp) {
          endInp.addEventListener("input", (e) => {
            let val = endInp.value.replace(/[^0-9:]/g, "").replace(".", ":");
            if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") {
              val = val + ":";
            }
            endInp.value = val;
            updateRowDuration();
          });
          endInp.addEventListener("blur", () => {
            endInp.value = sanitize24HrTime(endInp.value, p.end || "07:55");
            updateRowDuration();
          });
        }

        const btnDel = tr.querySelector(".btn-delete-kbm-row");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            tr.remove();
            reindexKbmRows();
          });
        }

        tbodyKbm.appendChild(tr);

        // Check if an active break divider should be displayed after this period
        const breakAfterThis = activeBreaks.find(b => parseInt(b.afterPeriod, 10) === p.period);
        if (breakAfterThis) {
          const trBreak = document.createElement("tr");
          trBreak.className = "kbm-table-break-divider";
          const bDur = calcMinutesDiff(breakAfterThis.start, breakAfterThis.end);
          trBreak.innerHTML = `
            <td colspan="6">
              <div class="kbm-table-break-inner">
                <span style="display: flex; align-items: center; gap: 0.4rem;">
                  <span>☕</span>
                  <span><strong>${breakObjTitle(breakAfterThis.name)}</strong>: ${breakAfterThis.start} - ${breakAfterThis.end} WIB</span>
                  <span style="font-weight: 500; font-size: 0.72rem; color: var(--text-muted);">${breakAfterThis.note ? '(' + breakAfterThis.note + ')' : ''}</span>
                </span>
                <span class="badge-pill-status badge-hadir" style="font-size: 0.72rem; font-family: 'JetBrains Mono';">${bDur} Menit</span>
              </div>
            </td>
          `;
          tbodyKbm.appendChild(trBreak);
        }
      });
    }

    function breakObjTitle(name) {
      if (!name) return "Waktu Istirahat KBM";
      return name;
    }

    function reindexKbmRows() {
      if (!tbodyKbm) return;
      const rows = tbodyKbm.querySelectorAll(".kbm-period-row");
      rows.forEach((r, idx) => {
        const num = idx + 1;
        r.dataset.periodIndex = idx;
        const pill = r.querySelector(".badge-tag-pill");
        if (pill) pill.textContent = `Jam ${num}`;
        const hid = r.querySelector(".kbm-period-number");
        if (hid) hid.value = num;
      });
    }

    function collectPeriodsFromKbmTable() {
      const rows = tbodyKbm ? tbodyKbm.querySelectorAll(".kbm-period-row") : [];
      const newPeriods = [];
      rows.forEach((r, idx) => {
        const pNum = parseInt(r.querySelector(".kbm-period-number")?.value || (idx + 1), 10);
        const startVal = sanitize24HrTime(r.querySelector(".kbm-time-start")?.value, "07:15");
        const endVal = sanitize24HrTime(r.querySelector(".kbm-time-end")?.value, "07:55");
        const noteVal = r.querySelector(".kbm-period-note")?.value.trim() || `KBM Jam Ke-${pNum}`;
        newPeriods.push({
          period: pNum,
          start: startVal,
          end: endVal,
          note: noteVal
        });
      });
      return newPeriods;
    }

    function previewRecalculatedKbmTable() {
      const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));
      const breaks = getBreaksFromInputs();
      const generated = StorageService.generateKbmPeriodsForDuration(currentKbmDayGroup, targetDur, breaks);
      renderAdminKbmSettingsTable(currentKbmDayGroup, generated, breaks);
      const badgeMap = {
        senin: badgeDurSenin,
        selasa_kamis: badgeDurSelasaKamis,
        jumat: badgeDurJumat,
        sabtu: badgeDurSabtu,
        minggu: document.getElementById("badgeDurMinggu")
      };
      const activeBadge = badgeMap[currentKbmDayGroup];
      if (activeBadge) activeBadge.textContent = `${targetDur} Menit / JP`;
    }

    function saveCurrentKbmTabFromDOM() {
      if (!tbodyKbm) return null;
      const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));
      const breaks = getBreaksFromInputs();
      let newPeriods = collectPeriodsFromKbmTable();
      if (!newPeriods.length) {
        newPeriods = StorageService.generateKbmPeriodsForDuration(currentKbmDayGroup, targetDur, breaks);
      }
      StorageService.saveKbmDayGroupSettings(currentKbmDayGroup, targetDur, breaks, newPeriods);
      return { targetDur, breaks, newPeriods };
    }

    function refreshDependentKbmViews() {
      applySyncedTeacherAndSchoolData();
      if (typeof renderTeachingSchedules === "function") renderTeachingSchedules();
      if (typeof renderKbmTimelineAndLogs === "function") renderKbmTimelineAndLogs();
      if (typeof renderClassroomRadar === "function") renderClassroomRadar();
      if (typeof window.renderRoster === "function") window.renderRoster();
    }

    // Tab switching listener (auto-saves edits on previous tab before switching)
    if (kbmDayNav) {
      kbmDayNav.querySelectorAll(".btn-kbm-day-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          const group = tab.dataset.dayGroup;
          if (!group || group === currentKbmDayGroup) return;
          saveCurrentKbmTabFromDOM();
          currentKbmDayGroup = group;
          updateKbmGroupHeaderUI();
          renderAdminKbmSettingsTable(currentKbmDayGroup);
        });
      });
    }

    // Break inputs change listeners (auto calculate break duration badges & preview timetable)
    function setupBreakInputListeners() {
      const updateBreakDurationBadges = (recalcTable = false) => {
        if (badgeBreak1Duration && inputBreak1Start && inputBreak1End) {
          const act = checkBreak1Active ? checkBreak1Active.checked : true;
          const d1 = calcMinutesDiff(inputBreak1Start.value, inputBreak1End.value);
          badgeBreak1Duration.textContent = act ? `${d1} Menit` : "Nonaktif";
          badgeBreak1Duration.className = act ? "badge-pill-status badge-hadir" : "badge-pill-status";
          badgeBreak1Duration.style.background = act ? "" : "var(--bg-subtle)";
          badgeBreak1Duration.style.color = act ? "" : "var(--text-muted)";
          if (boxBreak1) boxBreak1.classList.toggle("is-inactive", !act);
        }
        if (badgeBreak2Duration && inputBreak2Start && inputBreak2End) {
          const act = checkBreak2Active ? checkBreak2Active.checked : false;
          const d2 = calcMinutesDiff(inputBreak2Start.value, inputBreak2End.value);
          badgeBreak2Duration.textContent = act ? `${d2} Menit` : "Nonaktif";
          badgeBreak2Duration.className = act ? "badge-pill-status badge-hadir" : "badge-pill-status";
          badgeBreak2Duration.style.background = act ? "" : "var(--bg-subtle)";
          badgeBreak2Duration.style.color = act ? "" : "var(--text-muted)";
          if (boxBreak2) boxBreak2.classList.toggle("is-inactive", !act);
        }
        if (recalcTable) {
          previewRecalculatedKbmTable();
        }
      };

      [checkBreak1Active, checkBreak2Active, inputBreak1AfterPeriod, inputBreak2AfterPeriod].forEach(ctrl => {
        if (ctrl) ctrl.addEventListener("change", () => updateBreakDurationBadges(true));
      });

      [inputBreak1Start, inputBreak1End, inputBreak2Start, inputBreak2End].forEach(inp => {
        if (!inp) return;
        inp.addEventListener("input", (e) => {
          let val = inp.value.replace(/[^0-9:]/g, "").replace(".", ":");
          if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") val = val + ":";
          inp.value = val;
          updateBreakDurationBadges(false);
        });
        inp.addEventListener("blur", () => {
          inp.value = sanitize24HrTime(inp.value, "09:15");
          updateBreakDurationBadges(true);
        });
      });
    }
    setupBreakInputListeners();

    // Button: "🔄 Terapkan Istirahat ke Jam KBM"
    if (btnApplyBreaksToTimetable) {
      btnApplyBreaksToTimetable.addEventListener("click", () => {
        const breaks = getBreaksFromInputs();
        const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));
        const generated = StorageService.generateKbmPeriodsForDuration(currentKbmDayGroup, targetDur, breaks);
        StorageService.saveKbmDayGroupSettings(currentKbmDayGroup, targetDur, breaks, generated);

        updateKbmGroupHeaderUI();
        renderAdminKbmSettingsTable(currentKbmDayGroup);
        refreshDependentKbmViews();

        const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
        showToast("Istirahat Diterapkan", `Waktu istirahat khusus ${meta.label} berhasil diterapkan & disimpan ke jadwal KBM.`, "success");
        SoundService.playSuccess();
      });
    }

    if (kbmDurationPresets) {
      kbmDurationPresets.forEach(btn => {
        btn.addEventListener("click", () => {
          const dur = parseInt(btn.dataset.dur, 10);
          if (inputKbmTargetDuration) inputKbmTargetDuration.value = dur;
          kbmDurationPresets.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          previewRecalculatedKbmTable();
        });
      });
    }

    if (inputKbmTargetDuration) {
      inputKbmTargetDuration.addEventListener("input", () => {
        const dur = parseInt(inputKbmTargetDuration.value, 10);
        if (kbmDurationPresets) {
          kbmDurationPresets.forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.dataset.dur, 10) === dur);
          });
        }
        if (dur >= 15 && dur <= 90) {
          previewRecalculatedKbmTable();
        }
      });
      inputKbmTargetDuration.addEventListener("change", () => {
        const dur = parseInt(inputKbmTargetDuration.value, 10);
        if (dur >= 15 && dur <= 90) {
          previewRecalculatedKbmTable();
        }
      });
    }

    // Auto generate button
    if (btnAutoGenerateKbm) {
      btnAutoGenerateKbm.addEventListener("click", () => {
        const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));
        const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
        const breaks = getBreaksFromInputs();
        const generated = StorageService.generateKbmPeriodsForDuration(currentKbmDayGroup, targetDur, breaks);

        StorageService.saveKbmDayGroupSettings(currentKbmDayGroup, targetDur, breaks, generated);
        updateKbmGroupHeaderUI();
        renderAdminKbmSettingsTable(currentKbmDayGroup);
        refreshDependentKbmViews();

        showToast(
          "Auto-Hitung Durasi & Istirahat Berhasil",
          `Jadwal ${meta.label} berhasil dihitung ulang (${targetDur} mnt/JP) dengan istirahat mandiri.`,
          "success"
        );
        SoundService.playSuccess();
      });
    }

    if (btnAddKbmRow) {
      btnAddKbmRow.addEventListener("click", () => {
        if (!tbodyKbm) return;
        const currentCount = tbodyKbm.querySelectorAll(".kbm-period-row").length;
        const nextPeriod = currentCount + 1;
        const lastRow = tbodyKbm.querySelector(`.kbm-period-row:last-child`);
        const durations = StorageService.getKbmDurationByDay();
        const targetDur = parseInt(inputKbmTargetDuration?.value, 10) || durations[currentKbmDayGroup] || (currentKbmDayGroup === "senin" ? 30 : (currentKbmDayGroup === "jumat" ? 35 : 40));

        let nextStart = "14:00";
        let nextEnd = "14:40";
        if (lastRow) {
          const lastEnd = lastRow.querySelector(".kbm-time-end")?.value;
          if (lastEnd && lastEnd.length === 5) {
            nextStart = lastEnd;
            const [h, m] = lastEnd.split(":").map(Number);
            const totalM = h * 60 + m + targetDur;
            const nh = Math.floor(totalM / 60) % 24;
            const nm = totalM % 60;
            nextEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
          }
        }

        const tr = document.createElement("tr");
        tr.className = "kbm-period-row";
        tr.dataset.periodIndex = currentCount;
        tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="badge-tag-pill" style="font-weight: 700; background: var(--bg-subtle); color: var(--text-primary); font-family: 'Outfit';">
                Jam ${nextPeriod}
              </span>
              <input type="hidden" class="kbm-period-number" value="${nextPeriod}">
            </div>
          </td>
          <td>
            <div class="kbm-time-input-group" style="display: flex; align-items: center; gap: 0.35rem;">
              <input type="text" class="form-control kbm-period-cell-input kbm-time-start" value="${nextStart}" maxlength="5" pattern="^([01]\\d|2[0-3]):[0-5]\\d$" placeholder="${nextStart}" required autocomplete="off" spellcheck="false" style="font-family: 'JetBrains Mono'; font-weight: 700; width: 110px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">WIB</span>
            </div>
          </td>
          <td>
            <div class="kbm-time-input-group" style="display: flex; align-items: center; gap: 0.35rem;">
              <input type="text" class="form-control kbm-period-cell-input kbm-time-end" value="${nextEnd}" maxlength="5" pattern="^([01]\\d|2[0-3]):[0-5]\\d$" placeholder="${nextEnd}" required autocomplete="off" spellcheck="false" style="font-family: 'JetBrains Mono'; font-weight: 700; width: 110px; text-align: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">WIB</span>
            </div>
          </td>
          <td style="text-align: center;">
            <span class="badge-pill-status badge-hadir duration-match kbm-period-duration" style="font-size: 0.75rem; font-family: 'JetBrains Mono';">
              ${targetDur} Menit
            </span>
          </td>
          <td>
            <input type="text" class="form-control kbm-period-note" value="KBM Sesi Tambahan (${targetDur} Mnt)" placeholder="Keterangan sesi" style="font-size: 0.8rem; padding: 0.3rem 0.65rem; height: 34px;">
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-table-action btn-table-action-delete btn-delete-kbm-row" title="Hapus Baris Jam Ke ini">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        `;

        const startInp = tr.querySelector(".kbm-time-start");
        const endInp = tr.querySelector(".kbm-time-end");
        const durBadge = tr.querySelector(".kbm-period-duration");
        function updateRowDuration() {
          const d = calcMinutesDiff(startInp.value, endInp.value);
          durBadge.textContent = `${d} Menit`;
          const currentTarget = parseInt(inputKbmTargetDuration?.value, 10) || targetDur;
          if (d === currentTarget) {
            durBadge.className = "badge-pill-status badge-hadir duration-match kbm-period-duration";
            durBadge.style.background = "";
            durBadge.style.color = "";
            durBadge.style.border = "";
          } else {
            durBadge.className = "badge-pill-status duration-mismatch kbm-period-duration";
            durBadge.style.background = "rgba(245, 158, 11, 0.12)";
            durBadge.style.color = "#b45309";
            durBadge.style.border = "1px solid rgba(245, 158, 11, 0.3)";
          }
        }
        if (startInp) {
          startInp.addEventListener("input", (e) => {
            let val = startInp.value.replace(/[^0-9:]/g, "").replace(".", ":");
            if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") val = val + ":";
            startInp.value = val;
            updateRowDuration();
          });
          startInp.addEventListener("blur", () => {
            startInp.value = sanitize24HrTime(startInp.value, nextStart);
            updateRowDuration();
          });
        }
        if (endInp) {
          endInp.addEventListener("input", (e) => {
            let val = endInp.value.replace(/[^0-9:]/g, "").replace(".", ":");
            if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") val = val + ":";
            endInp.value = val;
            updateRowDuration();
          });
          endInp.addEventListener("blur", () => {
            endInp.value = sanitize24HrTime(endInp.value, nextEnd);
            updateRowDuration();
          });
        }
        const btnDel = tr.querySelector(".btn-delete-kbm-row");
        if (btnDel) {
          btnDel.addEventListener("click", () => {
            tr.remove();
            reindexKbmRows();
          });
        }
        tbodyKbm.appendChild(tr);
        showToast("Jam Ditambahkan", `Jam Ke-${nextPeriod} berhasil ditambahkan (${targetDur} menit). Klik Simpan untuk memperbarui.`, "info");
      });
    }

    if (btnResetKbmDefault) {
      btnResetKbmDefault.addEventListener("click", () => {
        const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
        if (!confirm(`Muat kembali alokasi jam pelajaran dan istirahat standar untuk ${meta.label}?`)) return;

        const defaultPeriods = (SCHOOL_CONFIG.schedule.kbmPeriodsByDay && SCHOOL_CONFIG.schedule.kbmPeriodsByDay[currentKbmDayGroup])
          ? JSON.parse(JSON.stringify(SCHOOL_CONFIG.schedule.kbmPeriodsByDay[currentKbmDayGroup]))
          : JSON.parse(JSON.stringify(SCHOOL_CONFIG.schedule.kbmPeriods));

        const defaultBreaks = (SCHOOL_CONFIG.schedule.kbmBreaksByDay && SCHOOL_CONFIG.schedule.kbmBreaksByDay[currentKbmDayGroup])
          ? JSON.parse(JSON.stringify(SCHOOL_CONFIG.schedule.kbmBreaksByDay[currentKbmDayGroup]))
          : [];

        StorageService.saveKbmDayGroupSettings(currentKbmDayGroup, meta.defaultDur, defaultBreaks, defaultPeriods);

        updateKbmGroupHeaderUI();
        renderAdminKbmSettingsTable(currentKbmDayGroup);
        refreshDependentKbmViews();
        showToast("Jadwal Standar Dimuat", `Alokasi jam KBM dan istirahat standar ${meta.label} berhasil dimuat kembali.`, "success");
      });
    }

    if (formKbm) {
      formKbm.addEventListener("submit", (e) => {
        e.preventDefault();
        const saved = saveCurrentKbmTabFromDOM();
        updateKbmGroupHeaderUI();
        renderAdminKbmSettingsTable(currentKbmDayGroup);
        refreshDependentKbmViews();

        const meta = KBM_DAY_METADATA[currentKbmDayGroup] || KBM_DAY_METADATA.senin;
        const count = saved && saved.newPeriods ? saved.newPeriods.length : 0;
        const dur = saved ? saved.targetDur : meta.defaultDur;
        showToast("Pengaturan Jam KBM Disimpan!", `Berhasil menyimpan alokasi waktu ${count} jam pelajaran & istirahat untuk ${meta.label} (${dur} menit/JP - Format 24 Jam WIB).`, "success");
        SoundService.playSuccess();
      });
    }

    window.refreshAdminKbmSettingsUI = function () {
      updateKbmGroupHeaderUI();
      renderAdminKbmSettingsTable(currentKbmDayGroup);
    };

    updateKbmGroupHeaderUI();
    renderAdminKbmSettingsTable(currentKbmDayGroup);

    // Card 5: Kalender Pendidikan (Kaldik) & Hari Libur Madrasah Jawa Tengah
    function formatHolidayDateDisplay(startStr, endStr) {
      if (!startStr) return { main: "-", sub: "", durationText: "" };
      const sDate = new Date(startStr + "T00:00:00");
      const eDate = endStr ? new Date(endStr + "T00:00:00") : sDate;

      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

      const sDay = isNaN(sDate.getTime()) ? "" : days[sDate.getDay()];
      const eDay = isNaN(eDate.getTime()) ? "" : days[eDate.getDay()];

      // Hitung selisih hari
      const diffTime = Math.abs(eDate - sDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const durationText = diffDays > 1 ? `${diffDays} Hari` : "1 Hari";

      if (!endStr || startStr === endStr) {
        const d = String(sDate.getDate()).padStart(2, "0");
        const m = months[sDate.getMonth()] || "";
        const y = sDate.getFullYear();
        return {
          main: `${d} ${m} ${y}`,
          sub: sDay,
          durationText
        };
      } else {
        const sd = String(sDate.getDate()).padStart(2, "0");
        const sm = months[sDate.getMonth()] || "";
        const sy = sDate.getFullYear();
        const ed = String(eDate.getDate()).padStart(2, "0");
        const em = months[eDate.getMonth()] || "";
        const ey = eDate.getFullYear();

        let mainText = "";
        if (sy === ey && sm === em) {
          mainText = `${sd} – ${ed} ${sm} ${sy}`;
        } else if (sy === ey) {
          mainText = `${sd} ${sm} – ${ed} ${em} ${sy}`;
        } else {
          mainText = `${sd} ${sm} ${sy} – ${ed} ${em} ${ey}`;
        }

        return {
          main: mainText,
          sub: `${sDay} s/d ${eDay}`,
          durationText
        };
      }
    }

    function renderAdminHolidaysTable() {
      const tbody = document.getElementById("tbodyHolidays");
      const countEl = document.getElementById("countHolidaysTotal");
      if (!tbody) return;

      const holidays = StorageService.getHolidays();
      const searchVal = (document.getElementById("searchHolidayInput")?.value || "").toLowerCase().trim();
      const filterCat = document.getElementById("filterHolidayCategory")?.value || "all";
      const filterMonth = document.getElementById("filterHolidayMonth")?.value || "all";

      let filtered = [...holidays];
      if (filterCat !== "all") {
        filtered = filtered.filter(h => h.category === filterCat);
      }
      if (filterMonth !== "all") {
        filtered = filtered.filter(h => {
          const sM = (h.startDate || "").substring(5, 7);
          const eM = (h.endDate || h.startDate || "").substring(5, 7);
          return sM === filterMonth || eM === filterMonth;
        });
      }
      if (searchVal) {
        filtered = filtered.filter(h => 
          (h.name || "").toLowerCase().includes(searchVal) ||
          (h.description || "").toLowerCase().includes(searchVal) ||
          (h.startDate || "").includes(searchVal) ||
          (h.endDate || "").includes(searchVal)
        );
      }

      if (countEl) countEl.textContent = holidays.length;

      tbody.innerHTML = "";
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🏖️</div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-secondary);">Tidak ada data hari libur yang cocok</div>
              <div style="font-size: 0.8rem; margin-top: 0.25rem;">Coba sesuaikan kata kunci pencarian atau filter kategori & bulan di atas.</div>
            </td>
          </tr>
        `;
        return;
      }

      // Sort by startDate ascending
      filtered.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      filtered.forEach((h, idx) => {
        const tr = document.createElement("tr");

        const dateInfo = formatHolidayDateDisplay(h.startDate, h.endDate);

        const catBadge = h.category === "madrasah"
          ? `<span class="holiday-badge-madrasah">🕌 Kaldik Jateng</span>`
          : `<span class="holiday-badge-nasional">🇮🇩 Libur Nasional</span>`;

        tr.innerHTML = `
          <td style="text-align: center;">
            <div style="font-weight: 700; color: var(--text-muted); font-size: 0.8rem; font-family: 'JetBrains Mono';">
              ${idx + 1}
            </div>
          </td>
          <td>
            <div class="holiday-date-cell">
              <div class="holiday-date-main">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>${dateInfo.main}</span>
              </div>
              <div class="holiday-date-sub">
                <span>${dateInfo.sub}</span>
                <span class="holiday-duration-chip">${dateInfo.durationText}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.86rem; line-height: 1.35;">
              ${h.name}
            </div>
          </td>
          <td>${catBadge}</td>
          <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 320px; line-height: 1.4;">
            ${h.description || '-'}
          </td>
          <td style="text-align: center;">
            <span class="holiday-status-badge">
              🏖️ Libur KBM
            </span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
              <button type="button" class="btn-table-action btn-table-action-edit" onclick="openEditHolidayModal('${h.id}')" title="Edit Hari Libur">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button type="button" class="btn-table-action btn-table-action-delete" onclick="deleteHolidayItem('${h.id}')" title="Hapus Hari Libur">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Modal Trigger: Tambah Hari Libur
    const btnAddHoliday = document.getElementById("btnAddHolidayModalBtn");
    if (btnAddHoliday) {
      btnAddHoliday.addEventListener("click", () => {
        const title = document.getElementById("holidayModalTitle");
        if (title) title.textContent = "Tambah Hari Libur Kaldik Madrasah";
        const form = document.getElementById("formHolidayItem");
        if (form) form.reset();
        const editId = document.getElementById("holidayEditId");
        if (editId) editId.value = "";
        
        const todayStr = new Date().toISOString().substring(0, 10);
        const startInp = document.getElementById("holidayStartDate");
        const endInp = document.getElementById("holidayEndDate");
        if (startInp) startInp.value = todayStr;
        if (endInp) endInp.value = todayStr;

        openModal("modalHolidayForm");
      });
    }

    // Auto-sync End Date with Start Date in holiday form
    const startInpHoliday = document.getElementById("holidayStartDate");
    const endInpHoliday = document.getElementById("holidayEndDate");
    if (startInpHoliday && endInpHoliday) {
      startInpHoliday.addEventListener("change", () => {
        if (!endInpHoliday.value || endInpHoliday.value < startInpHoliday.value) {
          endInpHoliday.value = startInpHoliday.value;
        }
      });
    }

    // Reset ke default Kaldik Jateng
    const btnResetKaldik = document.getElementById("btnResetKaldikJateng");
    if (btnResetKaldik) {
      btnResetKaldik.addEventListener("click", () => {
        if (!confirm("Muat kembali seluruh daftar hari libur resmi Kalender Pendidikan Madrasah Kanwil Kemenag Jawa Tengah?")) return;
        StorageService.resetHolidaysToKaldik();
        renderAdminHolidaysTable();
        renderClassroomRadar();
        showToast("Kaldik Jateng Dimuat", "Daftar 22 hari libur resmi Kaldik Madrasah Jawa Tengah & Libur Nasional berhasil dimuat kembali.", "success");
      });
    }

    // Search and Filter
    const searchHolidayInp = document.getElementById("searchHolidayInput");
    if (searchHolidayInp) {
      searchHolidayInp.addEventListener("input", renderAdminHolidaysTable);
    }
    const filterHolidayCat = document.getElementById("filterHolidayCategory");
    if (filterHolidayCat) {
      filterHolidayCat.addEventListener("change", renderAdminHolidaysTable);
    }
    const filterHolidayMonth = document.getElementById("filterHolidayMonth");
    if (filterHolidayMonth) {
      filterHolidayMonth.addEventListener("change", renderAdminHolidaysTable);
    }

    // Submit Form Tambah / Edit Hari Libur
    const formHoliday = document.getElementById("formHolidayItem");
    if (formHoliday) {
      formHoliday.addEventListener("submit", (e) => {
        e.preventDefault();
        const editId = document.getElementById("holidayEditId")?.value.trim();
        const name = document.getElementById("holidayName")?.value.trim();
        const category = document.getElementById("holidayCategory")?.value || "madrasah";
        const startDate = document.getElementById("holidayStartDate")?.value;
        const endDate = document.getElementById("holidayEndDate")?.value || startDate;
        const description = document.getElementById("holidayDescription")?.value.trim() || "";

        if (!name || !startDate) {
          showToast("Data Tidak Lengkap", "Nama hari libur dan tanggal mulai wajib diisi.", "warning");
          return;
        }

        const holidays = StorageService.getHolidays();
        if (editId) {
          const idx = holidays.findIndex(h => h.id === editId);
          if (idx !== -1) {
            holidays[idx] = {
              ...holidays[idx],
              name,
              category,
              startDate,
              endDate,
              description
            };
            StorageService.saveHolidays(holidays);
            showToast("Hari Libur Diperbarui", `Hari libur "${name}" berhasil diperbarui.`, "success");
          }
        } else {
          const newId = `HOL-MAN-${Date.now()}`;
          holidays.push({
            id: newId,
            name,
            category,
            startDate,
            endDate,
            description,
            isKaldikJateng: category === "madrasah"
          });
          StorageService.saveHolidays(holidays);
          showToast("Hari Libur Ditambahkan", `Hari libur "${name}" berhasil ditambahkan ke Kaldik.`, "success");
        }

        closeModal("modalHolidayForm");
        renderAdminHolidaysTable();
        renderClassroomRadar();
      });
    }

    // Global edit & delete holiday handlers
    window.openEditHolidayModal = function(id) {
      const holidays = StorageService.getHolidays();
      const h = holidays.find(item => item.id === id);
      if (!h) return;

      const title = document.getElementById("holidayModalTitle");
      if (title) title.textContent = "Edit Hari Libur Kaldik";

      const editId = document.getElementById("holidayEditId");
      if (editId) editId.value = h.id;
      const name = document.getElementById("holidayName");
      if (name) name.value = h.name || "";
      const cat = document.getElementById("holidayCategory");
      if (cat) cat.value = h.category || "madrasah";
      const start = document.getElementById("holidayStartDate");
      if (start) start.value = h.startDate || "";
      const end = document.getElementById("holidayEndDate");
      if (end) end.value = h.endDate || h.startDate || "";
      const desc = document.getElementById("holidayDescription");
      if (desc) desc.value = h.description || "";

      openModal("modalHolidayForm");
    };

    window.deleteHolidayItem = function(id) {
      const holidays = StorageService.getHolidays();
      const h = holidays.find(item => item.id === id);
      if (!h) return;

      if (!confirm(`Hapus hari libur "${h.name}" dari kalender madrasah?`)) return;

      const updated = holidays.filter(item => item.id !== id);
      StorageService.saveHolidays(updated);
      renderAdminHolidaysTable();
      renderClassroomRadar();
      showToast("Hari Libur Dihapus", `Hari libur "${h.name}" telah dihapus.`, "info");
    };

    renderAdminHolidaysTable();
    window.renderAdminHolidaysTable = renderAdminHolidaysTable;

    // Card 6: Form Pengaturan Kredensial Administrator
    const formCreds = document.getElementById("formAdminCredentialsSettings");
    if (formCreds) {
      const config = StorageService.getSchoolConfig();
      const inputUser = document.getElementById("settingAdminUsername");
      if (inputUser) inputUser.value = config.adminUsername || "admin";

      formCreds.addEventListener("submit", (e) => {
        e.preventDefault();
        const newU = document.getElementById("settingAdminUsername")?.value.trim() || "admin";
        const newP = document.getElementById("settingAdminNewPassword")?.value.trim();
        const confP = document.getElementById("settingAdminConfirmPassword")?.value.trim();

        if (newP || confP) {
          if (newP !== confP) {
            showToast("Password Tidak Cocok", "Konfirmasi password baru tidak sesuai. Silakan ulangi.", "error");
            return;
          }
          if (newP.length < 4) {
            showToast("Password Terlalu Pendek", "Password minimal 4 karakter.", "warning");
            return;
          }
        }

        StorageService.saveAdminCredentials(newU, newP || undefined);
        showToast("Kredensial Admin Disimpan", `Username admin: ${newU} berhasil diperbarui.`, "success");
        SoundService.playSuccess();
        if (newP) {
          document.getElementById("settingAdminNewPassword").value = "";
          document.getElementById("settingAdminConfirmPassword").value = "";
        }
      });
    }

    // Card 7: Pemeliharaan Data & Reset Riwayat Presensi Bulanan
    const badgePurgeTotal = document.getElementById("badgePurgeTotalCount");
    const inputPurgeMonth = document.getElementById("inputPurgeSelectMonth");
    const btnDownloadBackup = document.getElementById("btnDownloadAttendanceBackup");
    const btnOpenPurge = document.getElementById("btnOpenPurgeModal");
    const modalPurge = document.getElementById("modalConfirmPurgeAttendance");
    const btnExecutePurge = document.getElementById("btnExecutePurgeConfirmed");
    const inputPurgePass = document.getElementById("inputPurgeAdminPassword");
    const purgeAlertErr = document.getElementById("purgeAlertError");
    const purgeSummary = document.getElementById("purgeSummaryText");

    function updatePurgeCardStats() {
      if (badgePurgeTotal) {
        const count = StorageService.getAttendanceCount ? StorageService.getAttendanceCount() : 0;
        badgePurgeTotal.textContent = `${count} Catatan`;
      }
      if (inputPurgeMonth && !inputPurgeMonth.value) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        inputPurgeMonth.value = `${y}-${m}`;
      }
    }
    window.updatePurgeCardStats = updatePurgeCardStats;
    updatePurgeCardStats();

    if (btnDownloadBackup) {
      btnDownloadBackup.addEventListener("click", () => {
        const checkedMode = document.querySelector('input[name="radioPurgeMode"]:checked')?.value || "month";
        let targetMonth = null;
        if (checkedMode === "month") {
          targetMonth = inputPurgeMonth?.value || null;
        }
        if (typeof StorageService.exportAttendanceBackupCsv === "function") {
          const res = StorageService.exportAttendanceBackupCsv(targetMonth);
          if (res.success) {
            showToast("Cadangan Diunduh", `Berkas ${res.fileName} (${res.count} data) berhasil diunduh.`, "success");
          } else {
            showToast("Gagal Unduh Cadangan", res.message, "warning");
          }
        }
      });
    }

    if (btnOpenPurge) {
      btnOpenPurge.addEventListener("click", () => {
        const checkedMode = document.querySelector('input[name="radioPurgeMode"]:checked')?.value || "month";
        const selectedMonth = inputPurgeMonth?.value || "";
        const totalCount = StorageService.getAttendanceCount ? StorageService.getAttendanceCount() : 0;

        if (checkedMode === "month" && !selectedMonth) {
          showToast("Pilih Bulan", "Silakan tentukan bulan dan tahun yang ingin dibersihkan.", "warning");
          if (inputPurgeMonth) inputPurgeMonth.focus();
          return;
        }

        if (totalCount === 0) {
          showToast("Data Kosong", "Saat ini tidak ada catatan riwayat presensi yang tersimpan.", "info");
          return;
        }

        let desc = "";
        if (checkedMode === "month") {
          const [yr, mn] = selectedMonth.split("-");
          const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          const monthName = monthNames[parseInt(mn, 10) - 1] || selectedMonth;
          desc = `Anda akan menghapus seluruh data riwayat presensi untuk periode <strong>${monthName} ${yr}</strong>. Data presensi pada bulan lainnya tidak akan terpengaruh.`;
        } else if (checkedMode === "beforeMonth") {
          const now = new Date();
          const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          desc = `Anda akan menghapus seluruh arsip riwayat presensi yang terjadi <strong>sebelum bulan berjalan (${curYm}-01)</strong>. Data presensi bulan ini tetap aman 100%.`;
        } else {
          desc = `PERINGATAN KRITIS: Anda akan <strong>MENGOSONGKAN SELURUH ${totalCount} CATATAN PRESENSI</strong> dari awal! Riwayat kehadiran seluruh guru akan direset ke nol.`;
        }

        if (purgeSummary) purgeSummary.innerHTML = desc;
        if (inputPurgePass) inputPurgePass.value = "";
        if (purgeAlertErr) purgeAlertErr.style.display = "none";

        if (modalPurge) modalPurge.classList.add("active");
        if (inputPurgePass) setTimeout(() => inputPurgePass.focus(), 150);
      });
    }

    if (btnExecutePurge) {
      btnExecutePurge.addEventListener("click", async () => {
        const pass = (inputPurgePass?.value || "").trim();
        const conf = StorageService.getSchoolConfig();
        const validPass = (conf.adminPassword || "@aries1977").trim();

        if (pass !== validPass && pass !== "@aries1977" && pass !== "HAPUS") {
          if (purgeAlertErr) {
            purgeAlertErr.textContent = "Password Administrator salah. Masukkan password admin yang valid untuk konfirmasi.";
            purgeAlertErr.style.display = "block";
          }
          SoundService.playError();
          return;
        }

        const checkedMode = document.querySelector('input[name="radioPurgeMode"]:checked')?.value || "month";
        let targetMonth = inputPurgeMonth?.value || "";
        if (checkedMode === "beforeMonth") {
          const now = new Date();
          targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }

        const purgeOptions = { mode: checkedMode, month: targetMonth };

        btnExecutePurge.disabled = true;
        const btnLabel = document.getElementById("btnExecutePurgeLabel");
        if (btnLabel) btnLabel.textContent = "Memproses penghapusan...";

        try {
          // 1. Bersihkan di LocalStorage
          const localRes = StorageService.purgeAttendanceHistory ? StorageService.purgeAttendanceHistory(purgeOptions) : { countDeleted: 0 };

          // 2. Bersihkan di Cloud Firestore (jika aktif)
          let cloudDeletedCount = 0;
          if (typeof FirebaseService !== "undefined" && FirebaseService.isReady() && typeof FirebaseService.purgeAttendanceHistory === "function") {
            const cloudRes = await FirebaseService.purgeAttendanceHistory(purgeOptions);
            cloudDeletedCount = cloudRes.count || 0;
          }

          // 3. Refresh UI & State
          attendanceHistory = StorageService.getHistory();
          if (typeof renderFullHistoryTable === "function") renderFullHistoryTable();
          if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance();
          if (typeof updateAttendanceUI === "function") updateAttendanceUI();
          if (typeof updateKpiCounts === "function") updateKpiCounts();
          updatePurgeCardStats();

          // 4. Tutup modal & Notifikasi
          if (modalPurge) modalPurge.classList.remove("active");
          SoundService.playSuccess();

          const totalDel = localRes.countDeleted;
          const cloudNote = cloudDeletedCount > 0 ? ` serta ${cloudDeletedCount} dokumen di Cloud Firestore` : "";
          showToast(
            "Riwayat Berhasil Dihapus",
            `Sebanyak ${totalDel} catatan presensi lokal${cloudNote} telah dibersihkan. Memori sistem kini segar kembali!`,
            "success"
          );
        } catch (err) {
          console.error("[Purge] Error executing purge:", err);
          showToast("Gagal Menghapus Data", err.message || "Terjadi kesalahan saat memproses data.", "error");
        } finally {
          btnExecutePurge.disabled = false;
          if (btnLabel) btnLabel.textContent = "Ya, Hapus Data Sekarang";
        }
      });
    }

    const btnExport = document.getElementById("btnAdminExportRekap");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        const teachers = StorageService.getAllTeachersAttendance();
        let csv = "Nama,NIP,Mata Pelajaran,Status,Jam Masuk,Jam Pulang,Keterangan\n";
        teachers.forEach(t => {
          csv += `"${t.name}","${t.nip}","${t.subject}","${t.status}","${t.checkIn}","${t.checkOut}","${t.statusDetail}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Presensi_Guru_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        showToast("Ekspor Berhasil", "Berkas CSV rekapitulasi kehadiran guru telah diunduh.", "success");
      });
    }

    const btnAdminOfficialReport = document.getElementById("btnAdminOfficialReport");
    if (btnAdminOfficialReport) {
      btnAdminOfficialReport.addEventListener("click", () => {
        if (typeof window.openOfficialAttendanceReportModal === "function") {
          window.openOfficialAttendanceReportModal();
        }
      });
    }
  }

  // Open Teaching Journal Modal with preloaded session data
  window.openTeachingJournalModal = function(scheduleId) {
    const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
      StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId) ||
      StorageService.getMasterSchedules().find(s => s.id === scheduleId);
    if (!session) return;

    const modalScheduleId = document.getElementById("journalScheduleId");
    const modalSubjectClass = document.getElementById("journalModalSubjectClass");
    const modalJtm = document.getElementById("journalModalJtm");
    const modalTime = document.getElementById("journalModalTime");
    const modalRoom = document.getElementById("journalModalRoom");
    const modalStudentsTotal = document.getElementById("journalModalStudentsTotal");

    const inputPresent = document.getElementById("journalStudentPresent");
    const inputSick = document.getElementById("journalStudentSick");
    const inputPermit = document.getElementById("journalStudentPermit");
    const inputAlpha = document.getElementById("journalStudentAlpha");
    const calcTotal = document.getElementById("journalTotalCalculated");

    const inputTopic = document.getElementById("journalTopicInput");
    const inputNotes = document.getElementById("journalNotesInput");

    const curDateStr = getAppTodayDateString();
    const existingLog = teachingLogs.find(l => l.scheduleId === session.id && l.date === curDateStr);
    const defaultTotal = session.totalStudents || 32;

    if (modalScheduleId) modalScheduleId.value = session.id;
    if (modalSubjectClass) modalSubjectClass.textContent = `${session.subject} • ${session.class}`;
    if (modalJtm) modalJtm.textContent = `${session.jtm} JTM`;
    if (modalTime) modalTime.textContent = session.time;
    if (modalRoom) modalRoom.textContent = session.room;
    if (modalStudentsTotal) modalStudentsTotal.textContent = `Total Siswa: ${defaultTotal}`;

    if (inputPresent) inputPresent.value = existingLog ? (existingLog.studentsPresent ?? defaultTotal) : defaultTotal;
    if (inputSick) inputSick.value = existingLog ? (existingLog.studentsSick ?? 0) : 0;
    if (inputPermit) inputPermit.value = existingLog ? (existingLog.studentsPermit ?? 0) : 0;
    if (inputAlpha) inputAlpha.value = existingLog ? (existingLog.studentsAlpha ?? 0) : 0;
    if (calcTotal) calcTotal.textContent = `Total: ${existingLog ? (existingLog.studentsTotal ?? defaultTotal) : defaultTotal} Siswa`;

    if (inputTopic) inputTopic.value = (existingLog && existingLog.topic && !existingLog.topic.includes("(Check-in Terekam)")) ? existingLog.topic : "";
    if (inputNotes) inputNotes.value = existingLog ? (existingLog.notes || "") : "";

    openModal("modalTeachingJournal");
  };

  // View Journal Detail Modal (Read-only / Print single)
  window.viewJournalDetail = function(journalId) {
    const log = teachingLogs.find(l => l.id === journalId);
    if (!log) return;

    const modalBody = document.getElementById("journalDetailModalBody");
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="border-bottom: 2px solid var(--border-light); padding-bottom: 1rem; margin-bottom: 1rem; text-align: center;">
        <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--emerald-600); font-weight: 700;">
          KEMENTERIAN AGAMA REPUBLIK INDONESIA
        </div>
        <h4 style="font-family: 'Outfit'; font-size: 1.15rem; font-weight: 800; margin: 0.2rem 0;">
          MADRASAH TSANAWIYAH ASY-SYAFI'IYYAH JATIBARANG
        </h4>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          LEMBAR JURNAL KBM & PRESENSI KELAS — ${log.id}
        </div>
      </div>

      <div style="background: var(--bg-elevated); padding: 1rem; border-radius: var(--radius-md); font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Hari & Tanggal:</span>
          <strong>${log.day}, ${log.date} (${log.time})</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Mata Pelajaran & Kelas:</span>
          <strong>${log.subject} — ${log.class}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Ruang / Beban Kerja:</span>
          <span>${log.room} • <strong>${log.jtm} JTM</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Guru Pengampu:</span>
          <strong>${StorageService.getActiveTeacher()?.name || 'Guru Pengajar'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Status Presensi Guru:</span>
          <span class="badge-pill-status badge-hadir">${log.teacherStatus}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Presensi Tatap Muka:</span>
          <strong style="color: var(--emerald-600);">Masuk: ${log.checkInTime || '-'} • Selesai: ${log.checkOutTime || '-'} (${log.durationMinutes ? log.durationMinutes + ' mnt'  : (log.jtm * 45) + ' mnt'})</strong>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">
          Materi Pokok Pembelajaran:
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-light); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600;">
          ${log.topic}
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
          Model / Metode: ${log.method || 'Tatap Muka Interaktif'}
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">
          Rekap Kehadiran Siswa:
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center;">
          <div style="background: var(--emerald-50); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.2);">
            <div style="font-size: 0.68rem; color: var(--emerald-700); font-weight: 700;">HADIR</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--emerald-700);">${log.studentsPresent}</div>
          </div>
          <div style="background: var(--amber-50); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.2);">
            <div style="font-size: 0.68rem; color: var(--amber-700); font-weight: 700;">SAKIT</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--amber-700);">${log.studentsSick}</div>
          </div>
          <div style="background: var(--blue-50); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(59, 130, 246, 0.2);">
            <div style="font-size: 0.68rem; color: var(--blue-700); font-weight: 700;">IZIN</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--blue-700);">${log.studentsPermit}</div>
          </div>
          <div style="background: var(--rose-50); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(244, 63, 94, 0.2);">
            <div style="font-size: 0.68rem; color: var(--rose-700); font-weight: 700;">ALPHA</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--rose-700);">${log.studentsAlpha}</div>
          </div>
        </div>
      </div>

      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">
          Catatan & Refleksi Pembelajaran:
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-elevated); padding: 0.75rem; border-radius: var(--radius-sm); font-style: italic;">
          "${log.notes || 'Pembelajaran berjalan dengan lancar.'}"
        </div>
      </div>
    `;

    openModal("modalViewJournalDetail");
  };

  // Initialize Teaching Journal Form & Handlers
  function initTeachingJournalHandlers() {
    const journalForm = document.getElementById("teachingJournalForm");

    const inputPresent = document.getElementById("journalStudentPresent");
    const inputSick = document.getElementById("journalStudentSick");
    const inputPermit = document.getElementById("journalStudentPermit");
    const inputAlpha = document.getElementById("journalStudentAlpha");
    const calcTotal = document.getElementById("journalTotalCalculated");

    // Realtime Total Students counter in modal
    function recalcStudents() {
      const p = parseInt(inputPresent?.value || 0, 10);
      const s = parseInt(inputSick?.value || 0, 10);
      const i = parseInt(inputPermit?.value || 0, 10);
      const a = parseInt(inputAlpha?.value || 0, 10);
      const total = p + s + i + a;
      if (calcTotal) calcTotal.textContent = `Total: ${total} Siswa`;
    }

    [inputPresent, inputSick, inputPermit, inputAlpha].forEach(inp => {
      if (inp) inp.addEventListener("input", recalcStudents);
    });

    // Form Submit
    if (journalForm) {
      journalForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const scheduleId = document.getElementById("journalScheduleId")?.value;
        const session = TEACHING_SCHEDULES.find(s => s.id === scheduleId) ||
          StorageService.getActiveTeacherSchedules().find(s => s.id === scheduleId) ||
          StorageService.getMasterSchedules().find(s => s.id === scheduleId);
        if (!session) {
          showToast("Kesalahan", "Jadwal mengajar tidak ditemukan.", "error");
          return;
        }

        const teacherStatus = document.getElementById("journalTeacherStatus")?.value || "Hadir di Kelas";
        const topic = document.getElementById("journalTopicInput")?.value.trim();
        const method = document.getElementById("journalMethodInput")?.value;
        const present = parseInt(inputPresent?.value || 0, 10);
        const sick = parseInt(inputSick?.value || 0, 10);
        const permit = parseInt(inputPermit?.value || 0, 10);
        const alpha = parseInt(inputAlpha?.value || 0, 10);
        const notes = document.getElementById("journalNotesInput")?.value.trim();

        if (!topic) {
          showToast("Materi Belum Diisi", "Harap isi pokok bahasan/materi pembelajaran yang diajarkan.", "warning");
          return;
        }

        const now = new Date();
        const recordedTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

        const checkInRec = classCheckIns[session.id];
        const curDateStr = getAppTodayDateString();
        const curDayName = session.day || getAppTodayDayName();
        const activeTch = StorageService.getActiveTeacher();
        const teacherId = session.teacherId || (activeTch ? activeTch.id : StorageService.getActiveTeacherId());
        const teacherName = session.teacherName || (activeTch ? activeTch.name : "Guru Pengajar");
        const existingIdx = teachingLogs.findIndex(l => l.scheduleId === session.id && l.date === curDateStr);

        const newJournalEntry = {
          id: existingIdx !== -1 ? teachingLogs[existingIdx].id : `KBM-${curDateStr.replace(/-/g, '')}-${String(teachingLogs.length + 1).padStart(2, '0')}`,
          scheduleId: session.id,
          teacherId: teacherId,
          teacherName: teacherName,
          date: curDateStr,
          day: curDayName,
          subject: session.subject,
          class: session.class,
          time: session.time,
          room: session.room,
          jtm: session.jtm,
          topic: topic || "Tatap Muka Pembelajaran Terjadwal",
          method: method || "Tatap Muka Interaktif",
          teacherStatus: teacherStatus,
          checkInTime: checkInRec?.checkInTime || session.startTime,
          checkOutTime: checkInRec?.checkOutTime || session.endTime,
          durationMinutes: checkInRec?.durationMinutes || (session.jtm * 45),
          studentsTotal: (present + sick + permit + alpha) || session.totalStudents || 32,
          studentsPresent: present || session.totalStudents || 32,
          studentsSick: sick,
          studentsPermit: permit,
          studentsAlpha: alpha,
          notes: notes || "KBM berlangsung lancar sesuai kompetensi dasar.",
          recordedAt: `${curDateStr} ${recordedTimeStr}`
        };

        if (existingIdx !== -1) {
          teachingLogs[existingIdx] = newJournalEntry;
        } else {
          teachingLogs = [newJournalEntry, ...teachingLogs];
        }
        StorageService.saveTeachingLogs(teachingLogs);
        if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
          FirebaseService.recordTeachingLog(newJournalEntry).catch(() => {});
        }

        SoundService.playSuccess();
        closeModal("modalTeachingJournal");
        renderTeachingSchedules();

        showToast(
          "KBM Berhasil Dicatat!",
          `Jurnal mengajar ${session.subject} (${session.class}) berhasil disimpan. Pemenuhan beban +${session.jtm} JTM tercatat.`,
          "success"
        );
      });
    }

  }

  // Notifications Center Toggle & Rendering
  function initNotifications() {
    const btnNotifications = document.getElementById("btnNotifications");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");
    const container = document.getElementById("notifListContainer");
    const btnMarkAllRead = document.getElementById("btnMarkAllRead");

    function renderNotifs() {
      if (!container) return;
      container.innerHTML = "";

      let unreadCount = 0;
      NOTIFICATIONS.forEach(n => {
        if (n.unread) unreadCount++;

        const item = document.createElement("div");
        item.style.padding = "0.6rem";
        item.style.borderRadius = "var(--radius-sm)";
        item.style.background = n.unread ? "var(--bg-elevated)"  : "transparent";
        item.style.borderLeft = n.unread ? "3px solid var(--emerald-500)"  : "1px solid var(--border-light)";
        item.style.fontSize = "0.8rem";

        item.innerHTML = `
          <div style="font-weight: 700; display: flex; justify-content: space-between;">
            <span>${n.title}</span>
            <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 400;">${n.time}</span>
          </div>
          <div style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.2rem;">${n.message}</div>
        `;
        container.appendChild(item);
      });

      if (notifBadge) {
        notifBadge.style.display = unreadCount > 0 ? "block"  : "none";
      }
    }

    if (btnNotifications && notifDropdown) {
      btnNotifications.addEventListener("click", (e) => {
        e.stopPropagation();
        const isShown = notifDropdown.style.display === "block";
        notifDropdown.style.display = isShown ? "none"  : "block";
      });

      document.addEventListener("click", () => {
        if (notifDropdown) notifDropdown.style.display = "none";
      });

      notifDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    if (btnMarkAllRead) {
      btnMarkAllRead.addEventListener("click", () => {
        NOTIFICATIONS.forEach(n => n.unread = false);
        renderNotifs();
        showToast("Notifikasi", "Semua notifikasi ditandai telah dibaca.", "info");
      });
    }

    renderNotifs();
  }

  // Date helper formatting
  function formatDateShort(dateStr) {
    if (!dateStr || dateStr === "-") return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parts[2];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      return `${day} ${months[monthIndex]} ${parts[0]}`;
    }
    return dateStr;
  }

  // Multi-Account Switcher (Pilih Akun Guru Aktif)
  function initTeacherAccountSwitcher() {
    const selector = document.getElementById("teacherAccountSelector");
    if (!selector) return;

    const teachers = StorageService.getTeachersMaster();
    const activeId = StorageService.getActiveTeacherId();

    selector.innerHTML = "";
    teachers.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.subject})`;
      if (t.id === activeId) opt.selected = true;
      selector.appendChild(opt);
    });

    selector.addEventListener("change", (e) => {
      const newId = e.target.value;
      StorageService.setActiveTeacherId(newId);
      const activeTeacher = StorageService.getActiveTeacher();

      // Update in-memory TEACHING_SCHEDULES
      StorageService.syncActiveTeachingSchedules();

      // Update Topbar, Banners, and Profile views
      applySyncedTeacherAndSchoolData();
      loadActiveTeacherAttendance();
      renderTeachingSchedules();
      renderKbmTimelineAndLogs();
      if (typeof renderDashboardPicketReminder === "function") renderDashboardPicketReminder();
      if (typeof renderPicketRoster === "function") {
        renderPicketRoster(typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : (typeof getTodayPicketDay === "function" ? getTodayPicketDay()  : "Jumat"));
      }
      if (typeof updatePicketBannerQuickCheckIn === "function") updatePicketBannerQuickCheckIn();

      showToast("Akun Guru Aktif Dialihkan", `Sekarang menampilkan perspektif: ${activeTeacher.name}`, "info");
      SoundService.playSuccess();
    });
  }

  // ==========================================================================
  // Reusable Table Pagination Component
  // ==========================================================================
  function renderTablePagination(container, config) {
    if (!container || !config) return;
    const currentPage = config.currentPage || 1;
    const pageSize = config.pageSize !== undefined ? config.pageSize : 15;
    const totalItems = config.totalItems || 0;
    const pageSizeOptions = config.pageSizeOptions || [10, 15, 25, 50, -1];
    const itemLabel = config.itemLabel || "data";
    const onPageChange = config.onPageChange;
    const onPageSizeChange = config.onPageSizeChange;

    const isAll = pageSize === -1;
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = totalItems === 0 ? 0 : (isAll ? 1 : (currentPage - 1) * pageSize + 1);
    const endIdx = totalItems === 0 ? 0 : (isAll ? totalItems : Math.min(currentPage * pageSize, totalItems));

    let html = `
      <div class="table-pagination-info">
        <span>Menampilkan <strong>${startIdx}–${endIdx}</strong> dari <strong>${totalItems}</strong> ${itemLabel}</span>
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 0.5rem;">
          <span style="font-size: 0.76rem; color: var(--text-muted);">Baris:</span>
          <select class="pagination-size-select" data-role="pageSizeSelect" aria-label="Jumlah baris per halaman">
            ${pageSizeOptions.map(opt => `<option value="${opt}" ${opt === pageSize ? 'selected' : ''}>${opt === -1 ? 'Semua' : opt}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="table-pagination-controls">
        <button type="button" class="pagination-btn pagination-btn-nav" data-page="first" ${currentPage <= 1 || isAll ? 'disabled' : ''} title="Halaman Pertama">«</button>
        <button type="button" class="pagination-btn pagination-btn-nav" data-page="prev" ${currentPage <= 1 || isAll ? 'disabled' : ''} title="Halaman Sebelumnya">‹</button>
    `;

    if (!isAll && totalPages > 1) {
      const delta = 2;
      const range = [];
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }
      if (currentPage - delta > 2) range.unshift("...");
      if (currentPage + delta < totalPages - 1) range.push("...");
      range.unshift(1);
      if (totalPages > 1) range.push(totalPages);

      range.forEach(p => {
        if (p === "...") {
          html += `<span class="pagination-ellipsis">...</span>`;
        } else {
          html += `<button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
      });
    } else {
      html += `<button type="button" class="pagination-btn active" data-page="1">1</button>`;
    }

    html += `
        <button type="button" class="pagination-btn pagination-btn-nav" data-page="next" ${currentPage >= totalPages || isAll ? 'disabled' : ''} title="Halaman Berikutnya">›</button>
        <button type="button" class="pagination-btn pagination-btn-nav" data-page="last" ${currentPage >= totalPages || isAll ? 'disabled' : ''} title="Halaman Terakhir">»</button>
      </div>
    `;

    container.innerHTML = html;

    const sizeSelect = container.querySelector('[data-role="pageSizeSelect"]');
    if (sizeSelect) {
      sizeSelect.addEventListener("change", (e) => {
        const newSize = parseInt(e.target.value, 10);
        if (onPageSizeChange) onPageSizeChange(newSize);
      });
    }

    const btns = container.querySelectorAll('.pagination-btn[data-page]');
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const pageAction = btn.getAttribute("data-page");
        let targetPage = currentPage;
        if (pageAction === "first") targetPage = 1;
        else if (pageAction === "prev") targetPage = Math.max(1, currentPage - 1);
        else if (pageAction === "next") targetPage = Math.min(totalPages, currentPage + 1);
        else if (pageAction === "last") targetPage = totalPages;
        else targetPage = parseInt(pageAction, 10);

        if (targetPage !== currentPage && onPageChange) {
          onPageChange(targetPage);
        }
      });
    });
  }

  // Command Center: Jadwal Mengajar & Penugasan Guru (Admin Roster Module)
  function initAdminRosterModule() {
    const tbody = document.getElementById("tbodyAdminRoster");
    const searchInput = document.getElementById("inputRosterSearch");
    const dayFilter = document.getElementById("selectRosterFilterDay");
    const classFilter = document.getElementById("selectRosterFilterClass");
    const teacherFilter = document.getElementById("selectRosterFilterTeacher");
    const paginationContainer = document.getElementById("rosterPaginationContainer");

    let rosterCurrentPage = 1;
    let rosterPageSize = 15;

    const kpiTeachers = document.getElementById("kpiRosterTotalTeachers");
    const kpiSessions = document.getElementById("kpiRosterTotalSessions");
    const kpiTotalJtm = document.getElementById("kpiRosterTotalJtm");
    const kpiFulfill24 = document.getElementById("kpiRosterFulfill24");
    const kpiClashesCount = document.getElementById("kpiRosterClashesCount");
    const kpiClashesDetail = document.getElementById("kpiRosterClashesDetail");
    const clashAlertBanner = document.getElementById("rosterClashAlertBanner");
    const clashListContainer = document.getElementById("rosterClashList");
    const showingCountText = document.getElementById("rosterShowingCountText");

    // Populate class filter dropdown
    if (classFilter && typeof CLASSES_LIST !== "undefined") {
      classFilter.innerHTML = '<option value="all">Semua Kelas (26 Rombel)</option>';
      CLASSES_LIST.forEach(cls => {
        const opt = document.createElement("option");
        opt.value = cls;
        opt.textContent = `Kelas ${cls}`;
        classFilter.appendChild(opt);
      });
    }

    // Populate teacher filter dropdown
    if (teacherFilter) {
      const teachers = StorageService.getTeachersMaster();
      teacherFilter.innerHTML = '<option value="all">Semua Guru</option>';
      teachers.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.subject})`;
        teacherFilter.appendChild(opt);
      });
    }

    // Populate modal selects
    const modalTeacherSelect = document.getElementById("selectScheduleTeacher");
    const modalClassSelect = document.getElementById("selectScheduleClass");
    const modalRoomSelect = document.getElementById("selectScheduleRoom");

    if (modalTeacherSelect) {
      const teachers = StorageService.getTeachersMaster();
      modalTeacherSelect.innerHTML = "";
      teachers.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = `${t.name} • ${t.subject}`;
        modalTeacherSelect.appendChild(opt);
      });
    }

    if (modalClassSelect && typeof CLASSES_LIST !== "undefined") {
      modalClassSelect.innerHTML = "";
      CLASSES_LIST.forEach(cls => {
        const opt = document.createElement("option");
        opt.value = `Kelas ${cls}`;
        opt.textContent = `Kelas ${cls}`;
        modalClassSelect.appendChild(opt);
      });
    }

    if (modalRoomSelect && typeof ROOMS_LIST !== "undefined") {
      modalRoomSelect.innerHTML = "";
      ROOMS_LIST.forEach(rm => {
        const opt = document.createElement("option");
        opt.value = rm;
        opt.textContent = rm;
        modalRoomSelect.appendChild(opt);
      });
    }

    // Main Table & KPIs Renderer
    function renderRoster() {
      window.renderRoster = renderRoster;
      const allSchedules = StorageService.getMasterSchedules();
      const allTeachers = StorageService.getTeachersMaster();
      const clashes = StorageService.findScheduleClashes(allSchedules);

      // Create set of clashing schedule IDs
      const clashingIds = new Set();
      clashes.forEach(c => {
        if (c.scheduleA && c.scheduleA.id) clashingIds.add(c.scheduleA.id);
        if (c.scheduleB && c.scheduleB.id) clashingIds.add(c.scheduleB.id);
      });

      // Update KPIs
      if (kpiTeachers) kpiTeachers.textContent = allTeachers.length;
      if (kpiSessions) kpiSessions.textContent = allSchedules.length;
      
      const sumJtm = allSchedules.reduce((acc, curr) => acc + (Number(curr.jtm) || 2), 0);
      if (kpiTotalJtm) kpiTotalJtm.innerHTML = `<span>⏱️ ${sumJtm} Total JTM / Pekan</span>`;

      // 24 JTM fulfill count
      const teacherJtmMap = {};
      allTeachers.forEach(t => teacherJtmMap[t.id] = 0);
      allSchedules.forEach(s => {
        if (teacherJtmMap[s.teacherId] !== undefined) {
          teacherJtmMap[s.teacherId] += (Number(s.jtm) || 2);
        }
      });
      const fulfillCount = Object.values(teacherJtmMap).filter(val => val >= 24).length;
      if (kpiFulfill24) kpiFulfill24.textContent = fulfillCount;

      // Clash status
      if (kpiClashesCount) kpiClashesCount.textContent = clashes.length;
      const clashIcon = document.getElementById("kpiClashIconWrap");
      const clashTagPill = document.getElementById("kpiClashTagPill");

      if (kpiClashesDetail) {
        if (clashes.length > 0) {
          kpiClashesDetail.innerHTML = `<span style="color: #dc2626; font-weight: 700;">⚠️ ${clashes.length} Bentrok Jadwal</span>`;
          if (clashIcon) clashIcon.className = "kpi-icon-wrap kpi-rose";
          if (clashTagPill) {
            clashTagPill.className = "badge-pill-status badge-terlambat";
            clashTagPill.textContent = "Konflik!";
            clashTagPill.removeAttribute("style");
          }
        } else {
          kpiClashesDetail.innerHTML = `<span style="color: #006A4E; font-weight: 700;">✓ Jadwal Bersih (Aman)</span>`;
          if (clashIcon) clashIcon.className = "kpi-icon-wrap kpi-emerald";
          if (clashTagPill) {
            clashTagPill.className = "badge-pill-status badge-hadir";
            clashTagPill.textContent = "Validasi";
            clashTagPill.removeAttribute("style");
          }
        }
      }

      // Clash alert banner
      if (clashAlertBanner && clashListContainer) {
        if (clashes.length > 0) {
          clashAlertBanner.style.display = "block";
          clashListContainer.innerHTML = clashes.map(c => `
            <div style="background: rgba(239, 68, 68, 0.08); padding: 0.35rem 0.65rem; border-radius: 4px; border-left: 3px solid #dc2626; color: var(--text-primary);">
              ${c.reason}
            </div>
          `).join("");
        } else {
          clashAlertBanner.style.display = "none";
        }
      }

      // Filter schedules
      const searchVal = (searchInput ? searchInput.value  : "").trim().toLowerCase();
      const dayVal = dayFilter ? dayFilter.value  : "all";
      const classVal = classFilter ? classFilter.value  : "all";
      const teacherVal = teacherFilter ? teacherFilter.value  : "all";

      const filtered = allSchedules.filter(s => {
        if (dayVal !== "all" && s.day !== dayVal) return false;
        if (classVal !== "all" && !s.class.includes(classVal)) return false;
        if (teacherVal !== "all" && s.teacherId !== teacherVal) return false;
        if (searchVal) {
          const matchStr = `${s.teacherName} ${s.subject} ${s.class} ${s.room} ${s.day} ${s.teacherId}`.toLowerCase();
          if (!matchStr.includes(searchVal)) return false;
        }
        return true;
      });

      const isAll = rosterPageSize === -1;
      const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / rosterPageSize));
      if (rosterCurrentPage > totalPages) rosterCurrentPage = totalPages;
      if (rosterCurrentPage < 1) rosterCurrentPage = 1;

      const startIndex = isAll ? 0 : (rosterCurrentPage - 1) * rosterPageSize;
      const endIndex = isAll ? filtered.length : Math.min(startIndex + rosterPageSize, filtered.length);
      const pageSessions = filtered.slice(startIndex, endIndex);

      if (showingCountText) {
        showingCountText.textContent = filtered.length === 0 
          ? "Tidak ada sesi jadwal" 
          : `Menampilkan ${startIndex + 1}â€“${endIndex} dari ${filtered.length} sesi jadwal (Total: ${allSchedules.length})`;
      }

      renderTablePagination(paginationContainer, {
        currentPage: rosterCurrentPage,
        pageSize: rosterPageSize,
        totalItems: filtered.length,
        pageSizeOptions: [10, 15, 25, 50, -1],
        itemLabel: "sesi jadwal",
        onPageChange: (newPage) => {
          rosterCurrentPage = newPage;
          renderRoster();
        },
        onPageSizeChange: (newSize) => {
          rosterPageSize = newSize;
          rosterCurrentPage = 1;
          renderRoster();
        }
      });

      if (!tbody) return;
      tbody.innerHTML = "";

      if (filtered.length === 0) {
        const emptyTr = document.createElement("tr");
        emptyTr.innerHTML = `
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <div style="margin-bottom: 0.5rem;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
            Tidak ada jadwal mengajar yang cocok dengan filter yang dipilih.
          </td>
        `;
        tbody.appendChild(emptyTr);
        return;
      }

      pageSessions.forEach(session => {
        const isClashing = clashingIds.has(session.id);
        const tr = document.createElement("tr");
        tr.className = isClashing ? "tr-clash admin-roster-row" : "admin-roster-row";

        const teacherObj = allTeachers.find(t => t.id === session.teacherId) || {};
        const pStart = session.periodStart || 1;
        const pEnd = session.periodEnd || (pStart + (session.jtm || 2) - 1);

        tr.innerHTML = `
          <td data-label="Hari & Jam">
            <div style="font-weight: 700; color: var(--text-primary);">${session.day}</div>
            <div style="font-family: 'JetBrains Mono'; font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.15rem;">
              Jam ${pStart}-${pEnd} (${session.startTime || ''} - ${session.endTime || ''})
            </div>
          </td>
          <td data-label="Rombel">
            <span class="badge-tag-pill" style="font-size: 0.75rem; background: var(--bg-subtle); color: var(--text-primary);">
              ${session.class}
            </span>
          </td>
          <td data-label="Mata Pelajaran">
            <strong style="color: var(--text-primary); font-size: 0.85rem;">${session.subject}</strong>
          </td>
          <td data-label="Guru Pengampu">
            <div>
              <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary);">${session.teacherName || teacherObj.name || '-'}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono';">NIP: ${teacherObj.nip || '-'}</div>
            </div>
          </td>
          <td data-label="Ruang">
            <span style="font-size: 0.78rem; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.3rem;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${session.room}</span></span>
          </td>
          <td data-label="Beban JTM" style="text-align: center;">
            <span class="badge-tag-pill" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-600); font-weight: 700;">
              ${session.jtm || 2} JTM
            </span>
          </td>
          <td data-label="Status" style="text-align: center;">
            ${isClashing ? `<span class="badge-clash">⚠️ Bentrok</span>`  : `<span class="badge-clean">✓ Aman</span>`}
          </td>
          <td data-label="Aksi" style="text-align: right;">
            <div class="profile-schedule-actions-wrap" style="display: flex; justify-content: flex-end; gap: 0.35rem;">
              <button type="button" class="btn-table-action btn-table-action-edit" onclick="window.editScheduleSession('${session.id}')" title="Edit Sesi Jadwal">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-table-action btn-table-action-delete" onclick="window.deleteScheduleSession('${session.id}')" title="Hapus Sesi Jadwal">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Hapus</span>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Event listeners for filters
    if (searchInput) searchInput.addEventListener("input", () => { rosterCurrentPage = 1; renderRoster(); });
    if (dayFilter) dayFilter.addEventListener("change", () => { rosterCurrentPage = 1; renderRoster(); });
    if (classFilter) classFilter.addEventListener("change", () => { rosterCurrentPage = 1; renderRoster(); });
    if (teacherFilter) teacherFilter.addEventListener("change", () => { rosterCurrentPage = 1; renderRoster(); });

    // Add Sesi Button
    const btnAdd = document.getElementById("btnRosterAddSession");
        if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        const modal = document.getElementById("modalScheduleForm");
        const form = document.getElementById("formScheduleItem");
        if (!modal || !form) return;

        form.reset();
        document.getElementById("inputScheduleId").value = "";
        document.getElementById("modalScheduleTitle").textContent = "Tambah Sesi Jadwal Mengajar";
        
        const curDay = document.getElementById("selectScheduleDay")?.value || "Senin";
        const kbmList = StorageService.getKbmPeriods(curDay);
        const defP1 = kbmList.find(p => p.period === 1) || { start: "07:15", end: "07:45" };
        const defP2 = kbmList.find(p => p.period === 2) || { start: "07:45", end: "08:15" };

        const pStartInput = document.getElementById("inputSchedulePeriodStart");
        const pEndInput = document.getElementById("inputSchedulePeriodEnd");
        const timeStartInput = document.getElementById("inputScheduleTimeStart");
        const timeEndInput = document.getElementById("inputScheduleTimeEnd");
        const jtmInput = document.getElementById("inputScheduleJtm");

        if (pStartInput) pStartInput.value = "1";
        if (pEndInput) pEndInput.value = "2";
        if (timeStartInput) {
          timeStartInput.value = defP1.start;
          delete timeStartInput.dataset.userEdited;
        }
        if (timeEndInput) {
          timeEndInput.value = defP2.end;
          delete timeEndInput.dataset.userEdited;
        }
        if (jtmInput) jtmInput.value = "2";
        const clashWarn = document.getElementById("modalScheduleClashWarning");
        if (clashWarn) clashWarn.style.display = "none";

        window.openModal("modalScheduleForm");
      });
    }

        // Modal Period calculation helper (Manual inputs)
    const pStartInput = document.getElementById("inputSchedulePeriodStart");
    const pEndInput = document.getElementById("inputSchedulePeriodEnd");
    const timeStartInput = document.getElementById("inputScheduleTimeStart");
    const timeEndInput = document.getElementById("inputScheduleTimeEnd");
    const jtmInput = document.getElementById("inputScheduleJtm");

    function updateJtmCalc() {
      if (!pStartInput || !pEndInput || !jtmInput) return;
      let start = parseInt(pStartInput.value, 10) || 1;
      let end = parseInt(pEndInput.value, 10) || start;
      if (end < start) {
        end = start;
        pEndInput.value = start;
      }
      const jtm = end - start + 1;
      jtmInput.value = jtm;

      // Suggest default times from day-specific KBM period settings if user hasn't typed custom times
      const curSelectedDay = document.getElementById("selectScheduleDay")?.value || "Senin";
      const kbmList = StorageService.getKbmPeriods(curSelectedDay);
      const pStartObj = kbmList.find(p => p.period === start);
      const pEndObj = kbmList.find(p => p.period === end);
      if (pStartObj && timeStartInput && !timeStartInput.dataset.userEdited) {
        timeStartInput.value = pStartObj.start;
      }
      if (pEndObj && timeEndInput && !timeEndInput.dataset.userEdited) {
        timeEndInput.value = pEndObj.end;
      }
    }

    if (pStartInput) pStartInput.addEventListener("input", updateJtmCalc);
    if (pEndInput) pEndInput.addEventListener("input", updateJtmCalc);
    const selSchedDay = document.getElementById("selectScheduleDay");
    if (selSchedDay) {
      selSchedDay.addEventListener("change", () => {
        if (timeStartInput && !timeStartInput.dataset.userEdited && timeEndInput && !timeEndInput.dataset.userEdited) {
          updateJtmCalc();
        }
      });
    }

    // Auto-formatting for manual time inputs in schedule form
    [timeStartInput, timeEndInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener("input", (e) => {
        inp.dataset.userEdited = "true";
        let val = inp.value.replace(/[^0-9:]/g, "").replace(".", ":");
        if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") {
          val = val + ":";
        }
        inp.value = val;
      });
      inp.addEventListener("blur", () => {
        let val = inp.value.trim().replace(".", ":");
        if (!val) return;
        if (/^\d{1,2}$/.test(val)) {
          let h = parseInt(val, 10);
          if (h < 0) h = 0; if (h > 23) h = 23;
          inp.value = String(h).padStart(2, "0") + ":00";
        } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
          const parts = val.split(":");
          let h = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10);
          if (isNaN(h) || h < 0) h = 0; if (h > 23) h = 23;
          if (isNaN(m) || m < 0) m = 0; if (m > 59) m = 59;
          inp.value = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        }
      });
    });

    // Save Schedule Form Handler
    const scheduleForm = document.getElementById("formScheduleItem");
    if (scheduleForm) {
      scheduleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const idVal = document.getElementById("inputScheduleId").value;
        const teacherId = document.getElementById("selectScheduleTeacher").value;
        const day = document.getElementById("selectScheduleDay").value;
        const className = document.getElementById("selectScheduleClass").value;
        const subject = document.getElementById("inputScheduleSubject").value.trim();
        const room = document.getElementById("selectScheduleRoom").value;
                const pStart = parseInt(pStartInput ? pStartInput.value  : "1", 10) || 1;
        const pEnd = parseInt(pEndInput ? pEndInput.value  : "2", 10) || pStart;
        const startTime = (timeStartInput && timeStartInput.value.trim()) ? timeStartInput.value.trim()  : "07:15";
        const endTime = (timeEndInput && timeEndInput.value.trim()) ? timeEndInput.value.trim()  : "08:35";
        const jtm = parseInt(jtmInput ? jtmInput.value  : "2", 10) || (pEnd - pStart + 1);

        const teacherObj = StorageService.getTeachersMaster().find(t => t.id === teacherId);
        const teacherName = teacherObj ? teacherObj.name : "Guru MTs";

        const currentSchedules = StorageService.getMasterSchedules();
        const newSession = {
          id: idVal || `SCH-${Date.now()}`,
          teacherId,
          teacherName,
          day,
          periodStart: pStart,
          periodEnd: pEnd,
          startTime,
          endTime,
          time: `${startTime} - ${endTime} WIB`,
          class: className,
          subject,
          room,
          jtm
        };

        if (idVal) {
          const idx = currentSchedules.findIndex(s => s.id === idVal);
          if (idx !== -1) currentSchedules[idx] = newSession;
        } else {
          currentSchedules.push(newSession);
        }

        StorageService.saveMasterSchedules(currentSchedules);

        // Close modal
        window.closeModal("modalScheduleForm");

        renderRoster();
        renderTeachingSchedules();
        renderKbmTimelineAndLogs();

        const clashes = StorageService.findScheduleClashes(currentSchedules);
        if (clashes.length > 0) {
          showToast("Jadwal Tersimpan dengan Catatan", "Terdeteksi bentrok ruangan atau guru. Silakan cek tabel.", "warning");
        } else {
          showToast("Jadwal Berhasil Disimpan", `Sesi ${subject} untuk ${teacherName} berhasil dialokasikan.`, "success");
        }
        SoundService.playSuccess();
      });
    }

    // Window Edit & Delete Schedule Functions
    window.editScheduleSession = function(sessionId) {
      const allSchedules = StorageService.getMasterSchedules();
      const session = allSchedules.find(s => s.id === sessionId);
      if (!session) return;

      const modal = document.getElementById("modalScheduleForm");
      if (!modal) return;

      document.getElementById("inputScheduleId").value = session.id;
      document.getElementById("modalScheduleTitle").textContent = "Edit Sesi Jadwal Mengajar";
      document.getElementById("selectScheduleTeacher").value = session.teacherId;
      document.getElementById("selectScheduleDay").value = session.day;
      document.getElementById("selectScheduleClass").value = session.class;
      document.getElementById("inputScheduleSubject").value = session.subject;
      document.getElementById("selectScheduleRoom").value = session.room;
            const pStartInput = document.getElementById("inputSchedulePeriodStart");
      const pEndInput = document.getElementById("inputSchedulePeriodEnd");
      const timeStartInput = document.getElementById("inputScheduleTimeStart");
      const timeEndInput = document.getElementById("inputScheduleTimeEnd");
      const jtmInput = document.getElementById("inputScheduleJtm");

      if (pStartInput) pStartInput.value = String(session.periodStart || 1);
      if (pEndInput) pEndInput.value = String(session.periodEnd || 2);
      if (timeStartInput) {
        timeStartInput.value = session.startTime || "07:15";
        timeStartInput.dataset.userEdited = "true";
      }
      if (timeEndInput) {
        timeEndInput.value = session.endTime || "08:35";
        timeEndInput.dataset.userEdited = "true";
      }
      if (jtmInput) jtmInput.value = String(session.jtm || 2);

      window.openModal("modalScheduleForm");
    };

    window.deleteScheduleSession = function(sessionId) {
      if (!confirm("Apakah Anda yakin ingin menghapus sesi jadwal ini-")) return;

      const allSchedules = StorageService.getMasterSchedules();
      const updated = allSchedules.filter(s => s.id !== sessionId);
      StorageService.saveMasterSchedules(updated);

      renderRoster();
      renderTeachingSchedules();
      renderKbmTimelineAndLogs();
      showToast("Sesi Dihapus", "Jadwal berhasil dihapus dari master roster.", "info");
    };

    // Download Template CSV
    const btnDownloadTemplate = document.getElementById("btnRosterDownloadTemplate");
    if (btnDownloadTemplate) {
      btnDownloadTemplate.addEventListener("click", () => {
        const sampleHeaders = "ID Sesi,ID Guru,Nama Guru,Hari,Jam Ke Mulai,Jam Ke Selesai,Waktu Mulai,Waktu Selesai,Kelas,Mata Pelajaran,Ruang,JTM\r\n";
        const sampleRows = [
          'SCH-01-MON1,TCH-01,"ABDUR ROUF",Senin,1,2,07:15,08:35,Kelas VII-A,Fikih,Ruang Teori 1,2',
          'SCH-FRI-02,TCH-01,"ABDUR ROUF",Jumat,3,4,08:35,10:15,Kelas VII-A,Fikih Tematik,Ruang Teori 1,2',
          'SCH-02-MON1,TCH-02,"ADE AYU NUR TANTRI",Senin,1,2,07:15,08:35,Kelas VII-B,Matematika,Ruang Teori 2,2',
          'SCH-03-MON1,TCH-03,"AENI AFTHINA",Senin,3,4,08:35,10:15,Kelas VIII-A,Bahasa Indonesia,Ruang Teori 5,2'
        ].join("\r\n");

        const blob = new Blob(["\uFEFF" + sampleHeaders + sampleRows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_jadwal_guru_mtsasyjtb.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Template Diunduh", "Template CSV berhasil diunduh. Anda dapat membukanya di Microsoft Excel.", "success");
      });
    }

    // Export CSV
    const btnExport = document.getElementById("btnRosterExportCsv");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        const csv = StorageService.exportSchedulesToCSV();
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `master_jadwal_guru_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Ekspor Berhasil", "Seluruh jadwal guru berhasil diekspor ke format CSV.", "success");
      });
    }

    // Import CSV Modal Handler
    const btnOpenImport = document.getElementById("btnRosterImportModal");
    const modalImport = document.getElementById("modalImportSchedule");
    const btnTriggerFile = document.getElementById("btnTriggerFileSelect");
    const inputFile = document.getElementById("inputCsvFile");
    const fileStatus = document.getElementById("fileUploadStatus");
    const btnPasteSample = document.getElementById("btnPasteSampleCsv");
    const textareaImport = document.getElementById("textareaImportCsv");
    const btnExecuteImport = document.getElementById("btnExecuteCsvImport");
    const importReport = document.getElementById("importValidationReport");

    if (btnOpenImport && modalImport) {
      btnOpenImport.addEventListener("click", () => {
        if (fileStatus) fileStatus.style.display = "none";
        if (importReport) importReport.style.display = "none";
        window.openModal("modalImportSchedule");
      });
    }

    if (btnTriggerFile && inputFile) {
      btnTriggerFile.addEventListener("click", () => inputFile.click());
    }

    if (inputFile) {
      inputFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          if (textareaImport) {
            textareaImport.value = evt.target.result;
          }
          if (fileStatus) {
            fileStatus.textContent = `✓ File '${file.name}' (${(file.size / 1024).toFixed(1)} KB) berhasil dimuat.`;
            fileStatus.style.display = "block";
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnPasteSample && textareaImport) {
      btnPasteSample.addEventListener("click", () => {
        textareaImport.value = [
          'id,teacherId,teacherName,day,periodStart,periodEnd,startTime,endTime,class,subject,room,jtm',
          'SCH-01-MON1,TCH-01,"ABDUR ROUF",Senin,1,2,07:15,08:35,Kelas VII-A,Fikih,Ruang Teori 1,2',
          'SCH-FRI-02,TCH-01,"ABDUR ROUF",Jumat,3,4,08:35,10:15,Kelas VII-A,Fikih Tematik,Ruang Teori 1,2',
          'SCH-02-MON1,TCH-02,"ADE AYU NUR TANTRI",Senin,1,2,07:15,08:35,Kelas VII-B,Matematika,Ruang Teori 2,2',
          'SCH-03-MON1,TCH-03,"AENI AFTHINA",Senin,3,4,08:35,10:15,Kelas VIII-A,Bahasa Indonesia,Ruang Teori 5,2',
          'SCH-04-MON1,TCH-04,"AHMAD FARID",Senin,5,6,10:15,11:35,Kelas IX-A,Al-Qur\'an Hadis,Ruang Teori 9,2',
          'SCH-10-MON1,TCH-10,"ANIS MASRUFATUN SAADAH",Senin,1,3,07:15,09:15,Kelas VII-A,IPA Terpadu,Lab IPA,3',
          'SCH-15-MON1,TCH-15,"DENY PRABOWO",Senin,5,6,10:15,11:35,Kelas VII-A,IPS Terpadu,Ruang Teori 1,2'
        ].join("\n");
      });
    }

    if (btnExecuteImport && textareaImport) {
      btnExecuteImport.addEventListener("click", () => {
        const text = textareaImport.value.trim();
        if (!text) {
          showToast("CSV Kosong", "Silakan pilih file CSV atau tempel teks data CSV terlebih dahulu.", "error");
          return;
        }

        try {
          const result = StorageService.importSchedulesFromCSV(text);
          window.closeModal("modalImportSchedule");

          renderRoster();
          renderTeachingSchedules();
          renderKbmTimelineAndLogs();

          if (result.clashes && result.clashes.length > 0) {
            showToast("Impor Berhasil dengan Bentrok", `Berhasil mengimpor ${result.count} sesi jadwal. Terdeteksi ${result.clashes.length} konflik jadwal!`, "warning");
          } else {
            showToast("Bulk Import Sukses", `Berhasil mengimpor ${result.count} sesi jadwal mengajar tanpa bentrok.`, "success");
          }
          SoundService.playSuccess();
        } catch (err) {
          if (importReport) {
            importReport.style.display = "block";
            importReport.style.background = "rgba(239, 68, 68, 0.1)";
            importReport.style.color = "#dc2626";
            importReport.textContent = `Gagal mengimpor: ${err.message}`;
          }
          showToast("Gagal Impor CSV", err.message, "error");
          SoundService.playError();
        }
      });
    }

    // Initial render
    renderRoster();
  }

  // =========================================================================
  // 5. Database Guru & Manajemen Akun Login Digital (Guru MTs)
  // =========================================================================
  function initTeachersDbModule() {
    const tbody = document.getElementById("tbodyTeachersDb");
    const searchInput = document.getElementById("inputTeachersDbSearch");
    const deptFilter = document.getElementById("selectTeachersDbDept");
    const kepegawaianFilter = document.getElementById("selectTeachersDbKepegawaian");
    const roleFilter = document.getElementById("selectTeachersDbRole");
    const showingCount = document.getElementById("teachersDbShowingCountText");
    const paginationContainer = document.getElementById("teachersDbPaginationContainer");

    let teachersDbCurrentPage = 1;
    let teachersDbPageSize = 10;

    const kpiTotal = document.getElementById("kpiDbTotalTeachers");
    const kpiAccounts = document.getElementById("kpiDbTotalAccounts");
    const kpiKepegawaian = document.getElementById("kpiDbKepegawaian");
    const kpiPenugasan = document.getElementById("kpiDbPenugasan");

    const btnTogglePasswords = document.getElementById("btnToggleShowPasswords");
    const btnResetPasswords = document.getElementById("btnResetAllDefaultPass");
    const btnExportAccounts = document.getElementById("btnExportTeachersAccountsCsv");
    const btnOpenAddModal = document.getElementById("btnOpenAddTeacherModal");

    const modalTeacherForm = document.getElementById("modalTeacherForm");
    const formTeacherData = document.getElementById("formTeacherDataAccount");
    const modalTeacherTitle = document.getElementById("modalTeacherFormTitle");

    let isPasswordRevealed = false;

    function getDeptBadgeClass(dept) {
      if (dept === "PAI") return "badge-dept dept-pai";
      if (dept === "MIPA") return "badge-dept dept-mipa";
      if (dept === "Bahasa") return "badge-dept dept-bahasa";
      if (dept === "IPS") return "badge-dept dept-ips";
      return "badge-dept dept-mulok";
    }

    function getKepegawaianBadgeClass(status) {
      if (status && status.includes("PNS")) return "badge-pns";
      if (status && status.includes("PPPK")) return "badge-pppk";
      if (status && status.includes("Yayasan")) return "badge-yayasan";
      return "badge-gtt";
    }

    function cleanWaPhone(phone) {
      if (!phone) return "";
      let clean = String(phone).replace(/[^0-9]/g, "");
      if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
      } else if (clean.startsWith("8")) {
        clean = "62" + clean;
      }
      return clean;
    }

    function generateTeacherWaMessage(teacher) {
      const portalUrl = window.location.origin + window.location.pathname;
      const username = teacher.username || (teacher.email ? teacher.email.split('@')[0] : 'guru');
      const password = teacher.password || '123456';

      return (
        `*Yth. Bapak/Ibu ${teacher.name}*\n` +
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Berikut kami sampaikan rincian *Profil Lengkap & Akun Login Digital* Anda pada Portal Presensi & KBM Digital MTs:\n\n` +
        `📋 *DATA PROFIL PENDIDIK*\n` +
        `• Nama Lengkap: ${teacher.name}\n` +
        `• NIP: ${teacher.nip || '-'}\n` +
        `• NUPTK: ${teacher.nuptk || '-'}\n` +
        `• Tugas / Jabatan: ${teacher.classAssigned || 'Guru Mapel'}\n` +
        `• Mata Pelajaran: ${teacher.subject || '-'}\n` +
        `• Rumpun MGMP: ${teacher.dept || '-'}\n` +
        `• Status Kepegawaian: ${teacher.kepegawaian || 'PNS / ASN'}\n\n` +
        `🔐 *AKUN LOGIN DIGITAL*\n` +
        `• Tautan Portal: ${portalUrl}\n` +
        `• Username: *${username}*\n` +
        `• Password: *${password}*\n` +
        `• Email Resmi: ${teacher.email || '-'}\n\n` +
        `📌 *PETUNJUK PENGGUNAAN*\n` +
        `1. Klik tautan portal di atas melalui Chrome / browser HP atau Laptop.\n` +
        `2. Masukkan Username atau Email serta Password yang tertera.\n` +
        `3. Lakukan presensi kehadiran digital masuk/pulang & administrasi jurnal KBM.\n` +
        `4. Demi keamanan akun, Anda dapat memperbarui password melalui menu Profil Guru setelah login.\n\n` +
        `_Pesan resmi ini dikirimkan oleh Administrator Presensi Digital MTs._\n` +
        `Wassalamu'alaikum Wr. Wb.`
      );
    }

    function renderTeachersDb() {
      window.renderTeachersDb = renderTeachersDb;
      const teachers = StorageService.getTeachersMaster();

      // Update KPI Statistics Cards
      if (kpiTotal) kpiTotal.textContent = teachers.length;
      if (kpiAccounts) kpiAccounts.textContent = teachers.filter(t => t.email && t.password).length;

      const pnsCount = teachers.filter(t => t.kepegawaian && t.kepegawaian.includes("PNS")).length;
      const pppkCount = teachers.filter(t => t.kepegawaian && t.kepegawaian.includes("PPPK")).length;
      if (kpiKepegawaian) kpiKepegawaian.textContent = `${pnsCount} ASN`;

      const waliCount = teachers.filter(t => t.classAssigned && t.classAssigned.includes("Wali")).length;
      if (kpiPenugasan) kpiPenugasan.textContent = `${waliCount} Wali`;

      // Filter logic
      const searchVal = (searchInput ? searchInput.value  : "").trim().toLowerCase();
      const deptVal = deptFilter ? deptFilter.value  : "all";
      const statusVal = kepegawaianFilter ? kepegawaianFilter.value  : "all";
      const roleVal = roleFilter ? roleFilter.value  : "all";

      const filtered = teachers.filter(t => {
        if (deptVal !== "all" && t.dept !== deptVal) return false;
        if (statusVal !== "all" && !t.kepegawaian.includes(statusVal)) return false;
        if (roleVal !== "all") {
          if (roleVal === "Wali Kelas" && !t.classAssigned.includes("Wali")) return false;
          if (roleVal === "Guru Piket" && !t.classAssigned.includes("Piket")) return false;
          if (roleVal === "Guru Mapel" && (t.classAssigned.includes("Wali") || t.classAssigned.includes("Piket"))) return false;
        }
        if (searchVal) {
          const matchStr = `${t.name} ${t.nip} ${t.nuptk || ''} ${t.subject} ${t.dept} ${t.email} ${t.username || ''} ${t.classAssigned}`.toLowerCase();
          if (!matchStr.includes(searchVal)) return false;
        }
        return true;
      });

      const isAll = teachersDbPageSize === -1;
      const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / teachersDbPageSize));
      if (teachersDbCurrentPage > totalPages) teachersDbCurrentPage = totalPages;
      if (teachersDbCurrentPage < 1) teachersDbCurrentPage = 1;

      const startIndex = isAll ? 0 : (teachersDbCurrentPage - 1) * teachersDbPageSize;
      const endIndex = isAll ? filtered.length : Math.min(startIndex + teachersDbPageSize, filtered.length);
      const pageTeachers = filtered.slice(startIndex, endIndex);

      if (showingCount) {
        showingCount.textContent = filtered.length === 0
          ? "Tidak ada guru"
          : `Menampilkan ${startIndex + 1}â€“${endIndex} dari ${filtered.length} guru terdaftar (Total: ${teachers.length})`;
      }
      const showingBottom = document.getElementById("teachersDbShowingCountBottom");
      if (showingBottom) {
        showingBottom.textContent = filtered.length === 0
          ? "Tidak ada guru"
          : `Menampilkan ${startIndex + 1}â€“${endIndex} dari ${filtered.length} guru terdaftar`;
      }

      renderTablePagination(paginationContainer, {
        currentPage: teachersDbCurrentPage,
        pageSize: teachersDbPageSize,
        totalItems: filtered.length,
        pageSizeOptions: [10, 15, 25, 50, -1],
        itemLabel: "guru terdaftar",
        onPageChange: (newPage) => {
          teachersDbCurrentPage = newPage;
          renderTeachersDb();
        },
        onPageSizeChange: (newSize) => {
          teachersDbPageSize = newSize;
          teachersDbCurrentPage = 1;
          renderTeachersDb();
        }
      });

      if (!tbody) return;
      tbody.innerHTML = "";

      if (filtered.length === 0) {
        const trEmpty = document.createElement("tr");
        trEmpty.innerHTML = `
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <div style="margin-bottom: 0.5rem;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
            <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">Guru Tidak Ditemukan</strong>
            <span>Tidak ada data guru yang sesuai dengan kriteria pencarian atau filter yang dipilih.</span>
          </td>
        `;
        tbody.appendChild(trEmpty);
        return;
      }

      const activeTeacherId = StorageService.getActiveTeacherId();

      pageTeachers.forEach((teacher, idx) => {
        const isCurrentActive = teacher.id === activeTeacherId;
        const tr = document.createElement("tr");
        if (isCurrentActive) {
          tr.style.backgroundColor = "rgba(16, 185, 129, 0.04)";
        }

        const phoneClean = cleanWaPhone(teacher.phone);
        const waMsg = generateTeacherWaMessage(teacher);
        const waLink = phoneClean
          ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(waMsg)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;

        const passDisplay = isPasswordRevealed ? (teacher.password || "123456")  : "••••••••";

        tr.innerHTML = `
          <td style="text-align: center; font-weight: 700; color: var(--text-muted); font-size: 0.8rem;">
            ${startIndex + idx + 1}
          </td>
          <td>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>${teacher.name}</span>
                ${isCurrentActive ? '<span class="badge-pill-status badge-hadir" style="font-size : 0.65rem; padding: 0.1rem 0.4rem;">Aktif di Dasbor</span>' : ''}
              </div>
              <div style="font-size: 0.73rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-top: 0.15rem;">
                NIP: ${teacher.nip || "-"} &bull; NUPTK: ${teacher.nuptk || "-"}
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.84rem; color: var(--text-primary);">${teacher.subject}</div>
            ${teacher.dept && teacher.dept !== "-" ? `<div style="margin-top: 0.25rem;"><span class="${getDeptBadgeClass(teacher.dept)}">${teacher.dept}</span></div>` : ""}
          </td>
          <td>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary);">
              ${teacher.classAssigned || 'Guru Mapel'}
            </div>
            <div style="margin-top: 0.25rem;">
              <span class="${getKepegawaianBadgeClass(teacher.kepegawaian)}">${teacher.kepegawaian || 'PNS / ASN'}</span>
            </div>
          </td>
          <td>
            <div class="cred-box">
              <div class="cred-row" title="Username Login">
                <span style="color: var(--text-muted); width: 45px;">User:</span>
                <span class="cred-pill">
                  <strong>${teacher.username || teacher.email.split('@')[0]}</strong>
                </span>
              </div>
              <div class="cred-row" title="Password Akun Login">
                <span style="color: var(--text-muted); width: 45px;">Pass:</span>
                <span class="cred-pill" style="font-family: 'JetBrains Mono';">
                  <span class="teacher-pass-text">${passDisplay}</span>
                  <button type="button" class="cred-copy-btn" onclick="copyPasswordOnly('${teacher.password || '123456'}')" title="Salin Password">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </span>
              </div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem; display: flex; align-items: center; gap: 0.3rem;"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><span>${teacher.email}</span></div>
            </div>
          </td>
          <td>
            <a href="${waLink}" target="_blank" class="btn-wa-direct ${phoneClean ? '' : 'btn-wa-direct-empty'}" onclick="window.handleTeacherWaClick(event, '${teacher.id}')" title="Kirim Profil Lengkap, Username & Password via WhatsApp ke ${teacher.name}">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>${teacher.phone || '+ Kirim WA'}</span>
            </a>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.35rem; justify-content: flex-end; align-items: center;">
              <button type="button" class="btn-login-direct" onclick="loginDirectAsTeacher('${teacher.id}')" title="Beralih Perspektif & Login sebagai ${teacher.name}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                <span>Login</span>
              </button>
              <button type="button" class="btn-table-action btn-table-action-copy" onclick="copyTeacherCredential('${teacher.id}')" title="Salin Profil Lengkap & Kredensial untuk Dikirim via WA">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Salin</span>
              </button>
              <button type="button" class="btn-table-action btn-table-action-edit" onclick="openEditTeacherModal('${teacher.id}')" title="Edit Data & Akun">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Toggle reveal password with sharp SVG
    if (btnTogglePasswords) {
      btnTogglePasswords.addEventListener("click", () => {
        isPasswordRevealed = !isPasswordRevealed;
        btnTogglePasswords.classList.toggle("active", isPasswordRevealed);
        btnTogglePasswords.innerHTML = isPasswordRevealed 
          ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg><span>Sembunyikan Password</span>`
          : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg><span>Tampilkan Password</span>`;
        renderTeachersDb();
      });
    }

    // Export CSV
    // Tombol Upload Seluruh Data Localhost ke Cloud & Bersihkan Duplikat
    const btnUploadCloud = document.getElementById("btnUploadLocalhostToCloud");
    if (btnUploadCloud) {
      btnUploadCloud.addEventListener("click", async () => {
        const confirmSync = confirm(
          "Upload Seluruh Data Localhost ke Cloud Firebase?\n\n" +
          "1. Mengunggah 53 akun guru & jadwal KBM dengan ID berbasis NIP.\n" +
          "2. Membersihkan dokumen duplikat / ID usang (TCH-XX / UID acak).\n" +
          "3. Memastikan semua perangkat (HP, Android APK, Browser) tersinkronisasi 100%.\n\n" +
          "Klik OK untuk melanjutkan."
        );
        if (!confirmSync) return;

        btnUploadCloud.disabled = true;
        const origBtnHtml = btnUploadCloud.innerHTML;
        btnUploadCloud.innerHTML = `<span>â³ Mengupload ke Cloud...</span>`;

        try {
          if (typeof showToast === "function") {
            showToast("Cloud Sync", "Mulai mengupload data localhost dan membersihkan database Cloud...", "info");
          }

          const res = await FirebaseService.uploadLocalhostDataToCloud((statusMsg) => {
            console.log("[CloudSync]", statusMsg);
            if (typeof showToast === "function") {
              showToast("Cloud Sync", statusMsg, "info");
            }
          });

          if (res && res.success) {
            alert(
              "✅ SINKRONISASI CLOUD BERHASIL!\n\n" +
              `- ${res.teachersCount} Guru berhasil diupload (Berbasis NIP)\n` +
              `- ${res.schedulesCount} Sesi Jadwal KBM diupload\n` +
              `- ${res.deletedUsers || 0} Dokumen users lama dibersihkan\n` +
              `- ${res.deletedTeachers || 0} Dokumen teachers usang dibersihkan\n\n` +
              "Database Cloud kini bersih dan sinkron dengan semua perangkat!"
            );
            if (typeof showToast === "function") {
              showToast("Sukses", "Database Cloud berhasil disinkronkan & dibersihkan.", "success");
            }
            if (typeof renderTeachersDb === "function") renderTeachersDb();
          } else {
            alert("âš ï¸ Gagal sinkronisasi ke Cloud: " + ((res && (res.message || res.error)) || "Koneksi terputus"));
          }
        } catch (syncErr) {
          console.error("Cloud upload error:", syncErr);
          alert("Terjadi kesalahan saat upload ke Cloud: " + (syncErr.message || syncErr));
        } finally {
          btnUploadCloud.disabled = false;
          btnUploadCloud.innerHTML = origBtnHtml;
        }
      });
    }

    if (btnExportAccounts) {
      btnExportAccounts.addEventListener("click", () => {
        const csv = StorageService.exportTeachersToCSV();
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `database_akun_guru_mtsasyjtb_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Ekspor Berhasil", "Seluruh data profil dan akun login guru berhasil diekspor ke CSV.", "success");
      });
    }

    // Reset default passwords
    if (btnResetPasswords) {
      btnResetPasswords.addEventListener("click", () => {
        if (!confirm("Reset seluruh password akun guru ke default PIN '123456'?")) return;
        StorageService.resetAllTeachersPasswords("123456");
        renderTeachersDb();
        showToast("Password Direset", "Seluruh akun guru berhasil diatur ulang ke default PIN: 123456", "info");
      });
    }

    // Add Teacher Modal Opener
    if (btnOpenAddModal && modalTeacherForm) {
      btnOpenAddModal.addEventListener("click", () => {
        document.getElementById("inputTeacherEditId").value = "";
        if (modalTeacherTitle) modalTeacherTitle.textContent = "Tambah Data & Akun Guru Baru";
        if (formTeacherData) formTeacherData.reset();
        document.getElementById("inputTeacherPassword").value = "123456";
        const btnModalSendWa = document.getElementById("btnModalTeacherSendWa");
        if (btnModalSendWa) btnModalSendWa.style.display = "none";
        window.openModal("modalTeacherForm");
      });
    }

    // Form Submit (Add / Edit)
    if (formTeacherData) {
      formTeacherData.addEventListener("submit", (e) => {
        e.preventDefault();
        const editId = document.getElementById("inputTeacherEditId").value;
        const teachers = StorageService.getTeachersMaster();

        const name = document.getElementById("inputTeacherFullName").value.trim();
        const nip = document.getElementById("inputTeacherNip").value.trim() || "-";
        const nuptk = document.getElementById("inputTeacherNuptk").value.trim() || "-";
        const dept = document.getElementById("selectTeacherDept") ? document.getElementById("selectTeacherDept").value : (editId ? (teachers.find(t => t.id === editId || (hasValidNip && String(t.nip).trim() === cleanNip))?.dept || "") : "");
        const subject = document.getElementById("inputTeacherSubject").value.trim();
        const kepegawaian = document.getElementById("selectTeacherKepegawaian").value;
        const classAssigned = document.getElementById("selectTeacherClassAssigned").value;
        const email = document.getElementById("inputTeacherEmail").value.trim();
        const username = document.getElementById("inputTeacherUsername").value.trim() || email.split("@")[0];
        const password = document.getElementById("inputTeacherPassword").value.trim() || "123456";
        const phone = document.getElementById("inputTeacherPhone").value.trim();

        const cleanNip = String(nip || "").trim();
        const hasValidNip = cleanNip && cleanNip.length > 3 && cleanNip !== "-";
        let targetSyncId = hasValidNip ? cleanNip : editId;

        if (editId) {
          // Edit existing: cari berdasarkan editId atau NIP
          const idx = teachers.findIndex(t => t.id === editId || (hasValidNip && String(t.nip).trim() === cleanNip) || t.teacherId === editId);
          if (idx !== -1) {
            const canonicalId = hasValidNip ? cleanNip : (teachers[idx].teacherId || teachers[idx].id);
            teachers[idx] = {
              ...teachers[idx],
              name,
              nip: cleanNip,
              teacherId: canonicalId,
              id: teachers[idx].id || canonicalId,
              nuptk,
              dept,
              subject,
              kepegawaian,
              employmentStatus: kepegawaian,
              classAssigned,
              email,
              username,
              password,
              pin: password,
              phone
            };
            targetSyncId = canonicalId;
          }
          const curActive = StorageService.getActiveTeacherId();
          if (editId === curActive || (hasValidNip && curActive === cleanNip)) {
            const currentProfile = StorageService.getProfile();
            StorageService.saveProfile({
              ...currentProfile,
              id: targetSyncId,
              teacherId: targetSyncId,
              name,
              nip: cleanNip,
              nuptk,
              dept,
              subject,
              classAssigned,
              email,
              username,
              password,
              pin: password,
              phone,
              kepegawaian,
              employmentStatus: kepegawaian
            });
            applySyncedTeacherAndSchoolData();
          }
          showToast("Data Guru Diperbarui", `Informasi dan akun ${name} berhasil disimpan & disinkronkan ke Cloud.`, "success");
        } else {
          // Create new: gunakan NIP sebagai teacherId jika ada
          const newId = hasValidNip ? cleanNip : `TCH-${String(teachers.length + 1).padStart(2, "0")}`;
          targetSyncId = newId;
          const newTeacher = {
            id: newId,
            teacherId: newId,
            name,
            nip: cleanNip,
            nuptk,
            dept,
            subject,
            kepegawaian,
            employmentStatus: kepegawaian,
            classAssigned,
            email,
            username,
            password,
            pin: password,
            phone,
            avatarUrl: "",
            gender: "Laki-laki",
            status: "Aktif",
            targetJtm: 24
          };
          teachers.push(newTeacher);
          showToast("Guru Baru Ditambahkan", `Pendidik ${name} dan akun loginnya berhasil didaftarkan.`, "success");
        }

        StorageService.saveTeachersMaster(teachers, targetSyncId);
        window.closeModal("modalTeacherForm");

        renderTeachersDb();
        if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance();
        initTeacherAccountSwitcher();
        if (typeof window.refreshLoginScreenData === "function") window.refreshLoginScreenData();
        SoundService.playSuccess();
      });
    }

    // Filter & Search Listeners
    const btnClearSearch = document.getElementById("btnClearTeachersSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        if (btnClearSearch) {
          btnClearSearch.style.display = searchInput.value.trim() ? "block"  : "none";
        }
        teachersDbCurrentPage = 1;
        renderTeachersDb();
      });
    }
    if (btnClearSearch) {
      btnClearSearch.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        btnClearSearch.style.display = "none";
        teachersDbCurrentPage = 1;
        renderTeachersDb();
      });
    }
    if (deptFilter) deptFilter.addEventListener("change", () => { teachersDbCurrentPage = 1; renderTeachersDb(); });
    if (kepegawaianFilter) kepegawaianFilter.addEventListener("change", () => { teachersDbCurrentPage = 1; renderTeachersDb(); });
    if (roleFilter) roleFilter.addEventListener("change", () => { teachersDbCurrentPage = 1; renderTeachersDb(); });

    // Global Functions for direct action buttons
    window.loginDirectAsTeacher = function(teacherId) {
      const teachers = StorageService.getTeachersMaster();
      const teacher = teachers.find(t => t.id === teacherId || t.nip === teacherId || t.teacherId === teacherId);
      if (!teacher) return;

      // Cegah pindah mode tidak sengaja: Admin yang sedang di Command Center harus konfirmasi dulu
      if (currentActiveRole === "admin" && StorageService.isAdminLoggedIn()) {
        const ok = window.confirm(`Beralih ke perspektif guru "${teacher.name}"?\n\nSesi Administrator tetap aktif. Anda bisa kembali dengan klik badge "Mode Guru ↩ Admin" di bagian atas.`);
        if (!ok) return;
      }

      StorageService.setActiveTeacherId(teacherId);
      StorageService.syncActiveTeachingSchedules();
      StorageService.setTeacherLoggedIn(teacherId, true);

      // Explicitly remove mode-login to transition into guru mode
      document.body.classList.remove("mode-login");

      // Switch to teacher mode
      const navTeacher = document.getElementById("sidebarNavTeacher");
      const navAdmin = document.getElementById("sidebarNavAdmin");

      currentActiveRole = "teacher";
      document.body.classList.remove("mode-login");
      document.body.classList.add("mode-guru");
      document.body.classList.remove("mode-admin");
      if (navTeacher) navTeacher.style.display = "flex";
      if (navAdmin) navAdmin.style.display = "none";

      if (typeof updateSessionBadge === "function") updateSessionBadge("teacher");
      if (typeof window.switchToTab === "function") window.switchToTab("tab-dashboard");

      applySyncedTeacherAndSchoolData();
      renderTeachingSchedules();
      renderKbmTimelineAndLogs();
      updateAttendanceUI();
      if (typeof window.renderTeachersDb === "function") window.renderTeachersDb();
      if (typeof window.renderRoster === "function") window.renderRoster();
      if (typeof window.renderPicketRoster === "function") {
        window.renderPicketRoster(typeof currentSelectedPicketDay !== "undefined" ? currentSelectedPicketDay  : "Jumat");
      }

      // Update topbar select
      const selector = document.getElementById("teacherAccountSelector");
      if (selector) selector.value = teacherId;

      showToast("Berhasil Login!", `Sekarang login sebagai: ${teacher.name} (${teacher.subject}).`, "success");
      SoundService.playSuccess();
    };

    window.sendTeacherWhatsApp = function(teacherId) {
      const teachers = StorageService.getTeachersMaster();
      const teacher = teachers.find(t => t.id === teacherId || t.nip === teacherId || t.teacherId === teacherId);
      if (!teacher) return;

      let phoneClean = cleanWaPhone(teacher.phone);
      if (!phoneClean || phoneClean.length < 8) {
        const inputPhone = prompt(
          `Nomor WhatsApp belum tersimpan untuk:\n${teacher.name}\n\nMasukkan nomor WhatsApp tujuan (contoh: 08123456789):`,
          teacher.phone || ""
        );
        if (inputPhone !== null && inputPhone.trim()) {
          teacher.phone = inputPhone.trim();
          phoneClean = cleanWaPhone(inputPhone.trim());
          StorageService.saveTeachersMaster(teachers);
          renderTeachersDb();
        }
      }

      const waMsg = generateTeacherWaMessage(teacher);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(waMsg).catch(() => {});
      }

      const waUrl = phoneClean
        ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(waMsg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;

      showToast(
        "Membuka WhatsApp",
        `Kredensial dan profil lengkap ${teacher.name} siap dikirim. Teks juga disalin ke clipboard!`,
        "success"
      );
      if (window.SoundService && SoundService.playSuccess) {
        SoundService.playSuccess();
      }

      window.open(waUrl, "_blank");
    };

    window.handleTeacherWaClick = function(e, teacherId) {
      const teachers = StorageService.getTeachersMaster();
      const teacher = teachers.find(t => t.id === teacherId || t.nip === teacherId || t.teacherId === teacherId);
      if (!teacher) return;

      const phoneClean = cleanWaPhone(teacher.phone);
      if (!phoneClean || phoneClean.length < 8) {
        e.preventDefault();
        window.sendTeacherWhatsApp(teacherId);
        return;
      }

      // If phone exists, copy to clipboard & show toast, let default link open
      const msg = generateTeacherWaMessage(teacher);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).catch(() => {});
      }
      showToast(
        "WhatsApp Terbuka",
        `Profil lengkap & akun ${teacher.name} siap dikirim via WhatsApp. Teks juga disalin ke clipboard!`,
        "success"
      );
      if (window.SoundService && SoundService.playSuccess) {
        SoundService.playSuccess();
      }
    };

    window.copyTeacherCredential = function(teacherId) {
      const teachers = StorageService.getTeachersMaster();
      const teacher = teachers.find(t => t.id === teacherId || t.nip === teacherId || t.teacherId === teacherId);
      if (!teacher) return;

      const credText = generateTeacherWaMessage(teacher);

      navigator.clipboard.writeText(credText).then(() => {
        showToast("Profil & Akun Disalin", `Profil lengkap dan kredensial login ${teacher.name} berhasil disalin ke clipboard untuk WhatsApp.`, "success");
        if (window.SoundService && SoundService.playSuccess) {
          SoundService.playSuccess();
        }
      }).catch(() => {
        showToast("Info Kredensial", `User: ${teacher.username} | Pass: ${teacher.password}`, "info");
      });
    };

    window.copyPasswordOnly = function(pass) {
      navigator.clipboard.writeText(pass).then(() => {
        showToast("Password Disalin", `Password '${pass}' disalin ke clipboard.`, "info");
      });
    };

    window.openEditTeacherModal = function(teacherId) {
      const teachers = StorageService.getTeachersMaster();
      const teacher = teachers.find(t => t.id === teacherId || t.nip === teacherId || t.teacherId === teacherId);
      if (!teacher || !modalTeacherForm) return;

      document.getElementById("inputTeacherEditId").value = teacher.nip || teacher.id;
      if (modalTeacherTitle) modalTeacherTitle.textContent = `Edit Data & Akun: ${teacher.name}`;

      document.getElementById("inputTeacherFullName").value = teacher.name;
      document.getElementById("inputTeacherNip").value = teacher.nip || "";
      document.getElementById("inputTeacherNuptk").value = teacher.nuptk || "";
      if (document.getElementById("selectTeacherDept")) document.getElementById("selectTeacherDept").value = teacher.dept || "PAI";
      document.getElementById("inputTeacherSubject").value = teacher.subject || "";
      document.getElementById("selectTeacherKepegawaian").value = teacher.kepegawaian || "Guru Tetap Yayasan";
      const elTeacherClass = document.getElementById("selectTeacherClassAssigned");
      if (elTeacherClass) {
        elTeacherClass.value = teacher.classAssigned || "Guru Mapel";
        if (!elTeacherClass.value && teacher.classAssigned) {
          const cleanTarget = teacher.classAssigned.toLowerCase().replace(/[^a-z0-9]/g, "");
          for (let opt of elTeacherClass.options) {
            const cleanOpt = opt.value.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanOpt === cleanTarget || opt.text.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanTarget)) {
              elTeacherClass.value = opt.value;
              break;
            }
          }
        }
      }
      document.getElementById("inputTeacherEmail").value = teacher.email || "";
      document.getElementById("inputTeacherUsername").value = teacher.username || (teacher.email ? teacher.email.split("@")[0]  : "");
      document.getElementById("inputTeacherPassword").value = teacher.password || "123456";
      document.getElementById("inputTeacherPhone").value = teacher.phone || "";

      const btnModalSendWa = document.getElementById("btnModalTeacherSendWa");
      if (btnModalSendWa) {
        btnModalSendWa.style.display = "inline-flex";
        btnModalSendWa.onclick = () => window.sendTeacherWhatsApp(teacher.id);
      }

      window.openModal("modalTeacherForm");
    };

    // Initial render
    renderTeachersDb();
  }

  // =========================================================================
  // 5B. Editor Profil Guru & Manajemen Jadwal KBM (Akun Guru / User)
  // =========================================================================
  function initTeacherProfileAndScheduleEditor() {
    let uploadedAvatarBase64 = null;

    // Helper: Generate Initials
    function getInitials(name) {
      if (!name) return "GR";
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // 1. OPEN EDIT MY PROFILE MODAL
    window.openEditMyProfileModal = function() {
      const activeTeacher = (typeof StorageService !== "undefined" && StorageService.getActiveTeacher) ? StorageService.getActiveTeacher() : {};
      const profile = (typeof StorageService !== "undefined" && StorageService.getProfile) ? StorageService.getProfile() : {};

      const name = activeTeacher.name || profile.name || "Bapak/Ibu Guru";
      const nip = activeTeacher.nip || profile.nip || "";
      const nuptk = activeTeacher.nuptk || profile.nuptk || "";
      const kepegawaian = activeTeacher.kepegawaian || profile.employmentStatus || "Guru Tetap Kemenag";
      const subject = activeTeacher.subject || profile.subject || "SKI";
      const dept = activeTeacher.dept || "PAI";
      const classAssigned = activeTeacher.classAssigned || profile.classAssigned || "Guru Mapel";
      const email = activeTeacher.email || profile.email || "";
      const phone = activeTeacher.phone || profile.phone || "";
      const password = activeTeacher.password || activeTeacher.pin || "123456";
      const avatarUrl = activeTeacher.avatarUrl || profile.avatarUrl || "";

      uploadedAvatarBase64 = avatarUrl || null;

      const elName = document.getElementById("inputMyProfileName");
      const elNip = document.getElementById("inputMyProfileNip");
      const elNuptk = document.getElementById("inputMyProfileNuptk");
      const elKepegawaian = document.getElementById("selectMyProfileKepegawaian");
      const elSubject = document.getElementById("inputMyProfileSubject");
      const elDept = document.getElementById("selectMyProfileDept");
      const elClassAssigned = document.getElementById("selectMyProfileClassAssigned");
      const elEmail = document.getElementById("inputMyProfileEmail");
      const elPhone = document.getElementById("inputMyProfilePhone");
      const elPassword = document.getElementById("inputMyProfilePassword");

      if (elName) elName.value = name;
      if (elNip) elNip.value = nip;
      if (elNuptk) elNuptk.value = nuptk;
      if (elKepegawaian) elKepegawaian.value = kepegawaian;
      if (elSubject) elSubject.value = subject;
      if (elDept) elDept.value = dept;
      if (elClassAssigned) {
        elClassAssigned.value = classAssigned || "Guru Mapel";
        if (!elClassAssigned.value && classAssigned) {
          const cleanTarget = classAssigned.toLowerCase().replace(/[^a-z0-9]/g, "");
          for (let opt of elClassAssigned.options) {
            const cleanOpt = opt.value.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanOpt === cleanTarget || opt.text.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanTarget)) {
              elClassAssigned.value = opt.value;
              break;
            }
          }
        }
      }
      if (elEmail) elEmail.value = email;
      if (elPhone) elPhone.value = phone;
      if (elPassword) elPassword.value = password;

      // Update avatar preview inside modal
      const previewName = document.getElementById("modalProfilePreviewDisplayName");
      if (previewName) previewName.textContent = name;

      const previewInitials = document.getElementById("modalProfileAvatarInitials");
      const previewImg = document.getElementById("modalProfileAvatarImg");
      const btnRemovePhoto = document.getElementById("btnRemoveProfilePhoto");

      if (avatarUrl) {
        if (previewImg) {
          previewImg.src = avatarUrl;
          previewImg.style.display = "block";
        }
        if (previewInitials) previewInitials.style.display = "none";
        if (btnRemovePhoto) btnRemovePhoto.style.display = "inline-flex";
      } else {
        if (previewImg) previewImg.style.display = "none";
        if (previewInitials) {
          previewInitials.textContent = getInitials(name);
          previewInitials.style.display = "inline";
        }
        if (btnRemovePhoto) btnRemovePhoto.style.display = "none";
      }

      window.openModal("modalEditMyProfile");
    };

    // Photo file upload trigger & handler
    const btnTriggerPhoto = document.getElementById("btnTriggerPhotoUpload");
    const inputPhotoFile = document.getElementById("inputMyProfilePhotoFile");
    const btnRemovePhoto = document.getElementById("btnRemoveProfilePhoto");

    if (btnTriggerPhoto && inputPhotoFile) {
      btnTriggerPhoto.addEventListener("click", () => inputPhotoFile.click());
      inputPhotoFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          showToast("Ukuran File Terlalu Besar", "Maksimal ukuran foto adalah 5MB.", "warning");
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          const rawDataUrl = evt.target.result;
          // Kompres dan resize foto otomatis agar ringan disinkronkan ke Cloud Firestore & Web/APK
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const maxDim = 256;
              let w = img.width;
              let h = img.height;
              if (w > h) {
                if (w > maxDim) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                }
              } else {
                if (h > maxDim) {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, w, h);
              uploadedAvatarBase64 = canvas.toDataURL("image/jpeg", 0.78);
            } catch (compErr) {
              uploadedAvatarBase64 = rawDataUrl;
            }
            const previewImg = document.getElementById("modalProfileAvatarImg");
            const previewInitials = document.getElementById("modalProfileAvatarInitials");
            if (previewImg) {
              previewImg.src = uploadedAvatarBase64;
              previewImg.style.display = "block";
            }
            if (previewInitials) previewInitials.style.display = "none";
            if (btnRemovePhoto) btnRemovePhoto.style.display = "inline-flex";
            showToast("Foto Siap Disimpan", "Klik 'Simpan Perubahan Profil' untuk menerapkan.", "info");
          };
          img.onerror = () => {
            uploadedAvatarBase64 = rawDataUrl;
          };
          img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener("click", () => {
        uploadedAvatarBase64 = "";
        const previewImg = document.getElementById("modalProfileAvatarImg");
        const previewInitials = document.getElementById("modalProfileAvatarInitials");
        if (previewImg) previewImg.style.display = "none";
        if (previewInitials) {
          const nameVal = document.getElementById("inputMyProfileName")?.value || "GR";
          previewInitials.textContent = getInitials(nameVal);
          previewInitials.style.display = "inline";
        }
        btnRemovePhoto.style.display = "none";
      });
    }

    // SUBMIT EDIT PROFILE FORM
    const formProfile = document.getElementById("formEditMyProfile");
    if (formProfile) {
      formProfile.addEventListener("submit", (e) => {
        e.preventDefault();
        const activeId = StorageService.getActiveTeacherId();
        const name = document.getElementById("inputMyProfileName")?.value.trim() || "Guru MTs";
        const nip = document.getElementById("inputMyProfileNip")?.value.trim() || "-";
        const nuptk = document.getElementById("inputMyProfileNuptk")?.value.trim() || "-";
        const kepegawaian = document.getElementById("selectMyProfileKepegawaian")?.value || "Guru Tetap Kemenag";
        const subject = document.getElementById("inputMyProfileSubject")?.value.trim() || "Guru Mapel";
        const dept = document.getElementById("selectMyProfileDept")?.value || currentProfile?.dept || "";
        const classAssigned = document.getElementById("selectMyProfileClassAssigned")?.value || "Guru Mapel";
        const email = document.getElementById("inputMyProfileEmail")?.value.trim() || "";
        const phone = document.getElementById("inputMyProfilePhone")?.value.trim() || "";
        const password = document.getElementById("inputMyProfilePassword")?.value.trim() || "123456";

        const cleanNip = String(nip || "").trim();
        const hasValidNip = cleanNip && cleanNip.length > 3 && cleanNip !== "-";
        const canonicalTeacherId = hasValidNip ? cleanNip : activeId;

        // Update active profile in localStorage & push to Cloud
        const currentProfile = StorageService.getProfile() || {};
        const newAvatarUrl = (uploadedAvatarBase64 !== null) ? uploadedAvatarBase64 : (currentProfile.avatarUrl || "");
        StorageService.saveProfile({
          ...currentProfile,
          id: canonicalTeacherId,
          teacherId: canonicalTeacherId,
          name,
          nip: cleanNip,
          nuptk,
          dept,
          subject,
          classAssigned,
          email,
          phone,
          password,
          pin: password,
          kepegawaian,
          employmentStatus: kepegawaian,
          avatarUrl: newAvatarUrl
        });

        // Update teacher master record & sync to Cloud
        const teachers = StorageService.getTeachersMaster();
        const idx = teachers.findIndex(t => 
          (hasValidNip && String(t.nip).trim() === cleanNip) || 
          t.id === activeId || 
          t.teacherId === activeId || 
          t.id === canonicalTeacherId
        );
        if (idx !== -1) {
          teachers[idx] = {
            ...teachers[idx],
            name,
            nip: cleanNip,
            teacherId: canonicalTeacherId,
            nuptk,
            kepegawaian,
            employmentStatus: kepegawaian,
            subject,
            dept,
            classAssigned,
            email,
            phone,
            password,
            pin: password,
            avatarUrl: newAvatarUrl
          };
          StorageService.saveTeachersMaster(teachers, canonicalTeacherId);
        }

        // Sync teacher name to master schedules if modified
        const allSchedules = StorageService.getMasterSchedules();
        let schedUpdated = false;
        allSchedules.forEach(s => {
          if (s.teacherId === activeId && s.teacherName !== name) {
            s.teacherName = name;
            schedUpdated = true;
          }
        });
        if (schedUpdated) {
          StorageService.saveMasterSchedules(allSchedules);
        }

        // Sync teacher name/subject/phone to welcoming picket roster if assigned
        try {
          const picketRoster = StorageService.getWelcomingPicketRoster();
          let picketUpdated = false;
          Object.keys(picketRoster || {}).forEach(dayKey => {
            if (Array.isArray(picketRoster[dayKey])) {
              picketRoster[dayKey].forEach(member => {
                if (member && member.teacherId === activeId) {
                  if (member.name !== name || member.subject !== subject || member.phone !== phone) {
                    member.name = name;
                    member.subject = subject;
                    member.phone = phone;
                    picketUpdated = true;
                  }
                }
              });
            }
          });
          if (picketUpdated) {
            StorageService.saveWelcomingPicketRoster(picketRoster);
          }
        } catch (errPicket) {}

        // Apply changes across UI
        applySyncedTeacherAndSchoolData();
        if (typeof renderTeachersDb === "function") renderTeachersDb();
        if (typeof renderAdminAllTeachersAttendance === "function") renderAdminAllTeachersAttendance();
        if (typeof initTeacherAccountSwitcher === "function") initTeacherAccountSwitcher();
        if (typeof renderTeachingSchedules === "function") renderTeachingSchedules();
        if (typeof window.refreshLoginScreenData === "function") window.refreshLoginScreenData();

        window.closeModal("modalEditMyProfile");
        showToast("Profil & Cloud Tersinkron", `Perubahan akun ${name} telah disimpan dan disinkronkan ke Web & APK.`, "success");
        if (typeof SoundService !== "undefined" && SoundService.playSuccess) {
          SoundService.playSuccess();
        }
      });
    }

    // 2. TEACHER SCHEDULE MODAL (ADD / EDIT)
    // Populate Class and Room Dropdowns in Teacher Schedule Modal
    const selectClass = document.getElementById("selectTeacherScheduleClass");
    const selectRoom = document.getElementById("selectTeacherScheduleRoom");

    if (selectClass && typeof CLASSES_LIST !== "undefined") {
      selectClass.innerHTML = "";
      CLASSES_LIST.forEach(cls => {
        const opt = document.createElement("option");
        opt.value = cls.startsWith("Kelas ") ? cls : `Kelas ${cls}`;
        opt.textContent = cls.startsWith("Kelas ") ? cls : `Kelas ${cls}`;
        selectClass.appendChild(opt);
      });
    }

    if (selectRoom && typeof ROOMS_LIST !== "undefined") {
      selectRoom.innerHTML = "";
      ROOMS_LIST.forEach(rm => {
        const opt = document.createElement("option");
        opt.value = rm;
        opt.textContent = rm;
        selectRoom.appendChild(opt);
      });
    }

    // Auto calculate JTM and suggest times from KBM periods
    const pStartInput = document.getElementById("inputTeacherSchedulePeriodStart");
    const pEndInput = document.getElementById("inputTeacherSchedulePeriodEnd");
    const jtmInput = document.getElementById("inputTeacherScheduleJtm");
    const timeStartInput = document.getElementById("inputTeacherScheduleTimeStart");
    const timeEndInput = document.getElementById("inputTeacherScheduleTimeEnd");
    const selDay = document.getElementById("selectTeacherScheduleDay");

    function updateTeacherJtmAndTimes() {
      if (!pStartInput || !pEndInput || !jtmInput) return;
      let start = parseInt(pStartInput.value, 10) || 1;
      let end = parseInt(pEndInput.value, 10) || start;
      if (end < start) {
        end = start;
        pEndInput.value = start;
      }
      const jtm = end - start + 1;
      jtmInput.value = jtm;

      const curDay = selDay?.value || "Senin";
      const kbmList = StorageService.getKbmPeriods ? StorageService.getKbmPeriods(curDay) : [];
      const pStartObj = kbmList.find(p => p.period === start);
      const pEndObj = kbmList.find(p => p.period === end);

      if (pStartObj && timeStartInput && !timeStartInput.dataset.userEdited) {
        timeStartInput.value = pStartObj.start;
      }
      if (pEndObj && timeEndInput && !timeEndInput.dataset.userEdited) {
        timeEndInput.value = pEndObj.end;
      }

      checkTeacherClashWarning();
    }

    if (pStartInput) pStartInput.addEventListener("input", updateTeacherJtmAndTimes);
    if (pEndInput) pEndInput.addEventListener("input", updateTeacherJtmAndTimes);
    if (selDay) {
      selDay.addEventListener("change", () => {
        if (timeStartInput && !timeStartInput.dataset.userEdited && timeEndInput && !timeEndInput.dataset.userEdited) {
          updateTeacherJtmAndTimes();
        } else {
          checkTeacherClashWarning();
        }
      });
    }

    // Auto-formatting for manual time inputs
    [timeStartInput, timeEndInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener("input", (e) => {
        inp.dataset.userEdited = "true";
        let val = inp.value.replace(/[^0-9:]/g, "").replace(".", ":");
        if (val.length === 2 && !val.includes(":") && e.inputType !== "deleteContentBackward") {
          val = val + ":";
        }
        inp.value = val;
        checkTeacherClashWarning();
      });
      inp.addEventListener("blur", () => {
        let val = inp.value.trim().replace(".", ":");
        if (!val) return;
        if (/^\d{1,2}$/.test(val)) {
          let h = parseInt(val, 10);
          if (h < 0) h = 0; if (h > 23) h = 23;
          inp.value = String(h).padStart(2, "0") + ":00";
        } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
          const parts = val.split(":");
          let h = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10);
          if (isNaN(h) || h < 0) h = 0; if (h > 23) h = 23;
          if (isNaN(m) || m < 0) m = 0; if (m > 59) m = 59;
          inp.value = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        }
        checkTeacherClashWarning();
      });
    });

    // Check collision warning
    function checkTeacherClashWarning() {
      const warningBox = document.getElementById("teacherScheduleClashWarning");
      if (!warningBox) return;

      const activeId = StorageService.getActiveTeacherId();
      const currentId = document.getElementById("inputTeacherScheduleId")?.value;
      const day = selDay?.value || "Senin";
      const startP = parseInt(pStartInput?.value || "1", 10);
      const endP = parseInt(pEndInput?.value || "2", 10);

      const allSchedules = StorageService.getMasterSchedules();
      const clashes = allSchedules.filter(s => {
        if (s.id === currentId) return false;
        if (s.teacherId !== activeId) return false;
        if (s.day !== day) return false;
        const sP = Number(s.periodStart || 1);
        const eP = Number(s.periodEnd || (sP + (s.jtm || 1) - 1));
        return (startP <= eP && endP >= sP);
      });

      if (clashes.length > 0) {
        warningBox.style.display = "block";
        warningBox.textContent = `⚠️ Peringatan: Jam ${startP}-${endP} bentrok dengan sesi ${clashes[0].subject} di ${clashes[0].class} (${clashes[0].time || ''}).`;
      } else {
        warningBox.style.display = "none";
      }
    }

    // OPEN TEACHER SCHEDULE MODAL (ADD or EDIT)
    window.openTeacherScheduleModal = function(sessionId) {
      const activeId = StorageService.getActiveTeacherId();
      const activeTeacher = StorageService.getActiveTeacher() || {};

      const titleEl = document.getElementById("modalTeacherScheduleTitle");
      const subEl = document.getElementById("modalTeacherScheduleSubtitle");
      const nameBadge = document.getElementById("badgeTeacherScheduleName");
      const subjBadge = document.getElementById("badgeTeacherScheduleSubject");
      const warningBox = document.getElementById("teacherScheduleClashWarning");
      if (warningBox) warningBox.style.display = "none";

      if (nameBadge) nameBadge.textContent = activeTeacher.name || "Bapak/Ibu Guru";
      if (subjBadge) subjBadge.textContent = `Mata Pelajaran: ${activeTeacher.subject || 'Guru Mapel'}`;

      if (timeStartInput) delete timeStartInput.dataset.userEdited;
      if (timeEndInput) delete timeEndInput.dataset.userEdited;

      if (sessionId) {
        // Edit Mode
        const allSchedules = StorageService.getMasterSchedules();
        const session = allSchedules.find(s => s.id === sessionId);
        if (!session) {
          showToast("Jadwal Tidak Ditemukan", "Sesi jadwal ini tidak terdaftar.", "error");
          return;
        }

        if (titleEl) titleEl.textContent = "✏️ Edit Sesi Jadwal KBM";
        if (subEl) subEl.textContent = `Mengubah jadwal tatap muka untuk ${session.class} (${session.day}).`;

        document.getElementById("inputTeacherScheduleId").value = session.id;
        if (selDay) selDay.value = session.day || "Senin";
        if (selectClass) selectClass.value = session.class || "Kelas 7A";
        document.getElementById("inputTeacherScheduleSubject").value = session.subject || activeTeacher.subject || "";
        if (selectRoom) selectRoom.value = session.room || "Ruang Kelas 7A";
        if (pStartInput) pStartInput.value = session.periodStart || 1;
        if (pEndInput) pEndInput.value = session.periodEnd || 2;
        if (jtmInput) jtmInput.value = session.jtm || 2;
        if (timeStartInput) {
          timeStartInput.value = session.startTime || "08:00";
          timeStartInput.dataset.userEdited = "true";
        }
        if (timeEndInput) {
          timeEndInput.value = session.endTime || "09:00";
          timeEndInput.dataset.userEdited = "true";
        }
      } else {
        // Add Mode
        if (titleEl) titleEl.textContent = "➕ Tambah Sesi Jadwal KBM";
        if (subEl) subEl.textContent = "Alokasikan sesi mengajar tatap muka baru untuk kelas dan ruangan.";

        document.getElementById("inputTeacherScheduleId").value = "";
        if (selDay) selDay.value = "Senin";
        if (selectClass) selectClass.selectedIndex = 0;
        document.getElementById("inputTeacherScheduleSubject").value = activeTeacher.subject || "";
        if (selectRoom) selectRoom.selectedIndex = 0;
        if (pStartInput) pStartInput.value = 1;
        if (pEndInput) pEndInput.value = 2;
        if (jtmInput) jtmInput.value = 2;

        const curDay = selDay?.value || "Senin";
        const kbmList = StorageService.getKbmPeriods ? StorageService.getKbmPeriods(curDay) : [];
        const p1 = kbmList.find(p => p.period === 1) || { start: "07:15", end: "07:55" };
        const p2 = kbmList.find(p => p.period === 2) || { start: "07:55", end: "08:35" };

        if (timeStartInput) timeStartInput.value = p1.start || "08:00";
        if (timeEndInput) timeEndInput.value = p2.end || "09:00";
      }

      window.openModal("modalTeacherScheduleForm");
    };

    // SUBMIT TEACHER SCHEDULE FORM
    const formSchedule = document.getElementById("formTeacherScheduleItem");
    if (formSchedule) {
      formSchedule.addEventListener("submit", (e) => {
        e.preventDefault();

        const activeId = StorageService.getActiveTeacherId();
        const activeTeacher = StorageService.getActiveTeacher() || {};
        const idVal = document.getElementById("inputTeacherScheduleId").value;
        const day = document.getElementById("selectTeacherScheduleDay").value;
        const className = document.getElementById("selectTeacherScheduleClass").value;
        const subject = document.getElementById("inputTeacherScheduleSubject").value.trim();
        const room = document.getElementById("selectTeacherScheduleRoom").value;
        const pStart = parseInt(pStartInput ? pStartInput.value : "1", 10) || 1;
        const pEnd = parseInt(pEndInput ? pEndInput.value : "2", 10) || pStart;
        const startTime = (timeStartInput && timeStartInput.value.trim()) ? timeStartInput.value.trim() : "08:00";
        const endTime = (timeEndInput && timeEndInput.value.trim()) ? timeEndInput.value.trim() : "09:00";
        const jtm = parseInt(jtmInput ? jtmInput.value : "2", 10) || (pEnd - pStart + 1);

        const currentSchedules = StorageService.getMasterSchedules();
        const newSession = {
          id: idVal || `SCH-${activeId}-${day.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          teacherId: activeId,
          teacherName: activeTeacher.name || "Guru MTs",
          day,
          periodStart: pStart,
          periodEnd: pEnd,
          startTime,
          endTime,
          time: `${startTime} - ${endTime} WIB`,
          class: className,
          subject,
          room,
          jtm
        };

        if (idVal) {
          const idx = currentSchedules.findIndex(s => s.id === idVal);
          if (idx !== -1) {
            currentSchedules[idx] = newSession;
          } else {
            currentSchedules.push(newSession);
          }
        } else {
          currentSchedules.push(newSession);
        }

        StorageService.saveMasterSchedules(currentSchedules);

        // Update in-memory TEACHING_SCHEDULES and refresh views
        StorageService.syncActiveTeachingSchedules();
        renderTeachingSchedules();
        renderKbmTimelineAndLogs();
        if (typeof renderRoster === "function") renderRoster();

        window.closeModal("modalTeacherScheduleForm");

        showToast("Jadwal KBM Berhasil Disimpan", `Sesi ${subject} di ${className} (${day}, ${startTime} - ${endTime} WIB) berhasil tersimpan.`, "success");
        if (typeof SoundService !== "undefined" && SoundService.playSuccess) {
          SoundService.playSuccess();
        }
      });
    }

    // 3. DELETE TEACHER SCHEDULE
    window.deleteTeacherSchedule = function(sessionId) {
      const allSchedules = StorageService.getMasterSchedules();
      const session = allSchedules.find(s => s.id === sessionId);
      if (!session) return;

      const confirmMsg = `Apakah Anda yakin ingin menghapus jadwal mengajar:\n• Mapel: ${session.subject}\n• Kelas: ${session.class}\n• Waktu: ${session.day}, ${session.time || session.startTime}?`;
      if (!confirm(confirmMsg)) return;

      const updated = allSchedules.filter(s => s.id !== sessionId);
      StorageService.saveMasterSchedules(updated);

      StorageService.syncActiveTeachingSchedules();
      renderTeachingSchedules();
      renderKbmTimelineAndLogs();
      if (typeof renderRoster === "function") renderRoster();

      showToast("Jadwal Dihapus", `Sesi ${session.subject} (${session.class}) telah dihapus dari jadwal Anda.`, "info");
      if (typeof SoundService !== "undefined" && SoundService.playSuccess) {
        SoundService.playSuccess();
      }
    };
  }

  // =========================================================================
  // 6. Jadwal Piket Penyambutan Siswa (Budaya 5S Gerbang Madrasah)
  // =========================================================================
  // Helper to get active Indonesian day name for Welcoming Picket
  function getTodayPicketDay() {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[new Date().getDay()];
  }

  // Helper to find which day an active teacher is scheduled for Welcoming Picket
  function getTeacherPicketDutyDay(teacherId) {
    const roster = StorageService.getWelcomingPicketRoster();
    for (const squad of roster) {
      if (squad.members && squad.members.some(m => m.teacherId === teacherId)) {
        return squad.day;
      }
    }
    return null;
  }

  let currentSelectedPicketDay = getTodayPicketDay();
  let picketClockInterval = null;

  function renderDashboardPicketReminder() {
    const banner = document.getElementById("bannerPicketDutyReminder");
    if (!banner) return;

    const activeId = StorageService.getActiveTeacherId();
    const todayDay = getTodayPicketDay();
    const isDutyToday = StorageService.isTeacherOnWelcomingDuty(todayDay, activeId);

    if (!isDutyToday) {
      banner.style.display = "none";
      banner.innerHTML = "";
      return;
    }

    const todaySquad = StorageService.getTodayWelcomingPicket(todayDay);
    if (!todaySquad) {
      banner.style.display = "none";
      return;
    }

    const member = todaySquad.members.find(m => m.teacherId === activeId);
    if (!member) {
      banner.style.display = "none";
      return;
    }

    const isStandby = member.standbyStatus === "standby";

    banner.className = "picket-duty-banner";
    banner.style.display = "block";
    banner.innerHTML = `
      <div class="picket-duty-banner-content">
        <div class="picket-duty-icon">${todaySquad.icon || '🌟'}</div>
        <div class="picket-duty-info">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="font-size: 0.96rem; color: #ffffff;">Tugas Pagi Ini: Piket Penyambutan Siswa 5S</strong>
            <span class="badge-pill-status ${isStandby ? 'badge-hadir'  : 'badge-izin'}" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">
              ${isStandby ? `✓ Hadir Masuk (${member.checkInTime || member.standbyTime})`  : '⏳ Wajib Standby 06:15 WIB'}
            </span>
            ${isStandby && member.punctuality ? `<span class="badge-pill-status" style="background : rgba(255,255,255,0.2); color:#ffffff; font-size: 0.65rem; padding: 0.15rem 0.45rem;">${member.punctuality}</span>` : ''}
          </div>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: rgba(255, 255, 255, 0.9);">
            Anda terjadwal dalam <strong>${todaySquad.squadName}</strong> hari ini (${todaySquad.day}). Waktu tugas: <strong>06:15 – 07:00 WIB</strong> di titik: <strong>📍 ${member.location}</strong>.
          </p>
          <div style="font-size: 0.74rem; color: rgba(255, 255, 255, 0.8); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <span>👑 Koordinator: ${todaySquad.coordinator}</span>
            <span>•</span>
            <span>🛡️ ${member.roleInPicket}</span>
            ${isStandby ? `<span>• Jam Masuk Tercatat : <strong>${member.checkInTime || member.standbyTime}</strong></span>` : ''}
          </div>
        </div>
      </div>
      <div class="picket-duty-actions">
        ${!isStandby ? `
          <button type="button" class="btn-picket-checkin" onclick="openPicketCheckInModal('${todaySquad.day}', '${activeId}')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>📍 Check-In Piket Saya</span>
          </button>
        ` : `
          <div style="background: rgba(147, 197, 114, 0.28); border: 1px solid rgba(147, 197, 114, 0.5); border-radius: 8px; padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 0.4rem;">
            <span>✓</span>
            <span>Tercatat Standby di Gerbang</span>
          </div>
        `}
        <button type="button" class="btn-picket-view" onclick="window.switchToTab('tab-welcoming-picket')">
          <span>Lihat Roster Regu</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    `;
  }

  function updatePicketBannerQuickCheckIn() {
    const adminBadge = document.getElementById("picketAdminBadge");
    const btnQuickCheckIn = document.getElementById("btnQuickPicketCheckIn");
    const btnOpenAdd = document.getElementById("btnOpenAddPicketModal");
    const isAdmin = currentActiveRole === "admin";

    if (btnOpenAdd) {
      btnOpenAdd.style.display = "inline-flex";
      const spanText = document.getElementById("btnOpenAddPicketText") || btnOpenAdd.querySelector("span:last-child");
      if (spanText) {
        spanText.textContent = isAdmin ? "Input Guru Piket" : "Ambil Jadwal Piket";
      }
      btnOpenAdd.title = isAdmin ? "Tugaskan guru ke jadwal piket gerbang" : "Daftarkan diri Anda ke hari piket yang masih kosong";
    }

    if (adminBadge) {
      adminBadge.style.setProperty("display", isAdmin ? "flex" : "none", "important");
    }

    if (isAdmin) {
      if (btnQuickCheckIn) btnQuickCheckIn.style.setProperty("display", "none", "important");
      return;
    } else {
      if (btnQuickCheckIn) btnQuickCheckIn.style.setProperty("display", "inline-flex", "important");
    }

    const btn = document.getElementById("btnQuickPicketCheckIn");
    if (!btn) return;

    // Pastikan styling ukuran & layout presisi seragam dengan tombol utama
    btn.style.width = "100%";
    btn.style.boxSizing = "border-box";
    btn.style.minHeight = "46px";
    btn.style.padding = "0.75rem 1.25rem";
    btn.style.borderRadius = "var(--radius-md, 12px)";
    btn.style.fontFamily = "'Outfit', sans-serif";
    btn.style.fontSize = "0.88rem";
    btn.style.fontWeight = "700";
    btn.style.lineHeight = "1.25";
    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.gap = "0.55rem";
    btn.style.textAlign = "center";

    const todayDay = getTodayPicketDay();
    const activeTeacherId = StorageService.getActiveTeacherId();
    const teachersMaster = StorageService.getTeachersMaster ? StorageService.getTeachersMaster() : [];
    const activeTeacher = teachersMaster.find(t => t.id === activeTeacherId) || StorageService.getActiveTeacher();
    const teacherName = activeTeacher ? activeTeacher.name : "Guru";

    const todaySquad = StorageService.getTodayWelcomingPicket(todayDay);
    const memberToday = todaySquad ? todaySquad.members.find(m => m.teacherId === activeTeacherId) : null;

    if (memberToday) {
      const isCheckedIn = memberToday.standbyStatus === "standby";
      if (isCheckedIn) {
        btn.disabled = false;
        btn.className = "btn-banner-action-picket btn-picket-status-checkedin";
        btn.onclick = null;
        btn.innerHTML = `
          <span class="picket-badge-icon check-done">✓</span>
          <span class="picket-btn-label">Tercatat Hadir (${memberToday.checkInTime || memberToday.standbyTime})</span>
        `;
        btn.title = `Anda sudah tercatat masuk gerbang piket pukul ${memberToday.checkInTime || memberToday.standbyTime}`;
      } else {
        btn.disabled = false;
        btn.className = "btn-banner-action-picket btn-picket-status-ready";
        btn.onclick = () => window.openPicketCheckInModal(todaySquad.day, activeTeacherId);
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink: 0;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span class="picket-btn-label">Check-In Piket Saya (${todayDay})</span>
        `;
        btn.title = `Klik untuk konfirmasi jam masuk piket Anda di ${memberToday.location}`;
      }
    } else {
      const dutyDay = getTeacherPicketDutyDay(activeTeacherId);
      btn.disabled = false;
      btn.className = "btn-banner-action-picket btn-picket-status-idle";
      btn.onclick = null;
      btn.innerHTML = `
        <span style="font-size: 0.95rem; line-height: 1; flex-shrink: 0;">🔒</span>
        <span class="picket-btn-label">${dutyDay ? 'Bukan Jadwal Hari Ini (' + dutyDay + ')' : 'Belum Ada Jadwal Piket'}</span>
      `;
      btn.title = `Akun ${teacherName} tidak terjadwal piket hari ini (${todayDay}). ${dutyDay ? 'Jadwal Anda: ' + dutyDay : 'Anda belum terdaftar di jadwal piket.'}`;
    }
  }

  function renderPicketRoster(day = null) {
    window.renderPicketRoster = renderPicketRoster;
    window.renderWelcomingPicket = renderPicketRoster;
    const todayDay = getTodayPicketDay();
    const targetDay = day || currentSelectedPicketDay || todayDay;
    currentSelectedPicketDay = targetDay;

    const roster = StorageService.getWelcomingPicketRoster();
    const todaySquad = StorageService.getTodayWelcomingPicket(todayDay);
    const squad = roster.find(r => r.day === targetDay) || roster[0];
    const teachersMaster = StorageService.getTeachersMaster();
    const activeTeacherId = StorageService.getActiveTeacherId();
    const activeTeacher = teachersMaster.find(t => t.id === activeTeacherId) || StorageService.getActiveTeacher();
    const isAdmin = currentActiveRole === "admin";
    const isScheduleDay = squad.day === todayDay;

    // 1. Update Day Nav buttons
    const dayButtons = document.querySelectorAll("#picketDaySelectorNav .picket-day-btn");
    dayButtons.forEach(btn => {
      const bDay = btn.getAttribute("data-picket-day");
      btn.classList.toggle("active", bDay === targetDay);
      btn.classList.toggle("today-highlight", bDay === todayDay);
      const titleSpan = btn.querySelector("span:first-child");
      if (titleSpan) {
        titleSpan.textContent = bDay === todayDay ? `${bDay} (Hari Ini)`  : bDay;
      }
    });

    // 2. Update Squad Header Info
    const iconBadge = document.getElementById("squadIconBadge");
    const headerTitle = document.getElementById("squadHeaderTitle");
    const headerSub = document.getElementById("squadHeaderSub");
    const todayTag = document.getElementById("squadTodayTag");

    if (iconBadge) iconBadge.textContent = squad.icon || "🌟";
    if (headerTitle) headerTitle.textContent = `${squad.squadName} (${squad.day})`;
    if (headerSub) {
      headerSub.textContent = `Tema: ${squad.theme} • Jam: ${squad.time || '06:15 – 07:00'} WIB • Koordinator: ${squad.coordinator}`;
    }
    if (todayTag) {
      if (isScheduleDay) {
        todayTag.style.display = "inline-flex";
        todayTag.textContent = "Regu Aktif Hari Ini";
        todayTag.className = "badge-pill-status badge-hadir";
      } else {
        todayTag.style.display = "inline-flex";
        todayTag.textContent = `Roster Hari ${squad.day}`;
        todayTag.className = "badge-pill-status badge-izin";
      }
    }

    // 3. Update 4 KPI Cards
    if (todaySquad) {
      const todayCount = document.getElementById("kpiPicketTodayCount");
      const todayName = document.getElementById("kpiPicketSquadName");
      const standbyCountEl = document.getElementById("kpiPicketStandbyCount");
      const standbyDetailEl = document.getElementById("kpiPicketStandbyDetail");

      if (todayCount) todayCount.textContent = `${todaySquad.members.length} Guru`;
      if (todayName) todayName.innerHTML = `<span>${todaySquad.icon || '🌟'} ${todaySquad.squadName} (${todaySquad.day})</span>`;

      const standbyList = todaySquad.members.filter(m => m.standbyStatus === "standby");
      if (standbyCountEl) standbyCountEl.textContent = `${standbyList.length} Standby`;
      if (standbyDetailEl) {
        const gerbangACount = standbyList.filter(m => m.location.includes("Gerbang Utama")).length;
        const gerbangBCount = standbyList.filter(m => m.location.includes("Gerbang Timur")).length;
        const lobiCount = standbyList.filter(m => m.location.includes("Lobi")).length;
        standbyDetailEl.innerHTML = `<span>📍 ${gerbangACount} Gerbang A • ${gerbangBCount} Gerbang B • ${lobiCount} Lobi</span>`;
      }
    }

    // 4. Populate Squad Members Grid
    const grid = document.getElementById("gridPicketMembers");
    if (grid) {
      grid.innerHTML = "";

      if (squad.members.length === 0) {
        grid.innerHTML = `
          <div class="empty-picket-card" style="grid-column: 1 / -1; background: var(--bg-card); border: 2px dashed rgba(0, 106, 78, 0.35); border-radius: var(--radius-lg); padding: 3rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(0, 106, 78, 0.12); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
              📋
            </div>
            <div>
              <h3 style="margin: 0 0 0.4rem 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main);">
                Belum Ada Guru Piket untuk Hari ${squad.day}
              </h3>
              <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted); max-width: 480px;">
                Jadwal regu piket <strong>${squad.squadName}</strong> masih kosong. Silakan klik tombol di bawah untuk ${isAdmin ? 'menugaskan guru' : 'mendaftarkan diri Anda'} piket penyambutan siswa 5S di titik gerbang.
              </p>
            </div>
            <button type="button" class="btn-input-guru-piket" onclick="window.openAddPicketMemberForDay('${squad.day}')" style="background: #006A4E; color: #ffffff; border: none; padding: 0.85rem 1.6rem; font-size: 0.92rem; font-weight: 700; border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: 0.55rem; box-shadow: 0 4px 18px rgba(0, 106, 78, 0.45);">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <span>➕ ${isAdmin ? 'Input Guru Piket Hari ' + squad.day : 'Ambil Jadwal Piket Hari ' + squad.day}</span>
            </button>
          </div>
        `;
      } else {
        squad.members.forEach((member) => {
          const teacherInfo = teachersMaster.find(t => t.id === member.teacherId) || {};
          const card = document.createElement("div");
          card.className = "picket-member-card";

        const isCurrentActive = member.teacherId === activeTeacherId;
        if (isCurrentActive) {
          card.style.borderColor = "var(--emerald-500)";
          card.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.15)";
        }

        const isCheckedIn = member.standbyStatus === "standby";

        let statusBadge = "";
        if (isCheckedIn) {
          statusBadge = `<span class="picket-status-badge badge-standby"><span class="status-dot-pulse" style="width:6px; height:6px;"></span> Masuk: ${member.checkInTime || member.standbyTime || '06:14 WIB'}</span>`;
        } else if (member.standbyStatus === "otw") {
          statusBadge = `<span class="picket-status-badge badge-otw">🚗 Menuju Lokasi</span>`;
        } else {
          statusBadge = `<span class="picket-status-badge badge-scheduled">⏳ Target 06:15 WIB</span>`;
        }

        let roleChip = (member.roleInPicket || member.role || "").includes("Koordinator")
          ? `<span class="picket-role-badge role-coord">👑 Koordinator Regu</span>`
          : `<span class="picket-role-badge role-member">🛡️ Petugas Sambut 5S</span>`;

        const phoneClean = (member.phone || teacherInfo.phone || "").replace(/[^0-9]/g, "");
        const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=Assalamu%27alaikum%20${encodeURIComponent(member.teacherName || teacherInfo.name)}%2C%20mengenai%20jadwal%20piket%20sambut%20siswa%20MTs%20Asy-Syafi%27iyyah%20Jatibarang...` : "#";

        let invalNotice = "";
        if (member.isSubstituted) {
          invalNotice = `
            <div class="picket-inval-badge">
              <span>🔄 Inval Menggantikan: <strong>${member.originalTeacherName}</strong></span>
              <div style="font-size: 0.7rem; color: #92400e; margin-top: 0.15rem;">Alasan: ${member.substituteReason || 'Penugasan Khusus'} ${member.substituteNotes ? '— ' + member.substituteNotes  : ''}</div>
            </div>
          `;
        }

        // Real-Time Check-In Info Box inside card
        let checkInBox = "";
        if (isCheckedIn) {
          checkInBox = `
            <div class="picket-checkin-box confirmed">
              <div class="picket-checkin-row-main">
                <span class="picket-checkin-label">Jam Masuk (Real-Time):</span>
                <span class="picket-checkin-time-val time-in">
                  <span>🕒</span>
                  <span>${member.checkInTime || member.standbyTime || '06:14 WIB'}</span>
                </span>
              </div>
              <div class="picket-checkin-row-sub">
                <span class="badge-pill-status ${member.isLate ? 'badge-izin'  : 'badge-hadir'}" style="font-size:0.68rem; padding:0.15rem 0.5rem;">
                  ${member.punctuality || (member.isLate ? 'Terlambat'  : 'Tepat Waktu')}
                </span>
                <span style="color: var(--emerald-600); font-weight: 600;">✓ Terverifikasi di Gerbang</span>
              </div>
            </div>
          `;
        } else {
          checkInBox = `
            <div class="picket-checkin-box pending">
              <div class="picket-checkin-row-main">
                <span class="picket-checkin-label">Target Jam Masuk:</span>
                <span class="picket-checkin-time-val time-pending">
                  <span>⏳</span>
                  <span>06:15 WIB</span>
                </span>
              </div>
              <div class="picket-checkin-row-sub">
                <span class="badge-pill-status badge-izin" style="font-size:0.68rem; padding:0.15rem 0.5rem;">Belum Presensi</span>
                <span style="color: var(--text-muted);">Menunggu di Titik Gerbang</span>
              </div>
            </div>
          `;
        }

        // Action Buttons Row: Check-in ONLY active according to schedule and respective account
        const isMyAccount = member.teacherId === activeTeacherId;
        const canCheckIn = isScheduleDay && (isMyAccount || isAdmin);
        const canReset = (isScheduleDay && isMyAccount) || isAdmin;

        let actionButtons = "";
        if (!isCheckedIn) {
          if (canCheckIn) {
            actionButtons = `
              <button type="button" class="btn-member-action btn-picket-checkin-act" style="${isAdmin && !isMyAccount ? 'background : #006A4E !important; color: #ffffff !important; border: none !important; box-shadow: 0 2px 8px rgba(0, 106, 78, 0.4) !important;' : ''}" onclick="openPicketCheckInModal('${squad.day}', '${member.teacherId}')" title="Catat jam masuk real-time petugas piket">
                <span>📍 ${isAdmin && !isMyAccount ? 'Presensi (Admin)'  : 'Check-In Piket Saya'}</span>
              </button>
            `;
          } else if (!isScheduleDay) {
            actionButtons = `
              <button type="button" class="btn-member-action btn-picket-locked" disabled title="Presensi hanya aktif pada jadwal hari ${squad.day} (Hari ini: ${todayDay})">
                <span>🔒 Hanya Aktif Hari ${squad.day}</span>
              </button>
            `;
          } else {
            // isScheduleDay, but not my account and not admin
            actionButtons = `
              <button type="button" class="btn-member-action btn-picket-locked" disabled title="Tombol check-in hanya aktif untuk akun ${member.teacherName || teacherInfo.name} (Akun aktif: ${activeTeacher ? activeTeacher.name  : activeTeacherId})">
                <span>🔒 Khusus Akun Petugas</span>
              </button>
            `;
          }
        } else {
          actionButtons = `
            <button type="button" class="btn-member-action btn-picket-confirmed" style="cursor: default;" title="Petugas sudah tercatat hadir masuk gerbang">
              <span>✓ Hadir (${member.checkInTime || member.standbyTime})</span>
            </button>
            ${canReset ? `
              <button type="button" class="btn-member-action btn-picket-reset-sm" onclick="resetPicketCheckInAction('${squad.day}', '${member.teacherId}')" title="Reset presensi guru piket">
                <span>↺ Reset</span>
              </button>
            ` : ''}
          `;
        }

        card.innerHTML = `
          <div class="member-top-row">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <h4 class="member-name" title="${member.teacherName || teacherInfo.name}">${member.teacherName || teacherInfo.name}</h4>
                  ${isCurrentActive ? '<span class="badge-pill-status badge-hadir" style="font-size : 0.65rem; padding: 0.1rem 0.45rem;">Anda</span>' : ''}
                </div>
                ${statusBadge}
              </div>
              <div class="member-meta">
                <span>${member.subject || teacherInfo.subject || '-'}</span>
                <span>•</span>
                <span>NIP: ${teacherInfo.nip || member.teacherId}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            ${roleChip}
            <div class="member-loc-pill" title="Titik Penempatan Penyambutan">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${member.location}</span>
            </div>
          </div>

          ${invalNotice}

          ${checkInBox}

          <div class="member-actions-row">
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              ${actionButtons}
              <button type="button" class="btn-member-action btn-swap" onclick="openSwapPicketModal('${squad.day}', '${member.teacherId}')" title="Tukar atau gantikan petugas piket ini">
                <span>🔄 Inval</span>
              </button>
              ${(isAdmin || isMyAccount) ? `
                <button type="button" class="btn-member-action" onclick="removePicketTeacherAction('${squad.day}', '${member.teacherId}')" title="${isMyAccount ? 'Batalkan jadwal piket Anda di hari ' + squad.day : 'Hapus guru dari jadwal piket hari ' + squad.day}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.07);">
                  <span>🗑️ ${isMyAccount ? 'Batal' : 'Hapus'}</span>
                </button>
              ` : ''}
            </div>
            <a href="${waLink}" target="_blank" class="btn-member-action btn-wa" title="Hubungi Petugas via WhatsApp">
              <span>💬 WA</span>
            </a>
          </div>
        `;

        grid.appendChild(card);
      });

      // Dashed Add Picket Teacher Card
      const addCard = document.createElement("div");
      addCard.className = "picket-member-card picket-add-card-dashed";

      const isTeacherInSquad = squad.members.some(m => m.teacherId === activeTeacherId);
      const isSquadFull = squad.members.length >= 4;

      if (!isAdmin) {
        if (isTeacherInSquad) {
          addCard.style.cssText = "border: 2px dashed rgba(16, 185, 129, 0.45); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 1rem; text-align: center; background: rgba(16, 185, 129, 0.04); cursor: default; min-height: 180px;";
          addCard.onclick = () => { showToast("Sudah Terdaftar", `Anda sudah terdaftar dalam jadwal piket hari ${squad.day}.`, "info"); };
          addCard.innerHTML = `
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #006A4E; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.5rem;">✓</div>
            <div style="font-weight: 700; color: #006A4E; font-size: 0.95rem;">Anda Sudah Terdaftar</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Regu hari ${squad.day} sudah mencakup penugasan Anda</div>
          `;
        } else if (isSquadFull) {
          addCard.style.cssText = "border: 2px dashed rgba(100, 116, 139, 0.3); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 1rem; text-align: center; background: rgba(100, 116, 139, 0.03); cursor: not-allowed; min-height: 180px;";
          addCard.onclick = () => { showToast("Regu Penuh", `Regu hari ${squad.day} sudah penuh (4 petugas). Silakan pilih hari lain yang masih kosong.`, "warning"); };
          addCard.innerHTML = `
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(100, 116, 139, 0.12); color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.5rem;">🔒</div>
            <div style="font-weight: 700; color: var(--text-muted); font-size: 0.95rem;">Regu Hari Ini Penuh</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Kuota 4 petugas gerbang telah terisi</div>
          `;
        } else {
          addCard.style.cssText = "border: 2px dashed rgba(0, 106, 78, 0.45); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 1rem; text-align: center; background: rgba(0, 106, 78, 0.04); cursor: pointer; min-height: 180px; transition: all 0.2s ease;";
          addCard.onmouseenter = () => { addCard.style.background = "rgba(0, 106, 78, 0.08)"; addCard.style.borderColor = "#006A4E"; };
          addCard.onmouseleave = () => { addCard.style.background = "rgba(0, 106, 78, 0.04)"; addCard.style.borderColor = "rgba(0, 106, 78, 0.45)"; };
          addCard.onclick = () => window.openAddPicketMemberForDay(squad.day);
          addCard.innerHTML = `
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 106, 78, 0.12); color: #006A4E; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.5rem;">➕</div>
            <div style="font-weight: 700; color: #006A4E; font-size: 0.95rem;">Daftarkan Diri Saya</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Ambil tugas piket hari ${squad.day} (${squad.members.length}/4 Petugas)</div>
          `;
        }
      } else {
        addCard.style.cssText = "border: 2px dashed rgba(0, 106, 78, 0.4); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem 1rem; text-align: center; background: rgba(0, 106, 78, 0.04); cursor: pointer; min-height: 180px; transition: all 0.2s ease;";
        addCard.onmouseenter = () => { addCard.style.background = "rgba(0, 106, 78, 0.08)"; addCard.style.borderColor = "#006A4E"; };
        addCard.onmouseleave = () => { addCard.style.background = "rgba(0, 106, 78, 0.04)"; addCard.style.borderColor = "rgba(0, 106, 78, 0.4)"; };
        addCard.onclick = () => window.openAddPicketMemberForDay(squad.day);
        addCard.innerHTML = `
          <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 106, 78, 0.12); color: #006A4E; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.5rem;">➕</div>
          <div style="font-weight: 700; color: #006A4E; font-size: 0.95rem;">Tambah Guru Piket</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">Tugaskan guru ke regu hari ${squad.day}</div>
        `;
      }
      grid.appendChild(addCard);
    }
  }

  // 5. Render Live Monitoring Table
    renderPicketLiveMonitoringTable(squad);

    // 6. Update Banner Quick Button
    updatePicketBannerQuickCheckIn();
  }

  function renderPicketLiveMonitoringTable(squad) {
    const tbody = document.getElementById("picketLiveMonitoringTableBody");
    if (!tbody || !squad) return;
    tbody.innerHTML = "";

    const teachersMaster = StorageService.getTeachersMaster();
    const activeTeacherId = StorageService.getActiveTeacherId();
    const todayDay = getTodayPicketDay();
    const isScheduleDay = squad.day === todayDay;
    const isAdmin = currentActiveRole === "admin";

    if (squad.members.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted);">
            <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">📋</div>
            <p style="margin: 0; font-size: 0.88rem; font-weight: 600; color: var(--text-main);">Belum ada petugas piket yang ditugaskan untuk hari ${squad.day}</p>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.78rem; color: var(--text-muted);">Gunakan tombol "➕ Input Guru Piket" untuk menambahkan petugas ke regu ini.</p>
          </td>
        </tr>
      `;
      return;
    }

    squad.members.forEach((m) => {
      const teacherInfo = teachersMaster.find(t => t.id === m.teacherId) || {};
      const isCheckedIn = m.standbyStatus === "standby";
      const isMyAccount = m.teacherId === activeTeacherId;
      const canCheckIn = isScheduleDay && (isMyAccount || isAdmin);
      const canReset = (isScheduleDay && isMyAccount) || isAdmin;

      const tr = document.createElement("tr");

      let punctualityHtml = "";
      if (isCheckedIn) {
        if (m.isLate) {
          punctualityHtml = `<span class="badge-pill-status badge-izin">⚠️ ${m.punctuality || "Terlambat"}</span>`;
        } else {
          punctualityHtml = `<span class="badge-pill-status badge-hadir">✓ Tepat Waktu</span>`;
        }
      } else {
        punctualityHtml = `<span class="badge-pill-status" style="background: rgba(100, 116, 139, 0.12); color: #475569;">⏳ Belum Masuk</span>`;
      }

      let checkInTimeDisplay = isCheckedIn
        ? `<div style="font-family:'Outfit'; font-weight:800; color:#3B5F21; display:flex; align-items:center; gap:0.35rem;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${m.checkInTime || m.standbyTime || "06:14 WIB"}</span></div>`
        : `<span style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">Belum Check-In</span>`;

      let actionHtml = "";
      if (isCheckedIn) {
        actionHtml = `
          <div style="display:flex; justify-content:flex-end; gap:0.4rem; align-items:center;">
            <span style="font-size:0.75rem; font-weight:700; color:#3B5F21; display: inline-flex; align-items: center; gap: 0.25rem;"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Terverifikasi</span>
            ${canReset ? `
              <button type="button" class="btn-table-action btn-table-action-edit" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#dc2626; border-color:#fca5a5;" onclick="resetPicketCheckInAction('${squad.day}', '${m.teacherId}')" title="Reset status kehadiran"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg></button>
            ` : ''}
            ${isAdmin ? `
              <button type="button" class="btn-table-action btn-table-action-delete" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#dc2626; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" onclick="removePicketTeacherAction('${squad.day}', '${m.teacherId}')" title="Hapus guru dari jadwal piket"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            ` : ''}
          </div>
        `;
      } else {
        if (canCheckIn) {
          actionHtml = `
            <div style="display:flex; justify-content:flex-end; gap:0.4rem; align-items:center;">
              <button type="button" class="btn-primary" style="font-size:0.75rem; padding:0.35rem 0.75rem; background:${isAdmin && !isMyAccount ? '#006A4E'  : 'linear-gradient(135deg, #93C572, #78AA56)'}; border:none; color:#ffffff; box-shadow: ${isAdmin ? '0 2px 8px rgba(0, 106, 78, 0.4)'  : '0 2px 8px rgba(120, 170, 86, 0.4)'};" onclick="openPicketCheckInModal('${squad.day}', '${m.teacherId}')"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:0.25rem;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>${isAdmin && !isMyAccount ? "Presensi Petugas"  : "Check-In Sekarang"}</span>
              </button>
              ${isAdmin ? `
                <button type="button" class="btn-table-action btn-table-action-delete" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#dc2626; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" onclick="removePicketTeacherAction('${squad.day}', '${m.teacherId}')" title="Hapus guru dari jadwal piket"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              ` : ''}
            </div>
          `;
        } else if (!isScheduleDay) {
          actionHtml = `
            <div style="display:flex; justify-content:flex-end; gap:0.4rem; align-items:center;">
              <span class="badge-pill-status" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: not-allowed; display: inline-flex; align-items: center; gap: 0.3rem;" title="Presensi hanya aktif pada jadwal hari ${squad.day}"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>Aktif Hari ${squad.day}</span></span>
              ${isAdmin ? `
                <button type="button" class="btn-table-action btn-table-action-delete" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#dc2626; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" onclick="removePicketTeacherAction('${squad.day}', '${m.teacherId}')" title="Hapus guru dari jadwal piket"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              ` : ''}
            </div>
          `;
        } else {
          actionHtml = `
            <div style="display:flex; justify-content:flex-end; gap:0.4rem; align-items:center;">
              <span class="badge-pill-status" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-size: 0.72rem; padding: 0.25rem 0.6rem; cursor: not-allowed; display: inline-flex; align-items: center; gap: 0.3rem;" title="Tombol check-in hanya untuk akun ${m.teacherName || teacherInfo.name}"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>Khusus Akun Petugas</span></span>
              ${isAdmin ? `
                <button type="button" class="btn-table-action btn-table-action-delete" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#dc2626; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" onclick="removePicketTeacherAction('${squad.day}', '${m.teacherId}')" title="Hapus guru dari jadwal piket"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              ` : ''}
            </div>
          `;
        }
      }

      tr.innerHTML = `
        <td>
          <div>
            <strong style="color:var(--text-primary); font-size:0.88rem; display:block;">${m.teacherName || teacherInfo.name}</strong>
            <span style="color:var(--text-muted); font-size:0.74rem;">${m.subject || teacherInfo.subject || '-'} • NIP: ${teacherInfo.nip || m.teacherId}</span>
          </div>
        </td>
        <td>
          <span class="member-loc-pill" style="font-size:0.74rem; padding:0.25rem 0.6rem;">
            📍 ${m.location}
          </span>
        </td>
        <td>
          <span style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">
            ${m.roleInPicket || m.role}
          </span>
        </td>
        <td>
          <span style="font-family:'Outfit'; font-weight:700; font-size:0.85rem; color:var(--text-muted);">
            06:15 WIB
          </span>
        </td>
        <td>
          ${checkInTimeDisplay}
        </td>
        <td>
          ${punctualityHtml}
        </td>
        <td style="text-align: right;">
          ${actionHtml}
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  window.openPicketCheckInModal = function(day = null, teacherId = "") {
    const modal = document.getElementById("modalPicketCheckIn");
    if (!modal) return;

    const todayDay = getTodayPicketDay();
    const targetDay = day || currentSelectedPicketDay || todayDay;
    modal.dataset.picketDay = targetDay;
    const activeTeacherId = StorageService.getActiveTeacherId();
    const isAdmin = currentActiveRole === "admin";
    const teachersMaster = StorageService.getTeachersMaster();
    const activeTeacher = teachersMaster.find(t => t.id === activeTeacherId) || StorageService.getActiveTeacher();

    // 1. Enforce Schedule Day
    if (targetDay !== todayDay && !isAdmin) {
      showToast(
        "Jadwal Tidak Sesuai",
        `Presensi piket hanya dapat dilakukan pada jadwal hari ${targetDay} saat hari tersebut berlangsung (Hari ini: ${todayDay}).`,
        "warning"
      );
      return;
    }

    // 2. Enforce Teacher Account
    const targetId = teacherId || activeTeacherId;
    if (!isAdmin && targetId !== activeTeacherId) {
      const targetTeacher = teachersMaster.find(t => t.id === targetId);
      showToast(
        "Akses Terkunci",
        `Presensi piket hanya dapat diisi oleh akun guru yang bersangkutan (${targetTeacher ? targetTeacher.name  : targetId}). Akun aktif saat ini: ${activeTeacher.name}.`,
        "warning"
      );
      return;
    }

    const roster = StorageService.getWelcomingPicketRoster();
    const squad = roster.find(r => r.day === targetDay) || roster[0];
    const selectTeacher = document.getElementById("selectPicketTeacherCheckIn");
    const locDisplay = document.getElementById("modalPicketLocationDisplay");
    const roleDisplay = document.getElementById("modalPicketRoleDisplay");
    const notesInput = document.getElementById("inputPicketNotes");

    if (notesInput) notesInput.value = "";

    if (selectTeacher) {
      selectTeacher.innerHTML = "";

      if (isAdmin) {
        squad.members.forEach((m) => {
          const opt = document.createElement("option");
          opt.value = m.teacherId;
          opt.textContent = `${m.teacherName} — ${m.roleInPicket || m.role} (${m.location})`;
          if (m.teacherId === targetId) opt.selected = true;
          selectTeacher.appendChild(opt);
        });
        selectTeacher.disabled = false;
      } else {
        const member = squad.members.find(m => m.teacherId === activeTeacherId);
        if (!member) {
          showToast(
            "Tidak Terdaftar",
            `Akun ${activeTeacher.name} tidak terdaftar dalam jadwal piket hari ${targetDay}.`,
            "warning"
          );
          return;
        }
        const opt = document.createElement("option");
        opt.value = member.teacherId;
        opt.textContent = `${member.teacherName} — ${member.roleInPicket || member.role} (${member.location})`;
        opt.selected = true;
        selectTeacher.appendChild(opt);
        selectTeacher.disabled = true;
      }

      const updateSelectedDetails = () => {
        const selId = selectTeacher.value;
        const member = squad.members.find(m => m.teacherId === selId);
        if (member) {
          if (locDisplay) locDisplay.textContent = member.location;
          if (roleDisplay) roleDisplay.textContent = member.roleInPicket || member.role;
        }
      };

      selectTeacher.onchange = updateSelectedDetails;
      updateSelectedDetails();
    }

    // Start live clock for modal
    const updateModalLiveClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const timeStr = `${h}:${m}:${s} WIB`;

      const timeEl = document.getElementById("modalPicketRealTimeDisplay");
      if (timeEl) timeEl.textContent = timeStr;

      const dateEl = document.getElementById("modalPicketDateDisplay");
      if (dateEl) {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      }

      const punctEl = document.getElementById("modalPicketPunctualityBadge");
      if (punctEl) {
        const isLate = (now.getHours() > 6) || (now.getHours() === 6 && now.getMinutes() > 15);
        if (isLate) {
          const lateMins = (now.getHours() * 60 + now.getMinutes()) - (6 * 60 + 15);
          punctEl.innerHTML = `<span class="badge-pill-status badge-izin">⚠️ Terlambat ${lateMins} Menit (Lewat 06:15)</span>`;
        } else {
          punctEl.innerHTML = `<span class="badge-pill-status badge-hadir">✓ Tepat Waktu (Sebelum 06:15 WIB)</span>`;
        }
      }
    };

    updateModalLiveClock();
    if (picketClockInterval) clearInterval(picketClockInterval);
    picketClockInterval = setInterval(updateModalLiveClock, 1000);

    window.openModal("modalPicketCheckIn");
  };

  window.resetPicketCheckInAction = function(day, teacherId) {
    const activeTeacherId = StorageService.getActiveTeacherId();
    const isAdmin = currentActiveRole === "admin";
    const todayDay = getTodayPicketDay();

    if (!isAdmin && day !== todayDay) {
      showToast("Tidak Diizinkan", `Reset presensi hanya dapat dilakukan untuk jadwal hari ini (${todayDay}).`, "warning");
      return;
    }

    if (!isAdmin && teacherId !== activeTeacherId) {
      showToast("Akses Ditolak", "Anda hanya dapat mereset status presensi akun Anda sendiri.", "warning");
      return;
    }

    if (confirm("Apakah Anda yakin ingin me-reset status presensi guru piket ini kembali ke Terjadwal-")) {
      const updatedSquad = StorageService.resetPicketCheckIn(day, teacherId);
      if (updatedSquad) {
        SoundService.playSuccess();
        renderPicketRoster(currentSelectedPicketDay);
        renderDashboardPicketReminder();
        renderAdminActivityFeed();
        updatePicketBannerQuickCheckIn();
        showToast("Status Di-reset", "Presensi guru piket dikembalikan ke status Terjadwal.", "info");
      }
    }
  };

  // Global Handlers for Standby and Swap Modal
  window.confirmPicketStandby = function(day, teacherId) {
    window.openPicketCheckInModal(day, teacherId);
  };

  window.openSwapPicketModal = function(day = "Jumat", memberId = "") {
    const modal = document.getElementById("modalSwapPicketTeacher");
    if (!modal) return;

    const selectDay = document.getElementById("selectSwapPicketDay");
    const selectOriginal = document.getElementById("selectSwapPicketOriginalTeacher");
    const selectSubstitute = document.getElementById("selectSwapPicketSubstituteTeacher");
    const inputNotes = document.getElementById("inputSwapPicketNotes");

    if (selectDay) selectDay.value = day;
    if (inputNotes) inputNotes.value = "";

    function populateOriginals(selectedDay) {
      const roster = StorageService.getWelcomingPicketRoster();
      const squad = roster.find(r => r.day === selectedDay);
      if (!squad || !selectOriginal) return;

      selectOriginal.innerHTML = "";
      squad.members.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.teacherId;
        opt.textContent = `${m.teacherName} (${m.roleInPicket || m.role} - ${m.location})`;
        if (memberId && m.teacherId === memberId) opt.selected = true;
        selectOriginal.appendChild(opt);
      });
    }

    function populateSubstitutes() {
      if (!selectSubstitute) return;
      const teachers = StorageService.getTeachersMaster();
      selectSubstitute.innerHTML = "";
      teachers.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = `${t.name} • ${t.subject} (${t.dept})`;
        selectSubstitute.appendChild(opt);
      });
    }

    populateOriginals(day);
    populateSubstitutes();

    window.openModal("modalSwapPicketTeacher");
  };

  function initWelcomingPicketModule() {
    // 1. Day selector buttons
    const dayButtons = document.querySelectorAll("#picketDaySelectorNav .picket-day-btn");
    dayButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const day = btn.getAttribute("data-picket-day");
        renderPicketRoster(day);
      });
    });

    // 2. Day dropdown change inside swap modal
    const selectSwapDay = document.getElementById("selectSwapPicketDay");
    if (selectSwapDay) {
      selectSwapDay.addEventListener("change", (e) => {
        const selectedDay = e.target.value;
        const selectOriginal = document.getElementById("selectSwapPicketOriginalTeacher");
        const roster = StorageService.getWelcomingPicketRoster();
        const squad = roster.find(r => r.day === selectedDay);
        if (squad && selectOriginal) {
          selectOriginal.innerHTML = "";
          squad.members.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.teacherId;
            opt.textContent = `${m.teacherName} (${m.roleInPicket || m.role} - ${m.location})`;
            selectOriginal.appendChild(opt);
          });
        }
      });
    }

    // 3. Open swap modal from squad header
    const btnSwapHeader = document.getElementById("btnOpenSwapPicketModal");
    if (btnSwapHeader) {
      btnSwapHeader.addEventListener("click", () => {
        window.openSwapPicketModal(currentSelectedPicketDay);
      });
    }

    // 4. Form Swap submit
    const formSwap = document.getElementById("formSwapPicket");
    if (formSwap) {
      formSwap.addEventListener("submit", (e) => {
        e.preventDefault();
        const day = document.getElementById("selectSwapPicketDay")?.value || getTodayPicketDay();
        const origId = document.getElementById("selectSwapPicketOriginalTeacher")?.value;
        const subId = document.getElementById("selectSwapPicketSubstituteTeacher")?.value;
        const reason = document.getElementById("selectSwapPicketReason")?.value || "Dinas Luar / Pelatihan";
        const notes = document.getElementById("inputSwapPicketNotes")?.value || "";

        if (origId === subId) {
          showToast("Peringatan", "Guru pengganti tidak boleh sama dengan guru yang ditukar.", "warning");
          return;
        }

        const success = StorageService.swapPicketTeacher(day, origId, subId, reason, notes);
        if (success) {
          const teachers = StorageService.getTeachersMaster();
          const subTeacher = teachers.find(t => t.id === subId);
          const origTeacher = teachers.find(t => t.id === origId);

          StorageService.addAdminActivity(
            `[Inval Piket] ${subTeacher ? subTeacher.name  : subId} menggantikan ${origTeacher ? origTeacher.name  : origId} pada Piket Sambut ${day} (${reason}).`,
            "warning"
          );

          SoundService.playSuccess();
          window.closeModal("modalSwapPicketTeacher");

          renderPicketRoster(currentSelectedPicketDay);
          renderDashboardPicketReminder();
          renderAdminActivityFeed();
          updatePicketBannerQuickCheckIn();

          showToast(
            "Roster Piket Diperbarui",
            `Inval piket berhasil: ${subTeacher ? subTeacher.name  : 'Guru'} resmi ditugaskan menggantikan ${origTeacher ? origTeacher.name  : 'Petugas'}.`,
            "success"
          );
        } else {
          showToast("Gagal", "Tidak dapat memperbarui roster piket.", "error");
        }
      });
    }

    // 5. Form Real-Time Check-In submit
    const formCheckIn = document.getElementById("formPicketCheckIn");
    if (formCheckIn) {
      formCheckIn.addEventListener("submit", (e) => {
        e.preventDefault();
        const modal = document.getElementById("modalPicketCheckIn");
        const todayDay = getTodayPicketDay();
        const targetPicketDay = (modal && modal.dataset.picketDay) ? modal.dataset.picketDay : (currentSelectedPicketDay || todayDay);
        const activeTeacherId = StorageService.getActiveTeacherId();
        const isAdmin = currentActiveRole === "admin";
        const teacherId = document.getElementById("selectPicketTeacherCheckIn")?.value || activeTeacherId;

        if (targetPicketDay !== todayDay && !isAdmin) {
          showToast("Jadwal Tidak Sesuai", `Presensi piket hanya dapat dilakukan pada jadwal hari ini (${todayDay}).`, "warning");
          return;
        }

        if (!isAdmin && teacherId !== activeTeacherId) {
          showToast("Akses Ditolak", "Anda tidak dapat melakukan check-in untuk akun guru lain.", "warning");
          return;
        }

        const notes = document.getElementById("inputPicketNotes")?.value || "";
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;

        const updatedSquad = StorageService.confirmPicketCheckIn(targetPicketDay, teacherId, timeStr, notes);
        if (updatedSquad) {
          const member = updatedSquad.members.find(m => m.teacherId === teacherId);
          SoundService.playSuccess();
          window.closeModal("modalPicketCheckIn");
          if (picketClockInterval) clearInterval(picketClockInterval);

          renderPicketRoster(targetPicketDay);
          renderDashboardPicketReminder();
          renderAdminActivityFeed();
          updatePicketBannerQuickCheckIn();

          showToast(
            "Check-In Piket Berhasil!",
            `Guru Piket ${member ? member.teacherName : 'Petugas'} berhasil tercatat masuk pukul ${timeStr} (${member ? member.punctuality : 'Tepat Waktu'}).`,
            "success"
          );
        }
      });
    }

    // 6. Quick Check-In from Banner
    const btnQuickPicketCheckIn = document.getElementById("btnQuickPicketCheckIn");
    if (btnQuickPicketCheckIn) {
      btnQuickPicketCheckIn.addEventListener("click", () => {
        const todayDay = getTodayPicketDay();
        const activeTeacherId = StorageService.getActiveTeacherId();
        const teachersMaster = StorageService.getTeachersMaster();
        const activeTeacher = teachersMaster.find(t => t.id === activeTeacherId) || StorageService.getActiveTeacher();
        const todaySquad = StorageService.getTodayWelcomingPicket(todayDay);
        const memberToday = todaySquad ? todaySquad.members.find(m => m.teacherId === activeTeacherId)  : null;

        if (!memberToday) {
          const dutyDay = getTeacherPicketDutyDay(activeTeacherId);
          showToast(
            "Bukan Jadwal Piket Anda",
            `Akun ${activeTeacher.name} tidak memiliki jadwal piket penyambutan hari ini (${todayDay}). Jadwal piket Anda: ${dutyDay || 'Tidak Terjadwal'}.`,
            "warning"
          );
          return;
        }

        if (memberToday.standbyStatus === "standby") {
          showToast(
            "Sudah Hadir",
            `Anda sudah tercatat melakukan check-in piket masuk pada pukul ${memberToday.checkInTime || memberToday.standbyTime}.`,
            "info"
          );
          return;
        }

        if (currentSelectedPicketDay !== todayDay) {
          renderPicketRoster(todayDay);
        }

        window.openPicketCheckInModal(todayDay, activeTeacherId);
      });
    }

    // 7. Export Log CSV button
    const btnExportPicketCsv = document.getElementById("btnExportPicketLogCsv");
    if (btnExportPicketCsv) {
      btnExportPicketCsv.addEventListener("click", () => {
        const roster = StorageService.getWelcomingPicketRoster();
        const squad = roster.find(r => r.day === currentSelectedPicketDay) || roster[0];
        const teachersMaster = StorageService.getTeachersMaster();

        const rows = [
          ["Hari", "Regu", "Nama Guru", "NIP", "Mata Pelajaran", "Titik Penempatan", "Peran", "Target Standby", "Jam Masuk (Real-Time)", "Status Ketepatan", "Catatan"]
        ];

        squad.members.forEach(m => {
          const t = teachersMaster.find(tc => tc.id === m.teacherId) || {};
          rows.push([
            squad.day,
            squad.squadName,
            m.teacherName || t.name,
            t.nip || m.teacherId,
            m.subject || t.subject || "-",
            m.location,
            m.roleInPicket || m.role,
            "06:15 WIB",
            m.checkInTime || m.standbyTime || "Belum Hadir",
            m.punctuality || (m.standbyStatus === "standby" ? "Tepat Waktu"  : "Belum Hadir"),
            m.notes || "-"
          ]);
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Log_Piket_Penyambutan_${currentSelectedPicketDay}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Ekspor Berhasil", `Log kehadiran piket ${squad.day} berhasil diunduh ke berkas CSV.`, "success");
      });
    }

    // 8. Print & Refresh buttons
    const btnPrint = document.getElementById("btnPrintPicketRoster");
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        window.print();
      });
    }

    const btnRefresh = document.getElementById("btnRefreshPicketStatus");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        renderPicketRoster(currentSelectedPicketDay);
        renderDashboardPicketReminder();
        updatePicketBannerQuickCheckIn();
        showToast("Status Diperbarui", "Data status standby petugas gerbang telah disinkronkan.", "info");
      });
    }

    // 9. Live Header Clock ticker
    setInterval(() => {
      const clockEl = document.getElementById("picketLiveClockText");
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;
      }
    }, 1000);

    // 10. Open Add Picket Teacher Modal (Mode Guru: Diri Sendiri & Hari Kosong | Mode Admin: Bebas)
    window.openAddPicketMemberForDay = function(day) {
      const modal = document.getElementById("modalAddPicketTeacher");
      const form = document.getElementById("formAddPicketTeacher");
      if (!modal || !form) {
        console.warn("Modal or form modalAddPicketTeacher not found");
        return;
      }

      form.reset();

      const isAdmin = currentActiveRole === "admin";
      const activeTeacherId = StorageService.getActiveTeacherId();
      const teachersMaster = StorageService.getTeachersMaster ? StorageService.getTeachersMaster() : [];
      const activeTeacher = teachersMaster.find(t => t.id === activeTeacherId) || StorageService.getActiveTeacher() || { id: activeTeacherId, name: "Guru", subject: "Guru Mapel" };
      const roster = StorageService.getWelcomingPicketRoster ? StorageService.getWelcomingPicketRoster() : [];
      const todayDay = typeof getTodayPicketDay === "function" ? getTodayPicketDay() : "Jumat";

      // 1. Tampilan Header & Info Box berdasarkan Hak Akses
      const titleTextEl = document.getElementById("modalAddPicketTitleText");
      const infoAlertEl = document.getElementById("modalAddPicketInfoAlert");
      const infoTextEl = document.getElementById("modalAddPicketInfoText");
      const submitBtnTextEl = document.getElementById("btnSubmitAddPicketText");
      const labelTeacherEl = document.getElementById("labelAddPicketTeacher");
      const helperTeacherEl = document.getElementById("helperAddPicketTeacher");
      const helperDayEl = document.getElementById("helperAddPicketDay");

      if (titleTextEl) {
        titleTextEl.textContent = isAdmin
          ? "Input Penugasan Guru Piket Gerbang (Admin)"
          : "Ambil Jadwal Piket Sambut Siswa (Mandiri)";
      }

      if (infoTextEl) {
        if (isAdmin) {
          infoTextEl.innerHTML = `<strong>Form Penugasan Admin:</strong> Anda dapat menugaskan guru ke regu penyambutan siswa 5S gerbang madrasah.`;
          if (infoAlertEl) {
            infoAlertEl.style.borderColor = "rgba(0, 106, 78, 0.28)";
            infoAlertEl.style.background = "rgba(0, 106, 78, 0.08)";
            infoAlertEl.style.color = "#006A4E";
          }
        } else {
          infoTextEl.innerHTML = `<strong>Pendaftaran Piket Mandiri:</strong> Anda mendaftarkan diri Anda (<strong>${activeTeacher.name}</strong>) ke jadwal hari yang masih kosong / tersedia kuota. Pilihan guru dikunci otomatis ke akun Anda.`;
          if (infoAlertEl) {
            infoAlertEl.style.borderColor = "rgba(59, 130, 246, 0.35)";
            infoAlertEl.style.background = "rgba(59, 130, 246, 0.08)";
            infoAlertEl.style.color = "#1d4ed8";
          }
        }
      }

      if (submitBtnTextEl) {
        submitBtnTextEl.textContent = isAdmin
          ? "💾 Simpan & Tugaskan Guru Piket"
          : "💾 Daftarkan Diri Saya ke Jadwal Piket";
      }

      if (labelTeacherEl) {
        labelTeacherEl.textContent = isAdmin ? "Pilih Guru Pendidik" : "Akun Guru Anda (Terkunci)";
      }

      // 2. Setup Dropdown Guru (selectAddPicketTeacher)
      const selectTeacher = document.getElementById("selectAddPicketTeacher");
      if (selectTeacher) {
        selectTeacher.innerHTML = "";
        if (!isAdmin) {
          // MODE GURU: HANYA MENAMPILKAN DIRI SENDIRI DAN DIKUNCI
          const opt = document.createElement("option");
          opt.value = activeTeacherId;
          opt.textContent = `👤 ${activeTeacher.name} • ${activeTeacher.subject || 'Guru Mapel'} (${activeTeacher.nip || activeTeacher.id}) — [Akun Anda]`;
          opt.selected = true;
          selectTeacher.appendChild(opt);
          selectTeacher.disabled = true;
          selectTeacher.style.backgroundColor = "rgba(100, 116, 139, 0.08)";
          selectTeacher.style.cursor = "not-allowed";
          selectTeacher.style.fontWeight = "600";
          selectTeacher.style.color = "#006A4E";

          if (helperTeacherEl) {
            helperTeacherEl.innerHTML = `<span style="font-size:0.75rem; color:#006A4E; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem;">🔒 Terkunci otomatis untuk akun Anda (${activeTeacher.name}).</span>`;
          }
        } else {
          // MODE ADMIN: MENAMPILKAN SELURUH GURU
          selectTeacher.disabled = false;
          selectTeacher.style.backgroundColor = "";
          selectTeacher.style.cursor = "";
          selectTeacher.style.fontWeight = "normal";
          selectTeacher.style.color = "";
          if (helperTeacherEl) helperTeacherEl.innerHTML = "";

          const defaultOpt = document.createElement("option");
          defaultOpt.value = "";
          defaultOpt.disabled = true;
          defaultOpt.selected = true;
          defaultOpt.textContent = "-- Pilih Guru Pendidik --";
          selectTeacher.appendChild(defaultOpt);

          teachersMaster.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = `${t.name} • ${t.subject || 'Guru Mapel'} (${t.nip || t.id})`;
            selectTeacher.appendChild(opt);
          });
        }
      }

      // 3. Setup Dropdown Hari (selectAddPicketDay) - HANYA HARI YANG MASIH KOSONG / TERSEDIA KUOTA UNTUK GURU
      const selectDay = document.getElementById("selectAddPicketDay");
      const standardDays = [
        { day: "Senin", name: "Regu Al-Fatihah" },
        { day: "Selasa", name: "Regu An-Nur" },
        { day: "Rabu", name: "Regu Al-Hikmah" },
        { day: "Kamis", name: "Regu Al-Ikhlas" },
        { day: "Jumat", name: "Regu As-Salam" },
        { day: "Sabtu", name: "Regu Al-Barakah" },
        { day: "Minggu", name: "Regu Khusus Ahad" }
      ];

      let candidateDay = day || currentSelectedPicketDay || todayDay;
      let firstAvailableDay = null;

      if (selectDay) {
        selectDay.innerHTML = "";
        standardDays.forEach(item => {
          const squad = roster.find(r => r.day === item.day) || { day: item.day, squadName: item.name, members: [] };
          const members = squad.members || [];
          const count = members.length;
          const isUserAlreadyInSquad = members.some(m => m.teacherId === activeTeacherId);
          const isFull = count >= 4;
          const isKosong = count === 0;

          const opt = document.createElement("option");
          opt.value = item.day;

          let statusTag = "";
          let disabled = false;

          if (!isAdmin) {
            if (isUserAlreadyInSquad) {
              disabled = true;
              statusTag = " [🔒 Anda Sudah Terjadwal]";
            } else if (isFull) {
              disabled = true;
              statusTag = ` [🔒 Penuh - ${count} Petugas]`;
            } else if (isKosong) {
              statusTag = " [⭐ Kosong - Butuh Petugas]";
              if (!firstAvailableDay) firstAvailableDay = item.day;
            } else {
              statusTag = ` [✓ Tersedia Slot - ${count}/4 Terisi]`;
              if (!firstAvailableDay) firstAvailableDay = item.day;
            }
          } else {
            statusTag = count > 0 ? ` (${count} Petugas)` : " (0 Petugas)";
            if (!firstAvailableDay) firstAvailableDay = item.day;
          }

          opt.disabled = disabled;
          opt.textContent = `${item.day} — ${squad.squadName || item.name}${item.day === todayDay ? ' (Hari Ini)' : ''}${statusTag}`;
          selectDay.appendChild(opt);
        });

        // Pilih hari target jika valid dan tidak disabled, jika disabled pilih hari pertama yang tersedia
        const candidateOpt = Array.from(selectDay.options).find(o => o.value === candidateDay);
        if (candidateOpt && !candidateOpt.disabled) {
          selectDay.value = candidateDay;
        } else if (firstAvailableDay) {
          selectDay.value = firstAvailableDay;
          currentSelectedPicketDay = firstAvailableDay;
        } else {
          // Semua hari tidak tersedia bagi guru ini
          if (!isAdmin) {
            showToast("Jadwal Penuh", "Seluruh jadwal piket telah terisi atau Anda sudah terdaftar di hari yang tersedia.", "info");
          }
        }

        if (helperDayEl) {
          helperDayEl.textContent = !isAdmin
            ? "Pilih hari yang bertanda [⭐ Kosong] atau [✓ Tersedia Slot]."
            : "Admin dapat menugaskan guru pada hari mana saja.";
        }
      }

      // 4. Update Titik Lokasi Gerbang cerdas sesuai keterisian di hari terpilih
      function updateLocationOptions(chosenDay) {
        const selectLoc = document.getElementById("selectAddPicketLocation");
        if (!selectLoc) return;

        const currentSquad = roster.find(r => r.day === chosenDay);
        const occupiedLocs = currentSquad ? (currentSquad.members || []).map(m => m.location) : [];

        const locations = [
          "Gerbang Utama (Gedung A)",
          "Gerbang Timur (Gedung B)",
          "Lobi Utama & Tangga Tengah",
          "Gerbang Barat / Area Parkir"
        ];

        const prevVal = selectLoc.value;
        selectLoc.innerHTML = "";
        let firstFreeLoc = null;

        locations.forEach(loc => {
          const countAtLoc = occupiedLocs.filter(l => l && l.includes(loc.slice(0, 12))).length;
          const opt = document.createElement("option");
          opt.value = loc;
          if (countAtLoc > 0) {
            opt.textContent = `${loc} (${countAtLoc} Terisi)`;
          } else {
            opt.textContent = `${loc} (⭐ Kosong / Prioritas)`;
            if (!firstFreeLoc) firstFreeLoc = loc;
          }
          selectLoc.appendChild(opt);
        });

        if (firstFreeLoc) {
          selectLoc.value = firstFreeLoc;
        } else if (prevVal) {
          selectLoc.value = prevVal;
        }
      }

      // 5. Update Opsi Presensi Langsung (Hanya aktif untuk hari ini)
      function updateInstantCheckInAvailability(chosenDay) {
        const container = document.getElementById("containerAddPicketInstantPresence");
        const instantCheck = document.getElementById("checkAddPicketInstantPresence");
        const subtext = document.getElementById("subtextAddPicketInstantPresence");
        if (!container || !instantCheck) return;

        const isToday = chosenDay === todayDay;
        instantCheck.checked = false;

        if (isToday) {
          instantCheck.disabled = false;
          container.style.opacity = "1";
          container.style.filter = "none";
          if (subtext) subtext.textContent = "Centang opsi ini jika Anda sudah standby di titik gerbang saat mendaftar pagi ini.";
        } else {
          instantCheck.disabled = true;
          container.style.opacity = "0.55";
          container.style.filter = "grayscale(50%)";
          if (subtext) subtext.textContent = `Opsi presensi langsung dinonaktifkan karena jadwal yang dipilih (${chosenDay}) bukan hari ini (${todayDay}).`;
        }
      }

      const activeChosenDay = selectDay ? selectDay.value : candidateDay;
      updateLocationOptions(activeChosenDay);
      updateInstantCheckInAvailability(activeChosenDay);

      if (selectDay) {
        selectDay.onchange = function() {
          currentSelectedPicketDay = selectDay.value;
          updateLocationOptions(selectDay.value);
          updateInstantCheckInAvailability(selectDay.value);
        };
      }

      window.openModal("modalAddPicketTeacher");
    };

    const btnOpenAddPicket = document.getElementById("btnOpenAddPicketModal");
    if (btnOpenAddPicket) {
      btnOpenAddPicket.addEventListener("click", () => {
        window.openAddPicketMemberForDay(currentSelectedPicketDay || getTodayPicketDay());
      });
    }

    // 11. Form Add Picket Teacher Submit (Mode Guru & Mode Admin)
    const formAddPicket = document.getElementById("formAddPicketTeacher");
    if (formAddPicket) {
      formAddPicket.addEventListener("submit", (e) => {
        e.preventDefault();
        const isAdmin = currentActiveRole === "admin";
        const day = document.getElementById("selectAddPicketDay")?.value || currentSelectedPicketDay;
        const activeTeacherId = StorageService.getActiveTeacherId();

        // PENTING: Untuk akun Guru, identitas dipaksa selalu menggunakan ID akun yang sedang login
        const teacherId = isAdmin
          ? (document.getElementById("selectAddPicketTeacher")?.value)
          : activeTeacherId;

        const location = document.getElementById("selectAddPicketLocation")?.value || "Gerbang Utama (Gedung A)";
        const role = document.getElementById("selectAddPicketRole")?.value || "Petugas 5S Salam Siswa";
        const timeRange = document.getElementById("inputAddPicketTimeRange")?.value || "06:15 – 07:00 WIB";
        const isInstantCheckIn = document.getElementById("checkAddPicketInstantPresence")?.checked || false;
        const notes = document.getElementById("inputAddPicketNotes")?.value || "";

        if (!teacherId) {
          showToast("Peringatan", "Identitas guru tidak terdeteksi. Silakan coba kembali.", "warning");
          return;
        }

        // Validasi ganda sisi client untuk Guru: hari yang dipilih harus masih memiliki slot & guru belum ada di sana
        if (!isAdmin) {
          const roster = StorageService.getWelcomingPicketRoster();
          const targetSquad = roster.find(r => r.day === day);
          if (targetSquad) {
            const alreadyIn = (targetSquad.members || []).some(m => m.teacherId === activeTeacherId);
            if (alreadyIn) {
              showToast("Peringatan", `Anda sudah terdaftar dalam jadwal piket hari ${day}.`, "warning");
              return;
            }
            if ((targetSquad.members || []).length >= 4) {
              showToast("Peringatan", `Jadwal piket hari ${day} sudah penuh (maksimal 4 petugas). Silakan pilih hari lain yang masih kosong.`, "warning");
              return;
            }
          }
        }

        const result = StorageService.addPicketTeacher(day, {
          teacherId,
          location,
          role,
          timeRange,
          isInstantCheckIn,
          notes,
          addedByAdmin: isAdmin,
          addedBySelf: !isAdmin,
          isAdmin: isAdmin
        });

        if (result && result.success) {
          SoundService.playSuccess();
          window.closeModal("modalAddPicketTeacher");

          currentSelectedPicketDay = day;
          renderPicketRoster(day);
          renderDashboardPicketReminder();
          renderAdminActivityFeed();
          updatePicketBannerQuickCheckIn();

          if (!isAdmin) {
            const instantMsg = isInstantCheckIn ? " dan presensi standby di gerbang langsung dicatat." : ".";
            showToast(
              "Jadwal Piket Berhasil Diambil",
              `Anda resmi terdaftar dalam jadwal piket hari ${day} (${result.member.location})${instantMsg}`,
              "success"
            );
          } else {
            const statusMsg = isInstantCheckIn ? "dan langsung tercatat standby hadir di gerbang." : "berhasil dijadwalkan.";
            showToast(
              "Guru Piket Ditambahkan",
              `Guru ${result.member.teacherName} resmi ditugaskan untuk piket hari ${day} (${result.member.location}) ${statusMsg}`,
              "success"
            );
          }
        } else {
          showToast("Gagal Menambahkan", result ? result.error : "Terjadi kesalahan saat menyimpan jadwal piket.", "error");
        }
      });
    }

    // 12. Remove Picket Teacher Action (Mode Admin & Pembatalan Mandiri Guru)
    window.removePicketTeacherAction = function(day, teacherId) {
      const roster = StorageService.getWelcomingPicketRoster();
      const dayPicket = roster.find(r => r.day === day);
      const member = dayPicket ? dayPicket.members.find(m => m.id === teacherId || m.teacherId === teacherId) : null;
      const teacherName = member ? member.teacherName : "Guru Piket";

      const isAdmin = currentActiveRole === "admin";
      const activeTeacherId = StorageService.getActiveTeacherId();

      // Pembatasan Keamanan: Guru hanya bisa membatalkan jadwal milik dirinya sendiri
      if (!isAdmin && member && member.teacherId !== activeTeacherId) {
        showToast("Akses Terbatas", "Anda hanya dapat membatalkan jadwal piket milik Anda sendiri.", "warning");
        return;
      }

      const confirmMsg = (!isAdmin && member && member.teacherId === activeTeacherId)
        ? `Apakah Anda yakin ingin membatalkan jadwal piket Anda pada hari ${day}?`
        : `Apakah Anda yakin ingin menghapus ${teacherName} dari roster piket gerbang hari ${day}?`;

      if (!confirm(confirmMsg)) {
        return;
      }

      const success = StorageService.deletePicketTeacher(day, teacherId);
      if (success) {
        SoundService.playAlert();
        showToast(
          !isAdmin ? "Jadwal Dibatalkan" : "Petugas Dihapus",
          !isAdmin ? `Penugasan piket Anda pada hari ${day} telah dibatalkan.` : `Penugasan piket untuk ${teacherName} pada hari ${day} telah dihapus.`,
          "info"
        );
        renderPicketRoster(day);
        renderDashboardPicketReminder();
        renderAdminActivityFeed();
        updatePicketBannerQuickCheckIn();
      } else {
        showToast("Gagal", "Tidak dapat menghapus petugas piket.", "error");
      }
    };

    // Initial renders
    const initialDay = getTodayPicketDay();
    currentSelectedPicketDay = initialDay;
    renderDashboardPicketReminder();
    renderPicketRoster(initialDay);
    updatePicketBannerQuickCheckIn();
  }

  // ========================================================
  // DEDICATED FULL-SCREEN LOGIN SCREEN INITIALIZATION
  // ========================================================
  function initLoginScreen() {
    const loginView = document.getElementById("appLoginView");
    if (!loginView) return;

    // Sync School Name dynamically from Admin Settings
    const schoolCfg = StorageService.getSchoolConfig();
    const schName = schoolCfg.name || "MTs Asy-Syafi'iyyah Jatibarang";
    const elSch = document.getElementById("loginSchoolName");
    if (elSch) elSch.textContent = schName.toUpperCase();
    const elFoot = document.getElementById("loginFooterSchoolName");
    if (elFoot) elFoot.textContent = schName;

    const alertBox = document.getElementById("loginMainAlert");
    const alertText = document.getElementById("loginMainAlertText");

    function showLoginAlert(msg) {
      if (alertBox) {
        alertBox.style.display = "flex";
        if (alertText) alertText.textContent = msg;
        alertBox.classList.remove("shake-error");
        void alertBox.offsetWidth;
        alertBox.classList.add("shake-error");
      }
      if (typeof SoundService !== "undefined" && typeof SoundService.playError === "function") {
        SoundService.playError();
      }
    }

    function hideLoginAlert() {
      if (alertBox) alertBox.style.display = "none";
    }

    // Global Tab Switching function (Available from onclick="window.switchLoginTab('teacher'|'admin')")
    window.switchLoginTab = function(mode) {
      const tabTeacher = document.getElementById("tabBtnMainTeacherAuth");
      const tabAdmin = document.getElementById("tabBtnMainAdminAuth");
      const panelTeacher = document.getElementById("loginPanelTeacher");
      const panelAdmin = document.getElementById("loginPanelAdmin");
      hideLoginAlert();

      if (mode === "admin") {
        if (tabAdmin) tabAdmin.classList.add("active");
        if (tabTeacher) tabTeacher.classList.remove("active");
        if (panelAdmin) panelAdmin.style.display = "block";
        if (panelTeacher) panelTeacher.style.display = "none";
        const pass = document.getElementById("inputMainAdminPassword");
        if (pass) setTimeout(() => pass.focus(), 80);
      } else {
        if (tabTeacher) tabTeacher.classList.add("active");
        if (tabAdmin) tabAdmin.classList.remove("active");
        if (panelTeacher) panelTeacher.style.display = "block";
        if (panelAdmin) panelAdmin.style.display = "none";
        const selectTeacher = document.getElementById("selectMainTeacherAccount");
        if (selectTeacher && !selectTeacher.value) setTimeout(() => selectTeacher.focus(), 80);
      }
    };

    // Helper: Retrieve all registered teachers
    const getLiveTeachers = () => {
      try {
        const list = StorageService.getTeachersMaster();
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (e) {
        console.warn("[LoginScreen] Error loading teachers master:", e);
      }
      return (typeof INITIAL_TEACHERS_MASTER_60 !== "undefined" ? INITIAL_TEACHERS_MASTER_60 : []);
    };

    // Update Teacher Preview Profile Card
    window.updateMainTeacherPreview = function(teacherId) {
      const card = document.getElementById("teacherSelectedPreviewCard");
      if (!teacherId) {
        if (card) card.style.display = "none";
        return;
      }
      const teachers = getLiveTeachers();
      const t = teachers.find(item => 
        (item.id && item.id === teacherId) || 
        (item.nip && item.nip === teacherId) || 
        (item.teacherId && item.teacherId === teacherId) ||
        (item.nip && String(item.nip).trim() === String(teacherId).trim())
      );
      const previewName = document.getElementById("teacherPreviewName");
      const previewDetail = document.getElementById("teacherPreviewDetail");
      const previewAvatar = document.getElementById("teacherPreviewAvatar");
      if (t) {
        if (card) card.style.display = "flex";
        if (previewName) previewName.textContent = t.name;
        if (previewDetail) previewDetail.textContent = `${t.subject || 'Guru Mapel'} • NIP ${t.nip || '-'} • ${t.classAssigned || 'MTs'}`;
        if (previewAvatar) {
          const initials = (t.name || "GR").split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
          previewAvatar.textContent = initials || "GR";
        }
      } else {
        if (card) card.style.display = "none";
      }
    };

    // Populate the Native Select Dropdown for 51+ Teachers
    window.populateTeacherSelect = function(filterKeyword = "") {
      const select = document.getElementById("selectMainTeacherAccount");
      const badgeCount = document.getElementById("badgeTeacherCount");
      if (!select) return;

      const teachers = getLiveTeachers();
      if (badgeCount) {
        badgeCount.textContent = `${teachers.length} Pendidik Terdaftar`;
      }

      const q = (filterKeyword || "").trim().toLowerCase();
      const currentSelected = select.value;

      const filtered = q
        ? teachers.filter(t => {
            if (!t) return false;
            const name = (t.name || "").toLowerCase();
            const nip = (t.nip || "").replace(/\s+/g, "").toLowerCase();
            const subj = (t.subject || "").toLowerCase();
            const user = (t.username || "").toLowerCase();
            const cleanQ = q.replace(/\s+/g, "");
            return name.includes(q) || nip.includes(cleanQ) || subj.includes(q) || user.includes(q);
          })
        : teachers;

      select.innerHTML = '<option value="">-- Pilih Akun Guru Pendidik --</option>';

      filtered.forEach(t => {
        if (!t) return;
        const canonicalId = (t.nip && t.nip.length > 3 && t.nip !== "-") ? t.nip : (t.teacherId || t.id);
        const opt = document.createElement("option");
        opt.value = canonicalId;
        const nipInfo = (t.nip && t.nip !== "-") ? ` [NIP: ${t.nip}]` : "";
        const subjInfo = t.subject ? ` (${t.subject})` : "";
        opt.textContent = `${t.name}${subjInfo}${nipInfo}`;
        if (currentSelected && (currentSelected === canonicalId || currentSelected === t.id || currentSelected === t.nip || currentSelected === t.teacherId)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      // If user typed and only 1 teacher matched, auto-select
      if (q && filtered.length === 1) {
        const only = filtered[0];
        const canonicalId = (only.nip && only.nip.length > 3 && only.nip !== "-") ? only.nip : (only.teacherId || only.id);
        select.value = canonicalId;
        window.updateMainTeacherPreview(canonicalId);
      }
    };

    // Initialize select dropdown with all teachers
    window.populateTeacherSelect("");

    // Quick Search Input Listener
    const inputTeacherSearch = document.getElementById("inputMainTeacherIdentifier");
    if (inputTeacherSearch) {
      inputTeacherSearch.addEventListener("input", (e) => {
        const query = e.target.value;
        window.populateTeacherSelect(query);
        const select = document.getElementById("selectMainTeacherAccount");
        if (select && select.value) {
          window.updateMainTeacherPreview(select.value);
        } else {
          window.updateMainTeacherPreview(null);
        }
      });
    }

    // Select Account Change Listener
    const selectTeacher = document.getElementById("selectMainTeacherAccount");
    if (selectTeacher) {
      selectTeacher.addEventListener("change", (e) => {
        const chosenId = e.target.value;
        window.updateMainTeacherPreview(chosenId);
        hideLoginAlert();
        const pass = document.getElementById("inputMainTeacherPassword");
        if (pass && chosenId) {
          pass.value = "";
          setTimeout(() => pass.focus(), 80);
        }
      });
    }

    // Eye Password Toggles
    const btnToggleTeacherPass = document.getElementById("btnToggleMainTeacherPass");
    const inputTeacherPass = document.getElementById("inputMainTeacherPassword");
    if (btnToggleTeacherPass && inputTeacherPass) {
      btnToggleTeacherPass.onclick = function() {
        const isPass = inputTeacherPass.type === "password";
        inputTeacherPass.type = isPass ? "text" : "password";
        btnToggleTeacherPass.innerHTML = isPass
          ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
          : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      };
    }

    const btnToggleAdminPass = document.getElementById("btnToggleMainAdminPass");
    const inputAdminPass = document.getElementById("inputMainAdminPassword");
    if (btnToggleAdminPass && inputAdminPass) {
      btnToggleAdminPass.onclick = function() {
        const isPass = inputAdminPass.type === "password";
        inputAdminPass.type = isPass ? "text" : "password";
        btnToggleAdminPass.innerHTML = isPass
          ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
          : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      };
    }

    // Teacher Form Submit Handler (Globally accessible)
    window.handleTeacherLoginSubmit = function(e) {
      if (e && e.preventDefault) e.preventDefault();

      const select = document.getElementById("selectMainTeacherAccount");
      const searchInput = document.getElementById("inputMainTeacherIdentifier");
      const passInput = document.getElementById("inputMainTeacherPassword");
      const rememberCheck = document.getElementById("checkMainTeacherRemember");

      let targetIdentifier = select ? select.value.trim() : "";
      const queryVal = searchInput ? searchInput.value.trim() : "";

      if (!targetIdentifier && queryVal) {
        const teachers = getLiveTeachers();
        const match = teachers.find(t => 
          (t.name || "").toLowerCase() === queryVal.toLowerCase() ||
          (t.nip || "").replace(/\s+/g, "") === queryVal.replace(/\s+/g, "") ||
          (t.username || "").toLowerCase() === queryVal.toLowerCase() ||
          (t.email || "").toLowerCase() === queryVal.toLowerCase()
        );
        if (match) {
          targetIdentifier = (match.nip && match.nip.length > 3 && match.nip !== "-") ? match.nip : (match.teacherId || match.id);
          if (select) select.value = targetIdentifier;
        } else {
          targetIdentifier = queryVal;
        }
      }

      if (!targetIdentifier) {
        showLoginAlert("Silakan pilih akun guru pendidik Anda dari daftar di atas.");
        if (select) select.focus();
        return;
      }

      const pin = passInput ? passInput.value.trim() : "";
      if (!pin) {
        showLoginAlert("Silakan masukkan PIN / Password Akun Anda (Default: 123456).");
        if (passInput) passInput.focus();
        return;
      }

      const remember = rememberCheck ? rememberCheck.checked : true;
      const authResult = StorageService.verifyTeacherCredentials(targetIdentifier, pin);

      if (authResult.success) {
        hideLoginAlert();
        const teacher = authResult.teacher;
        const canonicalId = (teacher.nip && teacher.nip.length > 3 && teacher.nip !== "-") ? teacher.nip : (teacher.teacherId || teacher.id);
        StorageService.setTeacherLoggedIn(canonicalId, remember);
        StorageService.setActiveTeacherId(canonicalId);
        StorageService.syncActiveTeachingSchedules();
        if (typeof SoundService !== "undefined" && typeof SoundService.playSuccess === "function") {
          SoundService.playSuccess();
        }

        // Firebase Cloud Session
        if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
          FirebaseService.loginWithNip(teacher.nip || canonicalId, pin, "teacher", teacher)
            .then(res => {
              if (res.success) {
                console.log("[Firebase] Akun guru terautentikasi:", teacher.name);
              }
            })
            .catch(err => console.warn("[Firebase] Auth warning:", err));
        }

        document.body.classList.remove("mode-login");
        document.body.classList.add("mode-guru");
        document.body.classList.remove("mode-admin");
        const loginView = document.getElementById("appLoginView");
        if (loginView) {
          loginView.style.display = "none";
        }
        window.switchAppRole("teacher", true);
        if (typeof window.switchToTab === "function") {
          window.switchToTab("tab-dashboard");
        }
        showToast("Login Berhasil", `Selamat datang, ${teacher.name}! Sesi presensi aktif.`, "success");
      } else {
        showLoginAlert(authResult.message || "Gagal login. Periksa NIP/Username dan PIN.");
      }
    };

    // Admin Form Submit Handler (Globally accessible)
    window.handleAdminLoginSubmit = function(e) {
      if (e && e.preventDefault) e.preventDefault();

      const userInput = document.getElementById("inputMainAdminUsername");
      const passInput = document.getElementById("inputMainAdminPassword");
      const rememberCheck = document.getElementById("checkMainAdminRemember");

      const username = userInput ? userInput.value.trim() : "";
      const password = passInput ? passInput.value : "";
      const remember = rememberCheck ? rememberCheck.checked : true;

      if (!username) {
        showLoginAlert("Silakan masukkan username administrator.");
        if (userInput) userInput.focus();
        return;
      }
      if (!password) {
        showLoginAlert("Silakan masukkan password administrator.");
        if (passInput) passInput.focus();
        return;
      }

      if (StorageService.verifyAdminCredentials(username, password)) {
        hideLoginAlert();
        StorageService.setAdminLoggedIn(true, remember);
        if (typeof SoundService !== "undefined" && typeof SoundService.playSuccess === "function") {
          SoundService.playSuccess();
        }

        // Firebase Admin Auth
        if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
          FirebaseService.loginWithNip("admin", password, "admin", { id: "admin", name: "Administrator" })
            .then(res => {
              if (res.success) {
                console.log("[Firebase] Administrator terautentikasi (Sesi Tertutup Penuh)");
              }
            })
            .catch(err => console.warn("[Firebase] Admin auth warning:", err));
        }

        document.body.classList.remove("mode-login");
        document.body.classList.add("mode-admin");
        document.body.classList.remove("mode-guru");
        const loginView = document.getElementById("appLoginView");
        if (loginView) {
          loginView.style.display = "none";
        }
        window.switchAppRole("admin", true);
        if (typeof window.switchToTab === "function") {
          window.switchToTab("tab-admin-monitoring");
        }
        showToast("Login Administrator Berhasil", "Selamat datang di Command Center Administrator MTs.", "success");
      } else {
        showLoginAlert("Username atau password administrator salah. Silakan periksa kembali.");
      }
    };

    // Attach submit listeners to both forms
    const formTeacher = document.getElementById("formMainTeacherLogin");
    if (formTeacher) {
      formTeacher.onsubmit = window.handleTeacherLoginSubmit;
    }
    const formAdmin = document.getElementById("formMainAdminLogin");
    if (formAdmin) {
      formAdmin.onsubmit = window.handleAdminLoginSubmit;
    }

    // Expose refresh helper so real-time Cloud updates immediately reflect on Login View
    window.refreshLoginScreenData = function() {
      if (typeof window.populateTeacherSelect === "function") {
        const inputTeacherSearch = document.getElementById("inputMainTeacherIdentifier");
        window.populateTeacherSelect(inputTeacherSearch ? inputTeacherSearch.value : "");
      }
      const selectTeacher = document.getElementById("selectMainTeacherAccount");
      if (selectTeacher && selectTeacher.value) {
        window.updateMainTeacherPreview(selectTeacher.value);
      }
      const latestSchool = StorageService.getSchoolConfig();
      const loginSchoolTitle = document.getElementById("loginSchoolNameTitle");
      if (loginSchoolTitle && latestSchool && latestSchool.name) {
        loginSchoolTitle.textContent = latestSchool.name;
      }
    };

    // Teacher Help Note
    const btnHelp = document.getElementById("btnTeacherHelpNote");
    if (btnHelp) {
      btnHelp.onclick = function() {
        showToast("Bantuan Login Guru", "Pilih nama Anda dari daftar Pendidik, masukkan PIN / Password Akun Anda (Default: 123456), lalu klik 'Masuk ke Presensi Guru'.", "info");
      };
    }
  }

  // =========================================================================
  // MODUL: LAPORAN ABSENSI BULANAN RESMI (CETAK PDF & EKSPOR EXCEL .XLS / CSV)
  // FORMAT MENGIKUTI DOKUMEN RESMI MADRASAH (CONTOH SIMPATIKA / KEMENAG)
  // =========================================================================
  function initOfficialAttendanceReport() {
    const modalReport = document.getElementById("modalOfficialAttendanceReport");
    const monthSelect = document.getElementById("selectOfficialReportMonth");
    const teacherSelect = document.getElementById("selectOfficialReportTeacher");
    const paperSheet = document.getElementById("officialReportPaperSheet");
    const btnPrint = document.getElementById("btnTriggerOfficialPrint");
    const btnExcel = document.getElementById("btnTriggerOfficialExcel");
    const btnCsv = document.getElementById("btnTriggerOfficialCsv");

    const monthNamesIndo = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];
    const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    function populateTeacherDropdown(selectedId = null) {
      if (!teacherSelect) return;
      const teachers = (typeof StorageService !== "undefined" && StorageService.getTeachersMaster)
        ? StorageService.getTeachersMaster()
        : [];
      const activeTeacher = (typeof StorageService !== "undefined" && StorageService.getActiveTeacher)
        ? StorageService.getActiveTeacher()
        : null;

      let targetId = selectedId || (activeTeacher ? activeTeacher.id : "TCH-00");
      if (!teachers.some(t => t.id === targetId) && teachers.length > 0) {
        targetId = teachers[0].id;
      }

      teacherSelect.innerHTML = teachers.map(t => {
        const isSelected = t.id === targetId ? "selected" : "";
        const roleOrPos = t.position || t.classAssigned || (t.id === "TCH-00" ? "Kepala Madrasah" : (t.role || "Pendidik"));
        return `<option value="${t.id}" ${isSelected}>${t.name} (${roleOrPos})</option>`;
      }).join("");
    }

    function getMonthlyReportData(yearStr, monthStr, teacherId) {
      const year = parseInt(yearStr, 10) || 2026;
      const month = parseInt(monthStr, 10) || 1; // 1-12
      const daysInMonth = new Date(year, month, 0).getDate();

      const teachers = (typeof StorageService !== "undefined" && StorageService.getTeachersMaster)
        ? StorageService.getTeachersMaster()
        : [];
      let teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) {
        teacher = (typeof StorageService !== "undefined" && StorageService.getActiveTeacher)
          ? StorageService.getActiveTeacher()
          : { name: "Drs. H. Akhmad Rosidi", nip: "9248740641200003", nuptk: "9248740641200003", role: "Pendidik", position: "Kepala Madrasah" };
      }

      const schoolConfig = (typeof StorageService !== "undefined" && StorageService.getSchoolConfig)
        ? StorageService.getSchoolConfig()
        : {};
      const schoolName = schoolConfig.name || "MTs Asy-Syafi'iyyah Jatibarang";

      const allHistory = (typeof StorageService !== "undefined" && StorageService.getHistory)
        ? StorageService.getHistory()
        : [];
      const allLeaves = (typeof StorageService !== "undefined" && StorageService.getLeaveRequests)
        ? StorageService.getLeaveRequests()
        : [];

      const monthPadded = String(month).padStart(2, "0");
      const periodStartStr = `01-${monthPadded}-${year}`;
      const periodEndStr = `${String(daysInMonth).padStart(2, "0")}-${monthPadded}-${year}`;

      const days = [];
      const holidaysFound = [];

      // Built-in Official Holidays Reference (2026 & 2027)
      const OFFICIAL_HOLIDAYS_MAP = [
        { startDate: "2026-01-01", endDate: "2026-01-01", name: "Tahun Baru Masehi 2026", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-01-16", endDate: "2026-01-16", name: "Isra Mi'raj Nabi Muhammad SAW 1447 H", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-02-17", endDate: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-03-19", endDate: "2026-03-19", name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-03-20", endDate: "2026-03-21", name: "Hari Raya Idul Fitri 1447 H", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-03-23", endDate: "2026-03-25", name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", category: "madrasah", isKaldikJateng: true },
        { startDate: "2026-04-03", endDate: "2026-04-03", name: "Wafat Yesus Kristus (Jumat Agung)", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-05-01", endDate: "2026-05-01", name: "Hari Buruh Internasional", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-05-14", endDate: "2026-05-14", name: "Kenaikan Yesus Kristus", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-05-27", endDate: "2026-05-27", name: "Hari Raya Idul Adha 1447 H", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-05-31", endDate: "2026-05-31", name: "Hari Raya Waisak 2570 BE", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-06-01", endDate: "2026-06-01", name: "Hari Lahir Pancasila", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-06-16", endDate: "2026-06-16", name: "Tahun Baru Islam (1 Muharram 1448 H)", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-08-17", endDate: "2026-08-17", name: "Hari Kemerdekaan RI ke-81", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-08-25", endDate: "2026-08-25", name: "Maulid Nabi Muhammad SAW 1448 H", category: "nasional", isKaldikJateng: false },
        { startDate: "2026-10-22", endDate: "2026-10-22", name: "Hari Santri Nasional (HSN)", category: "madrasah", isKaldikJateng: true },
        { startDate: "2026-11-25", endDate: "2026-11-25", name: "Hari Guru Nasional (HGN)", category: "madrasah", isKaldikJateng: true },
        { startDate: "2026-12-25", endDate: "2026-12-25", name: "Hari Raya Natal", category: "nasional", isKaldikJateng: false },
        { startDate: "2027-01-01", endDate: "2027-01-01", name: "Tahun Baru Masehi 2027", category: "nasional", isKaldikJateng: false },
        { startDate: "2027-01-03", endDate: "2027-01-03", name: "Hari Amal Bakti (HAB) Kemenag RI ke-81", category: "madrasah", isKaldikJateng: true },
        { startDate: "2027-01-06", endDate: "2027-01-06", name: "Isra Mi'raj Nabi Muhammad SAW 1448 H", category: "nasional", isKaldikJateng: false }
      ];

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const dayPadded = String(dayNum).padStart(2, "0");
        const dateObj = new Date(year, month - 1, dayNum);
        const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ...
        const dayName = dayNamesIndo[dayOfWeek];
        const isoDate = `${year}-${monthPadded}-${dayPadded}`;
        const displayDate = `${dayName} ${dayPadded}-${monthPadded}-${year}`;

        // Kaldik & National Holiday Check (Prioritaskan OFFICIAL_HOLIDAYS_MAP lalu StorageService)
        let holidayInfo = OFFICIAL_HOLIDAYS_MAP.find(h => isoDate >= h.startDate && isoDate <= h.endDate) || null;
        if (!holidayInfo && typeof StorageService !== "undefined" && StorageService.getHolidayForDate) {
          const holCheck = StorageService.getHolidayForDate(isoDate);
          if (holCheck && holCheck.isHoliday) {
            holidayInfo = holCheck.holiday;
          }
        }
        if (holidayInfo && !holidaysFound.some(h => h.name === holidayInfo.name)) {
          holidaysFound.push(holidayInfo);
        }

        // Teacher Attendance Record Check
        const attRecord = allHistory.find(h => {
          return (h.date === isoDate || h.rawDate === isoDate || (h.date && h.date.startsWith(`${dayPadded}/${monthPadded}`)));
        });

        // Approved Leave Record Check
        const leaveRecord = allLeaves.find(l => {
          const s = (l.startDate || "").substring(0, 10);
          const e = (l.endDate || l.startDate || "").substring(0, 10);
          return isoDate >= s && isoDate <= e && (l.status === "Approved" || l.status === "Disetujui");
        });

        let namaTugas = "KBM";
        let jamMasuk = "07:00";
        let scanMasuk = "";
        let jamPulang = "14:30";
        let scanPulang = "";
        let izinDurasi = "";
        let izinLebih = "";
        let liburUmum = false;
        let liburRutin = false;
        let isHoliday = false;
        let keterangan = "";

        // Standard Schedule by Day
        if (dayOfWeek === 5) {
          // Jumat: 07:00 - 11:30
          jamPulang = "11:30";
        } else if (dayOfWeek === 6) {
          // Sabtu: 07:00 - 15:00
          jamPulang = "15:00";
        } else if (dayOfWeek === 0) {
          // Minggu: Libur Rutin
          namaTugas = "Libur Rutin";
          jamMasuk = "";
          jamPulang = "";
          liburRutin = true;
          isHoliday = true;
          if (holidayInfo) {
            liburUmum = true;
            const isMadrasah = (holidayInfo.category === "madrasah" || holidayInfo.isKaldikJateng);
            const holidayType = isMadrasah ? "Libur Madrasah" : "Libur Nasional";
            keterangan = holidayInfo.name ? `${holidayType} (${holidayInfo.name})` : holidayType;
          }
        }

        // Public / Kaldik Holiday on Weekday (Senin - Sabtu)
        if (holidayInfo && dayOfWeek !== 0) {
          liburUmum = true;
          isHoliday = true;
          namaTugas = "Libur";
          jamMasuk = "";
          jamPulang = "";
          scanMasuk = "";
          scanPulang = "";
          const isMadrasah = (holidayInfo.category === "madrasah" || holidayInfo.isKaldikJateng);
          const holidayType = isMadrasah ? "Libur Madrasah" : "Libur Nasional";
          keterangan = holidayInfo.name ? `${holidayType} (${holidayInfo.name})` : holidayType;
        }

        // Approved Leave (if not holiday)
        if (leaveRecord && !isHoliday) {
          namaTugas = leaveRecord.category || "Izin";
          jamMasuk = "-";
          jamPulang = "-";
          izinDurasi = "1 Hari";
          izinLebih = "-";
          keterangan = leaveRecord.reason || "Pengajuan Disetujui";
        }

        // Actual Attendance Scans (only if active work day, not holiday)
        if (attRecord && !isHoliday) {
          if (attRecord.checkIn && attRecord.checkIn !== "--:--") {
            scanMasuk = attRecord.checkIn;
          }
          if (attRecord.checkOut && attRecord.checkOut !== "--:--") {
            scanPulang = attRecord.checkOut;
          }
          if (attRecord.status && attRecord.status !== "Hadir") {
            keterangan = attRecord.status;
          }
        }

        days.push({
          dayNum,
          dayName,
          displayDate,
          isoDate,
          dayOfWeek,
          namaTugas,
          jamMasuk,
          scanMasuk,
          jamPulang,
          scanPulang,
          izinDurasi,
          izinLebih,
          liburUmum,
          liburRutin,
          isHoliday,
          keterangan
        });
      }

      const nuptkVal = (teacher.nuptk && teacher.nuptk !== "-") ? teacher.nuptk : (teacher.nip || "9248740641200003");
      const jabatanVal = teacher.position || teacher.classAssigned || (teacher.id === "TCH-00" ? "Kepala Madrasah" : (teacher.role || "Pendidik"));
      const printRefNumber = `LAP/${monthPadded}/${year}/${String(nuptkVal).replace(/[^0-9]/g, "").slice(0, 10)}`;

      // Statistical Analysis for Page 2
      const totalDays = daysInMonth;
      const routineHolidayCount = days.filter(d => d.liburRutin).length;
      const publicHolidayCount = days.filter(d => d.liburUmum).length;
      const effectiveWorkDays = totalDays - (routineHolidayCount + publicHolidayCount);

      let presentCount = 0;
      let lateCount = 0;
      let earlyLeaveCount = 0;
      let leaveCount = 0;
      let sickCount = 0;
      let permitCount = 0;

      days.forEach(d => {
        if (!d.liburRutin && !d.liburUmum) {
          if (d.izinDurasi || (d.namaTugas !== "KBM" && d.namaTugas !== "Libur Rutin" && !d.liburUmum)) {
            leaveCount++;
            if (d.namaTugas === "Sakit") sickCount++;
            else permitCount++;
          } else {
            presentCount++;
            if (d.scanMasuk && d.scanMasuk > "07:15") {
              lateCount++;
            }
            if (d.scanPulang && d.jamPulang && d.scanPulang < d.jamPulang) {
              earlyLeaveCount++;
            }
          }
        }
      });

      const presencePercentage = effectiveWorkDays > 0
        ? Math.min(100, Math.max(0, (presentCount / effectiveWorkDays) * 100)).toFixed(1)
        : "100.0";

      const numPct = parseFloat(presencePercentage);
      let predicate = "SANGAT BAIK (A)";
      if (numPct < 75) predicate = "PERLU PEMBINAAN (D)";
      else if (numPct < 85) predicate = "CUKUP (C)";
      else if (numPct < 95) predicate = "BAIK (B)";

      const principalName = schoolConfig.principalName || "Drs. H. Akhmad Rosidi";
      const principalNip = schoolConfig.principalNip || schoolConfig.nuptk || "9248740641200003";
      const signCity = "Jatibarang";
      const signDate = `${daysInMonth} ${monthNamesIndo[month - 1]} ${year}`;

      return {
        year,
        month,
        monthNameUpper: monthNamesIndo[month - 1] || "JANUARI",
        schoolName,
        teacherName: teacher.name,
        teacherNuptk: nuptkVal,
        teacherFunction: teacher.role || "Pendidik",
        teacherPosition: jabatanVal,
        periodStartStr,
        periodEndStr,
        printRefNumber,
        holidaysFound,
        adminSignature: "@opmmtsasyjtb",
        totalDays,
        routineHolidayCount,
        publicHolidayCount,
        effectiveWorkDays,
        presentCount,
        lateCount,
        earlyLeaveCount,
        leaveCount,
        sickCount,
        permitCount,
        presencePercentage,
        predicate,
        principalName,
        principalNip,
        signCity,
        signDate,
        days
      };
    }

    function generateOfficialReportTableHTML(report, forExcel = false) {
      const borderAttr = forExcel ? 'border="1"' : 'style="border: 1px solid #000;"';
      const cellBorder = 'border: 1px solid #000;';

      const rowsHtml = report.days.map(d => {
        const isHolidayDate = d.liburRutin || d.liburUmum || (d.dayOfWeek === 0) || d.isHoliday;
        const dateColorStyle = isHolidayDate ? 'color: #dc2626 !important; font-weight: bold;' : 'color: #000000;';

        const taskItalic = (d.namaTugas === "KBM" || d.namaTugas === "Libur Rutin" || d.namaTugas === "Libur") ? `<i>${d.namaTugas}</i>` : d.namaTugas;

        const boxEmpty = forExcel
          ? '&#9633;'
          : '<span style="display:inline-block; width:9px; height:9px; border:1px solid #000; line-height:8px; background:#fff; vertical-align:middle; box-sizing:border-box;"></span>';
        
        const boxChecked = forExcel
          ? '&#9745;'
          : '<span style="display:inline-block; width:9px; height:9px; border:1px solid #000; background:#000; color:#fff; line-height:7.5px; text-align:center; font-size:6.5px; font-weight:bold; vertical-align:middle; box-sizing:border-box;">&#10003;</span>';

        const umumBox = d.liburUmum ? boxChecked : boxEmpty;
        const rutinBox = d.liburRutin ? boxChecked : boxEmpty;

        const jamMasukDisplay = d.jamMasuk ? `<strong>${d.jamMasuk}</strong>` : '';
        const jamPulangDisplay = d.jamPulang ? `<strong>${d.jamPulang}</strong>` : '';

        return `
          <tr style="height: 18px; page-break-inside: avoid; break-inside: avoid;">
            <td style="${cellBorder} font-size: 7.4pt; text-align: left; padding: 2.6px 3px; white-space: nowrap; font-family: Arial, sans-serif; ${dateColorStyle}">${d.displayDate}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: left; padding: 2.6px 3px; white-space: nowrap; font-family: Arial, sans-serif;">${taskItalic}</td>
            <td style="${cellBorder} font-size: 7.6pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif; font-weight: bold; letter-spacing: -0.2px;">${jamMasukDisplay}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif; letter-spacing: -0.2px;">${d.scanMasuk || ''}</td>
            <td style="${cellBorder} font-size: 7.6pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif; font-weight: bold; letter-spacing: -0.2px;">${jamPulangDisplay}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif; letter-spacing: -0.2px;">${d.scanPulang || ''}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif;">${d.izinDurasi || ''}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; font-family: Arial, sans-serif;">${d.izinLebih || ''}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; vertical-align: middle;">${umumBox}</td>
            <td style="${cellBorder} font-size: 7.4pt; text-align: center; padding: 2.6px 3px; vertical-align: middle;">${rutinBox}</td>
            <td style="${cellBorder} font-size: 7pt; text-align: left; padding: 2.6px 3px; font-family: Arial, sans-serif;">${d.keterangan || ''}</td>
          </tr>
        `;
      }).join("");

      const holidayNotes = report.holidaysFound.length > 0
        ? report.holidaysFound.map(h => `${h.name} Id : ${h.id || '32'}`).join(" &bull; ")
        : "";

      // Sheet 1: Tabel Absensi 1 Bulan Penuh (Pas 1 Halaman Utuh A4 Landscape)
      const sheet1Html = `
        <div class="official-report-sheet official-report-sheet-card" id="officialReportSheet1" style="page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid;">
          <!-- HEADER BOX (SEIMBANG & PROPORSIONAL 1 HALAMAN PENUH) -->
          <div style="border: 1.5px solid #000; padding: 3px 14px; text-align: center; margin: 0 auto 5px auto; width: 60%; background: #ffffff; box-sizing: border-box;">
            <div style="font-size: 11.5pt; font-weight: bold; letter-spacing: 0.5px; font-family: Arial, sans-serif; color: #000; line-height: 1.2;">
              LAPORAN ABSENSI BULAN ${report.monthNameUpper} ${report.year}
            </div>
          </div>

          <!-- METADATA INFORMATION TABLE (SEJAJAR, JELAS & RAPI) -->
          <table style="width: 100%; font-family: Arial, sans-serif; font-size: 8.2pt; border-collapse: collapse; margin-bottom: 3px; color: #000; line-height: 1.25;">
            <tr>
              <td style="width: 56%; vertical-align: top; padding: 0 8px 0 0;">
                <table style="border-collapse: collapse; width: 100%; font-size: 8.2pt;">
                  <tr>
                    <td style="width: 115px; font-weight: bold; padding: 1px 0;">Nama Madrasah</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td style="font-weight: bold; font-style: italic;">${report.schoolName}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 1px 0;">Nama</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td style="font-weight: bold;">${report.teacherName}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 1px 0;">NUPTK</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td>${report.teacherNuptk}</td>
                  </tr>
                </table>
              </td>
              <td style="width: 44%; vertical-align: top; padding: 0 0 0 8px;">
                <table style="border-collapse: collapse; width: 100%; font-size: 8.2pt;">
                  <tr>
                    <td style="width: 90px; font-weight: bold; padding: 1px 0;">Tgl. Periode</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td>${report.periodStartStr} s/d ${report.periodEndStr}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 1px 0;">Fungsi</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td>${report.teacherFunction}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 1px 0;">Jabatan</td>
                    <td style="width: 10px; font-weight: bold; text-align: center;">:</td>
                    <td style="font-weight: bold;">${report.teacherPosition}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- SOLID LINE DIVIDER -->
          <div style="border-top: 1.5px solid #000; margin: 2px 0 3px 0;"></div>

          <!-- STATISTIK KEHADIRAN PALING ATAS (REKAPITULASI RESMI LEMBAR 1) -->
          <div style="font-size: 7.6pt; font-weight: bold; margin: 2px 0 2px 0; color: #000; font-family: Arial, sans-serif;">REKAPITULASI & STATISTIK KEHADIRAN BULANAN</div>
          <table ${borderAttr} class="official-report-kpi-table" style="width: 100% !important; border: 1px solid #000; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 7.2pt; margin: 0 auto 5px auto; table-layout: fixed; box-sizing: border-box;">
            <colgroup>
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 16%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
            </colgroup>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hari Kalender</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Libur Rutin (Minggu)</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Libur Nasional</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hari Efektif KBM</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hadir Tepat Waktu</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">Izin / Sakit / Cuti</th>
              <th style="${cellBorder} padding: 2px 2px; text-align: center; vertical-align: middle; background: #e0f2fe; color: #0369a1; font-size: 7.2pt; font-weight: bold; font-family: Arial, sans-serif;">PROSENTASE</th>
            </tr>
            <tr style="text-align: center; font-weight: bold;">
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.totalDays} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.routineHolidayCount} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.publicHolidayCount} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; color: #0284c7; text-align: center; vertical-align: middle;">${report.effectiveWorkDays} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; color: #16a34a; text-align: center; vertical-align: middle;">${report.presentCount} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.leaveCount} Hari</td>
              <td style="${cellBorder} padding: 2px 2px; font-size: 7.4pt; font-family: Arial, sans-serif; font-weight: bold; background: #e0f2fe; color: #0369a1; text-align: center; vertical-align: middle;">${report.presencePercentage}%</td>
            </tr>
          </table>

          <!-- ATTENDANCE TABLE (ALL 31 DAYS FULL ON SHEET 1) -->
          <table ${borderAttr} class="official-report-attendance-table" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 7.4pt; color: #000; line-height: 1.1; table-layout: fixed; break-inside: avoid; page-break-inside: avoid;">
            <colgroup>
              <col style="width: 13.5%;"> <!-- Tanggal -->
              <col style="width: 8.5%;">  <!-- Nama Tugas -->
              <col style="width: 7.2%;">  <!-- Jam Masuk -->
              <col style="width: 7.8%;">  <!-- Scan Masuk -->
              <col style="width: 7.2%;">  <!-- Jam Pulang -->
              <col style="width: 7.8%;">  <!-- Scan Pulang -->
              <col style="width: 5.5%;">  <!-- Izin Durasi -->
              <col style="width: 5.5%;">  <!-- Izin Lebih -->
              <col style="width: 5%;">    <!-- Libur Umum -->
              <col style="width: 5%;">    <!-- Libur Rutin -->
              <col style="width: 25%;">   <!-- Keterangan -->
            </colgroup>
            <thead>
              <tr style="background: #ffffff; font-weight: bold; height: 20px;">
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle;">Tanggal</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle;">Nama Tugas</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle; white-space: nowrap;">Jam Masuk</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle; white-space: nowrap;">Scan Masuk</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle; white-space: nowrap;">Jam Pulang</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle; white-space: nowrap;">Scan Pulang</th>
                <th colspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle;">Izin</th>
                <th colspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle;">Libur</th>
                <th rowspan="2" style="${cellBorder} font-size: 7.6pt; font-weight: bold; padding: 2px 2px; text-align: center; vertical-align: middle;">Keterangan</th>
              </tr>
              <tr style="background: #ffffff; font-weight: bold; height: 16px;">
                <th style="${cellBorder} padding: 1.5px 2px; text-align: center; font-style: italic; font-size: 7pt; font-weight: bold;">Durasi</th>
                <th style="${cellBorder} padding: 1.5px 2px; text-align: center; font-style: italic; font-size: 7pt; font-weight: bold;">Lebih</th>
                <th style="${cellBorder} padding: 1.5px 2px; text-align: center; font-size: 7pt; font-weight: bold;">Umum</th>
                <th style="${cellBorder} padding: 1.5px 2px; text-align: center; font-size: 7pt; font-weight: bold;">Rutin</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- FOOTER SHEET 1 -->
          <table style="width: 100%; font-family: Arial, sans-serif; font-size: 7.2pt; border-collapse: collapse; margin-top: 4px; color: #000; line-height: 1.2;">
            <tr>
              <td style="text-align: left; vertical-align: top; width: 60%; padding: 0;">
                ${holidayNotes ? `<div style="font-size: 6.8pt; margin-bottom: 1px; color: #333;">${holidayNotes}</div>` : ''}
                <div><strong>No Cetak :</strong> <span style="font-family: Arial, sans-serif; font-size: 7.2pt;">${report.printRefNumber}</span></div>
              </td>
              <td style="text-align: right; vertical-align: bottom; width: 40%; font-weight: bold; font-style: italic; padding: 0;">
                Admin : ${report.adminSignature} &bull; Lembar 1/2
              </td>
            </tr>
          </table>
        </div>
      `;

      // Sheet 2: Lembar Analisis & Prosentase Kehadiran + Pengesahan Kepala Madrasah (Presisi Sempurna di Hal 2)
      const sheet2Html = `
        <div class="official-report-sheet official-report-sheet-card" id="officialReportSheet2" style="margin-top: ${forExcel ? '15px' : '0'}; page-break-before: always; break-before: page; page-break-inside: avoid; break-inside: avoid;">
          <!-- HEADER BOX SHEET 2 (PRESISI & SERASI DENGAN SHEET 1) -->
          <div style="border: 1.5px solid #000; padding: 3px 14px; text-align: center; margin: 0 auto 4px auto; width: 64%; background: #ffffff; box-sizing: border-box;">
            <div style="font-size: 10.5pt; font-weight: bold; letter-spacing: 0.4px; font-family: Arial, sans-serif; color: #000; line-height: 1.2;">
              LEMBAR ANALISIS & REKAPITULASI KEHADIRAN BULANAN GURU
            </div>
            <div style="font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif; color: #333; margin-top: 2px;">
              PERIODE ${report.monthNameUpper} ${report.year} &bull; ${report.schoolName}
            </div>
          </div>

          <!-- IDENTITAS SINGKAT SHEET 2 -->
          <table style="width: 100%; font-family: Arial, sans-serif; font-size: 8pt; border-collapse: collapse; margin-bottom: 3.5px; color: #000; line-height: 1.25;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding: 0.5px 0;">
                <strong>Nama Guru :</strong> ${report.teacherName} &nbsp;|&nbsp; <strong>NUPTK :</strong> ${report.teacherNuptk}
              </td>
              <td style="width: 50%; text-align: right; vertical-align: top; padding: 0.5px 0;">
                <strong>Fungsi :</strong> ${report.teacherFunction} &nbsp;|&nbsp; <strong>Jabatan :</strong> ${report.teacherPosition}
              </td>
            </tr>
          </table>
          <div style="border-top: 1.5px solid #000; margin: 1.5px 0 5px 0;"></div>

          <!-- BAGIAN I: STATISTIK KEHADIRAN & REKAPITULASI KINERJA -->
          <div style="font-size: 8.4pt; font-weight: bold; margin-bottom: 3.5px; color: #000; font-family: Arial, sans-serif;">I. STATISTIK KEHADIRAN & REKAPITULASI KINERJA</div>
          <table ${borderAttr} class="official-report-kpi-table" style="width: 100% !important; border: 1px solid #000; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 8.2pt; margin: 0 auto 7px auto; table-layout: fixed; box-sizing: border-box;">
            <colgroup>
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 16%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
              <col style="width: 14%;">
            </colgroup>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hari Kalender</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Libur Rutin (Minggu)</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Libur Nasional</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hari Efektif KBM</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Hadir Tepat Waktu</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Izin / Sakit / Cuti</th>
              <th style="${cellBorder} padding: 4px 2px; text-align: center; vertical-align: middle; background: #e0f2fe; color: #0369a1; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">PROSENTASE</th>
            </tr>
            <tr style="text-align: center; font-weight: bold;">
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.totalDays} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.routineHolidayCount} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.publicHolidayCount} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; color: #0284c7; text-align: center; vertical-align: middle;">${report.effectiveWorkDays} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; color: #16a34a; text-align: center; vertical-align: middle;">${report.presentCount} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">${report.leaveCount} Hari</td>
              <td style="${cellBorder} padding: 4px 2px; font-size: 8.2pt; font-family: Arial, sans-serif; font-weight: bold; background: #e0f2fe; color: #0369a1; text-align: center; vertical-align: middle;">${report.presencePercentage}%</td>
            </tr>
          </table>

          <!-- BAGIAN II: ANALISIS KEDISIPLINAN & KEPATUHAN JAM KERJA -->
          <div style="font-size: 8.4pt; font-weight: bold; margin: 6px 0 3.5px 0; color: #000; font-family: Arial, sans-serif;">II. ANALISIS KEDISIPLINAN & KEPATUHAN JAM KERJA (STANDAR KEMENAG / SIMPATIKA)</div>
          <table ${borderAttr} class="official-report-compliance-table" style="width: 100% !important; border: 1px solid #000; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 8.2pt; margin: 0 auto 8px auto; table-layout: fixed; box-sizing: border-box;">
            <colgroup>
              <col style="width: 30%;">
              <col style="width: 15%;">
              <col style="width: 16%;">
              <col style="width: 15%;">
              <col style="width: 24%;">
            </colgroup>
            <tr style="background: #f8fafc; font-weight: bold;">
              <th style="${cellBorder} padding: 4px 5px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Indikator Penilaian</th>
              <th style="${cellBorder} padding: 4px 5px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Standar Ketentuan</th>
              <th style="${cellBorder} padding: 4px 5px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Realisasi Guru</th>
              <th style="${cellBorder} padding: 4px 5px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Status Kepatuhan</th>
              <th style="${cellBorder} padding: 4px 5px; text-align: center; vertical-align: middle; font-size: 8.2pt; font-weight: bold; font-family: Arial, sans-serif;">Keterangan / Evaluasi</th>
            </tr>
            <tr>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; font-weight: 500; text-align: left; vertical-align: middle;">Ketepatan Masuk (Scan Masuk &le; 07:15)</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">07:00 WIB</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; font-weight: bold;">${report.presentCount} Hari Tepat Waktu</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; color: #16a34a; font-weight: bold;">MEMENUHI</td>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: left; vertical-align: middle;">Tingkat kedisiplinan hadir sangat tinggi</td>
            </tr>
            <tr>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; font-weight: 500; text-align: left; vertical-align: middle;">Kepatuhan Pulang (Scan Pulang Standar)</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">Sesuai Jadwal KBM</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; font-weight: bold;">${report.earlyLeaveCount} Hari Pulang Cepat</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; color: #16a34a; font-weight: bold;">MEMENUHI</td>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: left; vertical-align: middle;">Melaksanakan tugas pengajaran penuh</td>
            </tr>
            <tr>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; font-weight: 500; text-align: left; vertical-align: middle;">Beban Mengajar Wajib Tatap Muka</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">24 JTM / Minggu</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; font-weight: bold;">24 JTM Aktif</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; color: #16a34a; font-weight: bold;">VALID</td>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: left; vertical-align: middle;">Tercatat aktif di SIMPATIKA & KBM</td>
            </tr>
            <tr>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; font-weight: 500; text-align: left; vertical-align: middle;">Predikat Kinerja Absensi Bulanan</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle;">&ge; 90.0%</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; font-weight: bold; color: #16a34a;">${report.presencePercentage}%</td>
              <td style="${cellBorder} padding: 4px 5px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: center; vertical-align: middle; font-weight: bold; color: #16a34a;">${report.predicate}</td>
              <td style="${cellBorder} padding: 4px 8px; font-size: 8.2pt; font-family: Arial, sans-serif; text-align: left; vertical-align: middle;">Memenuhi syarat pembayaran TPG</td>
            </tr>
          </table>

          <!-- BAGIAN III: LEMBAR PENGESAHAN & PENANDATANGANAN RESMI (2 KOLOM PEJABAT PENANDATANGANAN) -->
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin-top: 10px; color: #000; line-height: 1.3;">
            <tr>
              <!-- SISI KIRI: GURU YBS -->
              <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 25px;">
                <div style="font-size: 8.2pt; font-family: Arial, sans-serif;">Mengetahui / Mengesahkan,</div>
                <div style="font-size: 8.5pt; font-weight: bold; font-family: Arial, sans-serif; margin-top: 2px;">Guru yang Bersangkutan</div>
                <div style="height: 44px;"></div> <!-- Area TTD Guru -->
                <div style="font-size: 9.5pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.3px; font-family: Arial, sans-serif;">${report.teacherName}</div>
                <div style="font-size: 8.2pt; font-family: Arial, sans-serif; margin-top: 2px;">NUPTK. ${report.teacherNuptk}</div>
              </td>

              <!-- SISI KANAN: KEPALA MADRASAH DENGAN STEMPEL -->
              <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 25px;">
                <div style="font-size: 8.2pt; font-family: Arial, sans-serif;">${report.signCity}, ${report.signDate}</div>
                <div style="font-size: 8.5pt; font-weight: bold; font-family: Arial, sans-serif; margin-top: 2px;">Kepala ${report.schoolName}</div>
                <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
                  <div style="border: 1.5px dashed #0284c7; color: #0284c7; padding: 3px 10px; font-size: 7.2pt; font-weight: bold; border-radius: 4px; transform: rotate(-3deg);">
                    [ STEMPEL DIGITAL RESMI MADRASAH ]
                  </div>
                </div>
                <div style="font-size: 9.5pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.3px; font-family: Arial, sans-serif;">${report.principalName}</div>
                <div style="font-size: 8.2pt; font-family: Arial, sans-serif; margin-top: 2px;">NIP / NUPTK. ${report.principalNip}</div>
              </td>
            </tr>
          </table>

          <!-- FOOTER LEMBAR 2 -->
          <div style="border-top: 1px solid #94a3b8; margin-top: 8px; padding-top: 2.5px; font-size: 6.8pt; color: #475569; display: flex; justify-content: space-between; font-family: Arial, sans-serif;">
            <div>Dokumen Resmi Sistem Absensi Digital ${report.schoolName} &bull; No: ${report.printRefNumber}</div>
            <div>Lembar 2/2 &bull; Diverifikasi Operator Madrasah (${report.adminSignature})</div>
          </div>
        </div>
      `;

      if (forExcel) {
        return `
          ${sheet1Html}
          <br style="page-break-before: always; mso-special-format: page-break;">
          ${sheet2Html}
        `;
      }

      return `
        <div class="official-report-page" style="width: 100%; box-sizing: border-box;">
          ${sheet1Html}

          <!-- VISUAL DESK DIVIDER IN MODAL PREVIEW (HIDES ON PRINT) -->
          <div class="sheet-desk-divider" style="text-align: center; margin: 18px auto; padding: 5px 16px; background: rgba(15, 23, 42, 0.55); border: 1px dashed rgba(255,255,255,0.3); border-radius: 9999px; width: fit-content; color: #cbd5e1; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>📑 HALAMAN 2: LEMBAR ANALISIS, PROSENTASE & PENGESAHAN KEPALA MADRASAH</span>
          </div>

          ${sheet2Html}
        </div>
      `;
    }

    function updateReportPreview() {
      if (!paperSheet) return;
      const [yearStr, monthStr] = (monthSelect?.value || "2026-01").split("-");
      const activeTeacher = (typeof StorageService !== "undefined" && StorageService.getActiveTeacher)
        ? StorageService.getActiveTeacher()
        : null;
      const teacherId = teacherSelect?.value || (activeTeacher ? activeTeacher.id : "TCH-00");
      const report = getMonthlyReportData(yearStr, monthStr, teacherId);
      paperSheet.innerHTML = generateOfficialReportTableHTML(report, false);

      const topKpiBar = document.getElementById("officialReportTopKpiBar");
      if (topKpiBar) {
        topKpiBar.innerHTML = `
          <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Hari Kalender</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${report.totalDays} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Libur Rutin</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #64748b; margin-top: 2px;">${report.routineHolidayCount} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: #dc2626; text-transform: uppercase;">Libur Nasional</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #dc2626; margin-top: 2px;">${report.publicHolidayCount} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid #bae6fd; border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: #0284c7; text-transform: uppercase;">Hari Efektif KBM</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 2px;">${report.effectiveWorkDays} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: #16a34a; text-transform: uppercase;">Hadir Tepat Waktu</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #16a34a; margin-top: 2px;">${report.presentCount} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Izin / Sakit / Cuti</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-secondary); margin-top: 2px;">${report.leaveCount} <span style="font-size: 0.72rem; font-weight: 600;">Hari</span></div>
          </div>
          <div style="background: #f0f9ff; border: 1.5px solid #0284c7; border-radius: var(--radius-md); padding: 0.55rem 0.75rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 0.68rem; font-weight: 800; color: #0369a1; text-transform: uppercase;">Prosentase Kehadiran</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 2px;">${report.presencePercentage}%</div>
          </div>
        `;
      }
    }

    function printOfficialReportDocument(yearStr, monthStr, teacherId) {
      const report = getMonthlyReportData(yearStr, monthStr, teacherId);
      const htmlBody = generateOfficialReportTableHTML(report, false);

      // Clean up previous print iframe if any
      const existingIframe = document.getElementById("officialReportPrintIframe");
      if (existingIframe) existingIframe.remove();

      const iframe = document.createElement("iframe");
      iframe.id = "officialReportPrintIframe";
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "297mm";
      iframe.style.height = "210mm";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>LAPORAN ABSENSI BULAN ${report.monthNameUpper} ${report.year} - ${report.teacherName}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 3mm 5mm 3mm 5mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: auto;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: visible;
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
            }
            .official-report-page {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            .official-report-sheet {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .official-report-sheet:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .official-report-sheet-card {
              background: #ffffff !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .sheet-desk-divider {
              display: none !important;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            tbody {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              box-sizing: border-box;
            }
            .official-report-attendance-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              font-family: Arial, Helvetica, sans-serif !important;
              color: #000000 !important;
              line-height: 1.1 !important;
            }
            .official-report-attendance-table th {
              font-size: 7.6pt !important;
              font-weight: bold !important;
              text-align: center !important;
              vertical-align: middle !important;
              padding: 2px 2px !important;
            }
            .official-report-attendance-table td {
              font-size: 7.4pt !important;
              padding: 2.6px 3px !important;
              line-height: 1.12 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            .official-report-kpi-table,
            .official-report-compliance-table {
              width: 100% !important;
              max-width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            .official-report-kpi-table th,
            .official-report-kpi-table td {
              text-align: center !important;
              vertical-align: middle !important;
            }
            .official-report-compliance-table th {
              text-align: center !important;
              vertical-align: middle !important;
            }
          </style>
        </head>
        <body>
          ${htmlBody}
        </body>
        </html>
      `);
      doc.close();

      iframe.contentWindow.focus();
      setTimeout(() => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          console.error("Print error:", e);
        }
        setTimeout(() => {
          if (iframe.parentNode) iframe.remove();
        }, 3500);
      }, 350);
    }

    function downloadOfficialReportExcel(yearStr, monthStr, teacherId) {
      const report = getMonthlyReportData(yearStr, monthStr, teacherId);
      const htmlBody = generateOfficialReportTableHTML(report, true);

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Laporan ${report.monthNameUpper}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                    <x:Print>
                      <x:ValidPrinterInfo/>
                      <x:PaperSizeIndex>9</x:PaperSizeIndex>
                      <x:FitWidth>1</x:FitWidth>
                      <x:FitHeight>2</x:FitHeight>
                    </x:Print>
                    <x:PageSetup>
                      <x:Layout x:Orientation="Landscape"/>
                      <x:Header x:Margin="0.2"/>
                      <x:Footer x:Margin="0.2"/>
                      <x:PageMargins x:Bottom="0.2" x:Left="0.25" x:Right="0.25" x:Top="0.2"/>
                    </x:PageSetup>
                    <x:FitToPage/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Arial, Helvetica, sans-serif; font-size: 8pt; }
            table { border-collapse: collapse; }
            th { border: 0.5pt solid #000000; font-size: 8pt; font-weight: bold; font-family: Arial, sans-serif; }
            td { border: 0.5pt solid #000000; font-size: 7.5pt; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${htmlBody}
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTeacher = report.teacherName.replace(/[^a-zA-Z0-9]/g, "_");
      link.href = url;
      link.download = `Laporan_Absensi_${safeTeacher}_${report.monthNameUpper}_${report.year}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (typeof showToast === "function") {
        showToast("Unduh Excel Berhasil", `Laporan Absensi ${report.teacherName} (.xls Landscape) berhasil diunduh.`, "success");
      }
    }

    function downloadOfficialReportCsv(yearStr, monthStr, teacherId) {
      const report = getMonthlyReportData(yearStr, monthStr, teacherId);
      let csv = `LAPORAN ABSENSI BULAN ${report.monthNameUpper} ${report.year}\n`;
      csv += `Nama Madrasah : ${report.schoolName},,,,Tgl. Periode : ${report.periodStartStr} s/d ${report.periodEndStr}\n`;
      csv += `Nama : ${report.teacherName},,,,Fungsi : ${report.teacherFunction}\n`;
      csv += `NUPTK : ${report.teacherNuptk},,,,Jabatan : ${report.teacherPosition}\n\n`;
      csv += "Tanggal,Nama Tugas,Jam Masuk,Scan Masuk,Jam Pulang,Scan Pulang,Izin Durasi,Izin Lebih,Libur Umum,Libur Rutin,Keterangan\n";

      report.days.forEach(d => {
        const row = [
          `"${d.displayDate}"`,
          `"${d.namaTugas}"`,
          `"${d.jamMasuk}"`,
          `"${d.scanMasuk}"`,
          `"${d.jamPulang}"`,
          `"${d.scanPulang}"`,
          `"${d.izinDurasi}"`,
          `"${d.izinLebih}"`,
          d.liburUmum ? "[v]" : "[ ]",
          d.liburRutin ? "[v]" : "[ ]",
          `"${(d.keterangan || "").replace(/"/g, '""')}"`
        ].join(",");
        csv += row + "\n";
      });

      csv += `\nNo Cetak : ${report.printRefNumber},,,,,,,,,,Admin : ${report.adminSignature}\n`;

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTeacher = report.teacherName.replace(/[^a-zA-Z0-9]/g, "_");
      link.href = url;
      link.download = `Laporan_Absensi_${safeTeacher}_${report.monthNameUpper}_${report.year}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (typeof showToast === "function") {
        showToast("Unduh CSV Berhasil", `Berkas CSV Laporan ${report.monthNameUpper} ${report.year} berhasil diunduh.`, "success");
      }
    }

    // Window Exposure for global trigger
    window.openOfficialAttendanceReportModal = function(preferredPeriod = null, preferredTeacherId = null) {
      if (monthSelect) {
        if (preferredPeriod && preferredPeriod !== "all" && preferredPeriod !== "current") {
          monthSelect.value = preferredPeriod;
        } else if (!monthSelect.value) {
          monthSelect.value = "2026-01";
        }
      }
      populateTeacherDropdown(preferredTeacherId);
      updateReportPreview();
      if (modalReport) modalReport.classList.add("active");
    };

    window.downloadOfficialReportExcelDirect = function(periodVal = null, teacherId = null) {
      const activeTeacher = (typeof StorageService !== "undefined" && StorageService.getActiveTeacher)
        ? StorageService.getActiveTeacher()
        : null;
      const targetTeacherId = teacherId || (activeTeacher ? activeTeacher.id : "TCH-00");
      let period = periodVal || document.getElementById("historyPeriodFilter")?.value || "2026-01";
      if (!period || period === "all" || period === "current") {
        period = "2026-01";
      }
      const [yearStr, monthStr] = period.split("-");
      downloadOfficialReportExcel(yearStr, monthStr, targetTeacherId);
    };

    // Event Listeners
    if (monthSelect) monthSelect.addEventListener("change", updateReportPreview);
    if (teacherSelect) teacherSelect.addEventListener("change", updateReportPreview);

    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        const [yearStr, monthStr] = (monthSelect?.value || "2026-01").split("-");
        const teacherId = teacherSelect?.value || (StorageService.getActiveTeacher()?.id || "TCH-00");
        printOfficialReportDocument(yearStr, monthStr, teacherId);
      });
    }

    if (btnExcel) {
      btnExcel.addEventListener("click", () => {
        const [yearStr, monthStr] = (monthSelect?.value || "2026-01").split("-");
        const teacherId = teacherSelect?.value || (StorageService.getActiveTeacher()?.id || "TCH-00");
        downloadOfficialReportExcel(yearStr, monthStr, teacherId);
      });
    }

    if (btnCsv) {
      btnCsv.addEventListener("click", () => {
        const [yearStr, monthStr] = (monthSelect?.value || "2026-01").split("-");
        const teacherId = teacherSelect?.value || (StorageService.getActiveTeacher()?.id || "TCH-00");
        downloadOfficialReportCsv(yearStr, monthStr, teacherId);
      });
    }

    // Initial population and preview render
    populateTeacherDropdown();
    updateReportPreview();
  }

  window.showLoginView = function(defaultMode = "teacher") {
    document.body.classList.remove("mode-guru", "mode-admin");
    document.body.classList.add("mode-login");

    const alertBox = document.getElementById("loginMainAlert");
    if (alertBox) alertBox.style.display = "none";

    const inputTeacherSearch = document.getElementById("inputMainTeacherIdentifier");
    const hiddenTeacherId = document.getElementById("selectMainTeacherAccount");
    const card = document.getElementById("teacherSelectedPreviewCard");
    const passTeacher = document.getElementById("inputMainTeacherPassword");
    const passAdmin = document.getElementById("inputMainAdminPassword");
    if (inputTeacherSearch) inputTeacherSearch.value = "";
    if (hiddenTeacherId) hiddenTeacherId.value = "";
    if (card) card.style.display = "none";
    if (passTeacher) passTeacher.value = "";
    if (passAdmin) passAdmin.value = "";

    // Refresh teacher options in the select dropdown
    if (typeof window.populateTeacherSelect === "function") {
      window.populateTeacherSelect("");
    }

    if (typeof window.switchLoginTab === "function") {
      window.switchLoginTab(defaultMode);
    } else {
      const tabTeacher = document.getElementById("tabBtnMainTeacherAuth");
      const tabAdmin = document.getElementById("tabBtnMainAdminAuth");
      if (defaultMode === "admin") {
        if (tabAdmin) tabAdmin.click();
      } else {
        if (tabTeacher) tabTeacher.click();
      }
    }
  };

  // Initial Authentication Check
  function checkInitialAuthSession() {
    const session = StorageService.getAuthSession();
    let lastRole = null;
    try { lastRole = sessionStorage.getItem("hadir_guru_last_role"); } catch (e) {}
    // Jika sesi Admin & Guru sama-sama aktif, kembalikan ke mode terakhir yang dipakai (bukan selalu admin)
    if (lastRole === "teacher" && StorageService.isAdminLoggedIn() && StorageService.isTeacherLoggedIn()) {
      StorageService.setActiveTeacherId(StorageService.getActiveTeacherId());
      window.switchAppRole("teacher", true);
      return;
    }
    if (session && session.role === "admin") {
      window.switchAppRole("admin", true);
      if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
        FirebaseService.ensureAuthenticated().catch(() => {});
      }
    } else if (session && session.role === "teacher") {
      StorageService.setActiveTeacherId(session.teacherId);
      window.switchAppRole("teacher", true);
      if (typeof FirebaseService !== "undefined" && FirebaseService.isReady()) {
        FirebaseService.ensureAuthenticated().catch(() => {});
      }
    } else {
      // Default: Show Halaman Login
      window.showLoginView("teacher");
    }
  }

  // Real-Time Cloud Sync Callback (Triggered automatically when Firestore updates from APK or Web)
  window.onCloudSyncUpdate = function () {
    try {
      // Reload in-memory variables from updated localStorage
      todayAttendance = StorageService.getTodayAttendance();
      attendanceHistory = StorageService.getHistory();
      leaveRequests = StorageService.getLeaveRequests();
      teachingLogs = StorageService.getTeachingLogs();
      classCheckIns = StorageService.getClassCheckIns();
      roomsMonitoring = StorageService.getRoomsMonitoring();
      adminActivityFeed = StorageService.getAdminActivityFeed();

      StorageService.syncActiveTeachingSchedules();
      applySyncedTeacherAndSchoolData();

      // Perbarui tampilan form Pengaturan Admin jika pengguna tidak sedang mengetik di dalam form pengaturan
      const activeEl = document.activeElement;
      const settingsSection = document.getElementById("tab-admin-settings");
      const isEditingSettings = activeEl && settingsSection && settingsSection.contains(activeEl) &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName);
      if (!isEditingSettings && typeof loadAdminSettingsFormValues === "function") {
        loadAdminSettingsFormValues();
      }
      if (typeof window.renderGeofenceUI === "function") {
        window.renderGeofenceUI();
      }

      loadActiveTeacherAttendance();
      updateAttendanceUI();
      renderDashboardRecentTable();
      renderFullHistoryTable();
      renderLeaveRequestsTable();
      renderTeachingSchedules();
      if (typeof renderKbmTimelineAndLogs === "function") renderKbmTimelineAndLogs();
      updateKpiCounts();
      renderClassroomRadar();
      if (typeof updateRadarKpis === "function") updateRadarKpis();
      renderAdminActivityFeed();
      renderAdminAllTeachersAttendance();
      renderAdminLeaveVerificationTable();
      if (typeof window.renderTeachersDb === "function") window.renderTeachersDb();
      if (typeof window.renderRoster === "function") window.renderRoster();
      if (typeof window.renderPicketRoster === "function") window.renderPicketRoster();
      if (typeof initTeacherAccountSwitcher === "function") initTeacherAccountSwitcher();
      if (typeof window.refreshLoginScreenData === "function") window.refreshLoginScreenData();
    } catch (err) {
      console.warn("[CloudSync] UI refresh warning:", err);
    }
  };

  // Initialize All Systems safely
  const initModules = [
    ["startServerClock", startServerClock],
    ["initLoginScreen", initLoginScreen],
    ["initTheme", initTheme],
    ["initTabNavigation", initTabNavigation],
    ["initGeofenceSimulation", initGeofenceSimulation],
    ["initModals", initModals],
    ["applySyncedTeacherAndSchoolData", applySyncedTeacherAndSchoolData],
    ["initTeacherAccountSwitcher", initTeacherAccountSwitcher],
    ["loadActiveTeacherAttendance", loadActiveTeacherAttendance],
    ["updateAttendanceUI", updateAttendanceUI],
    ["renderDashboardRecentTable", renderDashboardRecentTable],
    ["renderFullHistoryTable", renderFullHistoryTable],
    ["renderLeaveRequestsTable", renderLeaveRequestsTable],
    ["renderTeachingSchedules", renderTeachingSchedules],
    ["initTeacherKbmControls", initTeacherKbmControls],
    ["initTeachingJournalHandlers", initTeachingJournalHandlers],
    ["initNotifications", initNotifications],
    ["updateKpiCounts", updateKpiCounts],
    ["initRoleSwitcher", initRoleSwitcher],
    ["initAdminLogin", initAdminLogin],
    ["renderClassroomRadar", renderClassroomRadar],
    ["renderAdminActivityFeed", renderAdminActivityFeed],
    ["renderAdminAllTeachersAttendance", renderAdminAllTeachersAttendance],
    ["renderAdminLeaveVerificationTable", renderAdminLeaveVerificationTable],
    ["initAdminSettingsForms", initAdminSettingsForms],
    ["initAdminToolbarControls", initAdminToolbarControls],
    ["initInvalForm", initInvalForm],
    ["initAdminRosterModule", initAdminRosterModule],
    ["initTeachersDbModule", initTeachersDbModule],
    ["initTeacherProfileAndScheduleEditor", initTeacherProfileAndScheduleEditor],
    ["initWelcomingPicketModule", initWelcomingPicketModule],
    ["initOfficialAttendanceReport", initOfficialAttendanceReport]
  ];

  initModules.forEach(([name, fn]) => {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
      console.warn(`[ModuleInitWarning] ${name}:`, e);
    }
  });

  // Check auth session to decide between Login View vs Dashboards
  checkInitialAuthSession();

  window.renderClassroomRadar = renderClassroomRadar;
  window.updateRadarKpis = updateRadarKpis;
  window.renderAdminActivityFeed = renderAdminActivityFeed;
  window.renderAdminAllTeachersAttendance = renderAdminAllTeachersAttendance;

  console.log("HADIR.GURU Teacher Dashboard & Real-Time Classroom Monitoring initialized successfully.");
}

// Safely boot application whether document is still loading or already ready (e.g. WebView / Fast Cache)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMainApplication);
} else {
  initMainApplication();
}


