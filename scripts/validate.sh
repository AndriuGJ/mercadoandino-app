
#!/bin/bash
set -e

for i in $(seq 1 12); do
  if curl -fsS http://localhost/health; then
    exit 0
  fi
  sleep 3
done

echo "MercadoAndino no responde en /health"
exit 1
