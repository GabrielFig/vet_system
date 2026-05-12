#!/bin/bash
# ================================================================
#  VetSystem — Instalación automática para Ubuntu
#
#  Uso:
#    bash install.sh
#
#  Qué hace:
#    1. Instala git, curl y dependencias base del sistema
#    2. Instala Node.js 20 (vía NodeSource)
#    3. Instala Docker Engine + Docker Compose Plugin
#    4. Clona el repositorio de GitHub
#    5. Configura los archivos .env
#    6. Instala dependencias npm (workspaces)
#    7. Levanta PostgreSQL y Redis con Docker Compose
#    8. Compila los paquetes compartidos
#    9. Ejecuta migraciones y seed de la base de datos
#   10. Compila la API (NestJS) y el Frontend (Next.js)
#   11. Inicia ambos servicios en segundo plano
#
#  Al finalizar:
#    Frontend → http://localhost:3000
#    API      → http://localhost:3001
# ================================================================
set -euo pipefail

# ── Colores ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}[$1/11]${NC}${BOLD} $2${NC}"; }
ok()   { echo -e "       ${GREEN}✔${NC} $1"; }
warn() { echo -e "       ${YELLOW}!${NC} $1"; }
die()  { echo -e "\n       ${RED}✘ ERROR:${NC} $1\n" >&2; exit 1; }

REPO_URL="https://github.com/GabrielFig/vet_system.git"
APP_DIR="$HOME/vetSystem"
LOG_DIR="/tmp/vetsystem"
mkdir -p "$LOG_DIR"

# ── Banner ───────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}  ║        🐾  VetSystem  — Setup            ║${NC}"
echo -e "${BLUE}${BOLD}  ║     Instalación automática Ubuntu         ║${NC}"
echo -e "${BLUE}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Dependencias del sistema ──────────────────────────────────
step 1 "Actualizando el sistema e instalando dependencias base..."
sudo apt-get update -y -qq
sudo apt-get install -y -qq \
    git curl wget build-essential \
    ca-certificates gnupg lsb-release apt-transport-https
ok "git, curl, build-essential listos"

# ── 2. Node.js 20 ────────────────────────────────────────────────
step 2 "Verificando Node.js 20..."

NEED_NODE=false
if ! command -v node &>/dev/null; then
    NEED_NODE=true
else
    NODE_VER=$(node -e 'process.stdout.write(process.version.split(".")[0].replace("v",""))')
    [ "$NODE_VER" -lt 20 ] 2>/dev/null && NEED_NODE=true || true
fi

if $NEED_NODE; then
    echo "       Instalando Node.js 20 desde NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y -qq nodejs
fi
ok "Node.js $(node --version)  ·  npm $(npm --version)"

# ── 3. Docker Engine ─────────────────────────────────────────────
step 3 "Verificando Docker..."

if ! command -v docker &>/dev/null; then
    echo "       Instalando Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y -qq
    sudo apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
fi

sudo systemctl enable docker >/dev/null 2>&1 || true
sudo systemctl start docker >/dev/null 2>&1 || true

# Añadir el usuario al grupo docker si aún no está
if ! groups "$USER" | grep -qw docker; then
    sudo usermod -aG docker "$USER"
fi

# Elegir comando docker: con sudo si el grupo no está activo aún
if docker ps >/dev/null 2>&1; then
    DC="docker compose"
else
    DC="sudo docker compose"
fi

ok "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)  ·  Compose $(${DC} version --short 2>/dev/null || echo 'ok')"

# ── 4. Clonar repositorio ────────────────────────────────────────
step 4 "Clonando el repositorio..."

if [ -d "$APP_DIR/.git" ]; then
    warn "El directorio $APP_DIR ya existe → actualizando con git pull..."
    git -C "$APP_DIR" pull --ff-only
else
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
ok "Repositorio listo en $APP_DIR"

# ── 5. Variables de entorno ──────────────────────────────────────
step 5 "Configurando archivos .env..."

# API: copiar el .env.example si no existe un .env
if [ ! -f apps/api/.env ]; then
    cp .env.example apps/api/.env
fi

# Frontend: archivo .env.local con la URL de la API
if [ ! -f apps/web/.env.local ]; then
    cat > apps/web/.env.local <<'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
ENVEOF
fi

ok "apps/api/.env y apps/web/.env.local configurados"

# ── 6. Dependencias npm ──────────────────────────────────────────
step 6 "Instalando dependencias npm (puede tardar 1-2 minutos)..."
npm install
ok "Dependencias instaladas"

# ── 7. PostgreSQL + Redis con Docker ─────────────────────────────
step 7 "Levantando PostgreSQL y Redis con Docker Compose..."
$DC up -d

