#!/usr/bin/env python3
"""
Demo script to validate the NiiVue Streamlit integration
"""

import os
import sys
from pathlib import Path

def check_setup():
    """Check if the setup is complete"""
    print("🔍 Checking NiiVue Streamlit Integration Setup...")
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    if current_dir.name != "niivue-streamlit":
        print("❌ Please run this script from the niivue-streamlit directory")
        return False
    
    # Check if niivue build exists
    niivue_build = current_dir.parent / "niivue" / "build"
    if not niivue_build.exists():
        print("❌ NiiVue build directory not found. Please run:")
        print("   cd ../niivue && npm install && npm run build")
        return False
    else:
        print("✅ NiiVue build directory found")
    
    # Check if static files are copied
    static_dir = current_dir / "static" / "niivue"
    if not static_dir.exists():
        print("⚠️  Static files not copied yet (will be done automatically)")
    else:
        print("✅ Static files directory exists")
        
        # Check key files
        index_js = static_dir / "assets" / "index.js"
        index_css = static_dir / "assets" / "index.css"
        
        if index_js.exists() and index_css.exists():
            print("✅ Key asset files found")
        else:
            print("⚠️  Some asset files missing (will be refreshed automatically)")
    
    # Check if app can be imported
    try:
        from app import STATIC_FILES_READY, setup_static_files
        print("✅ App imports successfully")
        print(f"✅ Static files ready: {STATIC_FILES_READY}")
    except Exception as e:
        print(f"❌ Error importing app: {e}")
        return False
    
    # Check if streamlit is installed
    try:
        import streamlit
        print(f"✅ Streamlit {streamlit.__version__} is installed")
    except ImportError:
        print("❌ Streamlit not installed. Please run: pip install streamlit")
        return False
    
    print("\n🎉 Setup validation complete!")
    print("\n🚀 To run the app:")
    print("   streamlit run app.py")
    print("\n📖 For more info, see README.md")
    
    return True

if __name__ == "__main__":
    check_setup()
