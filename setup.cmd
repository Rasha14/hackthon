@echo off
REM Lost&Found AI+ - Quick Start Script (Windows)
REM Run this batch file to set up the application

echo.
echo ======================================
echo  Lost^&Found AI+ - Quick Start
echo ======================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not installed. Please install Node.js 16+
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Success: Found %NODE_VERSION%
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Backend installation failed
    pause
    exit /b 1
)
echo Success: Backend dependencies installed
cd ..
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Frontend installation failed
    pause
    exit /b 1
)
echo Success: Frontend dependencies installed
echo.

REM Create .env file
echo Creating environment files...

if not exist ".env" (
    (
        echo VITE_API_BASE_URL=http://localhost:5000/api
        echo VITE_FIREBASE_API_KEY=AIzaSyBw5mGmXmL2cmWFAw9K675P-mKgXrJRVJk
        echo VITE_FIREBASE_AUTH_DOMAIN=hackthon-281b2.firebaseapp.com
        echo VITE_FIREBASE_PROJECT_ID=hackthon-281b2
        echo VITE_FIREBASE_STORAGE_BUCKET=hackthon-281b2.firebasestorage.app
        echo VITE_FIREBASE_MESSAGING_SENDER_ID=631295249130
        echo VITE_FIREBASE_APP_ID=1:631295249130:web:8edae8331658df66562593
    ) > .env
    echo Success: Created .env
) else (
    echo Success: .env already exists
)

if not exist "backend\.env" (
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo JWT_SECRET=your_jwt_secret_here_change_in_production
        echo FIREBASE_PROJECT_ID=hackthon-281b2
    ) > backend\.env
    echo Success: Created backend\.env
) else (
    echo Success: backend\.env already exists
)
echo.

REM Completion message
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps - Start in separate terminals:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm start
echo.
echo Terminal 2 (Frontend):
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo Documentation:
echo   - DEPLOYMENT_GUIDE.md
echo   - FRONTEND_IMPLEMENTATION_GUIDE.md
echo   - COMPONENT_INTEGRATION_TEMPLATE.md
echo.
pause
