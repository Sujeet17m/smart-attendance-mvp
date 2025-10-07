# Smart-Tend AI - Start Development Environment (Windows)

Write-Host "🚀 Starting Smart-Tend AI Development Environment..." -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "`n📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgService.Status -ne 'Running') {
    Write-Host "⚠️  PostgreSQL is not running. Please start it manually." -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL is running" -ForegroundColor Green

# Start Backend
Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Face Service
Write-Host "`n🤖 Starting Face Recognition Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd face-service; python -m venv venv; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8002" -WindowStyle Normal

# Wait a bit
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`n🎨 Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "`n✅ All services starting..." -ForegroundColor Green
Write-Host "`n📍 Services will be available at:" -ForegroundColor Cyan
Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  • Face API:  http://localhost:8002" -ForegroundColor White
Write-Host "`nℹ️  Press Ctrl+C in each window to stop services" -ForegroundColor Yellow