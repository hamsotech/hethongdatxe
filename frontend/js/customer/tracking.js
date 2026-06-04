<<<<<<< Updated upstream
/**
 * js/customer/tracking.js
 * Quản lý trạng thái chuyến đi và kết nối WebSocket để theo dõi.
 */

document.addEventListener('DOMContentLoaded', () => {
    const tripStatusText = document.getElementById('trip-status-text');
    const driverInfoCard = document.getElementById('driver-info-card');
    const btnCancelTrip = document.getElementById('btn-cancel-trip');
    
    // Lấy ID chuyến đi vừa đặt
    const currentTripId = sessionStorage.getItem('current_trip_id');

    if (!currentTripId) {
        alert('Không tìm thấy chuyến đi hiện tại!');
        window.location.href = 'dashboard.html';
        return;
    }

    // Khởi tạo Socket (Ví dụ user_id = 1)
    SocketManager.connect(1, 'customer');

    // Lắng nghe dữ liệu thời gian thực từ Backend gửi về
    SocketManager.listen((data) => {
        switch (data.type) {
            case 'DRIVER_FOUND':
                tripStatusText.textContent = 'Tài xế đang đến...';
                // Render thông tin tài xế từ payload
                document.getElementById('driver-name').textContent = data.payload.driver_name;
                document.getElementById('vehicle-plate').textContent = data.payload.license_plate;
                // Hiển thị Card thông tin tài xế
                driverInfoCard.style.display = 'block';
                break;
                
            case 'DRIVER_LOCATION_UPDATE':
                // Gọi hàm cập nhật marker trên map.js (giả lập)
                // updateMapMarker(data.payload.lat, data.payload.lng);
                break;

            case 'TRIP_COMPLETED':
                alert('Chuyến đi đã hoàn thành!');
                window.location.href = 'rating.html';
                break;
        }
    });

    // Nút hủy chuyến
    if (btnCancelTrip) {
        btnCancelTrip.addEventListener('click', async () => {
            const confirmCancel = confirm('Bạn có chắc chắn muốn hủy chuyến đi này?');
            if (confirmCancel) {
                try {
                    await API.post(`/customer/trip/${currentTripId}/cancel`, {});
                    alert('Đã hủy chuyến!');
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    alert('Lỗi khi hủy chuyến.');
                }
            }
        });
    }
=======
/**
 * js/customer/tracking.js
 * Quản lý trạng thái chuyến đi và kết nối WebSocket để theo dõi.
 */

document.addEventListener('DOMContentLoaded', () => {
    const tripStatusText = document.getElementById('trip-status-text');
    const driverInfoCard = document.getElementById('driver-info-card');
    const btnCancelTrip = document.getElementById('btn-cancel-trip');
    
    // Lấy ID chuyến đi vừa đặt
    const currentTripId = sessionStorage.getItem('current_trip_id');

    if (!currentTripId) {
        alert('Không tìm thấy chuyến đi hiện tại!');
        window.location.href = 'dashboard.html';
        return;
    }

    // Khởi tạo Socket (Ví dụ user_id = 1)
    SocketManager.connect(1, 'customer');

    // Lắng nghe dữ liệu thời gian thực từ Backend gửi về
    SocketManager.listen((data) => {
        switch (data.type) {
            case 'DRIVER_FOUND':
                tripStatusText.textContent = 'Tài xế đang đến...';
                // Render thông tin tài xế từ payload
                document.getElementById('driver-name').textContent = data.payload.driver_name;
                document.getElementById('vehicle-plate').textContent = data.payload.license_plate;
                // Hiển thị Card thông tin tài xế
                driverInfoCard.style.display = 'block';
                break;
                
            case 'DRIVER_LOCATION_UPDATE':
                // Gọi hàm cập nhật marker trên map.js (giả lập)
                // updateMapMarker(data.payload.lat, data.payload.lng);
                break;

            case 'TRIP_COMPLETED':
                alert('Chuyến đi đã hoàn thành!');
                window.location.href = 'rating.html';
                break;
        }
    });

    // Nút hủy chuyến
    if (btnCancelTrip) {
        btnCancelTrip.addEventListener('click', async () => {
            const confirmCancel = confirm('Bạn có chắc chắn muốn hủy chuyến đi này?');
            if (confirmCancel) {
                try {
                    await API.post(`/customer/trip/${currentTripId}/cancel`, {});
                    alert('Đã hủy chuyến!');
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    alert('Lỗi khi hủy chuyến.');
                }
            }
        });
    }
>>>>>>> Stashed changes
});