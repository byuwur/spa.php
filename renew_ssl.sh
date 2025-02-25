#!/bin/bash

if [ "$(id -u)" -ne 0 ]; then
    echo "This script requires root access. Please enter your password:"
    exec sudo bash "$0" "$@"
    exit 1
fi

echo ""
echo "[RENEW] SSL certificate for Bitnami LAMP with Certbot:"
echo "=== script start ==="
echo ""

read -p "Enter your domain: " DOMAIN
WILDCARD="*.$DOMAIN"
echo ""

echo "Using DOMAIN   = $DOMAIN"
echo "Using WILDCARD = $WILDCARD"
sleep 1

echo ""
echo "Please complete the ACME challenge on your DNS records:"
echo ""
sleep 2

sudo certbot -d $DOMAIN -d $WILDCARD --manual --preferred-challenges dns certonly

echo ""
sudo /opt/bitnami/ctlscript.sh stop

echo ""
echo "Move the old certificates:"

echo ""
echo "Which instance of Bitnami LAMP are you using:"
echo "1. Ubuntu"
echo "2. Debian Packages"
echo "3. Debian self-contained"
while [[ ! "$USER_INSTANCE" =~ ^[1-3]$ ]]; do
    read -p "Please select one: " USER_INSTANCE
done

case $USER_INSTANCE in
    1)
        echo ""
        echo "Option 1: Ubuntu"
        sudo mv /opt/bitnami/apache/conf/bitnami/certs/server.crt /opt/bitnami/apache/conf/bitnami/certs/server.crt.old
        sudo mv /opt/bitnami/apache/conf/bitnami/certs/server.key /opt/bitnami/apache/conf/bitnami/certs/server.key.old
        sudo ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/bitnami/apache/conf/bitnami/certs/server.key
        sudo ln -s /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/bitnami/apache/conf/bitnami/certs/server.crt
        ;;
    2)
        echo ""
        echo "Option 2: Debian Packages"
        sudo mv /opt/bitnami/apache2/conf/bitnami/certs/server.crt /opt/bitnami/apache2/conf/bitnami/certs/server.crt.old
        sudo mv /opt/bitnami/apache2/conf/bitnami/certs/server.key /opt/bitnami/apache2/conf/bitnami/certs/server.key.old
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/bitnami/apache2/conf/bitnami/certs/server.key
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/bitnami/apache2/conf/bitnami/certs/server.crt
        ;;
    3)
        echo ""
        echo "Option 3: Debian self-contained"
        sudo mv /opt/bitnami/apache2/conf/server.crt /opt/bitnami/apache2/conf/server.crt.old
        sudo mv /opt/bitnami/apache2/conf/server.key /opt/bitnami/apache2/conf/server.key.old
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/bitnami/apache2/conf/server.key
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/bitnami/apache2/conf/server.crt
        ;;
esac

echo ""
sudo /opt/bitnami/ctlscript.sh start

echo ""
echo "=== script end ==="