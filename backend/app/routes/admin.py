from flask import Blueprint
from flask import jsonify

from app.controllers.admin_controller import AdminController
from app.utils.auth_middleware import token_required

admin_bp = Blueprint(
    "admin",
    __name__
)


@admin_bp.route("/dashboard")
@token_required
def dashboard():

    return jsonify(
        AdminController.dashboard()
    )


@admin_bp.route("/users")
@token_required
def users():

    return jsonify(
        AdminController.get_users()
    )


@admin_bp.route("/trips")
@token_required
def trips():

    return jsonify(
        AdminController.get_trips()
    )
