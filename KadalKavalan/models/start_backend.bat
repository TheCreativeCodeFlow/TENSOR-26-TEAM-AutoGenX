@echo off
echo ========================================
echo Kadal Kavalan - ML Backend
echo ========================================
echo.
echo Starting FastAPI server on port 8000...
echo.

cd /d "%~dp0backend"

pip install -r requirements.txt

echo.
echo Starting server...
uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo.
echo Server running at http://localhost:8000
echo API docs at http://localhost:8000/docs
pause