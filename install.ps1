#Requires -Version 5.1

# ================================================================
#  VetSystem — Instalacion automatica para Windows
#
#  COMO USARLO:
#    1. Abre PowerShell (busca "PowerShell" en el menu inicio)
#    2. Navega a donde descargaste este archivo, por ejemplo:
#         cd C:\Users\TuUsuario\Downloads
#    3. Ejecuta:
#         powershell -ExecutionPolicy Bypass -File install.ps1
#
#  Que instala:
#    - Node.js 20 LTS
#    - Git
#    - Docker Desktop (para PostgreSQL y Redis)
#    - El proyecto VetSystem completo
#
#  Al finalizar abre automaticamente: http://localhost:3000
# ================================================================

param()
$ErrorActionPreference = "Stop"

# ── Auto-elevar a Administrador ─────────────────────────────────
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Necesito permisos de Administrador. Abriendo ventana elevada..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# ── Utilidades ───────────────────────────────────────────────────
function Step { param($n, $t) Write-Host "`n  [$n/10] $t" -ForegroundColor Cyan }
function OK   { param($t) Write-Host "         v $t" -ForegroundColor Green }
function Warn { param($t) Write-Host "         ! $t" -ForegroundColor Yellow }
function Fail {
    param($t)
    Write-Host "`n  [ERROR] $t`n" -ForegroundColor Red
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

function Refresh-Env {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")
}

$REPO_URL = "https://github.com/GabrielFig/vet_system.git"
$APP_DIR  = "$env:USERPROFILE\vetSystem"
$LOG_DIR  = "$env:TEMP\vetsystem"
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

# ── Banner ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor Blue
Write-Host "  |    VetSystem - Instalacion automatica    |" -ForegroundColor Blue
Write-Host "  |           Windows Setup Script           |" -ForegroundColor Blue
Write-Host "  +------------------------------------------+" -ForegroundColor Blue
Write-Host ""

# ── 1. Verificar winget ──────────────────────────────────────────
Step 1 "Verificando gestor de paquetes (winget)..."
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Fail "winget no esta disponible.`n  Abre la Microsoft Store, busca 'App Installer' e instalalo.`n  Luego vuelve a ejecutar este script."
}
OK "winget disponible"

# ── 2. Node.js 20 ────────────────────────────────────────────────
Step 2 "Verificando Node.js 20..."

$nodeOk = $false
if (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        $v = node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))" 2>$null
        if ([int]$v -ge 20) { $nodeOk = $true }
    } catch {}
}

if (-not $nodeOk) {
    Write-Host "         Instalando Node.js 20 LTS..." -ForegroundColor Gray
    winget install --id OpenJS.NodeJS.LTS -e `
        --accept-source-agreements --accept-package-agreements --silent
    Refresh-Env
}
OK "Node.js $(node --version)  -  npm $(npm --version)"

# ── 3. Git ───────────────────────────────────────────────────────
Step 3 "Verificando Git..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "         Instalando Git..." -ForegroundColor Gray
    winget install --id Git.Git -e `
        --accept-source-agreements --accept-package-agreements --silent
    Refresh-Env
}
OK "$(git --version)"

