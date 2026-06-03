// Lưu ý: nhúng CDN Socket.IO vào file HTML trước file này:
// <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

const socket = io("http://localhost:5000", {
    autoConnect: true
});

socket.on("connect", () => {
    console.log("-> Kết nối tới Realtime Server thành công! ID:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("-> Lỗi kết nối Realtime:", error);
});

// Các hàm tiện ích để giao tiếp với Realtime Server
const RealtimeApp = {
    // Cho Khách hàng đặt xe
    requestRide: (customerId, pickup, drop) => {
        socket.emit('customer_request_ride', {
            customer_id: customerId,
            pickup_location: pickup,
            drop_location: drop
        });
    },
    
    // Cho Tài xế bật trạng thái online
    driverOnline: (driverId) => {
        socket.emit('driver_register', { driver_id: driverId });
    },
    
    // Cho Tài xế nhận cuốc
    driverAccept: (tripId, driverId) => {
        socket.emit('driver_accept_ride', { trip_id: tripId, driver_id: driverId });
    },
    
    // Cho Tài xế cập nhật vị trí liên tục (gọi trong hàm location.js của tài xế)
    sendLiveLocation: (tripId, location) => {
        socket.emit('driver_share_location', { trip_id: tripId, location: location });
    }
};