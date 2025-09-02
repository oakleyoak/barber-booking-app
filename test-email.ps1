# Test email sending script
Write-Host "Testing SMTP email function..." -ForegroundColor Green

$supabaseUrl = "https://libpiqpetkiojiqzzlpa.supabase.co"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIxOTAxMywiZXhwIjoyMDcxNzk1MDEzfQ.SqNzjIyouiiqYuo7NUdbbOri9XIcj1ay9ryW5dwh4FM"

$emailBody = @{
    to = "ismailhmahmut@googlemail.com"
    subject = "Test email from Edge & Co Barbershop"
    html = @"
<h2>Hello from Edge & Co!</h2>
<p>This is a test email from your barbershop's new notification system.</p>
<p>The email system is now working and ready to send:</p>
<ul>
    <li>Booking confirmations</li>
    <li>Appointment reminders</li>
    <li>Staff notifications</li>
</ul>
<p>Best regards,<br>Edge & Co Team</p>
"@
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $serviceRoleKey"
    "apikey" = $serviceRoleKey
}

try {
    Write-Host "Sending email to ismailhmahmut@googlemail.com..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/functions/v1/send-notification" -Body $emailBody -Headers $headers
    
    Write-Host "Email sent successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
}
catch {
    Write-Host "Error sending email:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}
