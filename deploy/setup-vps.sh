#!/usr/bin/env bash
# ==============================================================================
# SKRIP AUTO-INSTALLER VPS UBUNTU/DEBIAN - HADIR.GURU (MTSN 2 KOTA SEMARANG)
# Menginstal Nginx, MariaDB/MySQL, PHP-FPM, Clone GitHub, Import Database, & SSL
# ==============================================================================
# Cara Jalankan di VPS (sebagai root):
#   bash setup-vps.sh [DOMAIN_ATAU_IP] [PASSWORD_DB]
# Contoh dengan domain:
#   bash setup-vps.sh absen.mtsn2semarang.sch.id MadrasahHebat2026!
# ==============================================================================

set -e

DOMAIN_NAME="${1:-_}"
DB_NAME="absen_digital"
DB_USER="user_absen"
DB_PASS="${2:-MadrasahHebat2026!}"
APP_DIR="/var/www/absen-digital"
REPO_URL="https://github.com/hilsyah77/absen-digital-mts.git"

echo "=================================================================="
echo " MEMULAI INSTALASI VPS HADIR.GURU - ABSENSI DIGITAL MADRASAH"
echo " Domain / Host : ${DOMAIN_NAME}"
echo " Direktori Web : ${APP_DIR}"
echo " Database MySQL: ${DB_NAME} (User: ${DB_USER})"
echo "=================================================================="

# 1. Set Zona Waktu WIB (Asia/Jakarta)
echo "[1/7] Mengatur zona waktu server ke Asia/Jakarta (WIB)..."
timedatectl set-timezone Asia/Jakarta || true

# 2. Instalasi Paket LEMP Stack (Nginx, MariaDB, PHP-FPM, Git, Certbot)
echo "[2/7] Menginstal Nginx, MariaDB, PHP-FPM, dan ekstensi pendukung..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx mariadb-server git curl unzip ufw \
    php-fpm php-mysql php-mbstring php-xml php-curl php-zip php-gd

systemctl enable --now nginx
systemctl enable --now mariadb

# 3. Buat Database & User MySQL/MariaDB
echo "[3/7] Membuat database '${DB_NAME}' dan user '${DB_USER}'..."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

# 4. Clone atau Update Repository dari GitHub
echo "[4/7] Mengunduh kode aplikasi dari GitHub (${REPO_URL})..."
if [ -d "${APP_DIR}/.git" ]; then
    git config --global --add safe.directory "${APP_DIR}"
    cd "${APP_DIR}" && git pull origin main
else
    rm -rf "${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
fi

# 5. Import Skema Database & Buat api/config.local.php
echo "[5/7] Mengimpor skema database.sql & menulis api/config.local.php..."
mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${APP_DIR}/database.sql"

cat > "${APP_DIR}/api/config.local.php" <<EOF
<?php
/**
 * Konfigurasi Database Produksi VPS (Dibuat otomatis oleh setup-vps.sh)
 * File ini tidak ikut ter-overwrite saat menjalankan git pull.
 */
define('DB_HOST', 'localhost');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASS', '${DB_PASS}');
define('DB_CHARSET', 'utf8mb4');
EOF

chown -R www-data:www-data "${APP_DIR}"
chmod -R 755 "${APP_DIR}"
chmod 640 "${APP_DIR}/api/config.local.php"

# 6. Deteksi Socket PHP-FPM & Konfigurasi Virtual Host Nginx
echo "[6/7] Mengonfigurasi Virtual Host Nginx..."
PHP_SOCK=$(find /run/php/ -name "php*-fpm.sock" | head -n 1)
if [ -z "${PHP_SOCK}" ]; then
    PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
    systemctl enable --now "php${PHP_VER}-fpm" || true
    PHP_SOCK="/run/php/php${PHP_VER}-fpm.sock"
fi

cat > /etc/nginx/sites-available/absen-digital <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};

    root ${APP_DIR};
    index index.html index.php;

    client_max_body_size 25M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${PHP_SOCK};
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 120;
    }

    location ~ /\.(git|env|htaccess) {
        deny all;
    }

    location ~* (database\.sql|config\.local\.php|config\.local\.example\.php)\$ {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/absen-digital /etc/nginx/sites-enabled/absen-digital
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. Pasang SSL Let's Encrypt Jika Menggunakan Domain Valid
if [ "${DOMAIN_NAME}" != "_" ] && [[ "${DOMAIN_NAME}" == *.* ]]; then
    echo "[7/7] Menginstal Certbot untuk SSL HTTPS pada domain ${DOMAIN_NAME}..."
    apt-get install -y certbot python3-certbot-nginx
    echo "Jalankan perintah berikut untuk mengaktifkan HTTPS gratis:"
    echo "  certbot --nginx -d ${DOMAIN_NAME}"
else
    echo "[7/7] Instalasi selesai! Untuk mengaktifkan HTTPS (wajib untuk GPS di HP), arahkan domain ke IP VPS lalu jalankan:"
    echo "  apt install -y certbot python3-certbot-nginx && certbot --nginx -d domain-anda.sch.id"
fi

echo "=================================================================="
echo " DEPLOYMENT SELESAI!"
echo " Uji Endpoint API : http://${DOMAIN_NAME}/api/init.php"
echo " Lokasi Aplikasi  : ${APP_DIR}"
echo " Kredensial DB    : ${APP_DIR}/api/config.local.php"
echo "=================================================================="
