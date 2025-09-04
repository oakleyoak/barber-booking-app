# Run DB migration: db/add_invoice_columns.sql
# Usage:
# 1) Set env var PG_CONN_URI to a Postgres libpq URI (postgresql://user:pass@host:port/dbname) and run:
#    powershell -File .\db\run_migration.ps1
# 2) Or run and paste the URI when prompted.

$scriptPath = Join-Path $PSScriptRoot "add_invoice_columns.sql"
if (-not (Test-Path $scriptPath)) {
    Write-Error "Migration file not found: $scriptPath"
    exit 1
}

$uri = $env:PG_CONN_URI
if (-not $uri) {
    $uri = Read-Host -AsSecureString "Enter Postgres connection URI (postgresql://user:pass@host:port/dbname)"
    # Convert secure string to plain text for immediate use only
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($uri)
    $uri = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql CLI not found. Install PostgreSQL client tools or run the SQL in Supabase SQL editor instead."
    exit 1
}

Write-Host "Running migration: $scriptPath"
try {
    & psql $uri -f $scriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "psql exited with code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "✅ Migration applied successfully."
} catch {
    Write-Error "Error running migration: $_"
    exit 1
}
