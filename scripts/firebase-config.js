/**
 * HADIR.GURU MTs — Konfigurasi Firebase Cloud Database
 * 
 * Silakan salin nilai konfigurasi dari Firebase Console:
 * Project Settings ➔ General ➔ Your apps ➔ Web app ➔ SDK setup and configuration.
 */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA37k_iuFSoj5yYDeQYUcJsO4n3689pTB8",
  authDomain: "absen-digital-6486d.firebaseapp.com",
  projectId: "absen-digital-6486d",
  storageBucket: "absen-digital-6486d.firebasestorage.app",
  messagingSenderId: "1029784790813",
  appId: "1:1029784790813:web:da7f1a35e7ced49327a3f4"
};



/**
 * Cek apakah konfigurasi Firebase telah diisi dengan nilai asli
 */
function isFirebaseConfigured() {
  return window.FIREBASE_CONFIG &&
    window.FIREBASE_CONFIG.apiKey &&
    !window.FIREBASE_CONFIG.apiKey.includes("MASUKKAN_API_KEY") &&
    !window.FIREBASE_CONFIG.apiKey.includes("xxxx");
}

window.isFirebaseConfigured = isFirebaseConfigured;
