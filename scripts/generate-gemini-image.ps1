param(
  [Parameter(Mandatory = $true)][string]$Name,
  [Parameter(Mandatory = $true)][string]$Prompt,
  [string]$Model = 'gemini-3.1-flash-image',
  [string]$AspectRatio = '1:1',
  [string]$OutDir
)

# Generates one raw image into image-drop/ using a local, git-ignored API key.
# Key source: .secrets/gemini.key, or the GEMINI_API_KEY environment variable.
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) { $OutDir = Join-Path $repo 'image-drop' }
$keyPath = Join-Path $repo '.secrets\gemini.key'
if (Test-Path $keyPath) {
  $key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
} elseif ($env:GEMINI_API_KEY) {
  $key = $env:GEMINI_API_KEY.Trim()
} else {
  throw 'No Gemini API key found in .secrets/gemini.key or GEMINI_API_KEY.'
}

$bodyObj = @{
  contents         = @(@{ parts = @(@{ text = $Prompt }) })
  generationConfig = @{
    responseModalities = @('TEXT', 'IMAGE')
    imageConfig        = @{ aspectRatio = $AspectRatio }
  }
}
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("gen-" + [guid]::NewGuid().ToString('N') + '.json')
$bodyObj | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $tmp -Encoding UTF8
$uri = "https://generativelanguage.googleapis.com/v1beta/models/$Model`:generateContent?key=$key"

$raw = (curl.exe -s -w "`n__HTTP__%{http_code}" -X POST -H "Content-Type: application/json" --data-binary "@$tmp" $uri 2>&1 | Out-String)
Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
if (-not $raw) { throw 'curl.exe produced no output.' }
$raw = $raw -replace [regex]::Escape($key), '***'
$idx = $raw.LastIndexOf('__HTTP__')
if ($idx -lt 0) {
  Write-Output 'Unexpected curl output (no HTTP marker):'
  Write-Output $raw
  exit 4
}
$http = $raw.Substring($idx + 8).Trim()
$json = $raw.Substring(0, $idx).Trim()

if ($http -ne '200') {
  Write-Output "HTTP $http for $Model"
  Write-Output $json
  exit 2
}

$resp = $json | ConvertFrom-Json
$parts = @()
if ($resp.candidates -and $resp.candidates[0].content.parts) { $parts = $resp.candidates[0].content.parts }
$imagePart = $parts | Where-Object { $_.inlineData -or $_.inline_data } | Select-Object -First 1
if (-not $imagePart) {
  Write-Output 'HTTP 200 but no image in response.'
  Write-Output (($parts | Where-Object { $_.text } | ForEach-Object { $_.text }) -join ' ')
  exit 3
}

$inline = if ($imagePart.inlineData) { $imagePart.inlineData } else { $imagePart.inline_data }
$mime = if ($inline.mimeType) { $inline.mimeType } else { $inline.mime_type }
$ext = switch ($mime) {
  'image/jpeg' { '.jpg' }
  'image/webp' { '.webp' }
  'image/gif' { '.gif' }
  default { '.png' }
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$outPath = Join-Path $OutDir ($Name + $ext)
[System.IO.File]::WriteAllBytes($outPath, [Convert]::FromBase64String($inline.data))

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($outPath)
try {
  Write-Output ('{0} | {1}x{2} | {3} KB | {4}' -f $outPath, $img.Width, $img.Height, [math]::Round((Get-Item $outPath).Length / 1KB), $mime)
} finally {
  $img.Dispose()
}