# ── 4. Docker Desktop ────────────────────────────────────────────
Step 4 "Verificando Docker Desktop..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "         Instalando Docker Desktop (descarga ~500 MB, espera...)..." -ForegroundColor Gray
    winget install --id Docker.DockerDesktop -e `
        --accept-source-agreements --accept-package-agreements --silent
    Refresh-Env
    Write-Host ""
    Warn "Docker Desktop acaba de instalarse."
    Warn "Si el script falla en el proximo paso, reinicia Windows y vuelve a ejecutarlo."
    Write-Host ""
}

# Iniciar Docker Desktop si el daemon no responde
$dockerUp = $false
try { docker info 2>$null | Out-Null; $dockerUp = $true } catch {}

if (-not $dockerUp) {
    $candidatos = @(
        "$env:PROGRAMFILES\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe"
    )
    $dockerExe = $candidatos | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($dockerExe) {
        Write-Host "         Iniciando Docker Desktop..." -ForegroundColor Gray
        Start-Process $dockerExe
    } else {
        Write-Host ""
        Warn "No encontre Docker Desktop.exe automaticamente."
        Warn "Abrelo manualmente desde el Menu Inicio y espera a que aparezca"
        Warn "el icono de la ballena en la barra de tareas del sistema."
        Read-Host "`n         Presiona Enter cuando Docker Desktop este corriendo"
    }

    Write-Host -NoNewline "         Esperando que Docker arranque (puede tardar 1-2 min)"
    for ($i = 0; $i -lt 36; $i++) {
        Start-Sleep -Seconds 5
        Write-Host -NoNewline "."
        try {
            docker info 2>$null | Out-Null
            Write-Host " OK"
            $dockerUp = $true
            break
        } catch {}
    }

    if (-not $dockerUp) {
        Fail "Docker no respondio en 3 minutos.`n  Asegurate de que Docker Desktop este abierto y corriendo,`n  luego vuelve a ejecutar este script."
    }
}
OK "Docker $(docker --version)"

# ── 5. Clonar repositorio ─────────────────────────────────────────
Step 5 "Clonando el repositorio..."

if (Test-Path "$APP_DIR\.git") {
    Warn "El directorio ya existe, actualizando con git pull..."
    git -C $APP_DIR pull --ff-only
} else {
    git clone $REPO_URL $APP_DIR
}

Set-Location $APP_DIR
OK "Repositorio listo en $APP_DIR"

# ── 6. Variables de entorno ───────────────────────────────────────
Step 6 "Configurando archivos .env..."

if (-not (Test-Path "apps\api\.env")) {
    Copy-Item ".env.example" "apps\api\.env"
}

if (-not (Test-Path "apps\web\.env.local")) {
    Set-Content -Path "apps\web\.env.local" `
        -Value "NEXT_PUBLIC_API_URL=http://localhost:3001" `
        -Encoding utf8
}

OK "apps/api/.env y apps/web/.env.local configurados"

# ── 7. Dependencias npm ──────────────────────────────────────────
Step 7 "Instalando dependencias npm (puede tardar 1-2 minutos)..."

npm install
if ($LASTEXITCODE -ne 0) { Fail "npm install fallo" }
OK "Dependencias instaladas"

# ── 8. PostgreSQL + Redis ─────────────────────────────────────────
Step 8 "Levantando PostgreSQL y Redis con Docker Compose..."

docker compose up -d
if ($LASTEXITCODE -ne 0) { Fail "docker compose up fallo. Revisa que Docker Desktop este corriendo." }

Write-Host -NoNewline "         Esperando que PostgreSQL este listo"
$pgReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    Write-Host -NoNewline "."
    docker compose exec -T postgres pg_isready -U vetuser -d vetdb 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK"
        $pgReady = $true
        break
    }
    if ($i -eq 29) { Fail "PostgreSQL no respondio en 60 segundos" }
}
OK "PostgreSQL y Redis corriendo"

# ── 9. Compilar + Migrar + Seed ──────────────────────────────────
Step 9 "Compilando la aplicacion e inicializando la base de datos..."

Write-Host "         Compilando paquetes compartidos (shared-types, utils)..." -ForegroundColor Gray
npm run build:packages
if ($LASTEXITCODE -ne 0) { Fail "build:packages fallo" }
OK "Paquetes compartidos compilados"

Push-Location "apps\api"

Write-Host "         Prisma: generando cliente..." -ForegroundColor Gray
npx prisma generate --schema=prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { Fail "prisma generate fallo" }

Write-Host "         Prisma: aplicando migraciones..." -ForegroundColor Gray
npx prisma migrate deploy --schema=prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { Fail "prisma migrate deploy fallo" }

Write-Host "         Prisma: cargando datos de ejemplo..." -ForegroundColor Gray
npx prisma db seed
if ($LASTEXITCODE -ne 0) { Fail "prisma db seed fallo" }

Pop-Location
OK "Base de datos migrada y con datos de ejemplo"

Write-Host "         Compilando API (NestJS)..." -ForegroundColor Gray
npm run build --workspace=apps/api
if ($LASTEXITCODE -ne 0) { Fail "build de la API fallo" }
OK "API compilada"

