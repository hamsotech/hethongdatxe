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
