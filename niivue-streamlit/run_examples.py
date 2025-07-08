#!/usr/bin/env python3
"""
NiiVue Streamlit Component Example Runner
This script demonstrates all available Streamlit applications.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_app(app_name, description):
    """Run a Streamlit application"""
    print(f"\n🚀 Starting {description}")
    print(f"   App: {app_name}")
    print(f"   URL will be: http://localhost:8501")
    print(f"   Press Ctrl+C to stop and return to menu")
    print("-" * 50)
    
    try:
        subprocess.run([sys.executable, "-m", "streamlit", "run", app_name], check=True)
    except KeyboardInterrupt:
        print(f"\n✅ Stopped {app_name}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {app_name}: {e}")

def main():
    """Main menu for running different apps"""
    
    # Check if we're in the right directory
    if not Path("app.py").exists():
        print("❌ Please run this script from the niivue-streamlit directory")
        sys.exit(1)
    
    print("🧠 NiiVue Streamlit Component Examples")
    print("=" * 50)
    
    while True:
        print("\nAvailable applications:")
        print("1. 📱 Simple App (app.py) - Basic HTML integration")
        print("2. ⚛️  Component App (app_component.py) - React component")
        print("3. 🎮 Demo App (demo.py) - Full-featured demo")
        print("4. 🔍 Validate Setup")
        print("5. 🚪 Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            run_app("app.py", "Simple HTML Integration App")
        elif choice == "2":
            run_app("app_component.py", "React Component App")
        elif choice == "3":
            run_app("demo.py", "Full-Featured Demo")
        elif choice == "4":
            print("\n🔍 Running validation...")
            subprocess.run([sys.executable, "validate.py"])
        elif choice == "5":
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main()
