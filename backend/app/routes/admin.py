from flask import Blueprint
from flask import jsonify

from app.controllers.admin_controller import AdminController
from app.utils.auth_middleware import token_required
from app.utils.database import get_connection

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


@admin_bp.route("/pending-drivers", methods=["GET"])
@token_required
def get_pending_drivers():
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT tx.MA_TAI_XE, tx.TEN, tx.SO_DIEN_THOAI, pt.LOAI_XE, pt.BIEN_SO, hs.MA_HO_SO, hs.TRANG_THAI
        FROM TAI_XE tx
        LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE
        JOIN HO_SO_TAI_XE hs ON tx.MA_TAI_XE = hs.MA_TAI_XE
        WHERE hs.TRANG_THAI = 'Chờ duyệt'
        """
    )
    drivers = cursor.fetchall()
    conn.close()
    return jsonify(drivers)


@admin_bp.route("/active-drivers", methods=["GET"])
@token_required
def get_active_drivers():
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT tx.MA_TAI_XE, tx.TEN, tx.SO_DIEN_THOAI, pt.LOAI_XE, pt.BIEN_SO, tx.TRANG_THAI
        FROM TAI_XE tx
        LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE
        LEFT JOIN HO_SO_TAI_XE hs ON tx.MA_TAI_XE = hs.MA_TAI_XE
        WHERE hs.TRANG_THAI = 'Đã xác minh' OR hs.TRANG_THAI IS NULL
        """
    )
    drivers = cursor.fetchall()
    conn.close()
    return jsonify(drivers)


@admin_bp.route("/approve-driver/<int:ma_tai_xe>", methods=["PUT"])
@token_required
def approve_driver(ma_tai_xe):
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE HO_SO_TAI_XE SET TRANG_THAI='Đã xác minh' WHERE MA_TAI_XE=%s",
        (ma_tai_xe,)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Đã phê duyệt tài xế"})


@admin_bp.route("/reject-driver/<int:ma_tai_xe>", methods=["PUT"])
@token_required
def reject_driver(ma_tai_xe):
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE HO_SO_TAI_XE SET TRANG_THAI='Từ chối' WHERE MA_TAI_XE=%s",
        (ma_tai_xe,)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Đã từ chối hồ sơ tài xế"})


@admin_bp.route("/reports", methods=["GET"])
@token_required
def reports():
    from flask import request
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")
    return jsonify(AdminController.get_reports(from_date, to_date))


@admin_bp.route("/complaint/<int:complaint_id>/resolve", methods=["PUT"])
@token_required
def resolve_complaint(complaint_id):
    from flask import request
    data = request.get_json()
    solution = data.get("solution", "")
    if not solution:
        return jsonify({"success": False, "message": "Thiếu biện pháp giải quyết"}), 400
    return jsonify(AdminController.resolve_complaint(complaint_id, solution))
