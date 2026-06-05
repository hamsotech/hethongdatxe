from flask import Blueprint
from flask import jsonify
from flask import request

from app.controllers.driver_controller import DriverController
from app.utils.auth_middleware import token_required
from app.utils.database import get_connection

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


@driver_bp.route("/stats", methods=["GET"])
@token_required
def get_driver_stats():
    driver_id = request.current_user.get("ma_tai_xe")
    if not driver_id:
        return jsonify({"success": False, "message": "Không phải tài xế hợp lệ"}), 400
    
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        
        # 1. Tính tổng doanh thu hôm nay của tài xế
        cursor.execute(
            """
            SELECT SUM(GIA_TIEN) AS today_revenue
            FROM CHUYEN_DI
            WHERE MA_TAI_XE = %s AND TRANG_THAI = 'HOAN_THANH' AND DATE(THOI_GIAN_TAO) = CURDATE()
            """,
            (driver_id,)
        )
        row_revenue = cursor.fetchone()
        today_revenue = float(row_revenue["today_revenue"]) if row_revenue and row_revenue.get("today_revenue") is not None else 0.0
        
        # 2. Tính số chuyến xe hôm nay của tài xế
        cursor.execute(
            """
            SELECT COUNT(*) AS today_trips
            FROM CHUYEN_DI
            WHERE MA_TAI_XE = %s AND TRANG_THAI = 'HOAN_THANH' AND DATE(THOI_GIAN_TAO) = CURDATE()
            """,
            (driver_id,)
        )
        row_trips = cursor.fetchone()
        today_trips = row_trips["today_trips"] if row_trips else 0
        
        # 3. Tính điểm đánh giá trung bình
        cursor.execute(
            """
            SELECT AVG(DIEM_SO) AS avg_rating
            FROM DANH_GIA
            WHERE MA_TAI_XE = %s
            """,
            (driver_id,)
        )
        row_rating = cursor.fetchone()
        avg_rating = float(row_rating["avg_rating"]) if row_rating and row_rating.get("avg_rating") is not None else None
        
        conn.close()
        return jsonify({
            "success": True,
            "today_revenue": today_revenue,
            "today_trips": today_trips,
            "avg_rating": avg_rating
        })
    except Exception as e:
        if conn: conn.close()
        print("Lỗi lấy thống kê tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/trip/<int:trip_id>/complete", methods=["POST"])
