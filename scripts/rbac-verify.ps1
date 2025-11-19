param(
  [string]$Base = "https://localhost:7072"
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

function PostJson([string]$Url, $Obj, $Headers) {
  $json = $Obj | ConvertTo-Json -Depth 5
  try {
    if ($Headers) { Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Headers $Headers -Body $json }
    else { Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body $json }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      return @{ StatusCode = $status; Body = $text }
    } else { throw }
  }
}

function GetJson([string]$Url, $Headers) {
  try {
    if ($Headers) { Invoke-RestMethod -Method Get -Uri $Url -Headers $Headers }
    else { Invoke-RestMethod -Method Get -Uri $Url }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      return @{ StatusCode = $status; Body = $text }
    } else { throw }
  }
}

# Unique emails to avoid conflicts across runs
$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$domain = $env:TEST_SIGNUP_DOMAIN
if ([string]::IsNullOrWhiteSpace($domain)) { $domain = "leadrat.com" }
$email1 = "alice+$suffix@$domain"
$email2 = "bob+$suffix@$domain"

# --- Signup two users (idempotent: will conflict if already exists) ---
$u1 = PostJson "$Base/api/auth/signup" @{ FullName = 'Alice Example'; Email = $email1; Password = 'Password123'; Phone = $null } $null
$u2 = PostJson "$Base/api/auth/signup" @{ FullName = 'Bob Example';   Email = $email2; Password = 'Password123'; Phone = $null } $null

# --- Login to get tokens ---
$l1 = PostJson "$Base/api/auth/login" @{ Email = $email1; Password = 'Password123' } $null
$l2 = PostJson "$Base/api/auth/login" @{ Email = $email2; Password = 'Password123' } $null

$token1 = $l1.data.AccessToken
$token2 = $l2.data.AccessToken

if (-not $token1 -or -not $token2) {
  Write-Output 'Failed to obtain tokens'
  Write-Output '--- SIGNUP RESPONSES ---'
  $u1 | ConvertTo-Json -Depth 5
  $u2 | ConvertTo-Json -Depth 5
  Write-Output '--- LOGIN RESPONSES ---'
  $l1 | ConvertTo-Json -Depth 5
  $l2 | ConvertTo-Json -Depth 5
  exit 1
}

$h1 = @{ Authorization = "Bearer $token1" }
$h2 = @{ Authorization = "Bearer $token2" }

# --- Create notes ---
$n1 = PostJson "$Base/api/notes" @{ title = 'Alice Note 1' } $h1
$n2 = PostJson "$Base/api/notes" @{ title = 'Bob Note 1' }   $h2

$id1 = $n1.data.id
$id2 = $n2.data.id

# --- List and access checks ---
$list1 = GetJson "$Base/api/notes" $h1
$getBobAsAlice = GetJson "$Base/api/notes/$id2" $h1
$missingId = [guid]::NewGuid().ToString()
$getMissing = GetJson "$Base/api/notes/$missingId" $h1

# --- Output summary ---
Write-Output '--- LOGIN USERS ---'
@{ user1 = $l1.data.user; user2 = $l2.data.user } | ConvertTo-Json -Depth 5

Write-Output '--- CREATED NOTE IDS ---'
Write-Output "AliceNoteId=$id1"
Write-Output "BobNoteId=$id2"

Write-Output '--- LIST (Alice) ---'
$list1 | ConvertTo-Json -Depth 5

Write-Output '--- GET Bob as Alice (expect 403) ---'
$getBobAsAlice | ConvertTo-Json -Depth 5

Write-Output '--- GET Missing (expect 404) ---'
$getMissing | ConvertTo-Json -Depth 5
