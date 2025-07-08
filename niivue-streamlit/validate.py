#!/usr/bin/env python3
"""
NiiVue Streamlit Component Validation Script
This script validates that all components are properly set up and working.
"""

import os
import sys
from pathlib import Path

def check_niivue_build():
    """Check if NiiVue build files exist"""
    print("🔍 Checking NiiVue build files...")
    
    app_dir = Path(__file__).parent.absolute()
    possible_build_dirs = [
        app_dir.parent / "niivue" / "build",
        app_dir / ".." / "niivue" / "build",
        Path.cwd() / "niivue" / "build",
    ]
    
    for build_dir in possible_build_dirs:
        if build_dir.exists():
            css_file = build_dir / "assets" / "index.css"
            js_file = build_dir / "assets" / "index.js"
            
            if css_file.exists() and js_file.exists():
                print(f"✅ NiiVue build files found at: {build_dir}")
                print(f"   - CSS: {css_file.stat().st_size:,} bytes")
                print(f"   - JS: {js_file.stat().st_size:,} bytes")
                return True
    
    print("❌ NiiVue build files not found")
    print("   Run: cd ../niivue && npm install && npm run build")
    return False

def check_react_component():
    """Check if React component is built"""
    print("\n🔍 Checking React component...")
    
    frontend_build = Path(__file__).parent / "niivue_component" / "frontend" / "build"
    
    if frontend_build.exists():
        # Check for main files
        build_files = list(frontend_build.rglob("*.js")) + list(frontend_build.rglob("*.css"))
        if build_files:
            print(f"✅ React component built at: {frontend_build}")
            print(f"   - Found {len(build_files)} build files")
            return True
    
    print("❌ React component not built")
    print("   Run: cd niivue_component/frontend && npm install && npm run build")
    return False

def check_python_dependencies():
    """Check if Python dependencies are installed"""
    print("\n🔍 Checking Python dependencies...")
    
    try:
        import streamlit
        print(f"✅ Streamlit installed: {streamlit.__version__}")
    except ImportError:
        print("❌ Streamlit not installed")
        print("   Run: pip install streamlit>=1.28.0")
        return False
    
    try:
        from niivue_component import niivue_viewer, read_build_files
        print("✅ niivue_component module importable")
        
        # Test reading build files
        css, js = read_build_files()
        if css and js:
            print(f"✅ Build files readable: CSS({len(css):,}), JS({len(js):,})")
            return True
        else:
            print("❌ Build files not readable")
            return False
            
    except ImportError:
        print("❌ niivue_component not installed")
        print("   Run: pip install -e .")
        return False

def check_example_files():
    """Check for example NIFTI files"""
    print("\n🔍 Checking for example files...")
    
    app_dir = Path(__file__).parent
    example_files = list(app_dir.glob("*.nii*"))
    
    if example_files:
        print(f"✅ Found {len(example_files)} NIFTI example files:")
        for f in example_files:
            print(f"   - {f.name} ({f.stat().st_size:,} bytes)")
        return True
    else:
        print("ℹ️  No example NIFTI files found")
        print("   This is optional - you can upload your own files")
        return True

def main():
    """Run all validation checks"""
    print("🧠 NiiVue Streamlit Component Validation")
    print("=" * 50)
    
    checks = [
        check_niivue_build(),
        check_react_component(),
        check_python_dependencies(),
        check_example_files()
    ]
    
    print("\n" + "=" * 50)
    
    if all(checks[:3]):  # First 3 are required
        print("✅ All required components are ready!")
        print("\n🚀 You can now run:")
        print("   streamlit run app_component.py")
        print("   streamlit run demo.py")
        return 0
    else:
        print("❌ Some components need setup")
        print("\n🔧 Run the setup script:")
        print("   ./setup.sh (Linux/Mac)")
        print("   setup.bat (Windows)")
        return 1

if __name__ == "__main__":
    sys.exit(main())
