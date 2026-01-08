$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyDir = Join-Path $root "python-app"
$feDir = Join-Path $root "frontend"

# Backend (FastAPI demo mode)
$venv = Join-Path $pyDir ".venv"
if (!(Test-Path $venv)) {
  python -m venv $venv
}
$pyExe = Join-Path $venv "Scripts\\python.exe"
& $pyExe -m pip install -r (Join-Path $pyDir "requirements.demo.txt")
$env:DEMO_MODE = "1"
$backendPort = 8001
Start-Process -WorkingDirectory $pyDir -FilePath $pyExe -ArgumentList "-m uvicorn app:app --reload --port $backendPort"

# Frontend
Set-Location $feDir
if (!(Test-Path (Join-Path $feDir "node_modules"))) {
  npm install
}
$env:REACT_APP_API_URL = "http://localhost:$backendPort/triage"
$env:PORT = "3001"
npm start
