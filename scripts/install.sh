
#!/bin/bash
set -e

cd /home/ec2-user/app
npm ci --omit=dev

cat > /etc/systemd/system/mercadoandino.service <<'EOF'
[Unit]
Description=MercadoAndino Node.js
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/ec2-user/app
Environment=PORT=80
Environment=BUCKET=mercadoandino-uploads-agf-20261104
ExecStart=/usr/bin/node /home/ec2-user/app/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mercadoandino
