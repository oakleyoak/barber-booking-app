<#
Interactive PowerShell helper: set required Supabase secrets and deploy the send-email Edge Function.

Usage: open PowerShell in the repo root and run:
  ./scripts/setup-send-email.ps1

Notes:
- You must run this locally; I cannot run commands on your machine.
- The script will call `supabase login` if you're not logged in.
- Replace values when prompted. Do NOT paste secrets into chat.
#>

<#
setup-send-email.ps1

Usage examples (run from repo root):
  powershell -ExecutionPolicy Bypass -File .\scripts\setup-send-email.ps1

Or run from any folder (script resolves its own directory):
  powershell -ExecutionPolicy Bypass -File "D:\path\to\repo\scripts\setup-send-email.ps1"

Non-interactive (provide values):
  powershell -ExecutionPolicy Bypass -File .\scripts\setup-send-email.ps1 -ProjectRef "your-project-ref" -ResendKey "sk_..." -ServiceRoleKey "srk_..." -SupabaseUrl "https://<project>.supabase.co" -Deploy
#>
param(
    [string]$ProjectRef,
    [string]$ResendKey,
    [string]$ServiceRoleKey,
    [string]$SupabaseUrl,
    [string]$FromEmail,
    [switch]$Deploy,
    [switch]$NonInteractive
)

function Write-Usage {
    Write-Host "\nThis script will set Supabase secrets (RESEND_API_KEY, SERVICE_ROLE_KEY, PROJECT_URL, FROM_EMAIL) and optionally deploy the 'send-email' Edge Function."
    Write-Host "You must have the Supabase CLI installed and be logged-in (run: supabase login)."
    Write-Host "If you don't want the script to deploy the function, omit the -Deploy switch and the script will only set secrets."
    Write-Host "\nExamples:";
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\setup-send-email.ps1"
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\setup-send-email.ps1 -ProjectRef myproj -ResendKey sk_xxx -ServiceRoleKey srk_xxx -SupabaseUrl https://myproj.supabase.co -FromEmail noreply@yourdomain.com -Deploy"
}

# Resolve script directory reliably (works regardless of current working dir)
$scriptPath = $MyInvocation.MyCommand.Definition
$scriptDir = Split-Path -Parent $scriptPath
$repoRoot = Split-Path -Parent $scriptDir

if (-not $ProjectRef -or -not $ResendKey -or -not $ServiceRoleKey -or -not $SupabaseUrl -or -not $FromEmail) {
    if ($NonInteractive) {
        Write-Host "Missing required parameters in non-interactive mode. Use -Help for usage." -ForegroundColor Red
        Write-Usage
        return
    }
}

if (-not $ProjectRef) {
    $ProjectRef = Read-Host "Enter your Supabase project ref (found in the Supabase dashboard URL or the project settings)"
}
if (-not $ResendKey) {
    Write-Host "\nIMPORTANT: If your Resend API key has been exposed, rotate it in the Resend dashboard now and use the new key here." -ForegroundColor Yellow
    $ResendKey = Read-Host -AsSecureString "Enter your RESEND_API_KEY (will be hidden)" | ConvertFrom-SecureString
    # ConvertFrom-SecureString returns an encrypted string for the local user; convert back immediately for use in CLI
    $ResendKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR((ConvertTo-SecureString $ResendKey)))
}
if (-not $ServiceRoleKey) {
    $ServiceRoleKey = Read-Host -AsSecureString "Enter your SUPABASE_SERVICE_ROLE_KEY (will be hidden)" | ConvertFrom-SecureString
    $ServiceRoleKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR((ConvertTo-SecureString $ServiceRoleKey)))
}
if (-not $SupabaseUrl) {
    $SupabaseUrl = Read-Host "Enter your SUPABASE_URL (e.g. https://<project-ref>.supabase.co)"
}
if (-not $FromEmail) {
    Write-Host "\nFor FROM email, you can use:" -ForegroundColor Yellow
    Write-Host "  1. 'onboarding@resend.dev' (Resend's testing domain - works immediately)"
    Write-Host "  2. Your own verified domain from Resend dashboard (e.g. noreply@yourdomain.com)"
    $FromEmail = Read-Host "Enter FROM email address (or press Enter for default: onboarding@resend.dev)"
    if ([string]::IsNullOrWhiteSpace($FromEmail)) {
        $FromEmail = "onboarding@resend.dev"
    }
}

