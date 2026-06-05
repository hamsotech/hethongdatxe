from flask_socketio import emit, join_room
from .socket_server import socketio
from flask import request

# Từ điển lưu trạng thái các tài xế đang hoạt động: { driver_id: socket_id }
active_drivers = {}

@socketio.on('driver_register')
def handle_driver_register(data):
    driver_id = data.get('driver_id')
    active_drivers[driver_id] = request.sid
    print(f"[SOCKET] Tài xế {driver_id} đã đăng ký trạng thái trực tuyến.")

@socketio.on('driver_accept_ride')
def handle_driver_accept(data):
    trip_id = str(data.get('trip_id'))
    driver_id = data.get('driver_id')
    
    # Tài xế tham gia chung vào Room của chuyến đi cùng Khách hàng
    join_room(trip_id)
    print(f"[SOCKET] Tài xế {driver_id} gia nhập phòng chuyến đi: {trip_id}")
    
    # Truy vấn thông tin tài xế và phương tiện từ DB để gửi cho khách hàng
    from app.utils.database import get_connection
    driver_name = "Tài xế"
    so_dien_thoai = "0987654321"
    bien_so = "N/A"
    loai_xe = "Xe máy"
    conn = get_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT tx.TEN, tx.SO_DIEN_THOAI, pt.LOAI_XE, pt.BIEN_SO 
                FROM TAI_XE tx
                LEFT JOIN PHUONG_TIEN pt ON tx.MA_TAI_XE = pt.MA_TAI_XE
                WHERE tx.MA_TAI_XE = %s
                """,
                (driver_id,)
            )
            driver_info = cursor.fetchone()
            if driver_info:
                driver_name = driver_info.get("TEN") or "Tài xế"
                so_dien_thoai = driver_info.get("SO_DIEN_THOAI") or "0987654321"
                bien_so = driver_info.get("BIEN_SO") or "N/A"
                loai_xe = driver_info.get("LOAI_XE") or "Xe máy"
        except Exception as e:
            print("[SOCKET-DRIVER] Lỗi truy vấn thông tin tài xế:", e)
        finally:
            conn.close()

    # Bắn thông báo cập nhật trạng thái chuyến đi thẳng vào Room 
    emit('ride_status_changed', {
        'status': 'accepted',
        'driver_id': driver_id,
        'trip_id': trip_id,
        'driver_name': driver_name,
        'so_dien_thoai': so_dien_thoai,
        'bien_so': bien_so,
        'loai_xe': loai_xe
    }, to=trip_id)

@socketio.on('driver_share_location')
def handle_location_share(data):
    trip_id = str(data.get('trip_id'))
    current_location = data.get('location') # {lat: ..., lng: ...}
    
    # Gửi định vị mới của tài xế tới Khách hàng trong phòng (không gửi ngược lại tài xế)
    emit('driver_location_updated', {
        'location': current_location
    }, to=trip_id, include_self=False)

@socketio.on('driver_complete_ride')
def handle_driver_complete(data):
    trip_id = str(data.get('trip_id'))
    driver_id = data.get('driver_id')
    print(f"[SOCKET] Tài xế {driver_id} hoàn thành chuyến đi: {trip_id}")
    emit('ride_status_changed', {
        'status': 'completed',
        'driver_id': driver_id,
        'trip_id': trip_id
    }, to=trip_id)


@socketio.on('driver_pickup_customer')
def handle_driver_pickup(data):
    trip_id = str(data.get('trip_id'))
    driver_id = data.get('driver_id')
    print(f"[SOCKET] Tài xế {driver_id} đã đón khách cho chuyến đi: {trip_id}")
    emit('ride_status_changed', {
        'status': 'picked_up',
        'driver_id': driver_id,
        'trip_id': trip_id
    }, to=trip_id)