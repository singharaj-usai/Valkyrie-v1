#!/bin/bash

# Create a new droplet
echo "Creating new droplet..."
doctl compute droplet create valkyrie-app \
    --image ubuntu-22-04-x64 \
    --size s-1vcpu-1gb \
    --region nyc1 \
    --ssh-keys $DO_SSH_KEY_FINGERPRINT

# Get the droplet IP
DROPLET_IP=$(doctl compute droplet get valkyrie-app --format PublicIPv4 --no-header)

# Wait for SSH to be available
until ssh -o StrictHostKeyChecking=no root@$DROPLET_IP 'exit'; do
    echo "Waiting for SSH..."
    sleep 5
done

# Setup the server
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'ENDSSH'
    # Update system
    apt update && apt upgrade -y

    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs

    # Install PM2
    npm install -g pm2

    # Install Nginx
    apt install -y nginx

    # Create app directory
    mkdir -p /var/www/valkyrie
    cd /var/www/valkyrie

    # Clone your repository
    git clone https://github.com/yourusername/your-repo.git .

    # Install dependencies
    npm install

    # Setup PM2 ecosystem file
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'valkyrie',
    script: 'server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

    # Setup Nginx configuration
    cat > /etc/nginx/sites-available/valkyrie << 'EOF'
server {
    listen 80;
    server_name valk.fun www.valk.fun;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /images/ {
        alias /var/www/valkyrie/images/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /uploads/ {
        alias /var/www/valkyrie/uploads/;
        client_max_body_size 50M;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

    # Enable the site
    ln -s /etc/nginx/sites-available/valkyrie /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default

    # Create necessary directories
    mkdir -p uploads images
    chmod 755 uploads images

    # Start the application with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup

    # Install SSL certificate
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d valk.fun -d www.valk.fun --non-interactive --agree-tos --email your-email@example.com

    # Restart Nginx
    systemctl restart nginx
ENDSSH

echo "Deployment complete! Your app is running at $DROPLET_IP"