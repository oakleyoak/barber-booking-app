Write-Host "Supabase SMTP deploy helper - deploy send-notification function and set secrets"

# Ensure supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Error: supabase CLI not found in PATH. Install from https://supabase.com/docs/guides/cli" -ForegroundColor Red
  exit 1
}

# Prompt for values
$smtpHost = "smtp.gmail.com"
$smtpPort = Read-Host "SMTP_PORT (press Enter for default 587)"
if ([string]::IsNullOrWhiteSpace($smtpPort)) { $smtpPort = "587" }

$smtpUser = Read-Host "SMTP_USER (your Gmail address)"
Write-Host "Enter SMTP_PASS (Google App Password). This will be hidden and not echoed."
$smtpPassSecure = Read-Host -AsSecureString "SMTP_PASS (hidden)"
# convert secure string to plain for passing to supabase CLI
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

$smtpFrom = Read-Host "SMTP_FROM (e.g. \"Edge & Co <youremail@gmail.com>\")"
$supabaseUrl = Read-Host "SUPABASE_URL (e.g. https://xyz.supabase.co)"
$serviceRole = Read-Host "SUPABASE_SERVICE_ROLE_KEY (your service role key - keep secret)"

Write-Host "\nAbout to set secrets in Supabase. These values will NOT be stored in this script file."
$confirm = Read-Host "Proceed and set secrets/deploy function? (y/n)"
if ($confirm -ne 'y') { Write-Host "Aborted by user."; exit 1 }

# Set secrets using supabase CLI
Write-Host "Setting Supabase secrets..."
supabase secrets set `
  SMTP_HOST="$smtpHost" `
  SMTP_PORT="$smtpPort" `
  SMTP_USER="$smtpUser" `
  SMTP_PASS="$smtpPass" `
  SMTP_FROM="$smtpFrom" `
  SUPABASE_URL="$supabaseUrl" `
  SUPABASE_SERVICE_ROLE_KEY="$serviceRole"

if ($LASTEXITCODE -ne 0) { Write-Host "Failed to set secrets" -ForegroundColor Red; exit 1 }

# Deploy the function
$funcDir = Join-Path -Path (Get-Location) -ChildPath "supabase\functions\send-notification"
if (-not (Test-Path $funcDir)) {
  Write-Host "Function directory not found at $funcDir" -ForegroundColor Red
  Write-Host "Make sure you run this from the repository root." -ForegroundColor Yellow
  exit 1
}

Push-Location $funcDir
Write-Host "Deploying send-notification function..."
supabase functions deploy send-notification
$deployExit = $LASTEXITCODE
Pop-Location

if ($deployExit -ne 0) {
  Write-Host "Function deploy failed (exit code $deployExit). Check CLI output and Supabase project settings." -ForegroundColor Red
  exit $deployExit
}

Write-Host "Deploy complete. You can test the function and view logs with:" -ForegroundColor Green
Write-Host "supabase functions invoke send-notification --body '{\"to\":\"you@example.com\",\"subject\":\"Test\",\"html\":\"<p>hi</p>\"}'" -ForegroundColor Cyan
Write-Host "supabase functions logs send-notification --since 1h" -ForegroundColor Cyan

Write-Host "Done." -ForegroundColor Green
