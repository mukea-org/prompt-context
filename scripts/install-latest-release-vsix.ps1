param(
  [string]$Repo = "",
  [string]$AssetPattern = "*.vsix",
  [string]$CodeBin = "code",
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

function Resolve-RepoFromPackageJson {
  $packageJsonPath = Join-Path $PSScriptRoot "..\package.json"
  if (-not (Test-Path $packageJsonPath)) {
    throw "Unable to find package.json at $packageJsonPath"
  }

  $pkg = Get-Content -Raw -Path $packageJsonPath | ConvertFrom-Json
  if (-not $pkg.repository -or -not $pkg.repository.url) {
    throw "package.json missing repository.url"
  }

  $url = [string]$pkg.repository.url
  # Supports: https://github.com/owner/repo(.git) and git@github.com:owner/repo(.git)
  $m = [regex]::Match($url, "(?:github\.com[:/])(?<owner>[^/]+)/(?<repo>[^/.]+)")
  if (-not $m.Success) {
    throw "Unable to parse GitHub repo from repository.url: $url"
  }

  return "$($m.Groups['owner'].Value)/$($m.Groups['repo'].Value)"
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Repo = Resolve-RepoFromPackageJson
}

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $OutDir = Join-Path $PSScriptRoot "..\.tmp"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
Write-Host "Fetching latest release: $apiUrl"

$headers = @{
  "Accept" = "application/vnd.github+json"
  "User-Agent" = "prompt-context-install-script"
}

$release = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
if (-not $release -or -not $release.assets) {
  throw "No release assets found for $Repo"
}

$asset = $release.assets | Where-Object { $_.name -like $AssetPattern } | Select-Object -First 1
if (-not $asset) {
  $names = ($release.assets | ForEach-Object { $_.name }) -join ", "
  throw "No asset matched pattern '$AssetPattern'. Available: $names"
}

$vsixName = [string]$asset.name
$downloadUrl = [string]$asset.browser_download_url
$destPath = Join-Path $OutDir $vsixName

Write-Host "Downloading: $downloadUrl"
Invoke-WebRequest -Uri $downloadUrl -Headers $headers -OutFile $destPath

Write-Host "Installing VSIX via '$CodeBin'..."
& $CodeBin --install-extension $destPath

Write-Host "Done: $destPath"
