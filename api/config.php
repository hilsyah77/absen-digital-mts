<?php
/**
 * HADIR.GURU - Konfigurasi Database & Helper API
 * Engine: PHP 7.4+ / PHP 8.x dengan PDO MySQL
 */

// Set Zona Waktu Standar WIB (Asia/Jakarta)
date_default_timezone_set('Asia/Jakarta');

// Header CORS agar dapat diakses dari browser, PWA, maupun aplikasi web
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Tangani Preflight Request OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================================
// PENGATURAN KONEKSI DATABASE MYSQL (LOKAL / cPanel / VPS)
// Jika file api/config.local.php tersedia di server VPS,
// maka kredensial di config.local.php yang akan digunakan
// sehingga aman dan tidak tertimpa saat menjalankan `git pull`.
// ========================================================
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}

if (!defined('DB_HOST'))    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_NAME'))    define('DB_NAME', getenv('DB_NAME') ?: 'absen_digital');
if (!defined('DB_USER'))    define('DB_USER', getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS'))    define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

/**
 * Pastikan seluruh tabel dan data awal (database.sql) terinstal otomatis
 * jika database masih kosong saat pertama kali diakses.
 */
function ensureDatabaseSchema(PDO $pdo) {
    static $checked = false;
    if ($checked) return;
    $checked = true;

    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'teachers'");
        $hasTeachersTable = ($stmt && $stmt->rowCount() > 0);
        $teacherCount = 0;
        if ($hasTeachersTable) {
            $cntStmt = $pdo->query("SELECT COUNT(*) FROM `teachers`");
            $teacherCount = $cntStmt ? (int)$cntStmt->fetchColumn() : 0;
        }

        if (!$hasTeachersTable || $teacherCount === 0) {
            $sqlFile = dirname(__DIR__) . '/database.sql';
            if (file_exists($sqlFile)) {
                $sql = file_get_contents($sqlFile);
                if (!empty($sql)) {
                    $pdo->exec($sql);
                }
            }
        }
    } catch (Exception $e) {
        // Abaikan jika gagal auto-import, endpoint masing-masing memiliki fallback CREATE TABLE IF NOT EXISTS
    }
}

/**
 * Dapatkan koneksi PDO Database MySQL (Otomatis buat database & tabel jika belum ada)
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Jika database belum ada (Error 1049: Unknown database), buat otomatis
            if (strpos($e->getMessage(), '1049') !== false || stripos($e->getMessage(), 'Unknown database') !== false) {
                try {
                    $rootDsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
                    $tempPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                    $dbNameSafe = str_replace('`', '``', DB_NAME);
                    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbNameSafe}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $tempPdo = null;
                    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                } catch (PDOException $e2) {
                    sendResponse(false, null, "Koneksi & pembuatan database otomatis gagal: " . $e2->getMessage(), 500);
                    exit();
                }
            } else {
                sendResponse(false, null, "Koneksi database gagal: " . $e->getMessage(), 500);
                exit();
            }
        }
        ensureDatabaseSchema($pdo);
    }
    return $pdo;
}

/**
 * Helper: Ambil Payload JSON dari Request Body
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Helper: Kirim Respons Standar JSON
 */
function sendResponse($success, $data = null, $message = "", $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'data'      => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

