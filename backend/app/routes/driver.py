from flask import Blueprint
from flask import jsonify
from flask import request

from app.controllers.driver_controller import DriverController
from app.utils.auth_middleware import token_required

driver_bp = Blueprint(
    "driver",
    __name__
)


@driver_bp.route("/trips", methods=["GET"])
@token_required
def get_trips():

    trips = DriverController.get_available_trips()

    return jsonify(trips)


@driver_bp.route("/accept", methods=["POST"])
@token_required
def accept_trip():

    data = request.get_json()

    result = DriverController.accept_trip(data)

    return jsonify(result)
