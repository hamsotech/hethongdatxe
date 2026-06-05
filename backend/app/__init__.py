from flask import Flask, send_from_directory
from flask_cors import CORS

from app.routes.auth import auth_bp
from app.routes.customer import customer_bp
from app.routes.driver import driver_bp
from app.routes.admin import admin_bp
from app.websocket.socket_server import init_websocket

import os
def create_app():

    app = Flask(__name__,
                static_folder=os.path.join(os.path.dirname(__file__), '../../frontend/frontend'),
                static_url_path='')

    CORS(app)

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        customer_bp,
        url_prefix="/api/customer"
    )
    app.register_blueprint(
        driver_bp,
        url_prefix="/api/driver"
    )
    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )

    init_websocket(app)
    @app.route('/')
    @app.route('/<path:path>')
    def serve_frontend(path='index.html'):
        return send_from_directory(app.static_folder, path)
    return app
