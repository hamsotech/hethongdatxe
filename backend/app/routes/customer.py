from flask import Blueprint, request, jsonify
from app.controllers.customer_controller import CustomerController
from app.utils.auth_middleware import token_required
from app.utils.database import get_connection

customer_bp = Blueprint("customer", __name__)


def get_current_customer_id():
    # 1. Thử lấy từ request.current_user
    ma_nguoi_dung = request.current_user.get("ma_nguoi_dung")
    if ma_nguoi_dung:
        return ma_nguoi_dung
        
    # 2. Nếu không có (do token bị ghi đè khi test nhiều role trên cùng một trình duyệt), truy vấn DB bằng email
    email = request.current_user.get("email")
    if email:
        conn = get_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT MA_NGUOI_DUNG FROM NGUOI_DUNG WHERE EMAIL = %s", (email,))
                user = cursor.fetchone()
                if user:
                    return user["MA_NGUOI_DUNG"]
            except Exception as e:
                print("Lỗi truy vấn ma_nguoi_dung từ email:", e)
            finally:
                conn.close()
    return None


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


@customer_bp.route("/payment/<int:payment_id>", methods=["PUT"])
@token_required
def confirm_payment(payment_id):
    result = CustomerController.confirm_payment(payment_id)
    return jsonify(result)


@customer_bp.route("/payments", methods=["GET"])
@token_required
def payment_history():
    ma_nguoi_dung = get_current_customer_id()
    if not ma_nguoi_dung:
        return jsonify([])
    result = CustomerController.payment_history(ma_nguoi_dung)
    return jsonify(result)


# --- CÁC ROUTE MỚI (sửa lỗi frontend gọi endpoint không tồn tại) ---

@customer_bp.route("/history", methods=["GET"])
@token_required
def trip_history():
    """Lịch sử chuyến đi của khách hàng đang đăng nhập."""
    ma_nguoi_dung = get_current_customer_id()
    if not ma_nguoi_dung:
        return jsonify([])
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM CHUYEN_DI WHERE MA_NGUOI_DUNG=%s ORDER BY MA_CHUYEN_DI DESC",
        (ma_nguoi_dung,)
    )
    trips = cursor.fetchall()
    conn.close()
    return jsonify(trips)


@customer_bp.route("/trip/<int:trip_id>/cancel", methods=["POST"])
@token_required
def cancel_trip(trip_id):
    """Huỷ chuyến đi (chỉ khi còn đang CHO_TAI_XE)."""
    ma_nguoi_dung = get_current_customer_id()
    if not ma_nguoi_dung:
        return jsonify({"success": False, "message": "Không tìm thấy thông tin khách hàng"}), 400
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    cursor = conn.cursor()
    # Kiểm tra chuyến có thuộc về user này không
    cursor.execute(
        "SELECT TRANG_THAI FROM CHUYEN_DI WHERE MA_CHUYEN_DI=%s AND MA_NGUOI_DUNG=%s",
        (trip_id, ma_nguoi_dung)
    )
    trip = cursor.fetchone()
    if not trip:
        conn.close()
        return jsonify({"success": False, "message": "Không tìm thấy chuyến đi"}), 404
    if trip["TRANG_THAI"] not in ("CHO_TAI_XE", "DA_NHAN"):
        conn.close()
        return jsonify({"success": False, "message": "Không thể huỷ chuyến đang di chuyển hoặc đã hoàn thành"}), 400
    cursor.execute(
        "UPDATE CHUYEN_DI SET TRANG_THAI='DA_HUY' WHERE MA_CHUYEN_DI=%s",
        (trip_id,)
    )
    conn.commit()
    conn.close()

    # Phát sóng realtime toàn cục báo chuyến đi đã bị huỷ để các tài xế khác xoá khỏi danh sách chờ
    try:
        from app.websocket.socket_server import socketio
        socketio.emit('global_trip_cancelled', {'trip_id': trip_id})
        print(f"[SOCKET-API] Phát sóng global_trip_cancelled cho chuyến đi: {trip_id}")
    except Exception as e:
        print("[SOCKET-API] Lỗi phát sóng global_trip_cancelled:", e)

    return jsonify({"success": True, "message": "Đã huỷ chuyến thành công"})


