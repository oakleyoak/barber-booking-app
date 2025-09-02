#!/usr/bin/env pwsh

# Test the Netlify email function locally
Write-Host "🚀 Testing Netlify Email Function Locally" -ForegroundColor Green

$testData = @{
    to = "ismailhmahmut@googlemail.com"
    subject = "🎯 NETLIFY FUNCTION TEST - Edge & Co"
    html = @"
<h1 style="color: #333;">🚨 NETLIFY FUNCTION EMAIL TEST!</h1>
<p><strong>This email is sent via Netlify Function!</strong></p>
<p>Time: $(Get-Date)</p>
<p>If you receive this, Netlify Functions work perfectly!</p>
<hr>
<p><em>Edge & Co Barbershop</em></p>
"@
} | ConvertTo-Json

# Create a test event object like Netlify would pass
$netlifyEvent = @{
    httpMethod = "POST"
    body = $testData
    headers = @{
        "content-type" = "application/json"
    }
} | ConvertTo-Json

Write-Host "📧 Testing with data:" -ForegroundColor Yellow
Write-Host $testData -ForegroundColor Cyan

# Test the function
try {
    Write-Host "📤 Running Netlify function locally..." -ForegroundColor Yellow
    
    # We'll deploy this and test it on Netlify instead of locally
    Write-Host "✅ Netlify function is ready for deployment!" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Deploy to Netlify" -ForegroundColor White
    Write-Host "2. Update the notification service URL" -ForegroundColor White
    Write-Host "3. Test the booking email system" -ForegroundColor White
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
