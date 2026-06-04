<<<<<<< Updated upstream
/**
 * js/customer/history.js
 * Fetch và hiển thị lịch sử chuyến đi của khách hàng.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('trip-history-list');

    // Nếu không ở trang history thì bỏ qua
    if (!historyList) return;

    // 1. Hiển thị trạng thái loading trước khi gọi API
    historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--color-text-muted);">Đang tải lịch sử chuyến đi...</p>';

    try {
        // Giả sử lấy user_id từ localStorage sau khi user đăng nhập
        const userId = localStorage.getItem('user_id') || 1;
        
        // 2. Gọi API lấy danh sách chuyến đi bằng file api.js dùng chung
        const response = await API.get(`/customer/${userId}/history`);
        
        // Cấu trúc trả về dự kiến: response.data là mảng các chuyến đi
        const trips = response.data || response;

        // Nếu mảng rỗng
        if (!trips || trips.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                    <p style="color: var(--color-text-muted);">Bạn chưa có chuyến đi nào.</p>
                </div>`;
            return;
        }

        // Xóa nội dung loading
        historyList.innerHTML = '';

        // 3. Render danh sách chuyến đi ra giao diện
        trips.forEach(trip => {
            // Xử lý format ngày giờ (Ví dụ: 12 Tháng 10, 14:30)
            const tripDate = new Date(trip.created_at || trip.date);
            const formattedDate = `${tripDate.getDate()} Tháng ${tripDate.getMonth() + 1}, ${tripDate.getHours().toString().padStart(2, '0')}:${tripDate.getMinutes().toString().padStart(2, '0')}`;
            
            // Xử lý format tiền tệ (Ví dụ: 150.000đ)
            const formattedPrice = new Intl.NumberFormat('vi-VN').format(trip.price) + 'đ';

            // Xử lý trạng thái và áp dụng ĐÚNG MÀU TỪ CSS CỦA TEAM (common.css)
            let statusText = 'Đang xử lý';
            let statusColor = 'var(--color-text-muted)'; 

            if (trip.status === 'completed') {
                statusText = 'Hoàn thành';
                statusColor = 'var(--color-green)'; // Xanh lá
            } else if (trip.status === 'cancelled') {
                statusText = 'Đã hủy';
                statusColor = 'var(--color-red)';   // Đỏ
            } else if (trip.status === 'ongoing') {
                statusText = 'Đang di chuyển';
                statusColor = 'var(--color-blue)';  // Xanh dương chủ đạo
            }

            // Tạo thẻ <li> cho mỗi chuyến đi
            const li = document.createElement('li');
            li.className = 'trip-item';
            
            // Sử dụng Template Literal để nhúng dữ liệu vào HTML
            li.innerHTML = `
                <div class="trip-item__header">
                    <span class="trip-item__date">${formattedDate}</span>
                    <span class="trip-item__status" style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
                </div>
                <div class="trip-item__route">
                    <p class="route-point">${trip.pickup_location}</p>
                    <p class="route-point">${trip.dropoff_location}</p>
                </div>
                <div class="trip-item__footer">
                    <span class="trip-item__price">${formattedPrice}</span>
                </div>
            `;

            historyList.appendChild(li);
        });

    } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error);
        // Báo lỗi bằng màu đỏ (--color-red) của team
        historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--color-red);">Không thể tải lịch sử chuyến đi. Vui lòng thử lại sau.</p>';
    }
=======
/**
 * js/customer/history.js
 * Fetch và hiển thị lịch sử chuyến đi của khách hàng.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('trip-history-list');

    // Nếu không ở trang history thì bỏ qua
    if (!historyList) return;

    // 1. Hiển thị trạng thái loading trước khi gọi API
    historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--color-text-muted);">Đang tải lịch sử chuyến đi...</p>';

    try {
        // Giả sử lấy user_id từ localStorage sau khi user đăng nhập
        const userId = localStorage.getItem('user_id') || 1;
        
        // 2. Gọi API lấy danh sách chuyến đi bằng file api.js dùng chung
        const response = await API.get(`/customer/${userId}/history`);
        
        // Cấu trúc trả về dự kiến: response.data là mảng các chuyến đi
        const trips = response.data || response;

        // Nếu mảng rỗng
        if (!trips || trips.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                    <p style="color: var(--color-text-muted);">Bạn chưa có chuyến đi nào.</p>
                </div>`;
            return;
        }

        // Xóa nội dung loading
        historyList.innerHTML = '';

        // 3. Render danh sách chuyến đi ra giao diện
        trips.forEach(trip => {
            // Xử lý format ngày giờ (Ví dụ: 12 Tháng 10, 14:30)
            const tripDate = new Date(trip.created_at || trip.date);
            const formattedDate = `${tripDate.getDate()} Tháng ${tripDate.getMonth() + 1}, ${tripDate.getHours().toString().padStart(2, '0')}:${tripDate.getMinutes().toString().padStart(2, '0')}`;
            
            // Xử lý format tiền tệ (Ví dụ: 150.000đ)
            const formattedPrice = new Intl.NumberFormat('vi-VN').format(trip.price) + 'đ';

            // Xử lý trạng thái và áp dụng ĐÚNG MÀU TỪ CSS CỦA TEAM (common.css)
            let statusText = 'Đang xử lý';
            let statusColor = 'var(--color-text-muted)'; 

            if (trip.status === 'completed') {
                statusText = 'Hoàn thành';
                statusColor = 'var(--color-green)'; // Xanh lá
            } else if (trip.status === 'cancelled') {
                statusText = 'Đã hủy';
                statusColor = 'var(--color-red)';   // Đỏ
            } else if (trip.status === 'ongoing') {
                statusText = 'Đang di chuyển';
                statusColor = 'var(--color-blue)';  // Xanh dương chủ đạo
            }

            // Tạo thẻ <li> cho mỗi chuyến đi
            const li = document.createElement('li');
            li.className = 'trip-item';
            
            // Sử dụng Template Literal để nhúng dữ liệu vào HTML
            li.innerHTML = `
                <div class="trip-item__header">
                    <span class="trip-item__date">${formattedDate}</span>
                    <span class="trip-item__status" style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
                </div>
                <div class="trip-item__route">
                    <p class="route-point">${trip.pickup_location}</p>
                    <p class="route-point">${trip.dropoff_location}</p>
                </div>
                <div class="trip-item__footer">
                    <span class="trip-item__price">${formattedPrice}</span>
                </div>
            `;

            historyList.appendChild(li);
        });

    } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error);
        // Báo lỗi bằng màu đỏ (--color-red) của team
        historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--color-red);">Không thể tải lịch sử chuyến đi. Vui lòng thử lại sau.</p>';
    }
>>>>>>> Stashed changes
});