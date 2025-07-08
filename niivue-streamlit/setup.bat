@echo off
REM NiiVue Streamlit Component Setup Script (Windows)
REM This script builds the niivue app and the React component, then installs the Python package

echo 🧠 NiiVue Streamlit Component Setup
echo ======================================

REM Check if we're in the right directory
if not exist "package.json" if not exist "niivue-streamlit" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Step 1: Build the NiiVue app
echo 📦 Step 1: Building NiiVue app...
cd niivue || (
    echo ❌ Error: niivue directory not found
    exit /b 1
)

if not exist "package.json" (
    echo ❌ Error: niivue/package.json not found
    exit /b 1
)

echo Installing NiiVue dependencies...
call npm install

echo Building NiiVue app...
call npm run build

cd ..

REM Step 2: Build the React component
echo 📦 Step 2: Building React component...
cd niivue-streamlit\niivue_component\frontend || (
    echo ❌ Error: frontend directory not found
    exit /b 1
)

echo Installing React component dependencies...
call npm install

echo Building React component...
call npm run build

cd ..\..\..

REM Step 3: Install the Python package
echo 🐍 Step 3: Installing Python package...
cd niivue-streamlit

echo Installing Streamlit component in development mode...
pip install -e .

echo ✅ Setup complete!
echo.
echo 🚀 You can now run the Streamlit app:
echo    cd niivue-streamlit
echo    streamlit run app_component.py
echo.
echo 📚 Available apps:
echo    - app.py: Simple implementation with inline HTML
echo    - app_component.py: Uses the custom React component

pause
