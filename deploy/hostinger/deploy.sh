#!/usr/bin/env bash
# Deploys Social Stays (website + admin + API) on Hostinger as ONE Node app on socialstays.in.
#
#   ssh -p 65002 u365735344@145.79.210.89
#   bash ~/domains/socialstays.in/current/deploy/hostinger/deploy.sh        # deploy latest main
#   bash ~/domains/socialstays.in/current/deploy/hostinger/deploy.sh <ref>  # a branch or tag
#
# Each deploy is a fresh clone in releases/<stamp>, built there, then `current` is switched to it
# and the app restarted, so the live site never runs a half-built copy. The last 3 releases are kept;
# roll back with:  ln -sfn ~/domains/socialstays.in/releases/<old> ~/domains/socialstays.in/current && pkill -f "^lsnode:"
#
# Secrets and data live outside the releases, in shared/:
#   shared/backend.env   -> linked as backend/.env
#   shared/frontend.env  -> linked as frontend/.env.production.local
#   shared/uploads       -> admin uploads (UPLOADS_DIR points here)
#   shared/logs/app.log  -> the app's log
set -euo pipefail

DOMAIN="socialstays.in"
BASE="$HOME/domains/$DOMAIN"
REPO="${REPO:-https://github.com/ariseinfotechsofficial/Social-Stays.git}"
REF="${1:-main}"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"
export PATH="$NODE_BIN:$PATH"
export NEXT_TELEMETRY_DISABLED=1
# The host reports 64 CPUs but caps threads per account: Node/libuv/sharp would otherwise start dozens
# of threads each and builds die with "pthread_create: Resource temporarily unavailable".
export NODE_OPTIONS="--v8-pool-size=2" UV_THREADPOOL_SIZE=2 VIPS_CONCURRENCY=1 RAYON_NUM_THREADS=2 TOKIO_WORKER_THREADS=2

log() { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }

mkdir -p "$BASE/releases" "$BASE/shared/uploads" "$BASE/shared/backups" "$BASE/shared/logs"
for f in backend.env frontend.env; do
  [[ -f "$BASE/shared/$f" ]] || { echo "Missing $BASE/shared/$f — create it first (see deploy/hostinger/README.md)"; exit 1; }
done

LOCK="$BASE/.deploy.lock"
mkdir "$LOCK" 2>/dev/null || { echo "Another deploy is running (remove $LOCK if it crashed)"; exit 1; }
API_PID=""
cleanup() { [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true; rmdir "$LOCK" 2>/dev/null || true; }
trap cleanup EXIT

REL="$BASE/releases/$(date +%Y%m%d-%H%M%S)"
log "Cloning $REF into $REL"
git clone --quiet --depth 1 --branch "$REF" "$REPO" "$REL"
log "Commit: $(git -C "$REL" log -1 --format='%h %s')"

ln -s "$BASE/shared/backend.env" "$REL/backend/.env"
ln -s "$BASE/shared/frontend.env" "$REL/frontend/.env.production.local"

log "Backend: install + build"
(cd "$REL/backend" && npm ci --no-audit --no-fund --loglevel=error && npm run build)

log "Frontend: install"
(cd "$REL/frontend" && npm ci --no-audit --no-fund --loglevel=error)

# Pages are pre-rendered from the API at build time, so run this release's API on a private port
PORT=$((20000 + RANDOM % 20000))
log "Starting a temporary API on 127.0.0.1:$PORT for the build"
(cd "$REL/backend" && PORT=$PORT exec node --env-file=.env dist/server.js) > "$BASE/shared/logs/build-api.log" 2>&1 &
API_PID=$!
for _ in $(seq 1 60); do
  curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null && break
  kill -0 "$API_PID" 2>/dev/null || { cat "$BASE/shared/logs/build-api.log"; echo "Temporary API failed to start"; exit 1; }
  sleep 1
done

log "Frontend: build"
(cd "$REL/frontend" && API_URL="http://127.0.0.1:$PORT" npm run build)
kill "$API_PID" 2>/dev/null || true; API_PID=""

log "Pruning backend dev dependencies"
(cd "$REL/backend" && npm prune --omit=dev --no-audit --no-fund --loglevel=error)

log "Switching current -> $(basename "$REL") and restarting"
ln -sfn "$REL" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"

# LiteSpeed starts the app through this wrapper so the live process gets the same thread caps
mkdir -p "$BASE/bin"
cat > "$BASE/bin/node" <<EOF
#!/bin/sh
export UV_THREADPOOL_SIZE=4 VIPS_CONCURRENCY=2
exec $NODE_BIN/node --v8-pool-size=4 "\$@"
EOF
chmod 755 "$BASE/bin/node"

HTACCESS="$BASE/public_html/.htaccess"
cat > "$HTACCESS.new" <<EOF
# Managed by deploy/hostinger/deploy.sh — the whole domain is served by the Node app.
PassengerAppRoot $BASE/current
PassengerBaseURI /
PassengerNodejs $BASE/bin/node
PassengerAppType node
PassengerStartupFile deploy/hostinger/server.cjs
EOF
mv -f "$HTACCESS.new" "$HTACCESS"
rm -f "$BASE/public_html/default.php"

pkill -f "^lsnode:$BASE/" || true
sleep 1

log "Warming up"
code=000
for _ in $(seq 1 30); do
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 60 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" || true)
  [[ "$code" == "200" ]] && break
  sleep 2
done
home=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 60 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true)
echo "api/health: $code   home: $home"

log "Removing old releases (keeping 3)"
ls -1dt "$BASE"/releases/*/ | tail -n +4 | xargs -r rm -rf

if [[ "$code" != "200" || "$home" != "200" ]]; then
  echo "Site did not come up cleanly — check $BASE/shared/logs/app.log"
  tail -n 40 "$BASE/shared/logs/app.log" 2>/dev/null || true
  exit 1
fi
log "Live: https://$DOMAIN"
