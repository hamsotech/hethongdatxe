from app.utils.database import get_connection


class MatchingService:

    @staticmethod
    def get_available_trips():

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        SELECT *
        FROM CHUYEN_DI
        WHERE TRANG_THAI='CHO_TAI_XE'
        """

        cursor.execute(sql)

        trips = cursor.fetchall()

        conn.close()

        return trips

    @staticmethod
    def accept_trip(ma_chuyen_di, ma_tai_xe):

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        UPDATE CHUYEN_DI
        SET MA_TAI_XE=%s,
            TRANG_THAI='DA_NHAN'
        WHERE MA_CHUYEN_DI=%s
        """

        cursor.execute(
            sql,
            (ma_tai_xe, ma_chuyen_di)
        )

        conn.commit()

        conn.close()

        return {
            "success": True,
            "message": "Nhận chuyến thành công"
        }