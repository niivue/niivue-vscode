import setuptools

setuptools.setup(
    name="niivue-streamlit",
    version="0.1.0",
    author="NiiVue Team",
    author_email="",
    description="A Streamlit component for NiiVue neuroimaging viewer",
    long_description="A Streamlit component that integrates the NiiVue neuroimaging viewer for interactive NIFTI file visualization.",
    long_description_content_type="text/plain",
    url="https://github.com/niivue/niivue",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "streamlit>=1.28.0",
    ],
)
