# Smart-Tend AI - Windows Setup Script

Write-Host "🚀 Setting up Smart-Tend AI on Windows..." -ForegroundColor Cyan

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green

# Check Python
Write-Host "`n🐍 Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.9+ from https://python.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green

# Check PostgreSQL
Write-Host "`n🗄️  Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($null -eq $pgService) {
    Write-Host "⚠️  PostgreSQL service not found. Please install PostgreSQL" -ForegroundColor Red
} else {
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
}

# Setup Backend
Write-Host "`n🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend
if (!(Test-Path "node_modules")) {
    npm install
}
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Created .env file. Please update with your settings!" -ForegroundColor Yellow
}
Set-Location ..
Write-Host "✅ Backend setup complete" -ForegroundColor Green

# Setup Frontend
Write-Host "`n🎨 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend
if (!(Test-Path "node_modules")) {
    npm install
}
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env
}
Set-Location ..
Write-Host "✅ Frontend setup complete" -ForegroundColor Green

# Setup Face Service
Write-Host "`n🤖 Setting up Face Recognition Service..." -ForegroundColor Yellow
Set-Location face-service

# Create virtual environment
if (!(Test-Path "venv")) {
    python -m venv venv
}

# Activate and install dependencies
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Download models
python scripts/download_models.py

if (!(Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Created .env file. Please update with your settings!" -ForegroundColor Yellow
}

deactivate
Set-Location ..
Write-Host "✅ Face service setup complete" -ForegroundColor Green

# Create directories
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "face-service\storage\faces" | Out-Null
New-Item -ItemType Directory -Force -Path "face-service\logs" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env files in backend/ and face-service/" -ForegroundColor White
Write-Host "  2. Setup PostgreSQL database" -ForegroundColor White
Write-Host "  3. Run: .\scripts\start-dev.ps1" -ForegroundColor White