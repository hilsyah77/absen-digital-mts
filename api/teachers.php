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

    // 2. Simpan / Update Data Lengkap Guru (Admin Database Guru & Edit Profil)
    if ($action === 'save' || $action === 'update_profile') {
        $identifier = trim($input['id'] ?? $input['teacherId'] ?? $input['nip'] ?? '');
        if (empty($identifier)) {
            sendResponse(false, null, "ID Guru atau NIP wajib disertakan", 400);
        }

        $nip = trim($input['nip'] ?? $identifier);
        if ($nip === '-' || strlen($nip) <= 3) {
            $nip = $identifier;
        }
        $id = trim($input['id'] ?? $nip);
        $legacyId = trim($input['legacyId'] ?? $input['legacy_id'] ?? $id);
        $name = trim($input['name'] ?? '');
        $nuptk = trim($input['nuptk'] ?? '-');
        $subject = trim($input['subject'] ?? 'Guru Mapel');
        $dept = trim($input['dept'] ?? 'UMUM');
        $targetJtm = (int)($input['targetJtm'] ?? $input['target_jtm'] ?? 24);
        $classAssigned = trim($input['classAssigned'] ?? $input['class_assigned'] ?? 'Guru Mapel');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $gender = trim($input['gender'] ?? 'Laki-laki');
        $status = trim($input['status'] ?? $input['kepegawaian'] ?? $input['employmentStatus'] ?? 'Aktif');
        $pin = trim($input['pin'] ?? $input['password'] ?? '123456');
        $password = trim($input['password'] ?? $input['pin'] ?? '123456');
        $role = trim($input['role'] ?? 'Pendidik');
        $position = trim($input['position'] ?? $classAssigned);

        // Cek apakah guru sudah ada di tabel teachers
        $checkStmt = $pdo->prepare("SELECT id, nip FROM teachers WHERE nip = ? OR id = ? OR legacy_id = ? LIMIT 1");
        $checkStmt->execute([$nip, $identifier, $identifier]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            $sql = "UPDATE teachers SET updated_at = CURRENT_TIMESTAMP";
            $params = [];

            if (!empty($name)) { $sql .= ", name = ?"; $params[] = $name; }
            if (!empty($nip)) { $sql .= ", nip = ?"; $params[] = $nip; }
            if (!empty($nuptk)) { $sql .= ", nuptk = ?"; $params[] = $nuptk; }
            if (!empty($subject)) { $sql .= ", subject = ?"; $params[] = $subject; }
            if (!empty($dept)) { $sql .= ", dept = ?"; $params[] = $dept; }
            if (!empty($classAssigned)) { $sql .= ", class_assigned = ?"; $params[] = $classAssigned; }
            if (isset($input['email'])) { $sql .= ", email = ?"; $params[] = $email; }
            if (isset($input['phone'])) { $sql .= ", phone = ?"; $params[] = $phone; }
            if (!empty($pin)) { $sql .= ", pin = ?"; $params[] = $pin; }
            if (!empty($password)) { $sql .= ", password = ?"; $params[] = $password; }

            $sql .= " WHERE id = ? OR nip = ?";
            $params[] = $existing['id'];
            $params[] = $existing['nip'];

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            sendResponse(true, ['id' => $existing['id'], 'nip' => $nip], "Data guru berhasil diperbarui");
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO teachers (id, nip, legacy_id, name, nuptk, subject, dept, target_jtm, class_assigned, email, phone, gender, status, password, pin, role, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $nip, $nip, $legacyId, $name ?: 'Guru MTs', $nuptk, $subject, $dept, $targetJtm,
                $classAssigned, $email, $phone, $gender, 'Aktif', $password, $pin, $role, $position
            ]);
            sendResponse(true, ['id' => $nip, 'nip' => $nip], "Guru baru berhasil ditambahkan ke database");
        }
    }

    sendResponse(false, null, "Action tidak dikenali", 400);
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);

