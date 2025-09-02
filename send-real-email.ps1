#!/usr/bin/env pwsh

# Direct email sending script using .NET SmtpClient
Write-Host "🚀 Testing direct email sending..." -ForegroundColor Green

try {
    # Load .NET assemblies
    Add-Type -AssemblyName System.Net.Mail
    Add-Type -AssemblyName System.Net

    # SMTP Configuration
    $smtpServer = "smtp.gmail.com"
    $smtpPort = 587
    $username = "edgeandcobarber@gmail.com"
    $password = "hapw tpmv kqku niqr"  # App password with spaces
    $fromEmail = "edgeandcobarber@gmail.com"
    $toEmail = "ismailhmahmut@googlemail.com"

    Write-Host "📧 Setting up SMTP client..." -ForegroundColor Yellow
    
    # Create SMTP client
    $smtpClient = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
    $smtpClient.EnableSsl = $true
    $smtpClient.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    
    # Create email message
    $mailMessage = New-Object System.Net.Mail.MailMessage
    $mailMessage.From = $fromEmail
    $mailMessage.To.Add($toEmail)
    $mailMessage.Subject = "🎯 DIRECT POWERSHELL TEST - Edge & Co"
    $mailMessage.Body = @"
<html>
<head><title>Email Test</title></head>
<body>
    <h1 style="color: #333;">🚨 EMAIL TEST SUCCESS!</h1>
    <p><strong>This email was sent directly from PowerShell!</strong></p>
    <p>Time: $(Get-Date)</p>
    <p>If you receive this, the email system is working!</p>
    <hr>
    <p><em>Edge & Co Barbershop</em></p>
</body>
</html>
"@
    $mailMessage.IsBodyHtml = $true

    Write-Host "📤 Sending email..." -ForegroundColor Yellow
    $smtpClient.Send($mailMessage)
    
    Write-Host "✅ EMAIL SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Check your inbox at: $toEmail" -ForegroundColor Cyan
    
    # Cleanup
    $mailMessage.Dispose()
    $smtpClient.Dispose()
    
} catch {
    Write-Host "❌ EMAIL FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.ToString())" -ForegroundColor Yellow
}

Write-Host "🔚 Script complete." -ForegroundColor Blue
