/**
 * HADIR.GURU MTs — Firebase Cloud Database Service
 * 
 * Mengelola autentikasi berbasis NIP + Password, sinkronisasi presensi tertutup,
 * pengajuan izin, dan penyimpanan offline-first dengan Cloud Firestore.
 */

const FirebaseService = {
  app: null,
  auth: null,
  db: null,
  storage: null,
  isInitialized: false,
  currentUserProfile: null,

  /**
   * Pemetaan NIP ke Email Internal Firebase Auth
   */
  nipToEmail(nip) {
    const cleanNip = String(nip).trim().replace(/[^0-9a-zA-Z]/g, "");
    return `nip_${cleanNip}@hadirguru.internal`;
  },

  /**
   * Inisialisasi Firebase App & Firestore dengan Cache Offline
   */
  async init() {
    if (this.isInitialized) return true;

    if (typeof firebase === "undefined") {
      console.info("[FirebaseService] SDK Firebase tidak dimuat (menggunakan mode LocalStorage).");
      return false;
    }

    if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
      console.info("[FirebaseService] Kredensial Firebase belum diisi (menggunakan mode LocalStorage).");
      return false;
    }

    try {
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(window.FIREBASE_CONFIG);
      } else {
        this.app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Aktifkan IndexedDB Offline Persistence (Sangat penting untuk APK Android & Area Minim Sinyal)
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        console.log("[FirebaseService] Offline persistence diaktifkan.");
      } catch (err) {
        if (err.code === "failed-precondition") {
          console.warn("[FirebaseService] Multiple tabs opened, persistence can only be enabled in one tab at a time.");
        } else if (err.code === "unimplemented") {
          console.warn("[FirebaseService] Browser tidak mendukung IndexedDB persistence.");
        }
      }

      if (firebase.storage) {
        this.storage = firebase.storage();
      }

      // Listener perubahan status login
      this.auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDoc = await this.db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
              this.currentUserProfile = userDoc.data();
            }
          } catch (e) {
            console.warn("[FirebaseService] Gagal memuat profil pengguna:", e);
          }
        } else {
          this.currentUserProfile = null;
        }
        this.updateConnectionBadge(!!user);
      });

      this.isInitialized = true;
      console.log("[FirebaseService] Berhasil terhubung ke Firebase Cloud Firestore.");
      return true;
    } catch (error) {
      console.error("[FirebaseService] Gagal inisialisasi Firebase:", error);
      return false;
    }
  },

  /**
   * Cek apakah Firebase siap digunakan
   */
  isReady() {
    return this.isInitialized && !!this.auth && !!this.db;
  },

  /**
   * Login menggunakan NIP + Password
   */
  async loginWithNip(nip, password, role = "teacher", extraData = {}) {
    if (!this.isReady()) {
      return { success: false, fallback: true, message: "Firebase belum aktif, menggunakan autentikasi lokal." };
    }

    const email = this.nipToEmail(nip);

    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Ambil metadata profil dari koleksi users
      let profileDoc = await this.db.collection("users").doc(user.uid).get();
      if (!profileDoc.exists) {
        // Jika dokumen profil belum ada (misal akun baru pertama kali dibuat), inisialisasi dokumen
        const initialDoc = {
          uid: user.uid,
          nip: String(nip),
          teacherId: extraData.id || (role === "admin" ? "admin" : ""),
          name: extraData.name || (role === "admin" ? "Administrator" : ""),
          email: email,
          role: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await this.db.collection("users").doc(user.uid).set(initialDoc, { merge: true });
        profileDoc = await this.db.collection("users").doc(user.uid).get();
      }

      this.currentUserProfile = profileDoc.data();
      return { success: true, user: user, profile: this.currentUserProfile };
    } catch (error) {
      // Jika akun belum terdaftar, coba registrasikan otomatis untuk kemudahan bootstrap awal
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        try {
          const newCredential = await this.auth.createUserWithEmailAndPassword(email, password);
          const newUser = newCredential.user;
          const userDocData = {
            uid: newUser.uid,
            nip: String(nip),
            teacherId: extraData.id || (role === "admin" ? "admin" : ""),
            name: extraData.name || (role === "admin" ? "Administrator" : ""),
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          await this.db.collection("users").doc(newUser.uid).set(userDocData);
          this.currentUserProfile = userDocData;
          return { success: true, user: newUser, profile: userDocData, isNew: true };
        } catch (regError) {
          return { success: false, code: regError.code, message: regError.message };
        }
      }

      return { success: false, code: error.code, message: error.message };
    }
  },

  /**
   * Logout dari Firebase
   */
  async logout() {
    if (this.auth) {
      await this.auth.signOut();
      this.currentUserProfile = null;
    }
  },

  /**
   * Catat Presensi Harian Guru ke Firestore
   */
  async recordAttendance(attendanceRecord) {
    if (!this.isReady() || !this.auth.currentUser) {
      return { success: false, fallback: true };
    }

    try {
      const dateStr = attendanceRecord.date || new Date().toISOString().split("T")[0];
      const docId = `${attendanceRecord.teacherId}_${dateStr}`;

      const payload = {
        ...attendanceRecord,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection("attendance").doc(docId).set(payload, { merge: true });
      return { success: true, docId: docId };
    } catch (error) {
      console.error("[FirebaseService] Gagal menyimpan presensi ke Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Ambil Riwayat Presensi Guru dari Firestore
   */
  async getTeacherHistory(teacherId, limit = 31) {
    if (!this.isReady()) return null;

    try {
      const snapshot = await this.db.collection("attendance")
        .where("teacherId", "==", teacherId)
        .orderBy("date", "desc")
        .limit(limit)
        .get();

      const results = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      return results;
    } catch (error) {
      console.warn("[FirebaseService] Gagal mengambil riwayat dari Firestore:", error);
      return null;
    }
  },

  /**
   * Kirim Pengajuan Izin / Sakit ke Firestore
   */
  async submitLeaveRequest(leaveRecord) {
    if (!this.isReady()) return { success: false, fallback: true };

    try {
      const docRef = await this.db.collection("leaves").add({
        ...leaveRecord,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("[FirebaseService] Gagal mengirim izin ke Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Admin: Mengubah Status Verifikasi Izin (Approved / Rejected)
   */
  async updateLeaveStatus(leaveId, status, notes = "") {
    if (!this.isReady()) return { success: false, fallback: true };

    try {
      await this.db.collection("leaves").doc(leaveId).update({
        status: status,
        verificationNotes: notes,
        verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        verifiedBy: this.currentUserProfile?.nip || "ADMIN"
      });
      return { success: true };
    } catch (error) {
      console.error("[FirebaseService] Gagal verifikasi izin:", error);
      return { success: false, error };
    }
  },

  /**
   * Admin: Real-Time Listener Presensi Hari Ini
   */
  subscribeTodayAttendance(todayDateStr, onUpdate) {
    if (!this.isReady()) return () => {};

    try {
      return this.db.collection("attendance")
        .where("date", "==", todayDateStr)
        .onSnapshot((snapshot) => {
          const records = [];
          snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
          if (typeof onUpdate === "function") {
            onUpdate(records);
          }
        }, (error) => {
          console.warn("[FirebaseService] Subscription error:", error);
        });
    } catch (e) {
      console.warn("[FirebaseService] Gagal subscribe presensi:", e);
      return () => {};
    }
  },

  /**
   * Admin: Hapus Batch Riwayat Presensi dari Firestore (Kapasitas Tertutup)
   */
  async purgeAttendanceHistory(options = { mode: "all" }) {
    if (!this.isReady()) return { success: false, fallback: true, count: 0 };

    try {
      let query = this.db.collection("attendance");

      if (options.mode === "month" && options.month) {
        const start = `${options.month}-01`;
        const end = `${options.month}-31T23:59:59`;
        query = query.where("date", ">=", start).where("date", "<=", end);
      } else if (options.mode === "beforeMonth" && options.month) {
        const cutoff = `${options.month}-01`;
        query = query.where("date", "<", cutoff);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        return { success: true, count: 0 };
      }

      let batch = this.db.batch();
      let opCount = 0;
      let totalDeleted = 0;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        opCount++;
        totalDeleted++;
        if (opCount >= 450) {
          await batch.commit();
          batch = this.db.batch();
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }

      console.log(`[FirebaseService] Berhasil menghapus ${totalDeleted} dokumen presensi di Firestore.`);
      return { success: true, count: totalDeleted };
    } catch (error) {
      console.error("[FirebaseService] Gagal menghapus batch presensi di Firestore:", error);
      return { success: false, error, count: 0 };
    }
  },

  /**
   * Tampilkan Badge Status Koneksi Cloud di Header
   */
  updateConnectionBadge(isLoggedIn) {
    const badge = document.getElementById("firebaseStatusBadge");
    if (!badge) return;

    if (this.isReady() && isLoggedIn) {
      badge.style.display = "inline-flex";
      badge.className = "firebase-status-badge online";
      badge.innerHTML = `<span class="status-indicator-dot green"></span><span>Cloud Sync (Private)</span>`;
      badge.title = "Database terhubung ke Firebase Cloud Firestore (Kapasitas Tertutup Aman)";
    } else if (this.isReady()) {
      badge.style.display = "inline-flex";
      badge.className = "firebase-status-badge connected";
      badge.innerHTML = `<span class="status-indicator-dot amber"></span><span>Cloud Standby</span>`;
    } else {
      badge.style.display = "none";
    }
  }
};

window.FirebaseService = FirebaseService;

// Inisialisasi otomatis saat script selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  FirebaseService.init();
});
