try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a git checkout or in editable mode from PyPI.
    import warnings
    warnings.warn("Importing 'jupyterlab_niivue' outside a proper installation.")
    __version__ = "dev"
from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "@niivue/jupyter"
    }]


def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_niivue"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to provide lab configuration data and serve a
    React-based interface for extensions in JupyterLab.
    """
    url_pattern = "/lab/extensions/@niivue/jupyter"
    setup_handlers(server_app.web_app, url_pattern)
    name = "jupyterlab_niivue"
    server_app.log.info(f"Registered {name} server extension")


# For backward compatibility with notebook server - useful for dev mode
load_jupyter_server_extension = _load_jupyter_server_extension