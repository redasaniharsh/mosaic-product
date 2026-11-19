param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [string]$Question = 'Describe the product in one sentence. Report any visible text, letters, numbers, logos, watermarks or brand marks. Say whether it is a microneedle dermal roller.',
  [string]$Model = 'gemini-2.5-flash'
)

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Harsh\Downloads\mosaic_product'
$key = (Get-Content -LiteralPath (Join-Path $repo '.secrets\gemini.key') -Raw).Trim()
$b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($ImagePath))
$mime = 'image/jpeg'
$bodyObj = @{
  contents = @(@{ parts = @(@{ text = $Question }, @{ inlineData = @{ mimeType = $mime; data = $b64 } }) })
}
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("vision-" + [guid]::NewGuid().ToString('N') + '.json')
$bodyObj | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $tmp -Encoding UTF8
$uri = "https://generativelanguage.googleapis.com/v1beta/models/$Model`:generateContent?key=$key"
$raw = (curl.exe -s -w "`n__HTTP__%{http_code}" -X POST -H "Content-Type: application/json" --data-binary "@$tmp" $uri 2>&1 | Out-String)
Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
$raw = $raw -replace [regex]::Escape($key), '***'
$idx = $raw.LastIndexOf('__HTTP__')
if ($idx -lt 0) { Write-Output $raw; exit 4 }
$http = $raw.Substring($idx + 8).Trim()
$json = $raw.Substring(0, $idx).Trim()
if ($http -ne '200') { Write-Output "HTTP $http"; Write-Output $json; exit 2 }
$resp = $json | ConvertFrom-Json
$parts = @()
if ($resp.candidates -and $resp.candidates[0].content.parts) { $parts = $resp.candidates[0].content.parts }
(($parts | Where-Object { $_.text } | ForEach-Object { $_.text }) -join ' ')