Write-Host "         Compilando Frontend (Next.js, tarda un poco)..." -ForegroundColor Gray
npm run build --workspace=apps/web
if ($LASTEXITCODE -ne 0) { Fail "build del Frontend fallo" }
OK "Frontend compilado"

# ── 10. Iniciar servicios en segundo plano ────────────────────────
Step 10 "Iniciando los servicios..."

# Detener procesos previos si existen
foreach ($pidFile in @("$LOG_DIR\api.pid", "$LOG_DIR\web.pid")) {
    if (Test-Path $pidFile) {
        $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
        if ($oldPid) {
            Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1

# Crear scripts lanzadores (se ejecutan en ventanas PowerShell ocultas)
$apiLauncher = "$LOG_DIR\run-api.ps1"
@"
Set-Location '$APP_DIR\apps\api'
node dist/main *>> '$LOG_DIR\api.log'
"@ | Out-File $apiLauncher -Encoding utf8

$webLauncher = "$LOG_DIR\run-web.ps1"
@"
Set-Location '$APP_DIR\apps\web'
& npx next start *>> '$LOG_DIR\web.log'
"@ | Out-File $webLauncher -Encoding utf8

# Lanzar API
$apiProc = Start-Process powershell `
    -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$apiLauncher`"" `
    -WindowStyle Hidden -PassThru
$apiProc.Id | Out-File "$LOG_DIR\api.pid" -Encoding ascii
OK "API iniciada (PID: $($apiProc.Id)) - log: $LOG_DIR\api.log"

# Lanzar Frontend
$webProc = Start-Process powershell `
    -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$webLauncher`"" `
    -WindowStyle Hidden -PassThru
$webProc.Id | Out-File "$LOG_DIR\web.pid" -Encoding ascii
OK "Frontend iniciado (PID: $($webProc.Id)) - log: $LOG_DIR\web.log"

# Esperar a que ambos servicios respondan HTTP
Write-Host -NoNewline "         Esperando que los servicios respondan"
$apiUp = $false
$webUp = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    Write-Host -NoNewline "."
    try {
        Invoke-WebRequest "http://localhost:3001" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null
        $apiUp = $true
    } catch {}
    try {
        Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null
        $webUp = $true
    } catch {}
    if ($apiUp -and $webUp) { Write-Host " OK"; break }
}

if (-not ($apiUp -and $webUp)) {
    Write-Host ""
    Warn "Los servicios pueden tardar un poco mas en estar listos."
    Warn "Espera 10-15 segundos y abre http://localhost:3000 manualmente."
} else {
    # Abrir navegador automaticamente
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:3000"
}

# ── Resumen ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  +----------------------------------------------+" -ForegroundColor Green
Write-Host "  |   VetSystem instalado y ejecutando           |" -ForegroundColor Green
Write-Host "  +----------------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "  Abre en tu navegador:"
Write-Host "    http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  API REST:  http://localhost:3001"
Write-Host ""
Write-Host "  Ver logs en tiempo real (abre una ventana PowerShell y corre):"
Write-Host "    Get-Content '$LOG_DIR\api.log' -Wait"
Write-Host "    Get-Content '$LOG_DIR\web.log' -Wait"
Write-Host ""
Write-Host "  Para detener todo:"
Write-Host "    Stop-Process -Id (Get-Content '$LOG_DIR\api.pid') -Force"
Write-Host "    Stop-Process -Id (Get-Content '$LOG_DIR\web.pid') -Force"
Write-Host "    docker compose -f '$APP_DIR\docker-compose.yml' down"
Write-Host ""
Write-Host "  Para volver a iniciar (proximas veces sin reinstalar):"
Write-Host "    docker compose -f '$APP_DIR\docker-compose.yml' up -d"
Write-Host "    powershell -ExecutionPolicy Bypass -File '$LOG_DIR\run-api.ps1' &"
Write-Host "    powershell -ExecutionPolicy Bypass -File '$LOG_DIR\run-web.ps1' &"
Write-Host ""

Read-Host "Presiona Enter para cerrar esta ventana"
