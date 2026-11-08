<?php
/**
 * CONTOH KONFIGURASI LOKAL / VPS (Salin file ini menjadi: api/config.local.php)
 * File api/config.local.php diabaikan oleh Git (.gitignore) sehingga kredensial
 * database VPS Anda tidak akan tertimpa saat menjalankan `git pull origin main`.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'absen_digital');
define('DB_USER', 'user_absen');
define('DB_PASS', 'GantiDenganPasswordDatabaseVpsAnda');
define('DB_CHARSET', 'utf8mb4');

