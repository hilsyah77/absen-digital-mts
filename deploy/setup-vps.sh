#!/usr/bin/env bash
# ==============================================================================
# SKRIP AUTO-INSTALLER VPS (MENDUKUNG AAPANEL & UBUNTU/DEBIAN MURNI)
# HADIR.GURU - SISTEM ABSENSI DIGITAL MADRASAH
# ==============================================================================
# Cara Jalankan di Terminal SSH VPS:
#   curl -fsSL https://raw.githubusercontent.com/hilsyah77/absen-digital-mts/main/deploy/setup-vps.sh | tr -d '\r' | bash -s -- absen.mtsasyjtb.cloud MadrasahHebat2026!
# ==============================================================================

set -e

DOMAIN_NAME="${1:-absen.mtsasyjtb.cloud}"
DB_NAME="absen_digital"
DB_USER="user_absen"
DB_PASS="${2:-MadrasahHebat2026!}"
REPO_URL="https://github.com/hilsyah77/absen-digital-mts.git"

# Deteksi apakah VPS menggunakan aaPanel / BT-Panel (/www/server/nginx)
IS_AAPANEL=0
if [ -d "/www/server/panel/vhost/nginx" ] || [ -x "/www/server/nginx/sbin/nginx" ]; then
    IS_AAPANEL=1
    APP_DIR="/www/wwwroot/${DOMAIN_NAME}"
else
    APP_DIR="/var/www/absen-digital"
fi

echo "=================================================================="
echo " MEMULAI INSTALASI & PERBAIKAN VPS HADIR.GURU"
echo " Mode Server   : $( [ $IS_AAPANEL -eq 1 ] && echo 'aaPanel / BT-Panel Terdeteksi' || echo 'Ubuntu/Debian LEMP Stack' )"
echo " Domain / Host : ${DOMAIN_NAME} + Akses IP Langsung"
echo " Direktori Web : ${APP_DIR}"
echo " Database MySQL: ${DB_NAME} (User: ${DB_USER})"
echo "=================================================================="

# 1. Set Zona Waktu WIB (Asia/Jakarta)
echo "[1/6] Mengatur zona waktu server ke Asia/Jakarta (WIB)..."
timedatectl set-timezone Asia/Jakarta || true

# 2. Pastikan Git, PHP-FPM, PHP-MySQL, & MariaDB Terpasang dan Berjalan
echo "[2/6] Memastikan layanan PHP-FPM dan MySQL/MariaDB aktif..."
export DEBIAN_FRONTEND=noninteractive
if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y git curl unzip php-fpm php-mysql php-mbstring php-xml php-curl php-zip php-gd mariadb-server || true
fi

# Hidupkan MySQL/MariaDB (baik bawaan aaPanel maupun sistem)
if [ -x "/etc/init.d/mysqld" ]; then
    /etc/init.d/mysqld start || true
else
    systemctl enable --now mariadb 2>/dev/null || systemctl enable --now mysql 2>/dev/null || true
fi

# Hidupkan semua layanan PHP-FPM yang tersedia
for init_php in /etc/init.d/php-fpm* /www/server/php/*/sbin/php-fpm; do
    if [ -x "$init_php" ]; then
        "$init_php" start 2>/dev/null || "$init_php" restart 2>/dev/null || true
    fi
done
for sys_php in $(systemctl list-unit-files 'php*-fpm.service' --no-legend 2>/dev/null | awk '{print $1}'); do
    systemctl enable --now "$sys_php" 2>/dev/null || systemctl restart "$sys_php" 2>/dev/null || true
done

# 3. Clone atau Update Repository dari GitHub
echo "[3/6] Mengunduh kode aplikasi dari GitHub ke ${APP_DIR}..."
mkdir -p "$(dirname "${APP_DIR}")"
if [ -d "${APP_DIR}/.git" ]; then
    git config --global --add safe.directory "${APP_DIR}"
    cd "${APP_DIR}" && git fetch origin main && git reset --hard origin/main
else
    chattr -i "${APP_DIR}/.user.ini" 2>/dev/null || true
    rm -rf "${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
fi

if [ "${APP_DIR}" != "/var/www/absen-digital" ]; then
    mkdir -p /var/www
    ln -sfn "${APP_DIR}" /var/www/absen-digital
fi

# 4. Konfigurasi Database MySQL / MariaDB & Import database.sql
echo "[4/6] Menyiapkan database '${DB_NAME}' & mengimpor skema database.sql..."
MYSQL_BIN="mysql"
if [ -x "/www/server/mysql/bin/mysql" ]; then
    MYSQL_BIN="/www/server/mysql/bin/mysql"
fi

MYSQL_CMD="${MYSQL_BIN} -u root"
if ! $MYSQL_CMD -e "SELECT 1;" >/dev/null 2>&1; then
    if [ -f "/www/server/panel/data/default.db" ] && command -v python3 >/dev/null 2>&1; then
        AA_ROOT_PASS=$(python3 -c "import sqlite3; conn=sqlite3.connect('/www/server/panel/data/default.db'); print(conn.execute('SELECT mysql_root FROM config WHERE id=1').fetchone()[0])" 2>/dev/null || true)
        if [ -n "${AA_ROOT_PASS}" ]; then
            MYSQL_CMD="${MYSQL_BIN} -u root -p${AA_ROOT_PASS}"
        fi
    fi
fi

if $MYSQL_CMD -e "SELECT 1;" >/dev/null 2>&1; then
    $MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
EOF
    "${MYSQL_BIN}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${APP_DIR}/database.sql"
    echo "    -> Database '${DB_NAME}' & 52 akun guru berhasil diimpor!"
fi

# Tulis file konfigurasi database produksi (api/config.local.php)
cat > "${APP_DIR}/api/config.local.php" <<EOF
<?php
/**
 * Konfigurasi Database Produksi VPS (Dibuat otomatis oleh setup-vps.sh)
 */
