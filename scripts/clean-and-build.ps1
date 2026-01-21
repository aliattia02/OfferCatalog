Set-Location C:\Users\aliat\New\Offer\android

Write-Host "Step 1: Stopping Gradle daemon..." -ForegroundColor Cyan
./gradlew --stop

Write-Host "Step 2: Cleaning build directories..." -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue app\.cxx
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue app\build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .gradle

Write-Host "Step 3: Cleaning node_modules build artifacts..." -ForegroundColor Cyan
Get-ChildItem -Path ..\node_modules -Filter "build" -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*\android\build" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Get-ChildItem -Path ..\node_modules -Filter ".cxx" -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*\android\.cxx" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Step 4: Building release APK..." -ForegroundColor Cyan
./gradlew assembleRelease --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== BUILD SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Checking APK output..." -ForegroundColor Cyan
    
    $apkPath = "app\build\outputs\apk\release"
    if (Test-Path $apkPath) {
        $apkFiles = Get-ChildItem -Path $apkPath -Filter "*.apk"
        Write-Host "Found $($apkFiles.Count) APK files:" -ForegroundColor Yellow
        foreach ($apk in $apkFiles) {
            $sizeInMB = [math]::Round($apk.Length / 1MB, 2)
            Write-Host "  - $($apk.Name) ($sizeInMB MB)" -ForegroundColor White
        }
        
        if ($apkFiles.Count -eq 1) {
            Write-Host "SUCCESS: Single APK generated!" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Multiple APK files found!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "=== BUILD FAILED ===" -ForegroundColor Red
}
