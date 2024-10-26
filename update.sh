#!/bin/bash

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Restart the application
pm2 reload all

# Restart Nginx
sudo systemctl restart nginx