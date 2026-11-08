#!/usr/bin/env bash
# ==============================================================================
# SKRIP UPDATE CEPAT VPS - HADIR.GURU (MENDUKUNG AAPANEL & UBUNTU STANDAR)
# ==============================================================================

set -e

if [ -d "/www/wwwroot/absen.mtsasyjtb.cloud/.git" ]; then
    APP_DIR="/www/wwwroot/absen.mtsasyjtb.cloud"
elif [ -d "/var/www/absen-digital/.git" ]; then
    APP_DIR="/var/www/absen-digital"
else
    APP_DIR=$(find /www/wwwroot /var/www -maxdepth 2 -name ".git" -type d 2>/dev/null | head -n 1 | xargs dirname)
fi

echo "Menarik pembaruan terbaru dari GitHub ke ${APP_DIR}..."
cd "${APP_DIR}"
git config --global --add safe.directory "${APP_DIR}"
git fetch origin main
git reset --hard origin/main

if id "www" >/dev/null 2>&1; then
    chown -R www:www "${APP_DIR}"
elif id "www-data" >/dev/null 2>&1; then
    chown -R www-data:www-data "${APP_DIR}"
fi
chmod -R 755 "${APP_DIR}"

echo "✅ Update VPS berhasil! Aplikasi di ${APP_DIR} telah diperbarui ke versi terbaru."
