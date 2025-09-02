# Direct deploy via Supabase Management API
param(
    [string]$ProjectRef = "libpiqpetkiojiqzzlpa",
    [string]$AccessToken = ""
)

if ([string]::IsNullOrEmpty($AccessToken)) {
    Write-Host "Please provide your Supabase access token:"
    Write-Host "1. Go to https://supabase.com/dashboard/account/tokens"
    Write-Host "2. Create a new token"
    Write-Host "3. Run: .\deploy-direct.ps1 -AccessToken 'your_token_here'"
    exit 1
}

$functionCode = Get-Content "supabase\functions\send-notification\index.ts" -Raw

$body = @{
    name = "send-notification"
    source = $functionCode
    entrypoint = "index.ts"
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/functions" -Method Post -Body $body -Headers $headers
    Write-Host "Function deployed successfully!" -ForegroundColor Green
    Write-Host $response
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}
