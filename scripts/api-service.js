/**
 * HADIR.GURU - API Service Adapter (MySQL Backend REST API)
 * Menghubungkan antarmuka frontend ke backend MySQL PHP di Web Hosting
 */

const ApiService = {
  // Base URL relatif terhadap direktori aplikasi di hosting (misal: /api atau ./api)
  baseUrl: (function() {
    if (typeof window !== "undefined" && window.location) {
      // Jika di-hosting di subfolder atau root domain
      const path = window.location.pathname;
      const dir = path.substring(0, path.lastIndexOf('/'));
      return dir ? `${dir}/api` : './api';
    }
    return './api';
  })(),

  _isOnline: true,
  _apiAvailable: false,
  _isApplyingServer: false,
  _syncInterval: null,
  _isPulling: false,
  _pendingWrites: 0,
  _lastWriteTimeMs: 0,

  isApplyingServer() {
    return this._isApplyingServer;
  },

  _beginWrite() {
    this._pendingWrites = Math.max(0, this._pendingWrites) + 1;
    this._lastWriteTimeMs = Date.now();
  },

  _endWrite(ok = false) {
    this._pendingWrites = Math.max(0, this._pendingWrites - 1);
    this._lastWriteTimeMs = Date.now();
    if (ok) this._apiAvailable = true;
  },

  /**
   * Cek konektivitas ke Backend REST API MySQL
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/settings.php`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      });
      if (res.ok) {
        const json = await res.json();
        this._apiAvailable = json && json.success === true;
        return this._apiAvailable;
      }
    } catch (e) {
      this._apiAvailable = false;
    }
    return false;
  },

  isReady() {
    if (typeof window !== "undefined" && window.location && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
      return true;
    }
    return this._apiAvailable;
  },

  /**
   * 1. Catat Presensi Harian Guru ke MySQL
   * @param {Object} attendanceRecord
   */
  async recordAttendance(attendanceRecord) {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/attendance.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceRecord)
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      console.warn("[ApiService] Gagal mencatat presensi ke MySQL:", error);
      return { success: false, error };
    }
  },

  /**
   * 2. Ambil Riwayat Presensi Guru dari MySQL
   * @param {string} teacherId NIP atau ID Guru
   */
  async getTeacherHistory(teacherId) {
    try {
      const res = await fetch(`${this.baseUrl}/attendance.php?teacher_id=${encodeURIComponent(teacherId)}`, {
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.success) {
        return data.data;
      }
    } catch (error) {
      console.warn("[ApiService] Gagal mengambil riwayat dari MySQL:", error);
    }
    return null;
  },

  /**
   * 3. Ambil Rekap Presensi Semua Guru Hari Ini (Untuk Admin)
   */
  async getTodayAllAttendance(dateStr = "") {
    try {
      const url = `${this.baseUrl}/attendance.php?mode=today_all${dateStr ? `&date=${encodeURIComponent(dateStr)}` : ''}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data && data.success) {
        return data.data;
      }
    } catch (error) {
      console.warn("[ApiService] Gagal mengambil rekap guru dari MySQL:", error);
    }
    return null;
  },

  /**
   * 4. Login Akun Guru via MySQL
   */
  async loginTeacher(identifier, password = "") {
    try {
      const res = await fetch(`${this.baseUrl}/auth.php?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: "Koneksi ke server gagal: " + error.message };
    }
  },

  /**
   * 5. Login Administrator via MySQL
   */
  async loginAdmin(username, password) {
    try {
      const res = await fetch(`${this.baseUrl}/auth.php?action=admin_login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: "Koneksi ke server gagal: " + error.message };
    }
  },

  /**
   * 6. Simpan Jurnal KBM Kelas ke MySQL
   */
  async recordTeachingSession(sessionData) {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/teaching-logs.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData)
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      console.warn("[ApiService] Gagal menyimpan jurnal KBM ke MySQL:", error);
      return { success: false, error };
    }
  },

  /**
   * 7. Kirim Pengajuan Izin Guru ke MySQL
   */
  async submitLeaveRequest(leaveRecord) {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/leaves.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveRecord)
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      console.warn("[ApiService] Gagal mengirim pengajuan izin ke MySQL:", error);
      return { success: false, error };
    }
  },

  /**
   * 8. Reset Semua Password Guru ke 123456 via MySQL
   */
  async resetAllTeacherPasswords() {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/teachers.php?action=reset_all_passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      return { success: false, message: error.message };
    }
  },

  /**
   * 9. Simpan / Update Data Guru atau Profil Guru ke MySQL
   */
  async saveTeacher(teacherData) {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/teachers.php?action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData || {})
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      return { success: false, message: error.message };
    }
  },

  /**
   * 10. Simpan Jadwal Piket Sambut 5S / Pengaturan Sistem ke MySQL
   */
  async savePicketRoster(rosterData) {
    return this.saveSetting("welcoming_picket_roster", rosterData);
  },

  /**
   * 11. Simpan Pengaturan / State Sistem ke MySQL (app_settings)
   */
  async saveSetting(key, value) {
    this._beginWrite();
    try {
      const payload = {};
      payload[key] = value;
      const res = await fetch(`${this.baseUrl}/settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      return { success: false, message: error.message };
    }
  },

  /**
   * 12. Hapus Batch Riwayat Presensi dari MySQL (Admin)
   */
  async purgeAttendanceHistory(options = { mode: "all" }) {
    this._beginWrite();
    try {
      const res = await fetch(`${this.baseUrl}/attendance.php?action=purge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || { mode: "all" })
      });
      const data = await res.json();
      this._endWrite(Boolean(data && data.success));
      return data;
    } catch (error) {
      this._endWrite(false);
      return { success: false, count: 0, message: error.message };
    }
  },

  /**
   * 13. Tarik Seluruh Data Terbaru dari Server MySQL (Sinkronisasi Lintas Browser & Perangkat)
   */
  async pullAllFromServer() {
    if (this._isPulling) return false;
    // Jangan timpa state lokal jika baru saja ada aksi klik/simpan tombol (proteksi race condition)
    if (this._pendingWrites > 0 || (Date.now() - this._lastWriteTimeMs < 4000)) {
      return false;
    }
    this._isPulling = true;
    try {
      const now = new Date();
      const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const res = await fetch(`${this.baseUrl}/settings.php?sync=1&date=${encodeURIComponent(todayDateStr)}&_t=${Date.now()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      });
      if (!res.ok) {
        this._isPulling = false;
        return false;
      }
      const json = await res.json();
      if (!json || !json.success || !json.data) {
        this._isPulling = false;
        return false;
      }
      // Cek ulang apakah ada aksi simpan saat request GET sedang berjalan di jaringan
      if (this._pendingWrites > 0 || (Date.now() - this._lastWriteTimeMs < 4000)) {
        this._isPulling = false;
        return false;
      }

      this._apiAvailable = true;
      const settings = json.data;
      const bundle = settings._live_bundle || {};
      let hasChanges = false;

      this._isApplyingServer = true;
      try {
        // 1. Sinkronisasi School Config
        if (settings.school_config && typeof settings.school_config === "object") {
          const curRaw = localStorage.getItem("hadir_guru_school_config");
          const nextRaw = JSON.stringify(settings.school_config);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_school_config", nextRaw);
            hasChanges = true;
          }
        }

        // 2. Sinkronisasi Jadwal Piket Sambut 5S (Auto-seed ke MySQL jika tabel masih baru/kosong)
        if (Array.isArray(settings.welcoming_picket_roster) && settings.welcoming_picket_roster.length > 0) {
          const curRaw = localStorage.getItem("hadir_guru_welcoming_picket_v2");
          const nextRaw = JSON.stringify(settings.welcoming_picket_roster);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_welcoming_picket_v2", nextRaw);
            hasChanges = true;
          }
        } else if (typeof StorageService !== "undefined" && typeof StorageService.getWelcomingPicketRoster === "function" && !this._hasSeededPicket) {
          this._hasSeededPicket = true;
          const initialPicket = StorageService.getWelcomingPicketRoster();
          if (Array.isArray(initialPicket) && initialPicket.length > 0) {
            this.saveSetting("welcoming_picket_roster", initialPicket).catch(() => {});
          }
        }

        // 3. Sinkronisasi Master Jadwal Mengajar (Auto-seed 649 sesi ke MySQL jika masih baru/kosong)
        if (Array.isArray(settings.master_schedules) && settings.master_schedules.length > 0) {
          const curRaw = localStorage.getItem("hadir_guru_master_schedules");
          const nextRaw = JSON.stringify(settings.master_schedules);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_master_schedules", nextRaw);
            hasChanges = true;
          }
        } else if (typeof StorageService !== "undefined" && typeof StorageService.getMasterSchedules === "function" && !this._hasSeededSchedules) {
          this._hasSeededSchedules = true;
          const initialSchedules = StorageService.getMasterSchedules();
          if (Array.isArray(initialSchedules) && initialSchedules.length > 0) {
            this.saveSetting("master_schedules", initialSchedules).catch(() => {});
          }
        }

        // 4. Sinkronisasi Hari Libur / Kaldik (Auto-seed Kaldik Jateng ke MySQL jika masih baru/kosong)
        if (Array.isArray(settings.holidays) && settings.holidays.length > 0) {
          const curRaw = localStorage.getItem("hadir_guru_holidays");
          const nextRaw = JSON.stringify(settings.holidays);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_holidays", nextRaw);
            hasChanges = true;
          }
        } else if (typeof StorageService !== "undefined" && typeof StorageService.getHolidays === "function" && !this._hasSeededHolidays) {
          this._hasSeededHolidays = true;
          const initialHolidays = StorageService.getHolidays();
          if (Array.isArray(initialHolidays) && initialHolidays.length > 0) {
            this.saveSetting("holidays", initialHolidays).catch(() => {});
          }
        }

        // 5. Sinkronisasi Database Guru & Override Profil
        const baseTeachers = Array.isArray(settings.teachers_master) && settings.teachers_master.length > 0
          ? settings.teachers_master
          : (typeof StorageService !== "undefined" ? StorageService.getTeachersMaster() : []);
        if (Array.isArray(baseTeachers) && baseTeachers.length > 0) {
          const dbTeachers = Array.isArray(bundle.teachers) ? bundle.teachers : [];
          const ovRaw = localStorage.getItem("hadir_guru_cloud_profile_overrides");
          const cloudOverrides = ovRaw ? (JSON.parse(ovRaw) || {}) : {};

          const mergedTeachers = baseTeachers.map(t => {
            const cleanNip = String(t.nip || "").trim();
            const dbRow = dbTeachers.find(r =>
              (cleanNip && cleanNip !== "-" && String(r.nip || "").trim() === cleanNip) ||
              r.id === t.id ||
              r.nip === t.id
            );
            if (!dbRow) return t;
            const merged = {
              ...t,
              name: dbRow.name || t.name,
              nip: (dbRow.nip && dbRow.nip !== "-") ? dbRow.nip : t.nip,
              nuptk: dbRow.nuptk || t.nuptk || "-",
              subject: dbRow.subject || t.subject,
              dept: dbRow.dept || t.dept,
              classAssigned: dbRow.class_assigned || t.classAssigned,
              email: dbRow.email !== undefined && dbRow.email !== null ? dbRow.email : t.email,
              phone: dbRow.phone !== undefined && dbRow.phone !== null ? dbRow.phone : t.phone,
              pin: dbRow.pin || t.pin || "123456",
              password: dbRow.password || dbRow.pin || t.password || "123456",
              avatarUrl: dbRow.avatar_url || t.avatarUrl || ""
            };
            const canonicalId = (merged.nip && merged.nip !== "-") ? merged.nip : merged.id;
            if (canonicalId) cloudOverrides[canonicalId] = merged;
            if (merged.id) cloudOverrides[merged.id] = merged;
            return merged;
          });

          const curTeachersRaw = localStorage.getItem("hadir_guru_teachers_60");
          const nextTeachersRaw = JSON.stringify(mergedTeachers);
          if (curTeachersRaw !== nextTeachersRaw) {
            localStorage.setItem("hadir_guru_teachers_60", nextTeachersRaw);
            localStorage.setItem("hadir_guru_cloud_profile_overrides", JSON.stringify(cloudOverrides));
            hasChanges = true;
          }
        }

        // 6. Sinkronisasi Presensi Harian Semua Guru (Mode Admin & Mode Guru Lintas Browser)
        if (typeof StorageService !== "undefined") {
          let allTeachersAtt = Array.isArray(settings.all_teachers_attendance) && settings.all_teachers_attendance.length > 0
            ? settings.all_teachers_attendance
            : StorageService.getAllTeachersAttendance();

          // Pastikan tanggal sesuai hari ini
          if (Array.isArray(allTeachersAtt) && allTeachersAtt.length > 0 && allTeachersAtt[0].date && allTeachersAtt[0].date !== todayDateStr) {
            localStorage.removeItem("hadir_guru_all_teachers");
            allTeachersAtt = StorageService.getAllTeachersAttendance();
          }

          const todayRows = Array.isArray(bundle.today_attendance) ? bundle.today_attendance : [];
          if (todayRows.length > 0 && Array.isArray(allTeachersAtt)) {
            const activeTeacher = StorageService.getActiveTeacher();
            const activeNip = activeTeacher ? String(activeTeacher.nip || "").trim() : "";
            const activeId = activeTeacher ? String(activeTeacher.id || "").trim() : "";

            todayRows.forEach(row => {
              const rowNip = String(row.nip || "").trim();
              const rowTid = String(row.teacher_id || "").trim();
              const idx = allTeachersAtt.findIndex(item =>
                (rowNip && String(item.nip || "").trim() === rowNip) ||
                (rowTid && (item.id === rowTid || item.teacherId === rowTid || item.nip === rowTid)) ||
                (rowNip && (item.id === rowNip || item.teacherId === rowNip))
              );
              const isLateBool = Boolean(Number(row.is_late));
              const statusStr = row.status || "Hadir";
              const detailStr = row.status_detail || (isLateBool ? "Terlambat" : "Hadir Tepat Waktu");
              const checkInStr = row.check_in_time || "-";
              const checkOutStr = row.check_out_time || "-";

              if (idx !== -1) {
                allTeachersAtt[idx] = {
                  ...allTeachersAtt[idx],
                  status: statusStr,
                  statusDetail: detailStr,
                  checkIn: checkInStr !== "-" ? checkInStr : (allTeachersAtt[idx].checkIn || "-"),
                  checkOut: checkOutStr !== "-" ? checkOutStr : (allTeachersAtt[idx].checkOut || "-"),
                  isLate: isLateBool,
                  date: row.date || todayDateStr
                };
              }

              // Jika guru yang sedang aktif di browser ini sudah absen di browser lain, sinkronkan hadir_guru_today
              if (activeTeacher && ((rowNip && rowNip === activeNip) || (rowTid && (rowTid === activeId || rowTid === activeNip)))) {
                const curToday = StorageService.getTodayAttendance() || {};
                const syncedToday = {
                  ...curToday,
                  date: row.date || todayDateStr,
                  day: row.day || curToday.day || "",
                  status: statusStr,
                  statusDetail: detailStr,
                  checkIn: {
                    ...(curToday.checkIn || {}),
                    time: checkInStr !== "-" ? checkInStr : (curToday.checkIn?.time || "-"),
                    lat: row.check_in_lat ? Number(row.check_in_lat) : (curToday.checkIn?.lat || null),
                    lng: row.check_in_lng ? Number(row.check_in_lng) : (curToday.checkIn?.lng || null),
                    distance: row.check_in_distance || (curToday.checkIn?.distance || "15 Meter"),
                    device: row.check_in_device || (curToday.checkIn?.device || "Perangkat Guru"),
                    verified: true,
                    isLate: isLateBool
                  },
                  checkOut: {
                    ...(curToday.checkOut || {}),
                    time: checkOutStr !== "-" ? checkOutStr : (curToday.checkOut?.time || "-"),
                    lat: row.check_out_lat ? Number(row.check_out_lat) : (curToday.checkOut?.lat || null),
                    lng: row.check_out_lng ? Number(row.check_out_lng) : (curToday.checkOut?.lng || null),
                    distance: row.check_out_distance || (curToday.checkOut?.distance || "-"),
                    verified: checkOutStr !== "-"
                  }
                };
                const curTodayRaw = localStorage.getItem("hadir_guru_today");
                const nextTodayRaw = JSON.stringify(syncedToday);
                if (curTodayRaw !== nextTodayRaw) {
                  localStorage.setItem("hadir_guru_today", nextTodayRaw);
                  hasChanges = true;
                }
              }
            });
          }

          const curAllRaw = localStorage.getItem("hadir_guru_all_teachers");
          const nextAllRaw = JSON.stringify(allTeachersAtt);
          if (curAllRaw !== nextAllRaw) {
            localStorage.setItem("hadir_guru_all_teachers", nextAllRaw);
            hasChanges = true;
          }
        }

        // 7. Sinkronisasi Riwayat Presensi Lengkap (hadir_guru_history)
        const settingHist = Array.isArray(settings.attendance_history) ? settings.attendance_history : [];
        const dbHistRows = Array.isArray(bundle.history_attendance) ? bundle.history_attendance : [];
        if (settingHist.length > 0 || dbHistRows.length > 0) {
          const histMap = new Map();
          settingHist.forEach(item => {
            if (!item) return;
            const k = `${item.nip || item.teacherId || item.id}_${item.date}`;
            histMap.set(k, item);
          });
          dbHistRows.forEach(row => {
            if (!row) return;
            const isLateBool = Boolean(Number(row.is_late));
            const k = `${row.nip || row.teacher_id}_${row.date}`;
            const prev = histMap.get(k) || {};
            histMap.set(k, {
              ...prev,
              id: row.id || prev.id || k,
              teacherId: row.nip || row.teacher_id || prev.teacherId,
              nip: row.nip || row.teacher_id || prev.nip,
              teacherName: row.teacher_name || prev.teacherName || "",
              date: row.date,
              day: row.day || prev.day || "",
              checkIn: row.check_in_time || prev.checkIn || "-",
              checkOut: row.check_out_time || prev.checkOut || "-",
              distance: row.check_in_distance || prev.distance || "18 Meter",
              status: row.status || prev.status || "Hadir",
              statusDetail: row.status_detail || prev.statusDetail || (isLateBool ? "Terlambat" : "Hadir Tepat Waktu"),
              isLate: isLateBool,
              verified: true
            });
          });
          const mergedHist = Array.from(histMap.values());
          const curHistRaw = localStorage.getItem("hadir_guru_history");
          const nextHistRaw = JSON.stringify(mergedHist);
          if (curHistRaw !== nextHistRaw) {
            localStorage.setItem("hadir_guru_history", nextHistRaw);
            hasChanges = true;
          }
        }

        // 8. Sinkronisasi Pengajuan Izin, Jurnal KBM, Radar Kelas & Aktivitas Admin
        if (Array.isArray(settings.leaves)) {
          const curRaw = localStorage.getItem("hadir_guru_leaves");
          const nextRaw = JSON.stringify(settings.leaves);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_leaves", nextRaw);
            hasChanges = true;
          }
        }
        if (Array.isArray(settings.teaching_logs) || (Array.isArray(bundle.teaching_logs) && bundle.teaching_logs.length > 0)) {
          const settingLogs = Array.isArray(settings.teaching_logs) ? settings.teaching_logs : [];
          const dbLogs = Array.isArray(bundle.teaching_logs) ? bundle.teaching_logs : [];
          const logsMap = new Map();
          settingLogs.forEach(l => {
            if (l && l.id) logsMap.set(l.id, l);
          });
          dbLogs.forEach(row => {
            if (!row || !row.id) return;
            let parsedAtt = {};
            if (row.student_attendance) {
              try {
                parsedAtt = typeof row.student_attendance === "string" ? (JSON.parse(row.student_attendance) || {}) : row.student_attendance;
              } catch (e) {}
            }
            const prev = logsMap.get(row.id) || {};
            logsMap.set(row.id, {
              ...prev,
              id: row.id,
              scheduleId: row.schedule_id || prev.scheduleId || "",
              teacherId: row.teacher_id || prev.teacherId || "",
              teacherName: row.teacher_name || prev.teacherName || "",
              date: row.date || prev.date || todayDateStr,
              day: parsedAtt.day || prev.day || "",
              subject: row.subject || prev.subject || "",
              class: row.class_name || prev.class || "",
              time: row.period_range || prev.time || "",
              room: parsedAtt.room || prev.room || `R. Kelas ${row.class_name || ""}`,
              jtm: parsedAtt.jtm || prev.jtm || 2,
              topic: row.topic_material || prev.topic || "Tatap Muka Pembelajaran Terjadwal",
              method: row.teaching_media || prev.method || "Tatap Muka Interaktif",
              teacherStatus: parsedAtt.teacherStatus || row.status || prev.teacherStatus || "Hadir Tepat Waktu",
              checkInTime: row.check_in_time || prev.checkInTime || "-",
              checkOutTime: row.check_out_time || prev.checkOutTime || "-",
              durationMinutes: parsedAtt.durationMinutes || prev.durationMinutes || 90,
              studentsTotal: parsedAtt.total || prev.studentsTotal || 32,
              studentsPresent: parsedAtt.present || prev.studentsPresent || 32,
              studentsSick: parsedAtt.sick !== undefined ? parsedAtt.sick : (prev.studentsSick || 0),
              studentsPermit: parsedAtt.permit !== undefined ? parsedAtt.permit : (prev.studentsPermit || 0),
              studentsAlpha: parsedAtt.alpha !== undefined ? parsedAtt.alpha : (prev.studentsAlpha || 0),
              notes: parsedAtt.notes || prev.notes || ""
            });
          });
          const mergedLogs = Array.from(logsMap.values());
          const curRaw = localStorage.getItem("hadir_guru_teaching_logs");
          const nextRaw = JSON.stringify(mergedLogs);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_teaching_logs", nextRaw);
            hasChanges = true;
          }
        }
        if (settings.class_checkins && typeof settings.class_checkins === "object") {
          const curRaw = localStorage.getItem("hadir_guru_class_checkins");
          const nextRaw = JSON.stringify(settings.class_checkins);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_class_checkins", nextRaw);
            hasChanges = true;
          }
        }
        if (settings.rooms_state && typeof settings.rooms_state === "object") {
          const curRaw = localStorage.getItem("hadir_guru_rooms_monitoring_state");
          const nextRaw = JSON.stringify(settings.rooms_state);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_rooms_monitoring_state", nextRaw);
            hasChanges = true;
          }
        }
        if (Array.isArray(settings.admin_feed)) {
          const curRaw = localStorage.getItem("hadir_guru_admin_feed");
          const nextRaw = JSON.stringify(settings.admin_feed);
          if (curRaw !== nextRaw) {
            localStorage.setItem("hadir_guru_admin_feed", nextRaw);
            hasChanges = true;
          }
        }
      } finally {
        this._isApplyingServer = false;
      }

      if (hasChanges && typeof window.onCloudSyncUpdate === "function") {
        window.onCloudSyncUpdate();
      }
      this._isPulling = false;
      return true;
    } catch (e) {
      this._isApplyingServer = false;
      this._isPulling = false;
      return false;
    }
  },

  /**
   * Inisialisasi Otomatis & Polling Sinkronisasi Lintas Browser/Perangkat
   */
  async init() {
    const isUp = await this.checkHealth();
    if (isUp) {
      console.log("[ApiService] Berhasil terhubung ke Backend MySQL Hosting (" + this.baseUrl + ")");
      await this.pullAllFromServer();
    }

    // Sinkronisasi berkala setiap 5 detik agar absen dari browser/HP lain langsung terdeteksi di Admin
    if (!this._syncInterval && this.isReady()) {
      this._syncInterval = setInterval(() => {
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          this.pullAllFromServer().catch(() => {});
        }
      }, 5000);
    }

    if (typeof window !== "undefined" && this.isReady()) {
      window.addEventListener("focus", () => {
        this.pullAllFromServer().catch(() => {});
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.pullAllFromServer().catch(() => {});
        }
      });
    }
    return isUp;
  }
};

if (typeof window !== "undefined") {
  window.ApiService = ApiService;
  window.addEventListener("DOMContentLoaded", () => {
    ApiService.init().catch(() => {});
  });
}

