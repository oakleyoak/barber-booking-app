@echo off
title Building Android APK for Booking Manager
color 0A
echo.
echo =====================================
echo    BUILDING ANDROID APK FILE
echo =====================================
echo.

echo Step 1: Preparing PWA for APK conversion...
cd /d "d:\PROJECT\booking app\mobile-pwa"
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Syncing with Android project...
call npx cap sync
if errorlevel 1 (
    echo ERROR: Sync failed!
    pause
    exit /b 1
)

echo.
echo =====================================
echo    APK BUILD OPTIONS
echo =====================================
echo.
echo Your PWA is ready for APK conversion!
echo Choose your preferred method:
echo.
echo [RECOMMENDED] Option 1: PWA Builder (Easiest)
echo   1. Go to: https://www.pwabuilder.com/
echo   2. Enter URL: http://192.168.0.77:4173/
echo   3. Click "Package for Stores" -^> Android
echo   4. Download APK file
echo   5. Install on any Android phone!
echo.
echo Option 2: Manual Android Studio
echo   1. Open Android Studio
echo   2. Open folder: d:\PROJECT\booking app\mobile-pwa\android
echo   3. Build -^> Generate Signed Bundle/APK -^> APK
echo   4. Follow Android Studio instructions
echo.
echo Option 3: Command Line (if Java SDK configured)
echo   - Run: gradlew.bat assembleDebug
echo   - APK will be in: android\app\build\outputs\apk\debug\
echo.
echo =====================================
echo    QUICK APK GENERATION
echo =====================================
echo.
echo Opening PWA Builder website...
start https://www.pwabuilder.com/
echo.
echo Your PWA URL to enter: http://192.168.0.77:4173/
echo.
echo The website will automatically convert your PWA to APK!
echo Download the APK and install it on any Android phone.
echo.
pause