@customer_bp.route("/rating", methods=["POST"])
@token_required
def create_rating():
    """Gửi đánh giá sau chuyến đi."""
    data = request.get_json()
    ma_chuyen_di = data.get("ma_chuyen_di")
    diem_so = data.get("diem_so") or data.get("so_sao")
    if not ma_chuyen_di or not diem_so:
        return jsonify({"success": False, "message": "Thiếu ma_chuyen_di hoặc so_sao/diem_so"}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    try:
        cursor = conn.cursor()
        
        # Lấy thông tin chuyến đi để trích xuất MA_NGUOI_DUNG và MA_TAI_XE thực tế
        # Việc này giải quyết triệt để lỗi KeyError: 'ma_nguoi_dung' khi test hai vai trò trên cùng một trình duyệt (token bị ghi đè chéo)
        cursor.execute(
            "SELECT MA_NGUOI_DUNG, MA_TAI_XE FROM CHUYEN_DI WHERE MA_CHUYEN_DI = %s",
            (ma_chuyen_di,)
        )
        trip = cursor.fetchone()
        if not trip:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy chuyến đi"}), 404
            
        ma_nguoi_dung = trip["MA_NGUOI_DUNG"]
        ma_tai_xe = trip["MA_TAI_XE"]
        
        # Thêm bản ghi đánh giá bao gồm cả MA_TAI_XE để hiển thị đánh giá thực tế cho tài xế
        cursor.execute(
            """INSERT INTO DANH_GIA (MA_CHUYEN_DI, MA_NGUOI_DUNG, MA_TAI_XE, DIEM_SO, NHAN_XET)
               VALUES (%s, %s, %s, %s, %s)""",
            (ma_chuyen_di, ma_nguoi_dung, ma_tai_xe, diem_so, data.get("nhan_xet", ""))
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Đánh giá thành công"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi tạo đánh giá:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@customer_bp.route("/register-driver", methods=["POST"])
@token_required
def register_driver():
    """Đăng ký tài khoản hiện tại làm Tài xế."""
    ma_nguoi_dung = get_current_customer_id()
    if not ma_nguoi_dung:
        return jsonify({"success": False, "message": "Không tìm thấy thông tin khách hàng"}), 400
    data = request.get_json()
    
    loai_xe = data.get("loai_xe")
    bien_so = data.get("bien_so")
    
    if not loai_xe or not bien_so:
        return jsonify({"success": False, "message": "Thiếu thông tin loại xe hoặc biển số"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
        
    try:
        cursor = conn.cursor()
        
        # 1. Lấy thông tin khách hàng hiện tại
        cursor.execute(
            "SELECT * FROM NGUOI_DUNG WHERE MA_NGUOI_DUNG=%s",
            (ma_nguoi_dung,)
        )
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy thông tin khách hàng"}), 404
            
        # 2. Kiểm tra xem email khách hàng đã tồn tại trong TAI_XE chưa
        cursor.execute(
            "SELECT * FROM TAI_XE WHERE EMAIL=%s",
            (user["EMAIL"],)
        )
        existing_driver = cursor.fetchone()
        if existing_driver:
            conn.close()
            return jsonify({"success": False, "message": "Tài khoản của bạn đã được đăng ký làm tài xế trước đó"}), 400
            
        # 3. Chèn vào bảng TAI_XE (sao chép tên, sđt, email, mật khẩu)
        cursor.execute(
            """
            INSERT INTO TAI_XE (TEN, SO_DIEN_THOAI, EMAIL, MAT_KHAU, TRANG_THAI)
            VALUES (%s, %s, %s, %s, 'OFFLINE')
            """,
            (user["TEN"], user["SO_DIEN_THOAI"], user["EMAIL"], user["MAT_KHAU"])
        )
        ma_tai_xe = cursor.lastrowid
        
        # 4. Chèn vào bảng PHUONG_TIEN
        cursor.execute(
            """
            INSERT INTO PHUONG_TIEN (LOAI_XE, BIEN_SO, MA_TAI_XE)
            VALUES (%s, %s, %s)
            """,
            (loai_xe, bien_so, ma_tai_xe)
        )
        
        # 5. Tạo ví tài xế trong bảng VI_TAI_XE
        cursor.execute(
            """
            INSERT INTO VI_TAI_XE (MA_TAI_XE, SO_DU, TONG_RUT)
            VALUES (%s, 0.00, 0.00)
            """,
            (ma_tai_xe,)
        )
        
        # 6. Tạo hồ sơ tài xế với trạng thái 'Chờ duyệt'
        cursor.execute(
            """
            INSERT INTO HO_SO_TAI_XE (MA_TAI_XE, LOAI_GIAY_TO, TRANG_THAI)
            VALUES (%s, 'Đăng ký trực tuyến', 'Chờ duyệt')
            """,
            (ma_tai_xe,)
        )
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Đăng ký làm tài xế thành công! Vui lòng đợi quản trị viên phê duyệt hồ sơ của bạn."})
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print("Lỗi đăng ký tài xế:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500

@customer_bp.route("/trip/<int:trip_id>", methods=["GET"])
@token_required
def get_trip_details(trip_id):
    """Lấy chi tiết của một chuyến đi cụ thể kèm theo thông tin tài xế nếu có."""
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT cd.*, tt.PHUONG_THUC
            FROM CHUYEN_DI cd
            LEFT JOIN THANH_TOAN tt ON cd.MA_CHUYEN_DI = tt.MA_CHUYEN_DI
            WHERE cd.MA_CHUYEN_DI = %s
            """,
            (trip_id,)
        )
        trip = cursor.fetchone()
        if not trip:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy chuyến đi"}), 404
            
        driver_info = None
        if trip.get("MA_TAI_XE"):
            cursor.execute(
                """
                SELECT tx.TEN, tx.SO_DIEN_THOAI, pt.LOAI_XE, pt.BIEN_SO 
                FROM TAI_XE tx
                LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE
                WHERE tx.MA_TAI_XE = %s
                """,
                (trip["MA_TAI_XE"],)
            )
            driver = cursor.fetchone()
            if driver:
                driver_info = {
                    "ten": driver["TEN"],
                    "so_dien_thoai": driver["SO_DIEN_THOAI"],
                    "loai_xe": driver["LOAI_XE"],
                    "bien_so": driver["BIEN_SO"]
                }
                
        conn.close()
        return jsonify({
            "success": True,
            "trip": trip,
            "driver": driver_info
        })
    except Exception as e:
        conn.close()
        print("Lỗi lấy chi tiết chuyến đi:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500


@customer_bp.route("/complaint", methods=["POST"])
@token_required
def create_complaint():
    ma_nguoi_dung = get_current_customer_id()
    if not ma_nguoi_dung:
        return jsonify({"success": False, "message": "Không tìm thấy thông tin người dùng"}), 400
        
    data = request.get_json()
    ma_chuyen_di = data.get("ma_chuyen_di")
    noi_dung = data.get("noi_dung")
    
    if not ma_chuyen_di or not noi_dung:
        return jsonify({"success": False, "message": "Thiếu mã chuyến đi hoặc nội dung khiếu nại"}), 400
        
    conn = get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Lỗi kết nối database"}), 500
        
    try:
        cursor = conn.cursor()
        # Chèn khiếu nại của khách hàng vào bảng KHIEU_NAI_SU_CO
        cursor.execute(
            """
            INSERT INTO KHIEU_NAI_SU_CO (MA_CHUYEN_DI, LOAI_NGUOI_GUI, MA_NGUOI_GUI, NOI_DUNG, TRANG_THAI)
            VALUES (%s, 'Khách hàng', %s, %s, 'Chờ xử lý')
            """,
            (ma_chuyen_di, ma_nguoi_dung, noi_dung)
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Gửi khiếu nại thành công!"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi tạo khiếu nại từ khách hàng:", e)
        return jsonify({"success": False, "message": "Lỗi hệ thống khi gửi khiếu nại"}), 500


@customer_bp.route("/request-otp-profile", methods=["POST"])
@token_required
def request_otp_profile():
    """Yêu cầu gửi OTP để đổi thông tin cá nhân khách hàng."""
    email = request.current_user.get("email")
    if not email:
        return jsonify({"success": False, "message": "Không tìm thấy email người dùng"}), 400
        
    from app.services.otp_service import OTPService
    otp_code = OTPService.generate_otp(email, "UPDATE_PROFILE")
    if not otp_code:
        return jsonify({"success": False, "message": "Không thể tạo mã OTP"}), 500
        
    return jsonify({
        "success": True,
        "message": f"Mã OTP đã được gửi tới {email}",
        "debug_otp": otp_code
    })


@customer_bp.route("/update-profile-otp", methods=["POST"])
@token_required
def update_profile_otp():
    """Cập nhật thông tin khách hàng. OTP chỉ yêu cầu nếu đổi email hoặc số điện thoại."""
    ma_nguoi_dung = get_current_customer_id()
    old_email = request.current_user.get("email")
    if not ma_nguoi_dung:
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
        cursor.execute("SELECT EMAIL, SO_DIEN_THOAI FROM NGUOI_DUNG WHERE MA_NGUOI_DUNG = %s", (ma_nguoi_dung,))
        old_data = cursor.fetchone()
        if not old_data:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy thông tin người dùng"}), 404
            
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
            "UPDATE NGUOI_DUNG SET TEN = %s, SO_DIEN_THOAI = %s, EMAIL = %s WHERE MA_NGUOI_DUNG = %s",
            (new_name, new_phone, new_email, ma_nguoi_dung)
        )
        
        # Nếu khách hàng cũng là tài xế (cùng email cũ), cập nhật cả bảng TAI_XE
        cursor.execute(
            "UPDATE TAI_XE SET TEN = %s, SO_DIEN_THOAI = %s, EMAIL = %s WHERE EMAIL = %s",
            (new_name, new_phone, new_email, old_email)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Cập nhật hồ sơ thành công!"})
    except Exception as e:
        if conn: conn.close()
        print("Lỗi cập nhật hồ sơ khách hàng:", e)
        return jsonify({"success": False, "message": "Có lỗi hệ thống xảy ra"}), 500

