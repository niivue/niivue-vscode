"""Custom hatch build hook to copy labextension files to share/jupyter."""
import os
import shutil
from pathlib import Path
from typing import Any

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    """Custom build hook to copy labextension directory to share/jupyter."""

    def initialize(self, version: str, build_data: dict[str, Any]) -> None:
        """
        Copy the entire labextension directory to share/jupyter/labextensions.
        
        This ensures all static files (including remoteEntry.js) are properly
        installed where JupyterLab expects them.
        """
        if self.target_name != "wheel":
            return

        # Source and destination paths
        source_dir = Path(self.root) / "jupyterlab_niivue" / "labextension"
        
        # Get the shared-data mapping from build_data
        shared_data = build_data.setdefault("shared_data", {})
        
        # Only proceed if the source directory exists
        if not source_dir.exists():
            return
            
        # Walk through all files in the labextension directory
        for item in source_dir.rglob("*"):
            if item.is_file():
                # Calculate relative path from source_dir
                rel_path = item.relative_to(source_dir)
                
                # Map to destination in share/jupyter/labextensions/@niivue/jupyter
                source_str = str(item.relative_to(self.root))
                dest_str = f"share/jupyter/labextensions/@niivue/jupyter/{rel_path}"
                
                # Add to shared_data mapping
                shared_data[source_str] = dest_str
        
        # Also add install.json
        install_json = Path(self.root) / "install.json"
        if install_json.exists():
            shared_data["install.json"] = "share/jupyter/labextensions/@niivue/jupyter/install.json"
        
        print(f"📦 Added {len(shared_data)} files to shared-data mapping")
