<?php
/**
 * HADIR.GURU - API Presensi Harian Guru
 * Menyimpan dan mengambil data presensi harian dengan ID berformat <NIP>_<YYYY-MM-DD>
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper: cari NIP resmi guru
function resolveCanonicalNip($pdo, $identifier) {
    if (empty($identifier)) return '';
    $stmt = $pdo->prepare("SELECT nip FROM teachers WHERE nip = ? OR id = ? OR legacy_id = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier, $identifier]);
    $res = $stmt->fetch();
    return $res ? $res['nip'] : $identifier;
}

// --------------------------------------------------------
// GET: Ambil Data Presensi
// --------------------------------------------------------
if ($method === 'GET') {
    $teacherId = trim($_GET['teacher_id'] ?? $_GET['nip'] ?? '');
    $date = trim($_GET['date'] ?? '');
    $month = trim($_GET['month'] ?? ''); // format: YYYY-MM

    // 1. Ambil rekap semua guru untuk tanggal tertentu (Default: Hari ini)
    if (isset($_GET['mode']) && $_GET['mode'] === 'today_all') {
        $queryDate = !empty($date) ? $date : date('Y-m-d');
        
        // Gabungkan tabel teachers dengan presensi tanggal tersebut
        $stmt = $pdo->prepare("
            SELECT 
                t.id, t.nip, t.legacy_id, t.name, t.role, t.subject, t.dept, t.class_assigned, t.gender,
                COALESCE(a.status, 'Belum Absen') AS status,
                a.id AS attendance_id,
                a.status_detail,
                a.check_in_time,
                a.check_out_time,
                a.check_in_distance,
                a.is_late
            FROM teachers t
            LEFT JOIN attendance a ON t.nip = a.nip AND a.date = ?
            ORDER BY t.name ASC
        ");
        $stmt->execute([$queryDate]);
        $rows = $stmt->fetchAll();

        sendResponse(true, [
            'date' => $queryDate,
            'total_teachers' => count($rows),
            'list' => $rows
        ], "Data absensi semua guru berhasil dimuat");
    }

    // 2. Ambil riwayat presensi guru tertentu
    if (!empty($teacherId)) {
        $canonicalNip = resolveCanonicalNip($pdo, $teacherId);
        
        $sql = "SELECT * FROM attendance WHERE nip = ?";
        $params = [$canonicalNip];

        if (!empty($date)) {
            $sql .= " AND date = ?";
            $params[] = $date;
        } elseif (!empty($month)) {
            $sql .= " AND date LIKE ?";
            $params[] = $month . '%';
        }

        $sql .= " ORDER BY date DESC LIMIT 60";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        sendResponse(true, $records, "Riwayat absensi berhasil dimuat");
    }

    // Default jika tanpa parameter: Ambil data hari ini untuk semua guru
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT * FROM attendance WHERE date = ? ORDER BY check_in_time ASC");
    $stmt->execute([$today]);
    sendResponse(true, $stmt->fetchAll(), "Presensi hari ini berhasil dimuat");
}

// --------------------------------------------------------
// POST: Catat / Perbarui Presensi (Check-in atau Check-out)
// --------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();
    
    $rawTeacherId = trim($input['teacherId'] ?? $input['teacher_id'] ?? $input['nip'] ?? '');
    if (empty($rawTeacherId)) {
        sendResponse(false, null, "teacherId atau NIP wajib disertakan", 400);
    }

    $canonicalNip = resolveCanonicalNip($pdo, $rawTeacherId);
    $dateStr = trim($input['date'] ?? date('Y-m-d'));
    $docId = "{$canonicalNip}_{$dateStr}";

    // Cek apakah data untuk hari ini sudah ada
    $checkStmt = $pdo->prepare("SELECT * FROM attendance WHERE id = ? LIMIT 1");
    $checkStmt->execute([$docId]);
    $existing = $checkStmt->fetch();

    // Data payload
    $status = trim($input['status'] ?? ($existing ? $existing['status'] : 'Hadir'));
    $statusDetail = trim($input['statusDetail'] ?? $input['status_detail'] ?? ($existing ? $existing['status_detail'] : ''));
    
    // Check-in
    $checkInTime = $input['checkIn']['time'] ?? $input['check_in_time'] ?? ($existing ? $existing['check_in_time'] : '-');
    $checkInLat = $input['checkIn']['lat'] ?? $input['check_in_lat'] ?? ($existing ? $existing['check_in_lat'] : null);
    $checkInLng = $input['checkIn']['lng'] ?? $input['check_in_lng'] ?? ($existing ? $existing['check_in_lng'] : null);
    $checkInDistance = $input['checkIn']['distance'] ?? $input['check_in_distance'] ?? ($existing ? $existing['check_in_distance'] : '');
    $checkInDevice = $input['checkIn']['device'] ?? $input['check_in_device'] ?? ($existing ? $existing['check_in_device'] : '');
    $isLate = isset($input['checkIn']['isLate']) ? ($input['checkIn']['isLate'] ? 1 : 0) : (isset($input['is_late']) ? ($input['is_late'] ? 1 : 0) : ($existing ? $existing['is_late'] : 0));

    // Check-out
    $checkOutTime = $input['checkOut']['time'] ?? $input['check_out_time'] ?? ($existing ? $existing['check_out_time'] : '-');
    $checkOutLat = $input['checkOut']['lat'] ?? $input['check_out_lat'] ?? ($existing ? $existing['check_out_lat'] : null);
    $checkOutLng = $input['checkOut']['lng'] ?? $input['check_out_lng'] ?? ($existing ? $existing['check_out_lng'] : null);
    $checkOutDistance = $input['checkOut']['distance'] ?? $input['check_out_distance'] ?? ($existing ? $existing['check_out_distance'] : '');

    $teacherName = trim($input['teacherName'] ?? $input['teacher_name'] ?? ($existing ? $existing['teacher_name'] : ''));
    if (empty($teacherName)) {
        $tStmt = $pdo->prepare("SELECT name FROM teachers WHERE nip = ? LIMIT 1");
        $tStmt->execute([$canonicalNip]);
        $tRow = $tStmt->fetch();
        $teacherName = $tRow ? $tRow['name'] : '';
    }

    $day = trim($input['day'] ?? ($existing ? $existing['day'] : ''));

    // UPSERT ke tabel attendance
    $sql = "
        INSERT INTO attendance (
            id, teacher_id, nip, teacher_name, date, day, status, status_detail,
            check_in_time, check_in_lat, check_in_lng, check_in_distance, check_in_device,
            check_out_time, check_out_lat, check_out_lng, check_out_distance, is_late
        ) VALUES (
            :id, :teacher_id, :nip, :teacher_name, :date, :day, :status, :status_detail,
            :check_in_time, :check_in_lat, :check_in_lng, :check_in_distance, :check_in_device,
            :check_out_time, :check_out_lat, :check_out_lng, :check_out_distance, :is_late
        ) ON DUPLICATE KEY UPDATE
            teacher_name = VALUES(teacher_name),
            status = VALUES(status),
            status_detail = VALUES(status_detail),
            check_in_time = IF(VALUES(check_in_time) != '-', VALUES(check_in_time), check_in_time),
            check_in_lat = IF(VALUES(check_in_lat) IS NOT NULL, VALUES(check_in_lat), check_in_lat),
            check_in_lng = IF(VALUES(check_in_lng) IS NOT NULL, VALUES(check_in_lng), check_in_lng),
            check_in_distance = IF(VALUES(check_in_distance) != '', VALUES(check_in_distance), check_in_distance),
            check_in_device = IF(VALUES(check_in_device) != '', VALUES(check_in_device), check_in_device),
            check_out_time = IF(VALUES(check_out_time) != '-', VALUES(check_out_time), check_out_time),
            check_out_lat = IF(VALUES(check_out_lat) IS NOT NULL, VALUES(check_out_lat), check_out_lat),
            check_out_lng = IF(VALUES(check_out_lng) IS NOT NULL, VALUES(check_out_lng), check_out_lng),
            check_out_distance = IF(VALUES(check_out_distance) != '', VALUES(check_out_distance), check_out_distance),
            is_late = VALUES(is_late)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'                 => $docId,
        ':teacher_id'         => $canonicalNip,
        ':nip'                => $canonicalNip,
        ':teacher_name'       => $teacherName,
        ':date'               => $dateStr,
        ':day'                => $day,
        ':status'             => $status,
        ':status_detail'      => $statusDetail,
        ':check_in_time'      => $checkInTime,
        ':check_in_lat'       => $checkInLat,
        ':check_in_lng'       => $checkInLng,
        ':check_in_distance'  => $checkInDistance,
        ':check_in_device'    => $checkInDevice,
        ':check_out_time'     => $checkOutTime,
        ':check_out_lat'      => $checkOutLat,
        ':check_out_lng'      => $checkOutLng,
        ':check_out_distance' => $checkOutDistance,
        ':is_late'            => $isLate
    ]);

    // Bersihkan catatan legacy jika sebelumnya tersimpan dengan format TCH-XX
    if ($rawTeacherId !== $canonicalNip) {
        $legacyDocId = "{$rawTeacherId}_{$dateStr}";
        $pdo->prepare("DELETE FROM attendance WHERE id = ?")->execute([$legacyDocId]);
    }

    sendResponse(true, [
        'id'        => $docId,
        'teacherId' => $canonicalNip,
        'nip'       => $canonicalNip,
        'status'    => $status,
        'checkIn'   => $checkInTime,
        'checkOut'  => $checkOutTime
    ], "Presensi berhasil dicatat di MySQL");
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);
