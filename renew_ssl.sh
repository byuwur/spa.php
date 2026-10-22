#!/bin/bash

if [ "$(id -u)" -ne 0 ]; then
    echo "This script requires root access. Please enter your password:"
    exec sudo bash "$0" "$@"
    exit 1
fi

echo ""
echo "[RENEW] SSL certificate for Lightsail LAMP with Certbot:"
echo "=== SCRIPT START ==="
echo ""

# Source .bashrc to load any existing DOMAIN/WILDCARD variables
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

# Prompt only if DOMAIN is not already set
if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain: " DOMAIN
    echo "export DOMAIN=\"$DOMAIN\"" >> "$HOME/.bashrc"
    echo "export WILDCARD=\"*.$DOMAIN\"" >> "$HOME/.bashrc"
fi

# Set WILDCARD if not already exported (in case DOMAIN was set manually but WILDCARD was not)
if [ -z "$WILDCARD" ]; then
    WILDCARD="*.$DOMAIN"
    echo "export WILDCARD=\"$WILDCARD\"" >> "$HOME/.bashrc"
fi

echo ""
echo "Using DOMAIN   = $DOMAIN"
echo "Using WILDCARD = $WILDCARD"
sleep 1

echo ""
sudo systemctl stop apache2
sudo systemctl stop mariadb

echo ""
echo "Please complete the ACME challenge on your DNS records:"
echo ""
sleep 2

sudo certbot -d $DOMAIN -d $WILDCARD --manual --preferred-challenges dns certonly

echo ""
echo "Change SSL config:"

sudo sed \
-i -e "s|SSLCertificateFile /etc/ssl/certs/ssl-cert-snakeoil.pem|SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" \
-i -e "s|SSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key|SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem|g" \
/etc/apache2/sites-enabled/default-ssl.conf

echo ""
sudo systemctl restart apache2
sudo systemctl restart mariadb

echo ""
echo "=== SCRIPT END ==="