define('DB_HOST', 'localhost');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASS', '${DB_PASS}');
define('DB_CHARSET', 'utf8mb4');
EOF

if id "www" >/dev/null 2>&1; then
    chown -R www:www "${APP_DIR}"
elif id "www-data" >/dev/null 2>&1; then
    chown -R www-data:www-data "${APP_DIR}"
fi
chmod -R 755 "${APP_DIR}"

# 5. Cari Socket PHP-FPM yang Benar-Benar Aktif (Mencegah 502 Bad Gateway)
echo "[5/6] Mencari socket PHP-FPM aktif & mengatur Virtual Host Nginx..."
LIVE_PHP_SOCK=""
for sock in /tmp/php-cgi-83.sock /tmp/php-cgi-82.sock /tmp/php-cgi-81.sock /tmp/php-cgi-80.sock /tmp/php-cgi-74.sock /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php8.1-fpm.sock /run/php/php8.0-fpm.sock /run/php/php7.4-fpm.sock /run/php/php-fpm.sock; do
    if [ -S "$sock" ]; then
        LIVE_PHP_SOCK="$sock"
        chmod 666 "$sock" || true
        break
    fi
done

if [ -z "${LIVE_PHP_SOCK}" ]; then
    LIVE_PHP_SOCK=$(find /run/php /tmp -maxdepth 2 -type s \( -name "php*fpm*.sock" -o -name "php-cgi*.sock" \) 2>/dev/null | head -n 1 || true)
    if [ -n "${LIVE_PHP_SOCK}" ]; then
        chmod 666 "${LIVE_PHP_SOCK}" || true
    fi
fi

echo "    -> Socket PHP-FPM aktif: ${LIVE_PHP_SOCK:-Tidak ditemukan}"

if [ $IS_AAPANEL -eq 1 ]; then
    FASTCGI_CONF="fastcgi_params"
    if [ -f "/www/server/nginx/conf/fastcgi.conf" ]; then
        FASTCGI_CONF="fastcgi.conf"
    fi

    VHOST_CONTENT="server {
    listen 80;
    server_name ${DOMAIN_NAME} 80.43.0.177 _;
    index index.html index.php;
    root ${APP_DIR};

    client_max_body_size 25M;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:${LIVE_PHP_SOCK};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include ${FASTCGI_CONF};
    }

    location ~ /\.(git|env|htaccess) {
        deny all;
    }

    location ~* (database\.sql|config\.local\.php|config\.local\.example\.php)\$ {
        deny all;
    }

    access_log /www/wwwlogs/${DOMAIN_NAME}.log;
    error_log  /www/wwwlogs/${DOMAIN_NAME}.error.log;
}"

    echo "${VHOST_CONTENT}" > "/www/server/panel/vhost/nginx/${DOMAIN_NAME}.conf"
    # Timpa juga 0.default.conf agar akses langsung via IP (http://80.43.0.177) langsung membuka aplikasi HADIR.GURU (bukan "Website not found")
    echo "${VHOST_CONTENT}" > "/www/server/panel/vhost/nginx/0.default.conf"

    /etc/init.d/nginx reload || /www/server/nginx/sbin/nginx -s reload
else
    cat > /etc/nginx/sites-available/absen-digital <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN_NAME} 80.43.0.177 _;

    root ${APP_DIR};
    index index.html index.php;

    client_max_body_size 25M;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${LIVE_PHP_SOCK};
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
fi

# 6. Verifikasi Otomatis Endpoint API Lokal
echo "[6/6] Memverifikasi respons API Database MySQL..."
sleep 1
curl -s "http://127.0.0.1/api/init.php" | head -n 20 || true
echo ""
echo "=================================================================="
echo " ✅ PERBAIKAN SELESAI!"
echo " 🌐 Buka via Domain : http://${DOMAIN_NAME}"
echo " 🌐 Buka via IP     : http://80.43.0.177"
echo " 🗄️ Cek Database    : http://${DOMAIN_NAME}/api/init.php"
echo "=================================================================="
