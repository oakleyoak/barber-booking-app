curl -X PUT "https://libpiqpetkiojiqzzlpa.supabase.co/functions/v1/send-notification" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIxOTAxMywiZXhwIjoyMDcxNzk1MDEzfQ.SqNzjIyouiiqYuo7NUdbbOri9XIcj1ay9ryW5dwh4FM" ^
  -H "Content-Type: application/javascript" ^
  --data-binary "@supabase/functions/send-notification/index.ts"