@token_required
def complete_trip(trip_id):
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        
        # 1. Lấy thông tin tài xế và giá tiền của chuyến đi
        cursor.execute("SELECT MA_TAI_XE, GIA_TIEN FROM CHUYEN_DI WHERE MA_CHUYEN_DI = %s", (trip_id,))
        trip = cursor.fetchone()
        if not trip:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy chuyến đi"}), 404
            
        ma_tai_xe = trip["MA_TAI_XE"]
        gia_tien = trip["GIA_TIEN"]
        
        # 2. Cập nhật trạng thái chuyến đi thành HOAN_THANH
        cursor.execute(
            "UPDATE CHUYEN_DI SET TRANG_THAI='HOAN_THANH' WHERE MA_CHUYEN_DI=%s",
            (trip_id,)
        )
        
        # 3. Cập nhật thanh toán thành DA_THANH_TOAN
        cursor.execute(
            "UPDATE THANH_TOAN SET TRANG_THAI='DA_THANH_TOAN' WHERE MA_CHUYEN_DI=%s",
            (trip_id,)
        )
        
        # 4. Cộng tiền vào ví tài xế
        if ma_tai_xe and gia_tien:
            cursor.execute("SELECT * FROM VI_TAI_XE WHERE MA_TAI_XE = %s", (ma_tai_xe,))
            wallet = cursor.fetchone()
            if wallet:
                cursor.execute(
                    "UPDATE VI_TAI_XE SET SO_DU = SO_DU + %s WHERE MA_TAI_XE = %s",
                    (gia_tien, ma_tai_xe)
                )
            else:
                cursor.execute(
                    "INSERT INTO VI_TAI_XE (MA_TAI_XE, SO_DU) VALUES (%s, %s)",
                    (ma_tai_xe, gia_tien)
                )
                
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Chuyến đi đã hoàn thành"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi hoàn thành chuyến:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/trip/<int:trip_id>", methods=["GET"])
@token_required
def get_driver_trip_details(trip_id):
    """Lấy chi tiết chuyến đi phía tài xế."""
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT cd.*, tt.PHUONG_THUC, tt.TRANG_THAI AS TRANG_THAI_THANH_TOAN
            FROM CHUYEN_DI cd
            LEFT JOIN THANH_TOAN tt ON cd.MA_CHUYEN_DI = tt.MA_CHUYEN_DI
            WHERE cd.MA_CHUYEN_DI = %s
            """,
            (trip_id,)
        )
        trip = cursor.fetchone()
        conn.close()
        if not trip:
            return jsonify({"success": False, "message": "Không tìm thấy chuyến đi"}), 404
        return jsonify({"success": True, "trip": trip})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi lấy chi tiết chuyến đi phía tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/trip/<int:trip_id>/pickup", methods=["POST"])
@token_required
def pickup_passenger(trip_id):
    """Xác nhận đã đón khách, chuyển trạng thái thành DANG_DI."""
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE CHUYEN_DI SET TRANG_THAI='DANG_DI' WHERE MA_CHUYEN_DI=%s",
            (trip_id,)
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Đón khách thành công, bắt đầu di chuyển"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi đón khách phía tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/emergency", methods=["POST"])
@token_required
def report_emergency():
    data = request.get_json()
    ma_chuyen_di = data.get("ma_chuyen_di")
    ma_tai_xe = data.get("ma_tai_xe")
    
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    
    try:
        cursor = conn.cursor()
        
        # 1. Thêm sự cố vào bảng KHIEU_NAI_SU_CO
        cursor.execute(
            """
            INSERT INTO KHIEU_NAI_SU_CO (MA_CHUYEN_DI, LOAI_NGUOI_GUI, MA_NGUOI_GUI, NOI_DUNG, TRANG_THAI)
            VALUES (%s, 'Tài xế', %s, 'Sự cố khẩn cấp khi đang chở khách. Cần tìm đồng nghiệp trợ giúp!', 'Chờ xử lý')
            """,
            (ma_chuyen_di, ma_tai_xe)
        )
        
        # 2. Tìm tất cả các tài xế ONLINE khác
        cursor.execute(
            """
            SELECT tx.MA_TAI_XE, tx.TEN, tx.SO_DIEN_THOAI, pt.LOAI_XE, pt.BIEN_SO 
            FROM TAI_XE tx
            LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE
            WHERE tx.TRANG_THAI = 'ONLINE' AND tx.MA_TAI_XE != %s
            """,
            (ma_tai_xe,)
        )
        colleagues = cursor.fetchall()
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "colleagues": colleagues})
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print("Lỗi báo cáo sự cố:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/history", methods=["GET"])
@token_required
def get_driver_history():
    """Lấy danh sách lịch sử tất cả chuyến đi của tài xế đang đăng nhập."""
    driver_id = request.current_user.get("ma_tai_xe")
    if not driver_id:
        return jsonify({"success": False, "message": "Không phải tài xế hợp lệ"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM CHUYEN_DI 
            WHERE MA_TAI_XE = %s 
            ORDER BY MA_CHUYEN_DI DESC
            """,
            (driver_id,)
        )
        trips = cursor.fetchall()
        conn.close()
        return jsonify({"success": True, "trips": trips})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi lấy lịch sử chuyến xe tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/wallet", methods=["GET"])
