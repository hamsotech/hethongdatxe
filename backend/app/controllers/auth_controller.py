from app.utils.database import get_connection
import bcrypt
import jwt
import datetime
from app.config import Config
from app.services.otp_service import OTPService


class AuthController:

    @staticmethod
    def request_otp(data):
        email = data.get("email")
        purpose = data.get("purpose")
        
        if not email or not purpose:
            return {
                "success": False,
                "message": "Thiếu email hoặc mục đích yêu cầu OTP"
            }
            
        conn = get_connection()
        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }
            
        cursor = conn.cursor()
        
        # Kiểm tra sự tồn tại của email đối với các mục đích cụ thể
        email_exists = False
        
        # Check in Admin, User, Driver
        cursor.execute("SELECT EMAIL FROM NGUOI_DUNG WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (email, email))
        if cursor.fetchone():
            email_exists = True
            
        if not email_exists:
            cursor.execute("SELECT EMAIL FROM TAI_XE WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (email, email))
            if cursor.fetchone():
                email_exists = True
                
        if not email_exists:
            cursor.execute("SELECT EMAIL FROM QUAN_TRI_VIEN WHERE EMAIL=%s", (email,))
            if cursor.fetchone():
                email_exists = True
                
        conn.close()
        
        if purpose == "REGISTER":
            if email_exists:
                return {
                    "success": False,
                    "message": "Email hoặc số điện thoại đã tồn tại"
                }
        else:
            # FORGOT_PASSWORD, PASSWORDLESS_LOGIN
            if not email_exists:
                return {
                    "success": False,
                    "message": "Email hoặc số điện thoại không tồn tại trong hệ thống"
                }
                
        # Sinh OTP
        otp_code = OTPService.generate_otp(email, purpose)
        if not otp_code:
            return {
                "success": False,
                "message": "Không thể sinh mã OTP"
            }
            
        return {
            "success": True,
            "message": f"Mã OTP đã được gửi tới {email}",
            "debug_otp": otp_code
        }

    @staticmethod
    def register(data):

        conn = get_connection()

        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }

        cursor = conn.cursor()

        email = data.get("email")
        ten = data.get("ten")
        so_dien_thoai = data.get("so_dien_thoai")
        mat_khau = data.get("mat_khau")
        otp_code = data.get("otp_code")

        if not otp_code:
            conn.close()
            return {
                "success": False,
                "message": "Thiếu mã xác thực OTP"
            }

        # Xác thực OTP
        if not OTPService.verify_otp(email, otp_code, "REGISTER"):
            conn.close()
            return {
                "success": False,
                "message": "Mã OTP không hợp lệ hoặc đã hết hạn"
            }

        cursor.execute(
            "SELECT * FROM NGUOI_DUNG WHERE EMAIL=%s OR SO_DIEN_THOAI=%s",
            (email, so_dien_thoai)
        )

        user = cursor.fetchone()

        if user:
            conn.close()

            return {
                "success": False,
                "message": "Email hoặc số điện thoại đã tồn tại"
            }

        password_hash = bcrypt.hashpw(
            mat_khau.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        sql = """
        INSERT INTO NGUOI_DUNG
        (
            TEN,
            SO_DIEN_THOAI,
            EMAIL,
            MAT_KHAU
        )
        VALUES (%s,%s,%s,%s)
        """

        cursor.execute(
            sql,
            (
                ten,
                so_dien_thoai,
                email,
                password_hash
            )
        )

        conn.commit()
        conn.close()

        return {
            "success": True,
            "message": "Đăng ký thành công"
        }

    @staticmethod
    def reset_password_otp(data):
        email = data.get("email")
        otp_code = data.get("otp_code")
        new_password = data.get("new_password")
        
        if not email or not otp_code or not new_password:
            return {
                "success": False,
                "message": "Thiếu thông tin yêu cầu đặt lại mật khẩu"
            }
            
        # Xác thực OTP
        if not OTPService.verify_otp(email, otp_code, "FORGOT_PASSWORD"):
            return {
                "success": False,
                "message": "Mã OTP không hợp lệ hoặc đã hết hạn"
            }
            
        conn = get_connection()
        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }
            
        try:
            cursor = conn.cursor()
            
            password_hash = bcrypt.hashpw(
                new_password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")
            
            # Cập nhật trong cả 3 bảng nếu có
            updated = False
            
            cursor.execute("UPDATE NGUOI_DUNG SET MAT_KHAU=%s WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (password_hash, email, email))
            if cursor.rowcount > 0:
                updated = True
                
            cursor.execute("UPDATE TAI_XE SET MAT_KHAU=%s WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (password_hash, email, email))
            if cursor.rowcount > 0:
                updated = True
                
            cursor.execute("UPDATE QUAN_TRI_VIEN SET MAT_KHAU=%s WHERE EMAIL=%s", (password_hash, email))
            if cursor.rowcount > 0:
                updated = True
                
            conn.commit()
            
            if updated:
                return {
                    "success": True,
                    "message": "Đặt lại mật khẩu thành công"
                }
            else:
                return {
                    "success": False,
                    "message": "Không tìm thấy tài khoản để cập nhật"
                }
        except Exception as e:
            print("Lỗi đặt lại mật khẩu:", e)
            return {
                "success": False,
                "message": "Có lỗi hệ thống xảy ra"
            }
        finally:
            conn.close()

    @staticmethod
    def login_otp(data):
        email = data.get("email")
        otp_code = data.get("otp_code")
        
        if not email or not otp_code:
            return {
                "success": False,
                "message": "Thiếu email hoặc mã OTP"
            }
            
        # Xác thực OTP
        if not OTPService.verify_otp(email, otp_code, "PASSWORDLESS_LOGIN"):
            return {
                "success": False,
                "message": "Mã OTP không hợp lệ hoặc đã hết hạn"
            }
            
        conn = get_connection()
        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }
            
        try:
            cursor = conn.cursor()
            matched_roles = []
            user_infos = {}
            pending_driver_status = None
            
            # 1. Kiểm tra Admin
            cursor.execute("SELECT * FROM QUAN_TRI_VIEN WHERE EMAIL=%s", (email,))
            admin_user = cursor.fetchone()
            if admin_user:
                matched_roles.append("admin")
                user_infos["admin"] = {
                    "ma_quan_tri": admin_user["MA_QUAN_TRI"],
                    "ten": admin_user["TEN"],
                    "email": admin_user["EMAIL"]
                }
                
            # 2. Kiểm tra Tài xế
            cursor.execute(
                """
                SELECT tx.*, pt.LOAI_XE, pt.BIEN_SO, hs.TRANG_THAI AS TRANG_THAI_DUYET
                FROM TAI_XE tx 
                LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE 
                LEFT JOIN HO_SO_TAI_XE hs ON tx.MA_TAI_XE = hs.MA_TAI_XE
                WHERE tx.EMAIL=%s OR tx.SO_DIEN_THOAI=%s
                """,
                (email, email)
            )
            driver_user = cursor.fetchone()
            if driver_user:
                trang_thai_duyet = driver_user.get("TRANG_THAI_DUYET")
                if trang_thai_duyet is None or trang_thai_duyet == "Đã xác minh":
                    matched_roles.append("driver")
                    user_infos["driver"] = {
                        "ma_tai_xe": driver_user["MA_TAI_XE"],
                        "ten": driver_user["TEN"],
                        "email": driver_user["EMAIL"],
                        "so_dien_thoai": driver_user["SO_DIEN_THOAI"],
                        "loai_xe": driver_user.get("LOAI_XE"),
                        "bien_so": driver_user.get("BIEN_SO")
                    }
                else:
                    pending_driver_status = trang_thai_duyet
                    
            # 3. Kiểm tra Khách hàng
            cursor.execute("SELECT * FROM NGUOI_DUNG WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (email, email))
            customer_user = cursor.fetchone()
            if customer_user:
                matched_roles.append("customer")
                user_infos["customer"] = {
                    "ma_nguoi_dung": customer_user["MA_NGUOI_DUNG"],
                    "ten": customer_user["TEN"],
                    "email": customer_user["EMAIL"],
                    "so_dien_thoai": customer_user["SO_DIEN_THOAI"]
                }
                
            if not matched_roles:
                if pending_driver_status:
                    if pending_driver_status == "Từ chối":
                        return {
                            "success": False,
                            "message": "Hồ sơ đăng ký tài xế của bạn đã bị từ chối."
                        }
                    else:
                        return {
                            "success": False,
                            "message": "Tài khoản tài xế của bạn đang chờ quản trị viên phê duyệt."
                        }
                return {
                    "success": False,
                    "message": "Email không tồn tại hoặc tài khoản chưa có vai trò hợp lệ"
                }
                
            primary_role = matched_roles[0]
            
            # Tạo JWT token
            token_payload = {
                "email": email,
                "role": primary_role,
                "roles": matched_roles,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }
            
            if "admin" in user_infos:
                token_payload["ma_quan_tri"] = user_infos["admin"]["ma_quan_tri"]
            if "driver" in user_infos:
                token_payload["ma_tai_xe"] = user_infos["driver"]["ma_tai_xe"]
            if "customer" in user_infos:
                token_payload["ma_nguoi_dung"] = user_infos["customer"]["ma_nguoi_dung"]
                
            token = jwt.encode(
                token_payload,
                Config.SECRET_KEY,
                algorithm="HS256"
            )
            
            return {
                "success": True,
                "message": "Đăng nhập bằng OTP thành công",
                "token": token,
                "role": primary_role,
                "roles": matched_roles,
                "user": user_infos[primary_role],
                "all_users": user_infos
            }
        except Exception as e:
            print("Lỗi đăng nhập OTP:", e)
            return {
                "success": False,
                "message": "Có lỗi hệ thống xảy ra"
            }
        finally:
            conn.close()

    @staticmethod
    def login(data):

        conn = get_connection()

        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }

        cursor = conn.cursor()

        email = data.get("email")
        mat_khau = data.get("mat_khau")

        matched_roles = []
        user_infos = {}
        pending_driver_status = None

        # 1. Kiểm tra Admin
        cursor.execute("SELECT * FROM QUAN_TRI_VIEN WHERE EMAIL=%s", (email,))
        admin_user = cursor.fetchone()
        if admin_user and bcrypt.checkpw(mat_khau.encode("utf-8"), admin_user["MAT_KHAU"].encode("utf-8")):
            matched_roles.append("admin")
            user_infos["admin"] = {
                "ma_quan_tri": admin_user["MA_QUAN_TRI"],
                "ten": admin_user["TEN"],
                "email": admin_user["EMAIL"]
            }

        # 2. Kiểm tra Tài xế (tham chiếu trạng thái duyệt trong bảng HO_SO_TAI_XE)
        cursor.execute(
            """
            SELECT tx.*, pt.LOAI_XE, pt.BIEN_SO, hs.TRANG_THAI AS TRANG_THAI_DUYET
            FROM TAI_XE tx 
            LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE 
            LEFT JOIN HO_SO_TAI_XE hs ON tx.MA_TAI_XE = hs.MA_TAI_XE
            WHERE tx.EMAIL=%s OR tx.SO_DIEN_THOAI=%s
            """,
            (email, email)
        )
        driver_user = cursor.fetchone()
        if driver_user and bcrypt.checkpw(mat_khau.encode("utf-8"), driver_user["MAT_KHAU"].encode("utf-8")):
            trang_thai_duyet = driver_user.get("TRANG_THAI_DUYET")
            # Nếu là tài xế cũ không có hồ sơ hoặc đã xác minh thì được duyệt
            if trang_thai_duyet is None or trang_thai_duyet == "Đã xác minh":
                matched_roles.append("driver")
                user_infos["driver"] = {
                    "ma_tai_xe": driver_user["MA_TAI_XE"],
                    "ten": driver_user["TEN"],
                    "email": driver_user["EMAIL"],
                    "so_dien_thoai": driver_user["SO_DIEN_THOAI"],
                    "loai_xe": driver_user.get("LOAI_XE"),
                    "bien_so": driver_user.get("BIEN_SO")
                }
            else:
                pending_driver_status = trang_thai_duyet

        # 3. Kiểm tra Khách hàng
        cursor.execute("SELECT * FROM NGUOI_DUNG WHERE EMAIL=%s OR SO_DIEN_THOAI=%s", (email, email))
        customer_user = cursor.fetchone()
        if customer_user and bcrypt.checkpw(mat_khau.encode("utf-8"), customer_user["MAT_KHAU"].encode("utf-8")):
            matched_roles.append("customer")
            user_infos["customer"] = {
                "ma_nguoi_dung": customer_user["MA_NGUOI_DUNG"],
                "ten": customer_user["TEN"],
                "email": customer_user["EMAIL"],
                "so_dien_thoai": customer_user["SO_DIEN_THOAI"]
            }

        conn.close()

        if not matched_roles:
            if pending_driver_status:
                if pending_driver_status == "Từ chối":
                    return {
                        "success": False,
                        "message": "Hồ sơ đăng ký tài xế của bạn đã bị từ chối."
                    }
                else:
                    return {
                        "success": False,
                        "message": "Tài khoản tài xế của bạn đang chờ quản trị viên phê duyệt."
                    }
            
            # Kiểm tra xem tài khoản có tồn tại không (bằng email hoặc số điện thoại)
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT EMAIL FROM NGUOI_DUNG WHERE EMAIL=%s OR SO_DIEN_THOAI=%s
                UNION
                SELECT EMAIL FROM TAI_XE WHERE EMAIL=%s OR SO_DIEN_THOAI=%s
                UNION
                SELECT EMAIL FROM QUAN_TRI_VIEN WHERE EMAIL=%s
                """,
                (email, email, email, email, email)
            )
            exists = cursor.fetchone()
            conn.close()
            if exists:
                return {
                    "success": False,
                    "message": "Sai mật khẩu"
                }
            else:
                return {
                    "success": False,
                    "message": "Email không tồn tại"
                }

        # Chọn vai trò chính làm mặc định
        primary_role = matched_roles[0]

        # Tạo JWT token
        token_payload = {
            "email": email,
            "role": primary_role,
            "roles": matched_roles,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }

        # Lưu thông tin khóa ID tương thích ngược trong token cho tất cả vai trò liên kết
        if "admin" in user_infos:
            token_payload["ma_quan_tri"] = user_infos["admin"]["ma_quan_tri"]
        if "driver" in user_infos:
            token_payload["ma_tai_xe"] = user_infos["driver"]["ma_tai_xe"]
        if "customer" in user_infos:
            token_payload["ma_nguoi_dung"] = user_infos["customer"]["ma_nguoi_dung"]

        token = jwt.encode(
            token_payload,
            Config.SECRET_KEY,
            algorithm="HS256"
        )

        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "token": token,
            "role": primary_role,
            "roles": matched_roles,
            "user": user_infos[primary_role],
            "all_users": user_infos
        }
