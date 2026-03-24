# NexVest Investment Marketplace - Start Script
Write-Host "Starting NexVest..." -ForegroundColor Cyan

# Start backend
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot\backend'; node server.js" -WindowStyle Normal

# Start frontend
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot\frontend'; npm run dev -- --port 3000" -WindowStyle Normal

Write-Host "Backend: http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
