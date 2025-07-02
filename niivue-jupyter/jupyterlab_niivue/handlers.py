import json
import os.path as osp
from tornado import web

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


HERE = osp.dirname(__file__)

with open(osp.join(HERE, 'labextension', 'package.json')) as fid:
    data = json.load(fid)

class StaticFileHandler(web.StaticFileHandler):
    """Custom static file handler with proper MIME types for JS/CSS files"""
    
    def get_content_type(self):
        """Override to ensure proper MIME types"""
        content_type = super().get_content_type()
        
        # Fix MIME types for specific file extensions
        if self.path.endswith('.js'):
            return 'application/javascript'
        elif self.path.endswith('.css'):
            return 'text/css'
        elif self.path.endswith('.json'):
            return 'application/json'
        
        return content_type

def setup_handlers(web_app, url_pattern):
    """Set up the extension handlers"""
    host_pattern = ".*$"
    
    # Serve static files from the labextension directory
    static_path = osp.join(HERE, 'labextension', 'static')
    if osp.exists(static_path):
        static_url = url_path_join(url_pattern, "static")
        handlers = [
            (
                url_path_join(static_url, r"(.*)"),
                StaticFileHandler,
                {"path": static_path}
            )
        ]
        web_app.add_handlers(host_pattern, handlers)