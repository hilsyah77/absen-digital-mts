<?php
/**
 * HADIR.GURU - API Konfigurasi Sistem (Radius GPS & Jadwal Madrasah)
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------
// GET: Ambil Semua Pengaturan (+ Live Bundle Sinkronisasi Lintas Browser/Perangkat)
// --------------------------------------------------------
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value, description FROM app_settings");
    $rawSettings = $stmt->fetchAll();

    $settings = [];
    foreach ($rawSettings as $row) {
        $decoded = json_decode($row['setting_value'], true);
        $settings[$row['setting_key']] = $decoded !== null ? $decoded : $row['setting_value'];
    }

    // Jika diminta bundle sinkronisasi lengkap lintas browser (?sync=1)
    if (isset($_GET['sync']) && $_GET['sync'] == '1') {
        $queryDate = isset($_GET['date']) && !empty($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

        $todayAtt = [];
        $historyAtt = [];
        $teachersList = [];
        $leavesList = [];
        $teachingLogsList = [];

        try {
            $attStmt = $pdo->prepare("SELECT * FROM attendance WHERE date = ? ORDER BY updated_at DESC");
            $attStmt->execute([$queryDate]);
            $todayAtt = $attStmt->fetchAll();
        } catch (Exception $e) {}

        try {
            $histStmt = $pdo->query("SELECT * FROM attendance ORDER BY date DESC, updated_at DESC LIMIT 250");
            $historyAtt = $histStmt->fetchAll();
        } catch (Exception $e) {}

        try {
            $tStmt = $pdo->query("SELECT id, nip, legacy_id, name, nuptk, subject, dept, target_jtm, class_assigned, email, phone, avatar_url, gender, status, pin, password, role, position, updated_at FROM teachers ORDER BY name ASC");
            $teachersList = $tStmt->fetchAll();
        } catch (Exception $e) {}

        try {
            $lStmt = $pdo->query("SELECT * FROM leaves ORDER BY created_at DESC LIMIT 100");
            $leavesList = $lStmt->fetchAll();
        } catch (Exception $e) {}

        try {
            $tlStmt = $pdo->query("SELECT * FROM teaching_logs ORDER BY date DESC, check_in_time DESC LIMIT 100");
            $teachingLogsList = $tlStmt->fetchAll();
        } catch (Exception $e) {}

        $settings['_live_bundle'] = [
            'date'               => $queryDate,
            'server_time_ms'     => round(microtime(true) * 1000),
            'today_attendance'   => $todayAtt,
            'history_attendance' => $historyAtt,
            'teachers'           => $teachersList,
            'leaves'             => $leavesList,
            'teaching_logs'      => $teachingLogsList
        ];
    }

    sendResponse(true, $settings, "Pengaturan berhasil dimuat");
}

// --------------------------------------------------------
// POST: Perbarui Pengaturan (Admin)
// --------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $stmt = $pdo->prepare("
        INSERT INTO app_settings (setting_key, setting_value, description)
        VALUES (:key, :value, :desc)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description)
    ");

    foreach ($input as $key => $val) {
        $valStr = is_array($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : (string)$val;
        $stmt->execute([
            ':key'   => $key,
            ':value' => $valStr,
            ':desc'  => 'Diperbarui via Admin API'
        ]);
    }

    sendResponse(true, null, "Pengaturan sistem berhasil disimpan ke database");
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);

