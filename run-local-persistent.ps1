$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyDir = Join-Path $root "python-app"
$feDir = Join-Path $root "frontend"

$backendPort = 8001
$frontendPort = 3001

# Backend (FastAPI demo mode)
$venv = Join-Path $pyDir ".venv"
if (!(Test-Path $venv)) {
  python -m venv $venv
}
$pyExe = Join-Path $venv "Scripts\\python.exe"
& $pyExe -m pip install -r (Join-Path $pyDir "requirements.demo.txt")
$env:DEMO_MODE = "1"
Start-Process -WorkingDirectory $pyDir -FilePath $pyExe -ArgumentList "-m uvicorn app:app --reload --port $backendPort"

# Frontend (run in its own process so it stays up)
Set-Location $feDir
if (!(Test-Path (Join-Path $feDir "node_modules"))) {
  npm install
}
Start-Process -WorkingDirectory $feDir -FilePath "cmd.exe" -ArgumentList "/c", "set REACT_APP_API_URL=http://localhost:$backendPort/triage&& set PORT=$frontendPort&& npm start"

Write-Host "Frontend: http://localhost:$frontendPort"
Write-Host "Backend:  http://localhost:$backendPort/triage"
