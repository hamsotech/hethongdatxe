from flask import Blueprint
from flask import request
from flask import jsonify

from app.controllers.auth_controller import AuthController

auth_bp = Blueprint(
    "auth",
    __name__
)


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    result = AuthController.register(data)

    return jsonify(result)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    result = AuthController.login(data)

    return jsonify(result)