/**
 * HADIR.GURU MTs — Konfigurasi Firebase Cloud Database
 * 
 * Silakan salin nilai konfigurasi dari Firebase Console:
 * Project Settings ➔ General ➔ Your apps ➔ Web app ➔ SDK setup and configuration.
 */

window.FIREBASE_CONFIG = {
  apiKey: "MASUKKAN_API_KEY_ANDA_DI_SINI",
  authDomain: "hadir-guru-mts.firebaseapp.com",
  projectId: "hadir-guru-mts",
  storageBucket: "hadir-guru-mts.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

/**
 * Cek apakah konfigurasi Firebase telah diisi dengan nilai asli
 */
function isFirebaseConfigured() {
  return window.FIREBASE_CONFIG &&
         window.FIREBASE_CONFIG.apiKey &&
         !window.FIREBASE_CONFIG.apiKey.includes("MASUKKAN_API_KEY");
}

window.isFirebaseConfigured = isFirebaseConfigured;
