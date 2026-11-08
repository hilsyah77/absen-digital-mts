#!/usr/bin/env bash
# ==============================================================================
# SKRIP AUTO-INSTALLER VPS (MENDUKUNG AAPANEL & UBUNTU/DEBIAN MURNI)
# HADIR.GURU - SISTEM ABSENSI DIGITAL MADRASAH
# ==============================================================================
# Cara Jalankan di Terminal SSH VPS:
#   curl -fsSL https://raw.githubusercontent.com/hilsyah77/absen-digital-mts/main/deploy/setup-vps.sh | bash -s -- absen.mtsasyjtb.cloud MadrasahHebat2026!
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
echo " MEMULAI INSTALASI VPS HADIR.GURU - ABSENSI DIGITAL MADRASAH"
echo " Mode Server   : $( [ $IS_AAPANEL -eq 1 ] && echo 'aaPanel / BT-Panel Terdeteksi' || echo 'Ubuntu/Debian LEMP Stack' )"
echo " Domain / Host : ${DOMAIN_NAME}"
echo " Direktori Web : ${APP_DIR}"
echo " Database MySQL: ${DB_NAME} (User: ${DB_USER})"
echo "=================================================================="

# 1. Set Zona Waktu WIB (Asia/Jakarta)
echo "[1/6] Mengatur zona waktu server ke Asia/Jakarta (WIB)..."
timedatectl set-timezone Asia/Jakarta || true

# 2. Pastikan Git & Paket Pendukung Terpasang
echo "[2/6] Memeriksa paket sistem (Git, PHP, MySQL, Nginx)..."
if [ $IS_AAPANEL -eq 0 ]; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y nginx mariadb-server git curl unzip ufw \
        php-fpm php-mysql php-mbstring php-xml php-curl php-zip php-gd
    systemctl enable --now nginx
    systemctl enable --now mariadb
else
    if ! command -v git >/dev/null 2>&1; then
        apt-get update -y && apt-get install -y git curl unzip || yum install -y git curl unzip
    fi
fi

# 3. Clone atau Update Repository dari GitHub
echo "[3/6] Mengunduh kode aplikasi dari GitHub ke ${APP_DIR}..."
mkdir -p "$(dirname "${APP_DIR}")"
if [ -d "${APP_DIR}/.git" ]; then
    git config --global --add safe.directory "${APP_DIR}"
    cd "${APP_DIR}" && git fetch origin main && git reset --hard origin/main
else
    rm -rf "${APP_DIR}/.user.ini" 2>/dev/null || true
    chattr -i "${APP_DIR}/.user.ini" 2>/dev/null || true
    rm -rf "${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
fi

# Buat juga symlink di /var/www/absen-digital agar konsisten
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
    # Coba ambil password root MySQL dari database internal aaPanel jika ada
    if [ -f "/www/server/panel/data/default.db" ] && command -v sqlite3 >/dev/null 2>&1; then
        AA_ROOT_PASS=$(sqlite3 /www/server/panel/data/default.db "SELECT mysql_root FROM config WHERE id=1;" 2>/dev/null || true)
        if [ -n "${AA_ROOT_PASS}" ]; then
            MYSQL_CMD="${MYSQL_BIN} -u root -p${AA_ROOT_PASS}"
        fi
    elif [ -f "/www/server/panel/data/default.db" ] && command -v python3 >/dev/null 2>&1; then
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
else
    echo "    -> [INFO] MySQL root memiliki password khusus. Tabel akan diimpor otomatis oleh api/init.php setelah kredensial sesuai."
fi

# Tulis file konfigurasi database produksi (api/config.local.php)
cat > "${APP_DIR}/api/config.local.php" <<EOF
<?php
/**
 * Konfigurasi Database Produksi VPS (Dibuat otomatis oleh setup-vps.sh)
 * File ini diabaikan oleh Git (.gitignore) sehingga tidak tertimpa saat git pull.
 */
define('DB_HOST', 'localhost');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASS', '${DB_PASS}');
define('DB_CHARSET', 'utf8mb4');
EOF

# Set permission direktori web (www untuk aaPanel, www-data untuk Ubuntu standar)
if id "www" >/dev/null 2>&1; then
    chown -R www:www "${APP_DIR}"
elif id "www-data" >/dev/null 2>&1; then
    chown -R www-data:www-data "${APP_DIR}"
fi
chmod -R 755 "${APP_DIR}"

