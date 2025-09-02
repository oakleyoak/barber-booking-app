Write-Host "🚀 SENDING TEST EMAIL RIGHT NOW..." -ForegroundColor Cyan

$body = @{
    to = "ismailhmahmut@googlemail.com"
    subject = "🎯 LIVE TEST - Edge & Co Barbershop - $(Get-Date -Format 'HH:mm:ss')"
    html = @"
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #2563eb; border-radius: 10px;">
    <h1 style="color: #2563eb; text-align: center;">🎉 EMAIL SYSTEM WORKING!</h1>
    <h2 style="color: #16a34a;">✅ Live Test Successful</h2>
    <p>Hello! This email was sent <strong>RIGHT NOW</strong> at <strong>$(Get-Date)</strong> from your Edge & Co barbershop booking system.</p>
    
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
        <h3 style="color: #15803d; margin-top: 0;">✅ System Status: FULLY OPERATIONAL</h3>
        <ul style="color: #166534;">
            <li><strong>Gmail SMTP:</strong> Connected ✅</li>
            <li><strong>App Password:</strong> Working ✅</li>
            <li><strong>Supabase Function:</strong> Deployed ✅</li>
            <li><strong>Authorization Headers:</strong> Fixed ✅</li>
        </ul>
    </div>

    <p style="font-size: 18px; color: #2563eb;"><strong>🎉 Your booking notification system is 100% operational!</strong></p>
    
    <p>When customers make bookings, you will receive notification emails just like this one.</p>
    
    <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
        <strong>Edge & Co Barbershop</strong><br/>
        Booking System Live Test • Sent: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    </p>
</div>
"@
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI"
    "Content-Type" = "application/json"
}

try {
    Write-Host "📧 Sending to: ismailhmahmut@googlemail.com" -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri "https://libpiqpetkiojiqzzlpa.supabase.co/functions/v1/send-email" -Method Post -Body $body -Headers $headers
    
    Write-Host ""
    Write-Host "🎉 EMAIL SENT SUCCESSFULLY! 🎉" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📬 CHECK YOUR EMAIL NOW: ismailhmahmut@googlemail.com" -ForegroundColor Yellow -BackgroundColor Blue
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR SENDING EMAIL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Details: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error details" -ForegroundColor Red
        }
    }
}
