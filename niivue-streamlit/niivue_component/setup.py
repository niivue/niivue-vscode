from pathlib import Path
from setuptools import setup, find_packages

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setup(
    name="niivue-streamlit",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A Streamlit component for viewing NIFTI files with NiiVue",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/niivue-streamlit",
    packages=find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "streamlit>=1.28.0",
        "streamlit-component-lib>=2.0.0",
    ],
)
