<?php
/**
 * HADIR.GURU - API Konfigurasi Sistem (Radius GPS & Jadwal Madrasah)
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------
// GET: Ambil Semua Pengaturan
// --------------------------------------------------------
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value, description FROM app_settings");
    $rawSettings = $stmt->fetchAll();

    $settings = [];
    foreach ($rawSettings as $row) {
        $decoded = json_decode($row['setting_value'], true);
        $settings[$row['setting_key']] = $decoded !== null ? $decoded : $row['setting_value'];
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

