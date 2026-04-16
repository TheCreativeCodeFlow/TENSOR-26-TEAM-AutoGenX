@echo off
echo ========================================
echo Kadal Kavalan - Data Collection
echo ========================================
echo.
echo Fetching 2 years of marine weather data...
echo This will take 5-10 minutes.
echo.

cd /d "%~dp0"

node scripts\fetch_historical_data.js

echo.
echo ========================================
echo Done! Check models\data\historical_data.csv
echo ========================================
pause