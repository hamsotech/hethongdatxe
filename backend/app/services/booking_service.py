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
            TRANG_THAI,
            THOI_GIAN_TAO
        )
        VALUES (%s,%s,%s,%s,%s, NOW())
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

        # Tạo bản ghi thanh toán ban đầu trong bảng THANH_TOAN
        phuong_thuc = data.get("phuong_thuc", "Tiền mặt")
        sql_payment = """
        INSERT INTO THANH_TOAN (MA_CHUYEN_DI, SO_TIEN, PHUONG_THUC, TRANG_THAI)
        VALUES (%s, %s, %s, 'CHO_THANH_TOAN')
        """
        cursor.execute(sql_payment, (trip_id, data["gia_tien"], phuong_thuc))
        conn.commit()

        conn.close()

        # Phát sóng realtime cho tất cả tài xế đang online
        try:
            from app.websocket.socket_server import socketio
            socketio.emit('global_new_trip_alert', {
                'trip_id': trip_id,
                'customer_id': data["ma_nguoi_dung"],
                'pickup_location': data["diem_don"],
                'drop_location': data["diem_den"],
                'price': data["gia_tien"]
            })
            print(f"[SOCKET-API] Đã phát sóng chuyến đi mới {trip_id} tới các tài xế.")
        except Exception as e:
            print("[SOCKET-API] Lỗi phát sóng socket:", e)

        return {
            "success": True,
            "message": "Đặt xe thành công",
            "trip_id": trip_id
        }