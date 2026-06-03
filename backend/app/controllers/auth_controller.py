from app.utils.database import get_connection
import bcrypt
import jwt
import datetime
from app.config import Config


class AuthController:

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

        cursor.execute(
            "SELECT * FROM NGUOI_DUNG WHERE EMAIL=%s",
            (email,)
        )

        user = cursor.fetchone()

        if user:
            conn.close()

            return {
                "success": False,
                "message": "Email đã tồn tại"
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
    def login(data):

        conn = get_connection()

        # Fix: kiểm tra kết nối DB trước khi dùng
        if not conn:
            return {
                "success": False,
                "message": "Không kết nối được database"
            }

        cursor = conn.cursor()

        email = data.get("email")
        mat_khau = data.get("mat_khau")

        cursor.execute(
            "SELECT * FROM NGUOI_DUNG WHERE EMAIL=%s",
            (email,)
        )

        user = cursor.fetchone()

        conn.close()

        if not user:
            return {
                "success": False,
                "message": "Email không tồn tại"
            }

        if not bcrypt.checkpw(
            mat_khau.encode("utf-8"),
            user["MAT_KHAU"].encode("utf-8")
        ):
            return {
                "success": False,
                "message": "Sai mật khẩu"
            }

        # Tạo JWT token
        token = jwt.encode(
            {
                "ma_nguoi_dung": user["MA_NGUOI_DUNG"],
                "email": user["EMAIL"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            Config.SECRET_KEY,
            algorithm="HS256"
        )

        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "token": token,
            "user": {
                "ma_nguoi_dung": user["MA_NGUOI_DUNG"],
                "ten": user["TEN"],
                "email": user["EMAIL"],
                "so_dien_thoai": user["SO_DIEN_THOAI"]
            }
        }