# 5. Konfigurasi Web Server Nginx (aaPanel maupun Ubuntu Standar)
echo "[5/6] Mengonfigurasi Virtual Host Nginx untuk ${DOMAIN_NAME}..."
if [ $IS_AAPANEL -eq 1 ]; then
    # Deteksi versi PHP yang terinstal di aaPanel (misal 83, 82, 81, 80, 74)
    AA_PHP_VER=""
    for ver in 83 82 81 80 74; do
        if [ -S "/tmp/php-cgi-${ver}.sock" ] || [ -f "/www/server/nginx/conf/enable-php-${ver}.conf" ]; then
            AA_PHP_VER="${ver}"
            break
        fi
    done

    # Jika PHP belum terinstal di aaPanel namun ada php-fpm sistem Ubuntu
    SYS_PHP_SOCK=$(find /run/php/ -name "php*-fpm.sock" 2>/dev/null | head -n 1 || true)

    PHP_BLOCK=""
    if [ -n "${AA_PHP_VER}" ] && [ -f "/www/server/nginx/conf/enable-php-${AA_PHP_VER}.conf" ]; then
        PHP_BLOCK="include enable-php-${AA_PHP_VER}.conf;"
    elif [ -n "${AA_PHP_VER}" ]; then
        PHP_BLOCK="location ~ \\.php\$ {
        fastcgi_pass unix:/tmp/php-cgi-${AA_PHP_VER}.sock;
        fastcgi_index index.php;
        include fastcgi.conf;
    }"
    elif [ -n "${SYS_PHP_SOCK}" ]; then
        chmod 666 "${SYS_PHP_SOCK}" || true
        PHP_BLOCK="location ~ \\.php\$ {
        fastcgi_pass unix:${SYS_PHP_SOCK};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }"
    else
        # Pasang php-fpm sistem jika di aaPanel belum di-install PHP sama sekali
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y && apt-get install -y php-fpm php-mysql php-mbstring php-xml php-curl php-zip php-gd
        PHP_VER_DOT=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
        systemctl enable --now "php${PHP_VER_DOT}-fpm" || true
        SYS_PHP_SOCK="/run/php/php${PHP_VER_DOT}-fpm.sock"
        chmod 666 "${SYS_PHP_SOCK}" || true
        PHP_BLOCK="location ~ \\.php\$ {
        fastcgi_pass unix:${SYS_PHP_SOCK};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }"
    fi

    # Nonaktifkan vhost lama yang me-redirect ke "website has been stopped" (html/stop)
    for conf in /www/server/panel/vhost/nginx/*.conf; do
        [ -e "$conf" ] || continue
        if grep -q "${DOMAIN_NAME}" "$conf" 2>/dev/null; then
            rm -f "$conf"
        fi
    done

    cat > "/www/server/panel/vhost/nginx/${DOMAIN_NAME}.conf" <<EOF
server {
    listen 80 default_server;
    server_name ${DOMAIN_NAME} _;
    index index.html index.php;
    root ${APP_DIR};

    client_max_body_size 25M;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    ${PHP_BLOCK}

    location ~ /\.(git|env|htaccess) {
        deny all;
    }

    location ~* (database\.sql|config\.local\.php|config\.local\.example\.php)\$ {
        deny all;
    }

    access_log /www/wwwlogs/${DOMAIN_NAME}.log;
    error_log  /www/wwwlogs/${DOMAIN_NAME}.error.log;
}
EOF

    # Hapus default_server dari 0.default.conf aaPanel agar tidak bentrok
    if [ -f "/www/server/panel/vhost/nginx/0.default.conf" ]; then
        sed -i 's/default_server//g' /www/server/panel/vhost/nginx/0.default.conf || true
    fi

    /etc/init.d/nginx reload || /www/server/nginx/sbin/nginx -s reload
else
    PHP_SOCK=$(find /run/php/ -name "php*-fpm.sock" | head -n 1)
    if [ -z "${PHP_SOCK}" ]; then
        PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
        systemctl enable --now "php${PHP_VER}-fpm" || true
        PHP_SOCK="/run/php/php${PHP_VER}-fpm.sock"
    fi

    cat > /etc/nginx/sites-available/absen-digital <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN_NAME} _;

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
fi

echo "=================================================================="
echo " ✅ DEPLOYMENT SELESAI DAN AKTIF!"
echo " 🌐 Buka Website   : http://${DOMAIN_NAME}"
echo " 🗄️ Cek Status API : http://${DOMAIN_NAME}/api/init.php"
echo " 📁 Lokasi File    : ${APP_DIR}"
echo "=================================================================="
