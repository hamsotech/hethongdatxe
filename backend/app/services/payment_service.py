from app.utils.database import get_connection


class PaymentService:

    @staticmethod
    def create_payment(data):

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        INSERT INTO THANH_TOAN
        (
            MA_CHUYEN_DI,
            SO_TIEN,
            PHUONG_THUC,
            TRANG_THAI
        )
        VALUES (%s,%s,%s,%s)
        """

        cursor.execute(
            sql,
            (
                data["ma_chuyen_di"],
                data["so_tien"],
                data["phuong_thuc"],
                "CHO_THANH_TOAN"
            )
        )

        conn.commit()

        payment_id = cursor.lastrowid

        conn.close()

        return {
            "success": True,
            "message": "Tạo thanh toán thành công",
            "payment_id": payment_id
        }

    @staticmethod
    def confirm_payment(ma_thanh_toan):

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE THANH_TOAN
            SET TRANG_THAI='DA_THANH_TOAN'
            WHERE MA_THANH_TOAN=%s
            """,
            (ma_thanh_toan,)
        )

        conn.commit()

        conn.close()

        return {
            "success": True,
            "message": "Thanh toán thành công"
        }

    @staticmethod
    def get_payment_history(ma_nguoi_dung):
        """Chỉ trả về lịch sử thanh toán của đúng người dùng đó"""

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT tt.*
            FROM THANH_TOAN tt
            JOIN CHUYEN_DI cd ON tt.MA_CHUYEN_DI = cd.MA_CHUYEN_DI
            WHERE cd.MA_NGUOI_DUNG = %s
            """,
            (ma_nguoi_dung,)
        )

        payments = cursor.fetchall()

        conn.close()

        return payments
