#!/bin/bash

echo "=== System Status ==="
date
echo

echo "=== Node.js Process ==="
pm2 list
pm2 logs --lines 50
echo

echo "=== System Resources ==="
df -h
free -m
top -bn1 | head -n 20
echo

echo "=== Nginx Status ==="
systemctl status nginx
echo

echo "=== SSL Certificate Status ==="
certbot certificates