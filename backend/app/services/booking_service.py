from app.utils.database import get_connection


class BookingService:

    @staticmethod
    def create_trip(data):

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        INSERT INTO CHUYEN_DI
        (
            MA_NGUOI_DUNG,
            DIEM_DON,
            DIEM_DEN,
            GIA_TIEN,
            TRANG_THAI
        )
        VALUES (%s,%s,%s,%s,%s)
        """

        cursor.execute(
            sql,
            (
                data["ma_nguoi_dung"],
                data["diem_don"],
                data["diem_den"],
                data["gia_tien"],
                "CHO_TAI_XE"
            )
        )

        conn.commit()

        trip_id = cursor.lastrowid

        conn.close()

        return {
            "success": True,
            "message": "Đặt xe thành công",
            "trip_id": trip_id
        }