param(
  [string]$Base = "https://localhost:7443",
  [string]$Domain = $env:TEST_SIGNUP_DOMAIN
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Domain)) { $Domain = 'leadrat.com' }

function CurlJsonPost([string]$Url, $Obj, [string[]]$ExtraHeaders) {
  $json = $Obj | ConvertTo-Json -Depth 5
  $cargs = @('-s','-k','-H','Content-Type: application/json')
  if ($ExtraHeaders) { foreach ($h in $ExtraHeaders) { $cargs += @('-H', $h) } }
  $cargs += @('-d', $json, $Url)
  $txt = & curl.exe @cargs
  try { return $txt | ConvertFrom-Json } catch { return $txt }
}

function CurlGet([string]$Url, [string[]]$ExtraHeaders) {
  $cargs = @('-s','-k')
  if ($ExtraHeaders) { foreach ($h in $ExtraHeaders) { $cargs += @('-H', $h) } }
  $cargs += $Url
  $txt = & curl.exe @cargs
  try { return $txt | ConvertFrom-Json } catch { return $txt }
}

function CurlGetStatus([string]$Url, [string[]]$ExtraHeaders) {
  $cargs = @('-s','-k','-o','NUL','-w','%{http_code}')
  if ($ExtraHeaders) { foreach ($h in $ExtraHeaders) { $cargs += @('-H', $h) } }
  $cargs += $Url
  $code = & curl.exe @cargs
  return [int]$code
}

# Unique emails per run
$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email1 = "alice+$suffix@$Domain"
$email2 = "bob+$suffix@$Domain"

Write-Output "BASE=$Base"
Write-Output "DOMAIN=$Domain"
Write-Output "EMAIL1=$email1"
Write-Output "EMAIL2=$email2"

# Signup two users
$u1 = CurlJsonPost "$Base/api/auth/signup" @{ FullName='Alice Example'; Email=$email1; Password='Password123'; Phone=$null } $null
$u2 = CurlJsonPost "$Base/api/auth/signup" @{ FullName='Bob Example';   Email=$email2; Password='Password123'; Phone=$null } $null

# Login
$l1 = CurlJsonPost "$Base/api/auth/login" @{ Email=$email1; Password='Password123' } $null
$l2 = CurlJsonPost "$Base/api/auth/login" @{ Email=$email2; Password='Password123' } $null

$token1 = $l1.data.AccessToken
$token2 = $l2.data.AccessToken

if (-not $token1 -or -not $token2) {
  Write-Output 'FAILED: Could not obtain tokens'
  Write-Output '--- SIGNUP RESPONSES ---'
  $u1 | ConvertTo-Json -Depth 5
  $u2 | ConvertTo-Json -Depth 5
  Write-Output '--- LOGIN RESPONSES ---'
  $l1 | ConvertTo-Json -Depth 5
  $l2 | ConvertTo-Json -Depth 5
  exit 1
}

$h1 = @("Authorization: Bearer $token1")
$h2 = @("Authorization: Bearer $token2")

# Create notes
$n1 = CurlJsonPost "$Base/api/notes" @{ title='Alice Note 1' } $h1
$n2 = CurlJsonPost "$Base/api/notes" @{ title='Bob Note 1' }   $h2
$id1 = $n1.data.id
$id2 = $n2.data.id

# List and access checks
$list1 = CurlGet "$Base/api/notes" $h1
$codeBobAsAlice = CurlGetStatus "$Base/api/notes/$id2" $h1
$missingId = [guid]::NewGuid().ToString()
$codeMissing = CurlGetStatus "$Base/api/notes/$missingId" $h1

Write-Output '--- SUMMARY ---'
Write-Output "AliceNoteId=$id1"
Write-Output "BobNoteId=$id2"
Write-Output 'LIST(Alice):'
$list1 | ConvertTo-Json -Depth 5
Write-Output "GET Bob as Alice -> HTTP $codeBobAsAlice (expect 403)"
Write-Output "GET Missing      -> HTTP $codeMissing (expect 404)"

if ($codeBobAsAlice -eq 403 -and $codeMissing -eq 404) {
  Write-Output 'RESULT: PASS (RBAC checks as expected)'
  exit 0
} else {
  Write-Output 'RESULT: CHECK (one or more RBAC checks unexpected)'
  exit 2
}
