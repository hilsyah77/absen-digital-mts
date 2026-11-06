<?php
/**
 * HADIR.GURU - API Konfigurasi Sistem (Radius GPS & Jadwal Madrasah)
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Pastikan tabel app_settings (LONGTEXT) dan picket_schedules tersedia di MySQL
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `app_settings` (
          `setting_key` VARCHAR(100) NOT NULL,
          `setting_value` LONGTEXT NOT NULL,
          `description` VARCHAR(200) DEFAULT '',
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`setting_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $pdo->exec("ALTER TABLE `app_settings` MODIFY COLUMN `setting_key` VARCHAR(100) NOT NULL");
    $pdo->exec("ALTER TABLE `app_settings` MODIFY COLUMN `setting_value` LONGTEXT NOT NULL");
} catch (Exception $e) {}

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `picket_schedules` (
          `id` VARCHAR(80) NOT NULL,
          `day` VARCHAR(20) NOT NULL,
          `squad_name` VARCHAR(100) DEFAULT '',
          `coordinator` VARCHAR(150) DEFAULT '',
          `teacher_id` VARCHAR(40) NOT NULL,
          `nip` VARCHAR(40) DEFAULT '',
          `teacher_name` VARCHAR(150) NOT NULL,
          `subject` VARCHAR(100) DEFAULT '',
          `phone` VARCHAR(40) DEFAULT '',
          `role` VARCHAR(100) DEFAULT 'Petugas 5S Salam Siswa',
          `location` VARCHAR(150) DEFAULT 'Gerbang Utama (Gedung A)',
          `time_range` VARCHAR(50) DEFAULT '06:15 - 07:00 WIB',
          `status` VARCHAR(50) DEFAULT 'Terjadwal',
          `standby_status` VARCHAR(30) DEFAULT 'terjadwal',
          `check_in_time` VARCHAR(30) DEFAULT '-',
          `check_in_date` VARCHAR(20) DEFAULT '',
          `punctuality` VARCHAR(50) DEFAULT '-',
          `is_late` TINYINT(1) DEFAULT 0,
          `notes` TEXT DEFAULT NULL,
          `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_picket_day` (`day`),
          KEY `idx_picket_teacher` (`teacher_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (Exception $e) {}

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
        $picketRows = [];

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

        try {
            $pkStmt = $pdo->query("SELECT * FROM picket_schedules ORDER BY FIELD(day, 'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'), id ASC");
            $picketRows = $pkStmt->fetchAll();
        } catch (Exception $e) {}

        $settings['_live_bundle'] = [
            'date'               => $queryDate,
            'server_time_ms'     => round(microtime(true) * 1000),
            'today_attendance'   => $todayAtt,
            'history_attendance' => $historyAtt,
            'teachers'           => $teachersList,
            'leaves'             => $leavesList,
            'teaching_logs'      => $teachingLogsList,
            'picket_schedules'   => $picketRows
        ];
    }

    sendResponse(true, $settings, "Pengaturan berhasil dimuat");
}

// --------------------------------------------------------
// POST: Perbarui Pengaturan & Sinkronkan Tabel Relasional MySQL
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
            ':desc'  => 'Diperbarui via Aplikasi Web'
        ]);

        // Sinkronisasi otomatis jadwal & absensi piket ke tabel relasional picket_schedules
        if ($key === 'welcoming_picket_roster' && is_array($val)) {
            try {
                $pdo->exec("DELETE FROM picket_schedules");
                $insPicket = $pdo->prepare("
                    INSERT INTO picket_schedules (
                        id, day, squad_name, coordinator, teacher_id, nip, teacher_name,
                        subject, phone, role, location, time_range, status, standby_status,
                        check_in_time, check_in_date, punctuality, is_late, notes
                    ) VALUES (
                        :id, :day, :squad_name, :coordinator, :teacher_id, :nip, :teacher_name,
                        :subject, :phone, :role, :location, :time_range, :status, :standby_status,
                        :check_in_time, :check_in_date, :punctuality, :is_late, :notes
                    ) ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        standby_status = VALUES(standby_status),
                        check_in_time = VALUES(check_in_time),
                        check_in_date = VALUES(check_in_date),
                        punctuality = VALUES(punctuality),
                        is_late = VALUES(is_late),
                        notes = VALUES(notes)
                ");
                foreach ($val as $squad) {
                    if (!is_array($squad) || empty($squad['day'])) continue;
                    $dayName = (string)$squad['day'];
                    $squadName = (string)($squad['squadName'] ?? '');
                    $coord = (string)($squad['coordinator'] ?? '-');
                    $members = isset($squad['members']) && is_array($squad['members']) ? $squad['members'] : [];
                    foreach ($members as $idx => $m) {
                        if (!is_array($m)) continue;
                        $tid = (string)($m['teacherId'] ?? '');
                        $rowId = !empty($m['id']) ? (string)$m['id'] : ('PKT-' . strtoupper(substr($dayName, 0, 3)) . '-' . ($idx + 1) . '-' . $tid);
                        $insPicket->execute([
                            ':id'             => $rowId,
                            ':day'            => $dayName,
                            ':squad_name'     => $squadName,
                            ':coordinator'    => $coord,
                            ':teacher_id'     => $tid,
                            ':nip'            => (string)($m['nip'] ?? $tid),
                            ':teacher_name'   => (string)($m['teacherName'] ?? 'Guru Piket'),
                            ':subject'        => (string)($m['subject'] ?? '-'),
                            ':phone'          => (string)($m['phone'] ?? ''),
                            ':role'           => (string)($m['roleInPicket'] ?? $m['role'] ?? 'Petugas 5S Salam Siswa'),
                            ':location'       => (string)($m['location'] ?? 'Gerbang Utama (Gedung A)'),
                            ':time_range'     => (string)($m['timeRange'] ?? '06:15 - 07:00 WIB'),
                            ':status'         => (string)($m['status'] ?? 'Terjadwal'),
                            ':standby_status' => (string)($m['standbyStatus'] ?? 'terjadwal'),
                            ':check_in_time'  => (string)($m['checkInTime'] ?? $m['standbyTime'] ?? '-'),
                            ':check_in_date'  => (string)($m['checkInDate'] ?? ''),
                            ':punctuality'    => (string)($m['punctuality'] ?? '-'),
                            ':is_late'        => !empty($m['isLate']) ? 1 : 0,
                            ':notes'          => (string)($m['notes'] ?? '')
                        ]);
                    }
                }
            } catch (Exception $e) {}
        }
    }

    sendResponse(true, null, "Pengaturan sistem berhasil disimpan ke database");
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);

