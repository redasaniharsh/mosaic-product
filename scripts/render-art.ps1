param([switch]$Build)

# Rasterizes scripts/make-art.mjs output into image-drop/ as PNGs, then
# runs the normal importer so the app receives correctly sized JPEGs.
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "Chrome not found at $chrome" }
$svgDir = Join-Path $repo 'image-drop\svg'
$drop = Join-Path $repo 'image-drop'
$profile = Join-Path ([System.IO.Path]::GetTempPath()) 'mm-art-chrome-profile'

$svgs = Get-ChildItem -LiteralPath $svgDir -Filter *.svg -File | Sort-Object Name
if (-not $svgs.Count) { throw "No SVGs in $svgDir. Run node scripts/make-art.mjs first." }

foreach ($svg in $svgs) {
  $text = Get-Content -LiteralPath $svg.FullName -Raw
  if ($text -match 'width="(\d+)"\s+height="(\d+)"') {
    $w = $Matches[1]; $h = $Matches[2]
  } else {
    $w = 1024; $h = 1024
  }
  $out = Join-Path $drop ($svg.BaseName + '.png')
  $url = 'file:///' + ($svg.FullName -replace '\\', '/')
  $chromeArgs = @(
    '--headless=new', '--disable-gpu', '--disable-extensions', '--no-sandbox',
    "--user-data-dir=$profile", '--hide-scrollbars',
    "--screenshot=$out", "--window-size=$w,$h", $url
  )
  $errLog = Join-Path ([System.IO.Path]::GetTempPath()) 'mm-art-chrome.log'
  $proc = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -NoNewWindow -PassThru -RedirectStandardError $errLog
  if (-not (Test-Path -LiteralPath $out)) { throw "Rasterization failed for $($svg.Name): $(Get-Content $errLog -Tail 3 -ErrorAction SilentlyContinue)" }
  Write-Output ("{0} -> {1}x{2}" -f $svg.Name, $w, $h)
}

Write-Output ''
if ($Build) {
  & (Join-Path $repo 'scripts\import-images.ps1') -Build
} else {
  & (Join-Path $repo 'scripts\import-images.ps1')
}