@token_required
def get_driver_wallet():
    """Lấy số dư ví của tài xế đang đăng nhập."""
    driver_id = request.current_user.get("ma_tai_xe")
    if not driver_id:
        return jsonify({"success": False, "message": "Không phải tài xế hợp lệ"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT SO_DU FROM VI_TAI_XE WHERE MA_TAI_XE = %s", (driver_id,))
        wallet = cursor.fetchone()
        conn.close()
        so_du = float(wallet["SO_DU"]) if wallet and wallet.get("SO_DU") is not None else 0.0
        return jsonify({"success": True, "balance": so_du})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi lấy thông tin ví tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/request-otp-withdraw", methods=["POST"])
@token_required
def request_otp_withdraw():
    """Yêu cầu OTP trước khi rút tiền."""
    email = request.current_user.get("email")
    if not email:
        return jsonify({"success": False, "message": "Không tìm thấy email tài xế"}), 400
        
    from app.services.otp_service import OTPService
    otp_code = OTPService.generate_otp(email, "WITHDRAW")
    if not otp_code:
        return jsonify({"success": False, "message": "Không thể tạo mã OTP"}), 500
        
    return jsonify({
        "success": True,
        "message": f"Mã OTP đã được gửi tới {email}",
        "debug_otp": otp_code
    })


@driver_bp.route("/withdraw-otp", methods=["POST"])
@token_required
def withdraw_otp():
    """Thực hiện rút tiền sau khi xác thực OTP."""
    driver_id = request.current_user.get("ma_tai_xe")
    email = request.current_user.get("email")
    if not driver_id or not email:
        return jsonify({"success": False, "message": "Tài khoản không hợp lệ"}), 400
        
    data = request.get_json()
    amount = float(data.get("amount") or 0)
    otp_code = data.get("otp_code")
    
    if amount <= 0:
        return jsonify({"success": False, "message": "Số tiền rút phải lớn hơn 0"}), 400
    if not otp_code:
        return jsonify({"success": False, "message": "Thiếu mã xác thực OTP"}), 400
        
    from app.services.otp_service import OTPService
    if not OTPService.verify_otp(email, otp_code, "WITHDRAW"):
        return jsonify({"success": False, "message": "Mã OTP không hợp lệ hoặc đã hết hạn"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
        
    try:
        cursor = conn.cursor()
        # Kiểm tra số dư ví
        cursor.execute("SELECT SO_DU FROM VI_TAI_XE WHERE MA_TAI_XE = %s", (driver_id,))
        wallet = cursor.fetchone()
        
        if not wallet or float(wallet["SO_DU"]) < amount:
            conn.close()
            return jsonify({"success": False, "message": "Số dư ví không đủ để thực hiện giao dịch"}), 400
            
        # Trừ số dư ví và tăng tổng rút
        cursor.execute(
            "UPDATE VI_TAI_XE SET SO_DU = SO_DU - %s, TONG_RUT = TONG_RUT + %s WHERE MA_TAI_XE = %s",
            (amount, amount, driver_id)
        )
        
        # Thêm yêu cầu rút tiền vào bảng YEU_CAU_RUT_TIEN
        cursor.execute(
            "INSERT INTO YEU_CAU_RUT_TIEN (MA_TAI_XE, SO_TIEN, TRANG_THAI) VALUES (%s, %s, 'Thành công')",
            (driver_id, amount)
        )
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Rút tiền thành công!", "new_balance": float(wallet["SO_DU"]) - amount})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi rút tiền ví tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@driver_bp.route("/update-profile-otp", methods=["POST"])
@token_required
def update_profile_otp():
    """Cập nhật thông tin tài xế. Yêu cầu OTP nếu đổi email/số điện thoại."""
    driver_id = request.current_user.get("ma_tai_xe")
    old_email = request.current_user.get("email")
    if not driver_id:
        return jsonify({"success": False, "message": "Tài khoản không hợp lệ"}), 400
        
    data = request.get_json()
    new_name = data.get("fullName")
    new_phone = data.get("phone")
    new_email = data.get("email")
    otp_code = data.get("otp_code")
    
    if not new_name or not new_phone or not new_email:
        return jsonify({"success": False, "message": "Vui lòng nhập đầy đủ thông tin"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
        
    try:
        cursor = conn.cursor()
        
        # Lấy thông tin cũ
        cursor.execute("SELECT EMAIL, SO_DIEN_THOAI FROM TAI_XE WHERE MA_TAI_XE = %s", (driver_id,))
        old_data = cursor.fetchone()
        if not old_data:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy thông tin tài xế"}), 404
            
        email_changed = old_data["EMAIL"] != new_email
        phone_changed = old_data["SO_DIEN_THOAI"] != new_phone
        
        if email_changed or phone_changed:
            if not otp_code:
                conn.close()
                return jsonify({"success": False, "message": "Cần xác thực OTP khi thay đổi Email hoặc Số điện thoại"}), 400
                
            from app.services.otp_service import OTPService
            # Sử dụng email cũ làm kênh nhận OTP
            if not OTPService.verify_otp(old_email, otp_code, "UPDATE_PROFILE"):
                conn.close()
                return jsonify({"success": False, "message": "Mã OTP không hợp lệ hoặc đã hết hạn"}), 400
                
        # Thực hiện cập nhật
        cursor.execute(
            "UPDATE TAI_XE SET TEN = %s, SO_DIEN_THOAI = %s, EMAIL = %s WHERE MA_TAI_XE = %s",
            (new_name, new_phone, new_email, driver_id)
        )
        
        # Nếu tài xế cũng là khách hàng (cùng email cũ), cập nhật cả bảng NGUOI_DUNG
        cursor.execute(
            "UPDATE NGUOI_DUNG SET TEN = %s, SO_DIEN_THOAI = %s, EMAIL = %s WHERE EMAIL = %s",
            (new_name, new_phone, new_email, old_email)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Cập nhật hồ sơ thành công!"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi cập nhật hồ sơ tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500