echo -n "       Esperando que PostgreSQL esté listo"
for i in $(seq 1 30); do
    if $DC exec -T postgres pg_isready -U vetuser -d vetdb >/dev/null 2>&1; then
        echo -e " ${GREEN}✔${NC}"
        break
    fi
    echo -n "."
    sleep 2
    [ "$i" -eq 30 ] && die "PostgreSQL no respondió después de 60 segundos. Revisa: $DC logs postgres"
done

ok "PostgreSQL 16 y Redis 7 corriendo"

# ── 8. Paquetes compartidos ──────────────────────────────────────
step 8 "Compilando paquetes compartidos (shared-types, utils)..."
npm run build:packages
ok "shared-types y utils compilados"

# ── 9. Base de datos: migraciones y seed ─────────────────────────
step 9 "Inicializando la base de datos..."

(
    cd apps/api
    npx prisma generate --schema=prisma/schema.prisma
    npx prisma migrate deploy --schema=prisma/schema.prisma
    npx prisma db seed
)

ok "Migraciones aplicadas y datos de ejemplo cargados"

# ── 10. Build de la API y el Frontend ────────────────────────────
step 10 "Compilando la aplicación (esto puede tardar unos minutos)..."

echo "       Compilando API (NestJS)..."
npm run build --workspace=apps/api
ok "API compilada"

echo "       Compilando Frontend (Next.js)..."
npm run build --workspace=apps/web
ok "Frontend compilado"

# ── 11. Iniciar servicios en segundo plano ───────────────────────
step 11 "Iniciando los servicios..."

# Detener instancias previas si existen
if [ -f "$LOG_DIR/api.pid" ]; then
    OLD_PID=$(cat "$LOG_DIR/api.pid")
    kill "$OLD_PID" 2>/dev/null || true
fi
if [ -f "$LOG_DIR/web.pid" ]; then
    OLD_PID=$(cat "$LOG_DIR/web.pid")
    kill "$OLD_PID" 2>/dev/null || true
fi
sleep 1

# Iniciar API (NestJS producción)
pushd "$APP_DIR/apps/api" > /dev/null
nohup node dist/main > "$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo "$API_PID" > "$LOG_DIR/api.pid"
popd > /dev/null
ok "API iniciada (PID: $API_PID)"

# Iniciar Frontend (Next.js producción)
pushd "$APP_DIR/apps/web" > /dev/null
nohup npx next start > "$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$LOG_DIR/web.pid"
popd > /dev/null
ok "Frontend iniciado (PID: $WEB_PID)"

# Esperar a que los servicios respondan HTTP
echo -n "       Esperando que los servicios arranquen"
API_UP=false
WEB_UP=false
for i in $(seq 1 25); do
    sleep 2
    echo -n "."
    curl -sf --max-time 2 http://localhost:3001 >/dev/null 2>&1 && API_UP=true || true
    curl -sf --max-time 2 http://localhost:3000 >/dev/null 2>&1 && WEB_UP=true || true
    if $API_UP && $WEB_UP; then
        echo -e " ${GREEN}✔${NC}"
        break
    fi
done
# Si el loop terminó sin confirmar, avisar (los servicios pueden seguir levantando)
if ! $API_UP || ! $WEB_UP; then
    echo ""
    warn "Los servicios pueden tardar unos segundos más en responder."
fi

# ── Resumen final ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}  ║  ✅  VetSystem instalado y ejecutando        ║${NC}"
echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}🌐 Abre en tu navegador:${NC}"
echo -e "       ${BOLD}http://localhost:3000${NC}"
echo ""
echo -e "  ${BOLD}🔌 API REST:${NC}  http://localhost:3001"
echo ""
echo -e "  ${BOLD}📄 Ver logs en tiempo real:${NC}"
echo -e "       tail -f $LOG_DIR/api.log   # API"
echo -e "       tail -f $LOG_DIR/web.log   # Frontend"
echo ""
echo -e "  ${BOLD}🛑 Para detener todo:${NC}"
echo -e "       kill \$(cat $LOG_DIR/api.pid) \$(cat $LOG_DIR/web.pid) 2>/dev/null || true"
echo -e "       $DC down"
echo ""
echo -e "  ${BOLD}🔄 Para volver a iniciar (sin reinstalar):${NC}"
echo -e "       $DC up -d"
echo -e "       cd $APP_DIR/apps/api && nohup node dist/main > $LOG_DIR/api.log 2>&1 &"
echo -e "       cd $APP_DIR/apps/web && nohup npx next start > $LOG_DIR/web.log 2>&1 &"
echo ""
