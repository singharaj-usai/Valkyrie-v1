#!/bin/bash
echo "Deploying application..."

# Pull latest code
git pull

# Install dependencies
npm install

# Rebuild application (if needed)
npm run build

# Restart PM2
pm2 reload all

echo "Application deployed!"

