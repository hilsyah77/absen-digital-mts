<?php
/**
 * HADIR.GURU - API Master Data Guru & Profil
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// --------------------------------------------------------
// GET: Ambil Daftar Master Guru
// --------------------------------------------------------
if ($method === 'GET') {
    $teacherId = trim($_GET['id'] ?? $_GET['nip'] ?? '');

    if (!empty($teacherId)) {
        $stmt = $pdo->prepare("SELECT * FROM teachers WHERE nip = ? OR id = ? OR legacy_id = ? LIMIT 1");
        $stmt->execute([$teacherId, $teacherId, $teacherId]);
        $teacher = $stmt->fetch();
        if ($teacher) {
            unset($teacher['password']);
            sendResponse(true, $teacher, "Data guru ditemukan");
        } else {
            sendResponse(false, null, "Guru tidak ditemukan", 404);
        }
    }

    // Ambil semua daftar guru (diurutkan berdasarkan nama)
    $stmt = $pdo->query("SELECT id, nip, legacy_id, name, nuptk, subject, dept, target_jtm, class_assigned, email, phone, gender, status, pin, role, position, created_at FROM teachers ORDER BY name ASC");
    $list = $stmt->fetchAll();

    sendResponse(true, $list, "Daftar guru berhasil dimuat");
}

// --------------------------------------------------------
// POST: Tambah, Update, atau Reset Password
// --------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    // 1. Reset SEMUA Password & PIN Guru ke 123456
    if ($action === 'reset_all_passwords') {
        $stmt = $pdo->prepare("UPDATE teachers SET password = '123456', pin = '123456'");
        $stmt->execute();
        $affected = $stmt->rowCount();

        sendResponse(true, ['affected' => $affected], "Semua password dan PIN akun guru berhasil di-reset menjadi 123456");
    }

    // 2. Update Profil Guru Mandiri (No HP, Email, PIN, Password)
    if ($action === 'update_profile') {
        $identifier = trim($input['id'] ?? $input['nip'] ?? '');
        if (empty($identifier)) {
            sendResponse(false, null, "ID Guru atau NIP wajib disertakan", 400);
        }

        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');
        $pin = trim($input['pin'] ?? '');
        $password = trim($input['password'] ?? '');

        $sql = "UPDATE teachers SET updated_at = CURRENT_TIMESTAMP";
        $params = [];

        if (!empty($phone)) {
            $sql .= ", phone = ?";
            $params[] = $phone;
        }
        if (!empty($email)) {
            $sql .= ", email = ?";
            $params[] = $email;
        }
        if (!empty($pin)) {
            $sql .= ", pin = ?";
            $params[] = $pin;
        }
        if (!empty($password)) {
            $sql .= ", password = ?";
            $params[] = $password;
        }

        $sql .= " WHERE nip = ? OR id = ?";
        $params[] = $identifier;
        $params[] = $identifier;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(true, null, "Profil guru berhasil diperbarui");
    }

    sendResponse(false, null, "Action tidak dikenali", 400);
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);
