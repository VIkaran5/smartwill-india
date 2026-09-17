# build-dist.ps1
# SmartWill India — Assembles the dist/ folder for Capacitor packaging
# Run: .\scripts\build-dist.ps1
# Senior Note: This is NOT a webpack/vite build. We copy source files deliberately
# so Capacitor packages only what the Android WebView needs.

$root   = Split-Path $PSScriptRoot -Parent
$dist   = Join-Path $root "dist"

Write-Host "==> SmartWill India dist build starting..." -ForegroundColor Cyan
Write-Host "    Root : $root"
Write-Host "    Dist : $dist"

# 1. Clean and recreate dist/
if (Test-Path $dist) {
    Write-Host "==> Removing old dist/..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $dist
}
New-Item -ItemType Directory -Path $dist | Out-Null

# 2. Copy HTML pages
$htmlFiles = @("index.html", "app.html", "contact.html", "terms.html", "refunds.html")
foreach ($f in $htmlFiles) {
    $src = Join-Path $root $f
    if (Test-Path $src) {
        Copy-Item $src -Destination $dist
        Write-Host "    Copied $f" -ForegroundColor Green
    } else {
        Write-Warning "    WARN: $f not found, skipping."
    }
}

# 3. Copy asset folders (css, js)
$folders = @("css", "js")
foreach ($folder in $folders) {
    $src = Join-Path $root $folder
    if (Test-Path $src) {
        Copy-Item -Recurse $src -Destination $dist
        Write-Host "    Copied $folder/" -ForegroundColor Green
    } else {
        Write-Warning "    WARN: $folder/ not found, skipping."
    }
}

# 4. Copy assets folder if it exists
$assetsDir = Join-Path $root "assets"
if (Test-Path $assetsDir) {
    Copy-Item -Recurse $assetsDir -Destination $dist
    Write-Host "    Copied assets/" -ForegroundColor Green
}

# 5. Safety check — do NOT copy server/config files into dist
$forbidden = @("node_modules", ".git", "android", "ios", "api", "scripts", ".vercel", "capacitor.config.json", "package.json", "package-lock.json", "vercel.json", "firestore.rules")
foreach ($item in $forbidden) {
    $path = Join-Path $dist $item
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "    Removed forbidden item: $item" -ForegroundColor Red
    }
}

# 6. Report
$fileCount = (Get-ChildItem -Recurse -File $dist).Count
Write-Host ""
Write-Host "==> dist/ build complete! ($fileCount files)" -ForegroundColor Cyan
Write-Host "    Path: $dist"
