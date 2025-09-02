param(
    [Parameter(Mandatory=$true)][string]$To,
    [Parameter(Mandatory=$true)][string]$Subject,
    [Parameter(Mandatory=$true)][string]$Body
)

Write-Host "🚀 PowerShell Email Sender" -ForegroundColor Green
Write-Host "To: $To" -ForegroundColor Yellow
Write-Host "Subject: $Subject" -ForegroundColor Yellow

try {
    # SMTP Configuration
    $smtpServer = "smtp.gmail.com"
    $smtpPort = 587
    $username = "edgeandcobarber@gmail.com"
    $password = "hapw tpmv kqku niqr"
    
    # Create credentials
    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($username, $securePassword)
    
    # Email parameters
    $emailParams = @{
        SmtpServer = $smtpServer
        Port = $smtpPort
        UseSsl = $true
        Credential = $credential
        From = $username
        To = $To
        Subject = $Subject
        Body = $Body
        BodyAsHtml = $true
    }
    
    Write-Host "📤 Sending email..." -ForegroundColor Yellow
    Send-MailMessage @emailParams
    
    Write-Host "✅ EMAIL SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Check inbox: $To" -ForegroundColor Cyan
    exit 0
    
} catch {
    Write-Host "❌ EMAIL FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
