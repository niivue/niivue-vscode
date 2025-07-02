import json
import os.path as osp

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


HERE = osp.dirname(__file__)

with open(osp.join(HERE, 'labextension', 'package.json')) as fid:
    data = json.load(fid)

def setup_handlers(web_app, url_pattern):
    """Set up the extension handlers"""
    pass