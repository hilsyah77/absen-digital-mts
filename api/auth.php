<?php
/**
 * HADIR.GURU - API Autentikasi (Guru & Admin)
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim($_GET['action']) : 'login';

if ($method !== 'POST') {
    sendResponse(false, null, "Metode HTTP harus POST", 405);
}

$input = getJsonInput();

// --------------------------------------------------------
// 1. LOGIN ADMIN (username & password)
// --------------------------------------------------------
if ($action === 'admin_login') {
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendResponse(false, null, "Username dan password wajib diisi", 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && ($admin['password'] === $password || password_verify($password, $admin['password']))) {
        unset($admin['password']);
        sendResponse(true, [
            'type'  => 'admin',
            'user'  => $admin,
            'token' => bin2hex(random_bytes(24))
        ], "Login admin berhasil");
    } else {
        sendResponse(false, null, "Username atau password admin salah", 401);
    }
}

// --------------------------------------------------------
// 2. LOGIN GURU (NIP / ID dan Password / PIN)
// --------------------------------------------------------
if ($action === 'login') {
    $identifier = trim($input['identifier'] ?? $input['nip'] ?? $input['username'] ?? '');
    $password = trim($input['password'] ?? $input['pin'] ?? '');

    if (empty($identifier)) {
        sendResponse(false, null, "NIP atau Akun Guru wajib diisi", 400);
    }

    // Cari guru berdasarkan NIP, ID, atau Legacy ID (TCH-XX)
    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE nip = ? OR id = ? OR legacy_id = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier, $identifier]);
    $teacher = $stmt->fetch();

    if (!$teacher) {
        sendResponse(false, null, "Akun guru dengan NIP/ID '$identifier' tidak ditemukan", 404);
    }

    // Verifikasi password atau PIN (kompatibel dengan plain text 123456 maupun hash)
    $storedPass = $teacher['password'] ?? '';
    $storedPin  = $teacher['pin'] ?? '';
    
    $isValid = false;
    if (empty($password)) {
        // Jika mode bypass / switch profile
        $isValid = true;
    } elseif ($password === $storedPass || $password === $storedPin) {
        $isValid = true;
    } elseif (password_verify($password, $storedPass)) {
        $isValid = true;
    }

    if (!$isValid) {
        sendResponse(false, null, "Password atau PIN yang dimasukkan salah", 401);
    }

    unset($teacher['password']);
    sendResponse(true, [
        'type'    => 'teacher',
        'teacher' => $teacher,
        'token'   => bin2hex(random_bytes(24))
    ], "Login berhasil. Selamat datang, " . $teacher['name']);
}

sendResponse(false, null, "Action tidak dikenali", 400);
