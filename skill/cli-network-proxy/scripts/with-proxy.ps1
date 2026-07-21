param(
  [Parameter(Mandatory = $true)]
  [string] $CommandLine,
  [switch] $Node
)

$env:HTTP_PROXY = 'http://127.0.0.1:10808'
$env:HTTPS_PROXY = 'http://127.0.0.1:10808'
$env:ALL_PROXY = 'socks5h://127.0.0.1:10808'
$env:NO_PROXY = 'localhost,127.0.0.1,::1'

if ($Node) {
  $env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-env-proxy').Trim())
}

Invoke-Expression $CommandLine
exit $LASTEXITCODE
