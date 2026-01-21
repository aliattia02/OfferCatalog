Set-Location C:\Users\aliat\New\Offer\android

Write-Host "Analyzing APK contents..." -ForegroundColor Cyan

$apkPath = "app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    Write-Host "`nAPK Location: $apkPath" -ForegroundColor Green
    
    # Get APK size
    $apkSize = (Get-Item $apkPath).Length
    $apkSizeMB = [math]::Round($apkSize / 1MB, 2)
    Write-Host "Total APK Size: $apkSizeMB MB" -ForegroundColor Yellow
    
    # Extract APK to analyze contents
    $extractPath = "app\build\outputs\apk\release\apk-analysis"
    
    if (Test-Path $extractPath) {
        Remove-Item -Recurse -Force $extractPath
    }
    
    Write-Host "`nExtracting APK for analysis..." -ForegroundColor Cyan
    Expand-Archive -Path $apkPath -DestinationPath $extractPath -Force
    
    # Check lib folder for native libraries
    $libPath = Join-Path $extractPath "lib"
    if (Test-Path $libPath) {
        Write-Host "`nNative Libraries (lib folder):" -ForegroundColor Yellow
        $architectures = Get-ChildItem -Path $libPath -Directory
        
        foreach ($arch in $architectures) {
            $archSize = (Get-ChildItem -Path $arch.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
            $archSizeMB = [math]::Round($archSize / 1MB, 2)
            $fileCount = (Get-ChildItem -Path $arch.FullName -Recurse -File).Count
            
            Write-Host "  - $($arch.Name): $archSizeMB MB ($fileCount files)" -ForegroundColor White
        }
        
        if ($architectures.Count -gt 1) {
            Write-Host "`n⚠ PROBLEM FOUND: Multiple architectures detected!" -ForegroundColor Red
            Write-Host "Your APK contains $($architectures.Count) architectures instead of just 1 (arm64-v8a)" -ForegroundColor Red
        } else {
            Write-Host "`n✓ Good: Only 1 architecture present" -ForegroundColor Green
        }
    }
    
    # Check assets size
    $assetsPath = Join-Path $extractPath "assets"
    if (Test-Path $assetsPath) {
        $assetsSize = (Get-ChildItem -Path $assetsPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $assetsSizeMB = [math]::Round($assetsSize / 1MB, 2)
        Write-Host "`nAssets Size: $assetsSizeMB MB" -ForegroundColor Yellow
    }
    
    # Check for debug symbols
    Write-Host "`nChecking for debug symbols..." -ForegroundColor Cyan
    $hasDebugSymbols = $false
    Get-ChildItem -Path $libPath -Recurse -File | ForEach-Object {
        if ($_.Name -like "*_debug*" -or $_.Extension -eq ".sym") {
            $hasDebugSymbols = $true
        }
    }
    
    if ($hasDebugSymbols) {
        Write-Host "⚠ Debug symbols found - these increase APK size" -ForegroundColor Yellow
    }
    
    Write-Host "`n" -NoNewline
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    Write-Host "RECOMMENDATION:" -ForegroundColor Yellow
    Write-Host "Expected size for arm64-v8a only: 50-60 MB" -ForegroundColor White
    Write-Host "Current size: $apkSizeMB MB" -ForegroundColor White
    
    if ($apkSizeMB -gt 70) {
        Write-Host "`nThe APK is larger than expected. Possible causes:" -ForegroundColor Yellow
        Write-Host "1. Multiple architectures included (check above)" -ForegroundColor White
        Write-Host "2. Debug information not stripped" -ForegroundColor White
        Write-Host "3. Unoptimized assets" -ForegroundColor White
    }
    
} else {
    Write-Host "APK not found at: $apkPath" -ForegroundColor Red
}
