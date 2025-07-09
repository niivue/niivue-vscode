@echo off
setlocal enabledelayedexpansion

echo 🔨 Building NiiVue Streamlit Component

REM Change to the script directory
cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "niivue_component" (
    echo ❌ Error: niivue_component directory not found
    echo Please run this script from the niivue-streamlit directory
    exit /b 1
)

REM Step 1: Build NiiVue if the directory exists
if exist "..\niivue" (
    echo 📦 Building NiiVue...
    cd ..\niivue
    
    if not exist "package.json" (
        echo ❌ Error: ..\niivue\package.json not found
        exit /b 1
    )
    
    call npm install
    call npm run build
    cd ..\niivue-streamlit
    echo ✅ NiiVue build complete
) else (
    echo ⚠️  Warning: ..\niivue directory not found, skipping NiiVue build
    echo    Make sure NiiVue is built manually
)

REM Step 2: Create assets directory in component
echo 📁 Creating assets directory...
if not exist "niivue_component\assets" mkdir niivue_component\assets

REM Step 3: Copy NiiVue assets
if exist "..\niivue\build\assets" (
    echo 📋 Copying NiiVue assets...
    copy "..\niivue\build\assets\index.css" "niivue_component\assets\" >nul
    copy "..\niivue\build\assets\index.js" "niivue_component\assets\" >nul
    copy "..\niivue\build\assets\*.wasm" "niivue_component\assets\" >nul 2>nul
    copy "..\niivue\build\assets\worker*.js" "niivue_component\assets\" >nul 2>nul
    echo ✅ Assets copied successfully
) else (
    echo ❌ Error: ..\niivue\build\assets not found
    echo    Please build NiiVue first: cd ..\niivue ^&^& npm run build
    exit /b 1
)

REM Step 4: Build the React component
echo ⚛️  Building React component...
cd niivue_component\frontend

if not exist "package.json" (
    echo ❌ Error: frontend\package.json not found
    exit /b 1
)

call npm install
call npm run build
cd ..\..

REM Step 5: Install the component in development mode
echo 🐍 Installing component in development mode...
pip install -e .

echo.
echo 🎉 Build complete!
echo.
echo 📋 Assets included (auto-generated, not in git):
dir "niivue_component\assets\"
echo.
echo 🚀 You can now:
echo    - Test with: streamlit run test_simplified_api.py
echo    - Run main app: streamlit run app_component.py
echo    - Build for PyPI: python setup.py sdist bdist_wheel
