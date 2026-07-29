param(
  [switch] $Node,
  [Parameter(Mandatory = $true, Position = 0)]
  [string] $Command,
  [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
  [string[]] $Arguments
)

$BypassList = @(
  'localhost', '127.0.0.1', '::1',
  '.local', '.lan', '.internal', '.intranet', '.corp', '.home.arpa',
  '10.0.0.0/8', '100.64.0.0/10', '169.254.0.0/16',
  '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7', 'fe80::/10'
) -join ','

function Test-DirectHost {
  param([string] $HostName)

  $NormalizedHost = $HostName.Trim('[', ']').TrimEnd('.').ToLowerInvariant()
  if ($NormalizedHost -eq 'localhost' -or
      $NormalizedHost.EndsWith('.localhost') -or
      $NormalizedHost.EndsWith('.local') -or
      $NormalizedHost.EndsWith('.lan') -or
      $NormalizedHost.EndsWith('.internal') -or
      $NormalizedHost.EndsWith('.intranet') -or
      $NormalizedHost.EndsWith('.corp') -or
      $NormalizedHost.EndsWith('.home.arpa')) {
    return $true
  }

  $Address = $null
  if (-not [System.Net.IPAddress]::TryParse($NormalizedHost, [ref] $Address)) {
    return $false
  }

  if ($Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
    $Bytes = $Address.GetAddressBytes()
    return (
      $Bytes[0] -eq 10 -or
      $Bytes[0] -eq 127 -or
      ($Bytes[0] -eq 100 -and $Bytes[1] -ge 64 -and $Bytes[1] -le 127) -or
      ($Bytes[0] -eq 169 -and $Bytes[1] -eq 254) -or
      ($Bytes[0] -eq 172 -and $Bytes[1] -ge 16 -and $Bytes[1] -le 31) -or
      ($Bytes[0] -eq 192 -and $Bytes[1] -eq 168)
    )
  }

  $Bytes = $Address.GetAddressBytes()
  return (
    $Address.Equals([System.Net.IPAddress]::IPv6Loopback) -or
    (($Bytes[0] -band 0xfe) -eq 0xfc) -or
    ($Bytes[0] -eq 0xfe -and ($Bytes[1] -band 0xc0) -eq 0x80)
  )
}

$DetectedHosts = @(
  foreach ($Argument in $Arguments) {
    $Uri = $null
    if ([System.Uri]::TryCreate($Argument, [System.UriKind]::Absolute, [ref] $Uri) -and
        $Uri.Scheme -in @('http', 'https', 'ftp', 'ssh', 'git')) {
      $Uri.Host
    }
    elseif ($Argument -match '^(?:[^@\s]+@)?(\[[^\]]+\]|[^:/\s]+):.+$') {
      $Matches[1]
    }
  }
)

$Direct = $DetectedHosts.Count -gt 0 -and
  -not ($DetectedHosts | Where-Object { -not (Test-DirectHost $_) } | Select-Object -First 1)

if ($Direct) {
  Remove-Item Env:HTTP_PROXY, Env:HTTPS_PROXY, Env:ALL_PROXY,
    Env:http_proxy, Env:https_proxy, Env:all_proxy -ErrorAction SilentlyContinue
  $env:NODE_OPTIONS = (($env:NODE_OPTIONS -replace '(?i)(?:^|\s)--use-env-proxy(?=\s|$)', '').Trim())
}
else {
  $env:HTTP_PROXY = 'http://127.0.0.1:10808'
  $env:HTTPS_PROXY = 'http://127.0.0.1:10808'
  $env:ALL_PROXY = 'socks5h://127.0.0.1:10808'
  $env:NO_PROXY = $BypassList

  if ($Node) {
    $env:NODE_OPTIONS = (($env:NODE_OPTIONS + ' --use-env-proxy').Trim())
  }
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
