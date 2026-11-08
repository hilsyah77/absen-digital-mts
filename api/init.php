<?php
/**
 * HADIR.GURU - Endpoint Inisialisasi & Cek Status Database Otomatis
 * Akses URL: /api/init.php
 * Otomatis membuat database, mengimpor seluruh tabel dari database.sql,
 * dan mengisi 52 data guru + akun admin jika database masih kosong.
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
ensureDatabaseSchema($pdo);

$tables = ['teachers', 'attendance', 'teaching_logs', 'leaves', 'app_settings', 'picket_schedules', 'admins'];
$tableStatus = [];

foreach ($tables as $tbl) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`");
        $tableStatus[$tbl] = (int)$stmt->fetchColumn();
    } catch (Exception $e) {
        $tableStatus[$tbl] = 'Belum ada (' . $e->getMessage() . ')';
    }
}

sendResponse(true, [
    'database'     => DB_NAME,
    'timezone'     => date_default_timezone_get(),
    'server_time'  => date('Y-m-d H:i:s'),
    'tables_count' => $tableStatus
], 'Database dan seluruh tabel HADIR.GURU telah aktif & terinstal otomatis.');
