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
    trip_id = data.get('trip_id')
    driver_id = data.get('driver_id')
    
    # Tài xế tham gia chung vào Room của chuyến đi cùng Khách hàng
    join_room(trip_id)
    print(f"[SOCKET] Tài xế {driver_id} gia nhập phòng chuyến đi: {trip_id}")
    
    # Bắn thông báo cập nhật trạng thái chuyến đi thẳng vào Room 
    # (Khách hàng đang ở trong Room này sẽ lập tức nhận được)
    emit('ride_status_changed', {
        'status': 'accepted',
        'driver_id': driver_id,
        'trip_id': trip_id
    }, to=trip_id)

@socketio.on('driver_share_location')
def handle_location_share(data):
    trip_id = data.get('trip_id')
    current_location = data.get('location') # {lat: ..., lng: ...}
    
    # Gửi định vị mới của tài xế tới Khách hàng trong phòng (không gửi ngược lại tài xế)
    emit('driver_location_updated', {
        'location': current_location
    }, to=trip_id, include_self=False)