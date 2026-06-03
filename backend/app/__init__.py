from flask import Flask
from flask_cors import CORS

from app.routes.auth import auth_bp
from app.routes.customer import customer_bp
from app.routes.driver import driver_bp
from app.routes.admin import admin_bp
from app.websocket.socket_server import init_websocket


def create_app():

    app = Flask(__name__)

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

    return app
