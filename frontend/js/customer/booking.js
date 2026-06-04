/**
 * js/customer/booking.js
 * Xử lý logic tìm điểm đến, tính giá, đặt chuyến xe và hệ thống thông báo.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // ĐỒNG BỘ ẢNH ĐẠI DIỆN LÊN TRANG CHỦ
    // ==========================================
    const savedAvatar = localStorage.getItem('customer_avatar');
    const dashboardAvatar = document.getElementById('user-avatar');
    if (savedAvatar && dashboardAvatar) {
        dashboardAvatar.src = savedAvatar;
    }

    // ==========================================
    // LOGIC HỆ THỐNG THÔNG BÁO (NOTIFICATION)
    // ==========================================
    const btnNotifications = document.getElementById('btn-notifications');
    const notificationBadge = document.getElementById('nav-notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');

    // Mảng dữ liệu thông báo
    let notifications = [
        { id: 1, text: "🎉 Khuyến mãi: Nhập RIDEBLUE giảm ngay 20% cho chuyến đi đầu tiên.", unread: true },
        { id: 2, text: "🚗 Chuyến đi TRP-9812 của bạn đã hoàn thành xuất sắc.", unread: true },
        { id: 3, text: "⚠️ Tài khoản của bạn đã được xác minh thành công.", unread: false }
    ];

    function renderNotifications() {
        if (!notificationDropdown) return;

        // Đếm và hiển thị số lượng chưa đọc lên chấm đỏ
        const unreadCount = notifications.filter(n => n.unread).length;
        if (unreadCount > 0 && notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'flex';
        } else if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }

        // Đổ danh sách vào khay dropdown
        notificationDropdown.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.unread ? 'notification-item--unread' : ''}" data-id="${n.id}">
                ${n.text}
            </div>
        `).join('');

        // Bấm vào tin để đổi trạng thái thành "đã đọc"
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const noti = notifications.find(n => n.id === id);
                if (noti && noti.unread) {
                    noti.unread = false;
                    renderNotifications(); 
                }
            });
        });
    }

    renderNotifications();

    // Ẩn hiện khay thông báo khi bấm chuông
    if (btnNotifications && notificationDropdown) {
        btnNotifications.addEventListener('click', (e) => {
            e.stopPropagation(); 
            notificationDropdown.classList.toggle('notification-dropdown--active');
        });
    }

    // Tự đóng khay khi bấm ra ngoài
    document.addEventListener('click', () => {
        if (notificationDropdown && notificationDropdown.classList.contains('notification-dropdown--active')) {
            notificationDropdown.classList.remove('notification-dropdown--active');
        }
    });

    // ==========================================
    // LOGIC ĐIỀU HƯỚNG TRANG DASHBOARD
    // ==========================================
    const searchDestBtn = document.getElementById('search-destination-btn');
    const btnBookRide = document.getElementById('btn-book-ride');
    const btnViewHistory = document.getElementById('btn-view-history');

    if (searchDestBtn) {
        searchDestBtn.addEventListener('click', () => {
            window.location.href = 'book_ride.html';
        });
    }

    if (btnBookRide) {
        btnBookRide.addEventListener('click', () => {
            window.location.href = 'book_ride.html';
        });
    }

    if (btnViewHistory) {
        btnViewHistory.addEventListener('click', () => {
            window.location.href = 'history.html'; 
        });
    }

    // ==========================================
    // LOGIC CHO TRANG BOOK RIDE (ĐẶT XE)
    // ==========================================
    const btnBack = document.getElementById('btn-back');
    const btnConfirmBooking = document.getElementById('btn-confirm-booking');
    const inputPickup = document.getElementById('pickup-location');
    const inputDropoff = document.getElementById('dropoff-location');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener('click', async () => {
            const pickup = inputPickup.value.trim();
            const dropoff = inputDropoff.value.trim();
            const vehicleType = document.querySelector('input[name="vehicle_type"]:checked').value;

            if (!pickup || !dropoff) {
                alert('Vui lòng nhập đầy đủ điểm đón và điểm đến!');
                return;
            }

            btnConfirmBooking.textContent = 'Đang xử lý...';
            btnConfirmBooking.disabled = true;

            try {
                const payload = {
                    pickup_location: pickup,
                    dropoff_location: dropoff,
                    vehicle_type: vehicleType,
                    user_id: localStorage.getItem('user_id') || 1 
                };

                // Giả lập kết nối API
                const response = await API.post('/customer/book', payload);

                if (response.success) {
                    sessionStorage.setItem('current_trip_id', response.data.trip_id);
                    window.location.href = 'tracking.html';
                }

            } catch (error) {
                alert('Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.');
                btnConfirmBooking.textContent = 'Xác nhận đặt xe';
                btnConfirmBooking.disabled = false;
            }
        });
    }
});