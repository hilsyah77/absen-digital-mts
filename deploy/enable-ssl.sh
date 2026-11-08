#!/usr/bin/env bash
# ==============================================================================
# SKRIP AUTO-INSTALL SSL HTTPS (LET'S ENCRYPT) UNTUK AAPANEL & UBUNTU NGINX
# Mengubah http://absen.mtsasyjtb.cloud (Not secure) menjadi https:// (Secure)
# ==============================================================================
# Cara Jalankan di Terminal SSH VPS:
#   curl -fsSL https://raw.githubusercontent.com/hilsyah77/absen-digital-mts/main/deploy/enable-ssl.sh | tr -d '\r' | bash -s -- absen.mtsasyjtb.cloud
# ==============================================================================

set -e

DOMAIN_NAME="${1:-absen.mtsasyjtb.cloud}"

if [ -d "/www/wwwroot/${DOMAIN_NAME}" ]; then
    APP_DIR="/www/wwwroot/${DOMAIN_NAME}"
    IS_AAPANEL=1
else
    APP_DIR="/var/www/absen-digital"
    IS_AAPANEL=0
fi

echo "=================================================================="
echo " MEMASANG SERTIFIKAT SSL HTTPS GRATIS (LET'S ENCRYPT)"
echo " Domain      : https://${DOMAIN_NAME}"
echo " Folder Web  : ${APP_DIR}"
echo "=================================================================="

# 1. Buka Port 443 (HTTPS) di Firewall jika ada
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

# 2. Instal Certbot
echo "[1/4] Memastikan paket Certbot terpasang..."
export DEBIAN_FRONTEND=noninteractive
if ! command -v certbot >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y certbot
fi

# 3. Request Sertifikat SSL via Webroot (Aman untuk aaPanel maupun Nginx standar)
echo "[2/4] Meminta sertifikat SSL resmi Let's Encrypt untuk ${DOMAIN_NAME}..."
mkdir -p "${APP_DIR}/.well-known/acme-challenge"
chmod -R 755 "${APP_DIR}/.well-known"

certbot certonly --webroot \
    -w "${APP_DIR}" \
    -d "${DOMAIN_NAME}" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --keep-until-expiring

CERT_FULLCHAIN="/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem"
CERT_PRIVKEY="/etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem"

if [ ! -f "${CERT_FULLCHAIN}" ] || [ ! -f "${CERT_PRIVKEY}" ]; then
    echo "❌ Gagal menerbitkan sertifikat SSL di ${CERT_FULLCHAIN}"
    exit 1
fi

# 4. Pasang Konfigurasi HTTPS (Port 443) + Auto-Redirect HTTP ke HTTPS
echo "[3/4] Mengaktifkan HTTPS (Port 443) & Redirect Otomatis di Nginx..."

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
fi

if [ $IS_AAPANEL -eq 1 ]; then
    FASTCGI_CONF="fastcgi_params"
    if [ -f "/www/server/nginx/conf/fastcgi.conf" ]; then
        FASTCGI_CONF="fastcgi.conf"
    fi

    cat > "/www/server/panel/vhost/nginx/${DOMAIN_NAME}.conf" <<EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME};
    index index.html index.php;
    root ${APP_DIR};

    # Sertifikat SSL Let's Encrypt
    ssl_certificate     ${CERT_FULLCHAIN};
    ssl_certificate_key ${CERT_PRIVKEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Otomatis alihkan http:// ke https:// (Agar selalu Secure)
    if (\$server_port !~ 443){
        rewrite ^(/.*)\$ https://\$host\$1 permanent;
    }

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
}
EOF

    /etc/init.d/nginx reload || /www/server/nginx/sbin/nginx -s reload
else
    cat > /etc/nginx/sites-available/absen-digital <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_NAME};

    ssl_certificate     ${CERT_FULLCHAIN};
    ssl_certificate_key ${CERT_PRIVKEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

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
    nginx -t && systemctl reload nginx
fi

echo "[4/4] Menambahkan jadwal perpanjangan SSL otomatis (Auto-Renew)..."
(crontab -l 2>/dev/null | grep -v "certbot renew" ; echo "0 3 * * * certbot renew --quiet --post-hook '/etc/init.d/nginx reload || systemctl reload nginx'") | crontab - 2>/dev/null || true

echo "=================================================================="
echo " 🔒 SSL HTTPS BERHASIL DIAKTIFKAN!"
echo " 🌐 Buka Sekarang : https://${DOMAIN_NAME}"
echo "=================================================================="
