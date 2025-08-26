@echo off
echo ================================
echo  DEPLOYING BOOKING APP TO WEB
echo ================================
echo.

echo Step 1: Building the app...
cd /d "d:\PROJECT\booking app\mobile-pwa"
call npm run build

echo.
echo Step 2: Ready for deployment!
echo.
echo NEXT STEPS:
echo 1. Go to https://app.netlify.com/drop
echo 2. Drag the 'dist' folder to the upload area
echo 3. Your app will get a free URL like: https://random-name.netlify.app
echo 4. Anyone can visit that URL and install your app!
echo.
echo The 'dist' folder is at: d:\PROJECT\booking app\mobile-pwa\dist
echo.
pause
