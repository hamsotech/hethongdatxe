/**
 * js/socket.js
 * Quản lý kết nối WebSocket qua Socket.IO.
 * Yêu cầu: nhúng CDN Socket.IO trước file này trong HTML:
 * <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
 */

const socket = io(window.location.origin, { autoConnect: true });

socket.on('connect', () => {
    console.log('✅ Socket.IO đã kết nối. ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('❌ Lỗi kết nối Socket.IO:', error);
});

socket.on('disconnect', () => {
    console.warn('⚠️ Socket.IO đã ngắt kết nối.');
});

const SocketManager = {
    // Đăng ký user khi vào hệ thống
    connect: function(userId, role) {
        socket.emit('user_register', { userId, role });
    },

    // Gửi sự kiện lên server
    sendMessage: function(type, payload) {
        socket.emit(type, payload);
    },

    // Lắng nghe sự kiện từ server
    listen: function(event, callback) {
        socket.on(event, callback);
    },

    // Bỏ lắng nghe sự kiện
    off: function(event) {
        socket.off(event);
    }
};

// Tiện ích dành cho Khách hàng
const CustomerSocket = {
    requestRide: (customerId, pickup, drop) => {
        socket.emit('customer_request_ride', {
            customer_id: customerId,
            pickup_location: pickup,
            drop_location: drop
        });
    },
    onRideAccepted: (callback) => {
        socket.on('ride_status_changed', callback);
    },
    onDriverLocationUpdate: (callback) => {
        socket.on('driver_location_updated', callback);
    },
    callDriver: (tripId) => {
        socket.emit('customer_call_driver', { trip_id: tripId });
    },
    cancelCall: (tripId) => {
        socket.emit('customer_cancel_call', { trip_id: tripId });
    },
    onCallStatusChanged: (callback) => {
        socket.on('call_status_changed', callback);
    }
};

// Tiện ích dành cho Tài xế
const DriverSocket = {
    goOnline: (driverId) => {
        socket.emit('driver_register', { driver_id: driverId });
    },
    acceptRide: (tripId, driverId) => {
        socket.emit('driver_accept_ride', { trip_id: tripId, driver_id: driverId });
    },
    sendLocation: (tripId, location) => {
        socket.emit('driver_share_location', { trip_id: tripId, location: location });
    },
    completeRide: (tripId, driverId) => {
        socket.emit('driver_complete_ride', { trip_id: tripId, driver_id: driverId });
    },
    onNewTrip: (callback) => {
        socket.on('global_new_trip_alert', callback);
    },
    respondCall: (tripId, action) => {
        socket.emit('driver_respond_call', { trip_id: tripId, action: action });
    },
    onIncomingCall: (callback) => {
        socket.on('incoming_call_alert', callback);
    },
    onCallStatusChanged: (callback) => {
        socket.on('call_status_changed', callback);
    }
};
