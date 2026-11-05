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
    return this._apiAvailable;
  },

  /**
   * 1. Catat Presensi Harian Guru ke MySQL
   * @param {Object} attendanceRecord
   */
  async recordAttendance(attendanceRecord) {
    try {
      const res = await fetch(`${this.baseUrl}/attendance.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceRecord)
      });
      const data = await res.json();
      return data;
    } catch (error) {
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
    try {
      const res = await fetch(`${this.baseUrl}/teaching-logs.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData)
      });
      return await res.json();
    } catch (error) {
      console.warn("[ApiService] Gagal menyimpan jurnal KBM ke MySQL:", error);
      return { success: false, error };
    }
  },

  /**
   * 7. Kirim Pengajuan Izin Guru ke MySQL
   */
  async submitLeaveRequest(leaveRecord) {
    try {
      const res = await fetch(`${this.baseUrl}/leaves.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveRecord)
      });
      return await res.json();
    } catch (error) {
      console.warn("[ApiService] Gagal mengirim pengajuan izin ke MySQL:", error);
      return { success: false, error };
    }
  },

  /**
   * 8. Reset Semua Password Guru ke 123456 via MySQL
   */
  async resetAllTeacherPasswords() {
    try {
      const res = await fetch(`${this.baseUrl}/teachers.php?action=reset_all_passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Inisialisasi Otomatis Saat Web Dimuat
   */
  async init() {
    const isUp = await this.checkHealth();
    if (isUp) {
      console.log("[ApiService] Berhasil terhubung ke Backend MySQL Hosting (" + this.baseUrl + ")");
    }
    return isUp;
  }
};

// Auto-run pengecekan health saat skrip dimuat di browser
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    ApiService.init().catch(() => {});
  });
}
