import uuid
from flask_socketio import emit, join_room
from .socket_server import socketio
from flask import request


@socketio.on('customer_request_ride')
def handle_ride_request(data):
    customer_id = data.get('customer_id')
    pickup_loc = data.get('pickup_location')
    drop_loc = data.get('drop_location')

    # Dùng UUID để tránh trùng trip_id khi cùng 1 khách đặt nhiều cuốc
    trip_id = f"TRIP_{customer_id}_{uuid.uuid4().hex[:8]}"

    join_room(trip_id)
    print(f"[SOCKET] Khách hàng {customer_id} tạo phòng chuyến đi: {trip_id}")

    emit('global_new_trip_alert', {
        'trip_id': trip_id,
        'customer_id': customer_id,
        'pickup_location': pickup_loc,
        'drop_location': drop_loc
    }, broadcast=True)

@socketio.on('join_trip_room')
def handle_join_trip(data):
    trip_id = str(data.get('trip_id'))
    user_id = data.get('user_id')
    role = data.get('role', 'customer')
    join_room(trip_id)
    print(f"[SOCKET] {role.capitalize()} {user_id} gia nhập phòng chuyến đi: {trip_id}")

@socketio.on('customer_call_driver')
def handle_customer_call(data):
    trip_id = str(data.get('trip_id'))
    print(f"[SOCKET] Khách hàng yêu cầu cuộc gọi trong phòng: {trip_id}")
    emit('incoming_call_alert', {
        'trip_id': trip_id,
        'message': 'Cuộc gọi đến từ khách hàng...'
    }, to=trip_id, include_self=False)

@socketio.on('driver_respond_call')
def handle_driver_call_respond(data):
    trip_id = str(data.get('trip_id'))
    action = data.get('action')
    print(f"[SOCKET] Tài xế phản hồi cuộc gọi trong phòng {trip_id}: {action}")
    emit('call_status_changed', {
        'action': action
    }, to=trip_id, include_self=False)

@socketio.on('customer_cancel_call')
def handle_customer_cancel_call(data):
    trip_id = str(data.get('trip_id'))
    print(f"[SOCKET] Khách hàng hủy cuộc gọi trong phòng: {trip_id}")
    emit('call_status_changed', {
        'action': 'cancel'
    }, to=trip_id, include_self=False)
