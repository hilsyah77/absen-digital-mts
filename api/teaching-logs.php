<?php
/**
 * HADIR.GURU - API Jurnal KBM Kelas & Rekap Mengajar
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------
// GET: Ambil Riwayat Mengajar
// --------------------------------------------------------
if ($method === 'GET') {
    $teacherId = trim($_GET['teacher_id'] ?? $_GET['nip'] ?? '');
    $date = trim($_GET['date'] ?? '');
    $className = trim($_GET['class'] ?? '');

    $sql = "SELECT * FROM teaching_logs WHERE 1=1";
    $params = [];

    if (!empty($teacherId)) {
        $sql .= " AND teacher_id = ?";
        $params[] = $teacherId;
    }
    if (!empty($date)) {
        $sql .= " AND date = ?";
        $params[] = $date;
    }
    if (!empty($className)) {
        $sql .= " AND class_name = ?";
        $params[] = $className;
    }

    $sql .= " ORDER BY date DESC, check_in_time DESC LIMIT 100";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    // Decode JSON student_attendance jika ada
    foreach ($logs as &$log) {
        if (!empty($log['student_attendance'])) {
            $log['student_attendance'] = json_decode($log['student_attendance'], true);
        }
    }

    sendResponse(true, $logs, "Jurnal KBM berhasil dimuat");
}

// --------------------------------------------------------
// POST: Simpan Sesi KBM Kelas Baru / Selesai Sesi
// --------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $id = trim($input['id'] ?? ('KBM-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 6)));
    $scheduleId = trim($input['scheduleId'] ?? $input['schedule_id'] ?? '');
    $teacherId = trim($input['teacherId'] ?? $input['teacher_id'] ?? $input['nip'] ?? '');
    $teacherName = trim($input['teacherName'] ?? $input['teacher_name'] ?? '');
    $className = trim($input['className'] ?? $input['class_name'] ?? $input['class'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $date = trim($input['date'] ?? date('Y-m-d'));
    $periodRange = trim($input['periodRange'] ?? $input['period_range'] ?? $input['time'] ?? '');
    $checkInTime = trim($input['checkInTime'] ?? $input['check_in_time'] ?? date('H:i'));
    $checkOutTime = trim($input['checkOutTime'] ?? $input['check_out_time'] ?? '');
    $topicMaterial = trim($input['topicMaterial'] ?? $input['topic_material'] ?? $input['topic'] ?? '');
    $teachingMedia = trim($input['teachingMedia'] ?? $input['teaching_media'] ?? $input['method'] ?? '');
    $status = trim($input['status'] ?? $input['teacherStatus'] ?? ($checkOutTime !== '' ? 'Selesai' : 'Sedang Berlangsung'));

    $studentAtt = $input['studentAttendance'] ?? $input['student_attendance'] ?? null;
    if ($studentAtt === null && (isset($input['studentsTotal']) || isset($input['studentsPresent']) || isset($input['notes']) || isset($input['room']))) {
        $studentAtt = [
            'total'          => (int)($input['studentsTotal'] ?? 32),
            'present'        => (int)($input['studentsPresent'] ?? 32),
            'sick'           => (int)($input['studentsSick'] ?? 0),
            'permit'         => (int)($input['studentsPermit'] ?? 0),
            'alpha'          => (int)($input['studentsAlpha'] ?? 0),
            'room'           => (string)($input['room'] ?? ''),
            'jtm'            => (int)($input['jtm'] ?? 2),
            'day'            => (string)($input['day'] ?? ''),
            'teacherStatus'  => (string)($input['teacherStatus'] ?? $status),
            'durationMinutes'=> (int)($input['durationMinutes'] ?? 90),
            'notes'          => (string)($input['notes'] ?? '')
        ];
    }
    $studentAttJson = is_array($studentAtt) ? json_encode($studentAtt, JSON_UNESCAPED_UNICODE) : (is_string($studentAtt) ? $studentAtt : null);

    $sql = "
        INSERT INTO teaching_logs (
            id, schedule_id, teacher_id, teacher_name, class_name, subject,
            date, period_range, check_in_time, check_out_time, topic_material,
            teaching_media, student_attendance, status
        ) VALUES (
            :id, :schedule_id, :teacher_id, :teacher_name, :class_name, :subject,
            :date, :period_range, :check_in_time, :check_out_time, :topic_material,
            :teaching_media, :student_attendance, :status
        ) ON DUPLICATE KEY UPDATE
            teacher_id = IF(VALUES(teacher_id) != '', VALUES(teacher_id), teacher_id),
            teacher_name = IF(VALUES(teacher_name) != '', VALUES(teacher_name), teacher_name),
            period_range = IF(VALUES(period_range) != '', VALUES(period_range), period_range),
            check_in_time = IF(VALUES(check_in_time) != '', VALUES(check_in_time), check_in_time),
            check_out_time = IF(VALUES(check_out_time) != '', VALUES(check_out_time), check_out_time),
            topic_material = IF(VALUES(topic_material) != '', VALUES(topic_material), topic_material),
            teaching_media = IF(VALUES(teaching_media) != '', VALUES(teaching_media), teaching_media),
            student_attendance = IF(VALUES(student_attendance) IS NOT NULL, VALUES(student_attendance), student_attendance),
            status = VALUES(status)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'                 => $id,
        ':schedule_id'        => $scheduleId,
        ':teacher_id'         => $teacherId,
        ':teacher_name'       => $teacherName,
        ':class_name'         => $className,
        ':subject'            => $subject,
        ':date'               => $date,
        ':period_range'       => $periodRange,
        ':check_in_time'      => $checkInTime,
        ':check_out_time'     => $checkOutTime,
        ':topic_material'     => $topicMaterial,
        ':teaching_media'     => $teachingMedia,
        ':student_attendance' => $studentAttJson,
        ':status'             => $status
    ]);

    sendResponse(true, ['id' => $id], "Jurnal KBM kelas berhasil disimpan");
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);

