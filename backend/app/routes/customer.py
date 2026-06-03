from flask import Blueprint
from flask import request
from flask import jsonify

from app.controllers.customer_controller import CustomerController
from app.utils.auth_middleware import token_required

customer_bp = Blueprint(
    "customer",
    __name__
)


@customer_bp.route("/trip", methods=["POST"])
@token_required
def create_trip():

    data = request.get_json()

    result = CustomerController.create_trip(data)

    return jsonify(result)


@customer_bp.route("/payment", methods=["POST"])
@token_required
def create_payment():

    data = request.get_json()

    result = CustomerController.create_payment(data)

    return jsonify(result)


@customer_bp.route(
    "/payment/<int:payment_id>",
    methods=["PUT"]
)
@token_required
def confirm_payment(payment_id):

    result = CustomerController.confirm_payment(
        payment_id
    )

    return jsonify(result)


@customer_bp.route(
    "/payments",
    methods=["GET"]
)
@token_required
def payment_history():

    ma_nguoi_dung = request.current_user["ma_nguoi_dung"]

    result = CustomerController.payment_history(ma_nguoi_dung)

    return jsonify(result)
