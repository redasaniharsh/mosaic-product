param(
  [string]$DropDir,
  [string]$OutRoot,
  [switch]$Build
)

# Imports raw image-generator exports into the app's fixed image slots.
# Crops to the right aspect ratio, resizes, compresses and renames, so the
# frontend never needs a code change.
#
#   npm run images
#   npm run images -- -Build
#
# Raw files go in image-drop/ with the exact base name from IMAGE_PROMPTS.md.
# .png, .jpg and .jpeg are accepted.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo = Split-Path $PSScriptRoot -Parent
if (-not $DropDir) { $DropDir = Join-Path $repo 'image-drop' }
if (-not $OutRoot) { $OutRoot = Join-Path $repo 'web\public' }

$products = @(
  'advanced-hair-growth-serum',
  'anti-hairfall-shampoo',
  'biotin-gummies',
  'hair-health-tablets',
  'beard-growth-oil',
  'beard-growth-roller',
  'vitamin-c-serum',
  'under-eye-cream',
  'acne-control-serum',
  'testosterone-booster',
  'delay-spray',
  'weight-loss-program',
  'clock-cap'
)
$avatars = @('raj-gandhi', 'shreyans-jain', 'manan-sancheti', 'harsh-redasani', 'chandan-singh')
$progress = @('crown-week-01', 'crown-week-03', 'crown-week-05')

$groups = @(
  [pscustomobject]@{ Folder = 'products'; Width = 1024; Height = 1024; Names = $products },
  [pscustomobject]@{ Folder = 'avatars'; Width = 512; Height = 512; Names = $avatars },
  [pscustomobject]@{ Folder = 'progress'; Width = 800; Height = 1000; Names = $progress }
)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' } |
  Select-Object -First 1

function Save-Jpeg([System.Drawing.Bitmap]$Bitmap, [string]$Path, [int]$Quality) {
  $enc = New-Object System.Drawing.Imaging.EncoderParameters 1
  $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
  $Bitmap.Save($Path, $codec, $enc)
  $enc.Dispose()
}

function Import-Image([string]$Source, [string]$Destination, [int]$Width, [int]$Height) {
  $img = [System.Drawing.Image]::FromFile($Source)
  try {
    $targetRatio = $Width / $Height
    $srcRatio = $img.Width / $img.Height

    if ($srcRatio -gt $targetRatio) {
      $cropH = $img.Height
      $cropW = [int][math]::Round($img.Height * $targetRatio)
      $cropX = [int][math]::Round(($img.Width - $cropW) / 2)
      $cropY = 0
    } else {
      $cropW = $img.Width
      $cropH = [int][math]::Round($img.Width / $targetRatio)
      $cropX = 0
      $cropY = [int][math]::Round(($img.Height - $cropH) / 2)
    }

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#F2EFE8'))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
    $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
    $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    Save-Jpeg $bmp $Destination 86
    if ((Get-Item -LiteralPath $Destination).Length -gt 320000) {
      Save-Jpeg $bmp $Destination 74
    }
    $bmp.Dispose()
  } finally {
    $img.Dispose()
  }
}

if (-not (Test-Path -LiteralPath $DropDir)) {
  New-Item -ItemType Directory -Path $DropDir | Out-Null
  Write-Host "Created $DropDir. Drop your raw images there and run this again." -ForegroundColor Yellow
  exit 0
}

$extensions = @('.png', '.jpg', '.jpeg')
$rows = @()
$missing = @()
$imported = 0

foreach ($group in $groups) {
  $outFolder = Join-Path (Join-Path $OutRoot $group.Folder) ''
  New-Item -ItemType Directory -Force -Path $outFolder | Out-Null

  foreach ($name in $group.Names) {
    $source = Get-ChildItem -LiteralPath $DropDir -File |
      Where-Object { $_.BaseName -ieq $name -and $extensions -contains $_.Extension.ToLower() } |
      Select-Object -First 1

    if (-not $source) {
      $missing += "$($group.Folder)/$name.jpg"
      continue
    }

    $destination = Join-Path $outFolder "$name.jpg"
    Import-Image -Source $source.FullName -Destination $destination -Width $group.Width -Height $group.Height
    $imported += 1

    $bytes = (Get-Item -LiteralPath $destination).Length
    $ratio = [math]::Round($group.Width / $group.Height, 3)
    $rows += [pscustomobject]@{
      Folder = $group.Folder
      File = "$name.jpg"
      Size = "$($group.Width)x$($group.Height)"
      Ratio = $ratio
      KB = [math]::Round($bytes / 1KB)
      Source = $source.Name
    }
  }
}

if ($rows.Count) {
  $rows | Format-Table -AutoSize
}

$total = ($groups | ForEach-Object { $_.Names.Count } | Measure-Object -Sum).Sum
Write-Host ""
Write-Host "Imported $imported of $total images." -ForegroundColor Green

if ($missing.Count) {
  Write-Host "Not supplied yet (left unchanged):" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  $_" }
}

if ($Build -and $imported -gt 0) {
  Write-Host ""
  Write-Host "Building web app..." -ForegroundColor Cyan
  Push-Location $repo
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed." }
  } finally {
    Pop-Location
  }
  Write-Host "Build OK." -ForegroundColor Green
}

if ($imported -gt 0) {
  Write-Host ""
  Write-Host "Next:" -ForegroundColor Cyan
  Write-Host '  git add -A'
  Write-Host '  git commit -m "Replace product imagery"'
  Write-Host '  git push'
  Write-Host "Render redeploys automatically."
}