# Check supabase CLI exists
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "Supabase CLI not found in PATH." -ForegroundColor Red
    Write-Host "Install it: npm install -g supabase  OR follow https://supabase.com/docs/guides/cli"
    Write-Usage
    return
}

# Show plan
Write-Host "\nWill set the following Supabase secrets for project ref: $ProjectRef" -ForegroundColor Cyan
Write-Host "  RESEND_API_KEY = (hidden)"
Write-Host "  SERVICE_ROLE_KEY = (hidden)"
Write-Host "  PROJECT_URL = $SupabaseUrl"
Write-Host "  FROM_EMAIL = $FromEmail"
$ok = Read-Host "Proceed? (y/n)"
if ($ok -ne 'y' -and $ok -ne 'Y') {
    Write-Host "Aborting at user request." -ForegroundColor Yellow
    return
}

# Build secret set command
Write-Host "\nRunning: supabase secrets set ..." -ForegroundColor Green
try {
    & supabase secrets set RESEND_API_KEY="$ResendKey" SERVICE_ROLE_KEY="$ServiceRoleKey" PROJECT_URL="$SupabaseUrl" FROM_EMAIL="$FromEmail" --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) {
        Write-Host "supabase secrets set returned a non-zero exit code: $LASTEXITCODE" -ForegroundColor Red
    } else {
        Write-Host "Secrets set successfully." -ForegroundColor Green
    }
} catch {
    Write-Host "Error running supabase secrets set: $_" -ForegroundColor Red
    Write-Host "You can run this command manually from a Powershell prompt:" -ForegroundColor Yellow
    Write-Host $secretsCmd
    return
}

if (-not $Deploy) {
    Write-Host "\nSkipping function deploy because -Deploy was not provided. If you want to deploy, rerun with -Deploy." -ForegroundColor Yellow
    Write-Host "After deploying, update the frontend helper at mobile-pwa/src/services/email.ts with the function URL: https://$ProjectRef.functions.supabase.co/send-email" -ForegroundColor Cyan
    return
}

# Deploy the Edge Function
$functionDir = Join-Path $repoRoot 'supabase\functions\send-email'
if (-not (Test-Path $functionDir)) {
    Write-Host "Could not find function source at: $functionDir" -ForegroundColor Red
    Write-Host "Expected the Edge Function source in 'supabase/functions/send-email'. Please confirm the repository contains it." -ForegroundColor Yellow
    return
}

Push-Location $functionDir
try {
    Write-Host "\nDeploying Edge Function 'send-email' from: $functionDir" -ForegroundColor Cyan
    & supabase functions deploy send-email --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) {
        Write-Host "supabase functions deploy returned non-zero exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "If you see errors about the Deno runtime in your editor, that's normal for TypeScript meant to run in Supabase Edge Functions."
    } else {
        Write-Host "Function deployed. The public invocation URL should be: https://$ProjectRef.functions.supabase.co/send-email" -ForegroundColor Green
        Write-Host "Copy that URL and then update mobile-pwa/src/services/email.ts to use it (replace the placeholder)."
    }
} catch {
    Write-Host "Error deploying function: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host "\nDone. Next steps:" -ForegroundColor Cyan
Write-Host "  1) If you haven't rotated the Resend key, do so now in the Resend dashboard." -ForegroundColor Yellow
Write-Host "  2) Update mobile-pwa/src/services/email.ts with: const FUNCTION_URL = 'https://$ProjectRef.functions.supabase.co/send-email'" -ForegroundColor Cyan
Write-Host "  3) Rebuild and redeploy the frontend (Netlify) so it picks up the updated helper URL and assets." -ForegroundColor Cyan
