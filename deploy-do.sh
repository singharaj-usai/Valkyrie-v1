#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Create app directory
sudo mkdir -p /var/www/valkyrie
sudo chown -R $USER:$USER /var/www/valkyrie

# Clone repository (replace with your repo URL)
git clone https://github.com/singharaj-usai/my-project.git /var/www/valkyrie

# Install dependencies
cd /var/www/valkyrie
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
MAINTENANCE_MODE=false
MONGODB_URI=mongodb+srv://usais:fast12@cluster0.isaat.mongodb.net/
SESSION_SECRET=your_session_secret_here
MAINTENANCE_SECRET_KEY=mrbobbillyssecretkey
ENCRYPTION_KEY=BTFXRj0jrxSbaTKOj+aUVw3wPBIFKCx2/qveUxaIErJuVNDEXz9wvXmPuYAInkUS
UPLOAD_ACCESS_KEY=518484
MAILCHIMP_API_KEY=8bdf84c00e127f26802a94474aa96bdf-us17
MAILCHIMP_SERVER_PREFIX=https://us17.admin.mailchimp.com/
MAILCHIMP_LIST_ID=bee92a5a1e
EMAIL_USERNAME=support@alphablox.net
EMAIL_FROM_NAME=Alphablox Support
GOOGLE_CLIENT_ID=914198737416-ib8t5ejpv3kidadqlmi0q3dap9g10eih.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//04SMY1UGhY3HMCgYIARAAGAQSNwF-L9IrAavadS_tNXtDaHhBQhTcOuD0fo38j-jJ4AzWx7MsoOdc9fXoApn5VTeTc559W0PN7Zw
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
AWS_ACCESS_KEY_ID=AKIAQ4J5YFDU7HIC2XMC
AWS_SECRET_ACCESS_KEY=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
AWS_REGION=us-east-2
AWS_S3_BUCKET_NAME=c2.rblx18.com
BASE_URL=www.valk.fun
EMAIL_USER=djjd22938@gmail.com
EMAIL_PASS=iazx mivw xuhi ixcq
CLOUDFLARE_SECRET_KEY=0x4AAAAAAAw6-naWF42EyvhyITGX4NRuBqc
EOF

# Setup Nginx
sudo tee /etc/nginx/sites-available/valkyrie << EOF
server {
    listen 80;
    server_name alphablox.net www.alphablox.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    location /static/ {
        alias /var/www/valkyrie/public/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /uploads/ {
        alias /var/www/valkyrie/uploads/;
        client_max_body_size 50M;
    }
}
EOF

# Enable site and remove default
sudo ln -sf /etc/nginx/sites-available/valkyrie /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx

# Start application with PM2
cd /var/www/valkyrie
pm2 delete all
NODE_ENV=production PORT=3000 MAINTENANCE_MODE=false pm2 start server/server.js --name "valkyrie"
pm2 save
pm2 startup