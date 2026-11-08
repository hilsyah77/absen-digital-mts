#!/usr/bin/env bash
# ==============================================================================
# SKRIP UPDATE CEPAT VPS - HADIR.GURU (MTSN 2 KOTA SEMARANG)
# Menarik pembaruan terbaru dari GitHub tanpa menimpa api/config.local.php
# ==============================================================================

set -e
APP_DIR="/var/www/absen-digital"

echo "Menarik pembaruan terbaru dari GitHub ke ${APP_DIR}..."
cd "${APP_DIR}"
git config --global --add safe.directory "${APP_DIR}"
git pull origin main

chown -R www-data:www-data "${APP_DIR}"
chmod -R 755 "${APP_DIR}"
if [ -f "${APP_DIR}/api/config.local.php" ]; then
    chmod 640 "${APP_DIR}/api/config.local.php"
fi

echo "✅ Update VPS berhasil! Aplikasi telah diperbarui ke versi terbaru."
