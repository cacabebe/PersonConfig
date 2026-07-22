param(
  [switch] $Node,
  [Parameter(Mandatory = $true, Position = 0)]
  [string] $Command,
  [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
  [string[]] $Arguments
)

$env:HTTP_PROXY = 'http://127.0.0.1:10808'
$env:HTTPS_PROXY = 'http://127.0.0.1:10808'
$env:ALL_PROXY = 'socks5h://127.0.0.1:10808'
$env:NO_PROXY = 'localhost,127.0.0.1,::1'

if ($Node) {
  $env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-env-proxy').Trim())
}

$ErrorActionPreference = 'Stop'

try {
  & $Command @Arguments
  if ($null -ne $LASTEXITCODE) {
    exit $LASTEXITCODE
  }
  exit 0
}
catch {
  Write-Error $_
  exit 1
}
