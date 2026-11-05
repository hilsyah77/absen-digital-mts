<?php
/**
 * HADIR.GURU - Konfigurasi Database & Helper API
 * Engine: PHP 7.4+ / PHP 8.x dengan PDO MySQL
 */

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
// PENGATURAN KONEKSI DATABASE MYSQL
// Sesuaikan dengan data database di cPanel Anda
// ========================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'absen_digital'); // Ganti dengan nama database cPanel Anda
define('DB_USER', 'root');          // Ganti dengan username database cPanel Anda
define('DB_PASS', '');              // Ganti dengan password database cPanel Anda
define('DB_CHARSET', 'utf8mb4');

/**
 * Dapatkan koneksi PDO Database MySQL
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
            sendResponse(false, null, "Koneksi database gagal: " . $e->getMessage(), 500);
            exit();
        }
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
