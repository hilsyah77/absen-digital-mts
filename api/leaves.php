<?php
/**
 * HADIR.GURU - API Pengajuan Izin / Cuti / Sakit Guru
 */
require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------
// GET: Ambil Daftar Permohonan Izin
// --------------------------------------------------------
if ($method === 'GET') {
    $teacherId = trim($_GET['teacher_id'] ?? $_GET['nip'] ?? '');
    
    $sql = "SELECT * FROM leaves";
    $params = [];
    if (!empty($teacherId)) {
        $sql .= " WHERE teacher_id = ? OR nip = ?";
        $params[] = $teacherId;
        $params[] = $teacherId;
    }
    $sql .= " ORDER BY created_at DESC LIMIT 100";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    sendResponse(true, $stmt->fetchAll(), "Data pengajuan izin berhasil dimuat");
}

// --------------------------------------------------------
// POST: Kirim Pengajuan Izin Baru / Setujui Izin
// --------------------------------------------------------
if ($method === 'POST') {
    // Tangani multipart form data atau json
    $isMultipart = !empty($_POST);
    $input = $isMultipart ? $_POST : getJsonInput();
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';

    // Aksi Persetujuan oleh Admin
    if ($action === 'approve') {
        $id = trim($input['id'] ?? '');
        $status = trim($input['status'] ?? 'Disetujui'); // Disetujui / Ditolak
        $adminName = trim($input['admin_name'] ?? 'Admin Madrasah');

        if (empty($id)) {
            sendResponse(false, null, "ID izin wajib diisi", 400);
        }

        $stmt = $pdo->prepare("UPDATE leaves SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $adminName, $id]);

        sendResponse(true, null, "Status pengajuan izin berhasil diubah menjadi $status");
    }

    // Aksi Pengajuan Izin Baru
    $id = trim($input['id'] ?? ('IZN-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 6)));
    $teacherId = trim($input['teacher_id'] ?? $input['teacherId'] ?? $input['nip'] ?? '');
    $teacherName = trim($input['teacher_name'] ?? $input['teacherName'] ?? '');
    $nip = trim($input['nip'] ?? $teacherId);
    $type = trim($input['type'] ?? 'Izin');
    $startDate = trim($input['start_date'] ?? $input['startDate'] ?? date('Y-m-d'));
    $endDate = trim($input['end_date'] ?? $input['endDate'] ?? $startDate);
    $reason = trim($input['reason'] ?? '');
    $proofUrl = trim($input['proof_attachment'] ?? '');

    // Upload lampiran jika ada berkas yang dikirimkan
    if (isset($_FILES['proof_file']) && $_FILES['proof_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/leaves/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $ext = strtolower(pathinfo($_FILES['proof_file']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'pdf'];
        if (in_array($ext, $allowed)) {
            $fileName = 'surat_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            if (move_uploaded_file($_FILES['proof_file']['tmp_name'], $uploadDir . $fileName)) {
                $proofUrl = 'uploads/leaves/' . $fileName;
            }
        }
    }

    if (empty($teacherId) || empty($reason)) {
        sendResponse(false, null, "Guru dan Alasan permohonan wajib diisi", 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO leaves (id, teacher_id, teacher_name, nip, type, start_date, end_date, reason, proof_attachment, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    ");
    $stmt->execute([$id, $teacherId, $teacherName, $nip, $type, $startDate, $endDate, $reason, $proofUrl]);

    sendResponse(true, ['id' => $id, 'proof' => $proofUrl], "Pengajuan izin berhasil dikirim");
}

sendResponse(false, null, "Metode HTTP tidak didukung", 405);
