/**
 * js/customer/tracking.js
 * Quản lý trạng thái chuyến đi và kết nối Socket.IO để theo dõi tài xế.
 */

document.addEventListener('DOMContentLoaded', () => {
    const tripStatusText = document.getElementById('trip-status-text');
    const driverInfoCard = document.getElementById('driver-info-card');
    const btnCancelTrip = document.getElementById('btn-cancel-trip');
    const searchingCard = document.getElementById('searching-card');
    const btnCancelSearching = document.getElementById('btn-cancel-searching');

    const currentTripId = sessionStorage.getItem('current_trip_id');

    if (!currentTripId) {
        alert('Không tìm thấy chuyến đi hiện tại!');
        window.location.href = 'dashboard.html';
        return;
    }

    let driverPhone = '0987654321';

    // Hàm đồng bộ trạng thái ban đầu đề phòng bất đồng bộ
    async function checkInitialTripStatus() {
        try {
            const data = await API.get(`/customer/trip/${currentTripId}`);
            if (data.success && data.trip) {
                const trip = data.trip;
                
                // Cập nhật Phương thức thanh toán & Giá tiền lên giao diện
                const payMethodEl = document.getElementById('tracking-payment-method');
                const payIconEl = document.getElementById('tracking-payment-icon');
                const tripPriceEl = document.getElementById('tracking-trip-price');

                if (payMethodEl) payMethodEl.textContent = trip.PHUONG_THUC || 'Tiền mặt';
                if (tripPriceEl) tripPriceEl.textContent = `${parseInt(trip.GIA_TIEN || 0).toLocaleString('vi-VN')} đ`;
                if (payIconEl) {
                    const method = trip.PHUONG_THUC || 'Tiền mặt';
                    if (method === 'Thẻ tín dụng') payIconEl.textContent = '💳';
                    else if (method === 'Ví điện tử') payIconEl.textContent = '📱';
                    else if (method === 'Ví MoMo') payIconEl.textContent = '🌸';
                    else payIconEl.textContent = '💵';
                }

                // Lưu toạ độ/địa chỉ chuyến đi để map.js vẽ lộ trình
                sessionStorage.setItem('customer_active_trip_pickup', trip.DIEM_DON);
                sessionStorage.setItem('customer_active_trip_drop', trip.DIEM_DEN);

                // Khởi chạy vẽ lại bản đồ lộ trình sau khi lưu sessionStorage
                if (typeof window.initLeafletMap === 'function') {
                    window.initLeafletMap();
                }

                if (trip.TRANG_THAI === 'DA_NHAN' || trip.TRANG_THAI === 'DANG_DI') {
                    if (searchingCard) searchingCard.style.display = 'none';
                    if (driverInfoCard) driverInfoCard.style.display = 'block';

                    if (trip.TRANG_THAI === 'DANG_DI') {
                        if (tripStatusText) tripStatusText.textContent = 'Đang trong chuyến đi...';
                        if (btnCancelTrip) btnCancelTrip.style.display = 'none';
                    } else {
                        if (tripStatusText) tripStatusText.textContent = 'Tài xế đang đến...';
                        if (btnCancelTrip) btnCancelTrip.style.display = 'inline-block';
                    }
                    
                    if (data.driver) {
                        driverPhone = data.driver.so_dien_thoai || '0987654321';
                        
                        const driverNameEl = document.getElementById('driver-name');
                        if (driverNameEl) driverNameEl.textContent = data.driver.ten || 'Tài xế';
                        
                        const vehiclePlateEl = document.getElementById('vehicle-plate');
                        if (vehiclePlateEl) vehiclePlateEl.textContent = data.driver.bien_so || 'N/A';
                        
                        const vehicleDescEl = document.getElementById('vehicle-desc');
                        if (vehicleDescEl) vehicleDescEl.textContent = data.driver.loai_xe || 'Xe máy';
                    }
                } else if (trip.TRANG_THAI === 'CHO_TAI_XE') {
                    if (searchingCard) searchingCard.style.display = 'block';
                    if (driverInfoCard) driverInfoCard.style.display = 'none';
                } else if (trip.TRANG_THAI === 'HOAN_THANH') {
                    alert('Chuyến đi đã hoàn thành! Vui lòng đánh giá dịch vụ.');
                    window.location.href = 'rating.html';
                }
            }
        } catch (error) {
            console.error('Lỗi đồng bộ trạng thái ban đầu:', error);
        }
    }

    checkInitialTripStatus();

    // Kết nối Socket.IO (dùng SocketManager từ socket.js)
    if (typeof SocketManager !== 'undefined') {
        const userId = localStorage.getItem('user_id') || 1;
        SocketManager.connect(userId, 'customer');

        // Gia nhập lại phòng của chuyến đi để nhận thông tin realtime
        const joinRoom = () => {
            SocketManager.sendMessage('join_trip_room', { trip_id: currentTripId, user_id: userId, role: 'customer' });
        };

        // Gửi khi mới vào trang
        joinRoom();

        // Tự động gia nhập lại nếu bị mất kết nối và kết nối lại
        SocketManager.listen('connect', joinRoom);

        // Lắng nghe các thay đổi về trạng thái chuyến đi
        SocketManager.listen('ride_status_changed', function(data) {
            if (data.status === 'accepted') {
                if (searchingCard) searchingCard.style.display = 'none';
                if (driverInfoCard) driverInfoCard.style.display = 'block';
                if (tripStatusText) tripStatusText.textContent = 'Tài xế đang đến...';
                if (btnCancelTrip) btnCancelTrip.style.display = 'inline-block';
                
                driverPhone = data.so_dien_thoai || '0987654321';
                
                const driverNameEl = document.getElementById('driver-name');
                if (driverNameEl) driverNameEl.textContent = data.driver_name || 'Tài xế';
                
                const vehiclePlateEl = document.getElementById('vehicle-plate');
                if (vehiclePlateEl) vehiclePlateEl.textContent = data.bien_so || 'N/A';
                
                const vehicleDescEl = document.getElementById('vehicle-desc');
                if (vehicleDescEl) vehicleDescEl.textContent = data.loai_xe || 'Xe máy';
            } else if (data.status === 'picked_up') {
                if (searchingCard) searchingCard.style.display = 'none';
                if (driverInfoCard) driverInfoCard.style.display = 'block';
                if (tripStatusText) tripStatusText.textContent = 'Đang trong chuyến đi...';
                if (btnCancelTrip) btnCancelTrip.style.display = 'none';
            } else if (data.status === 'completed') {
                alert('Chuyến đi đã hoàn thành! Vui lòng đánh giá dịch vụ.');
                window.location.href = 'rating.html';
            }
        });

        // Lắng nghe vị trí tài xế (map.js sẽ xử lý cập nhật marker)
        SocketManager.listen('driver_location_updated', function(data) {
            console.log('[TRACKING] Vị trí tài xế mới:', data.location);
        });

        // Lắng nghe trạng thái phản hồi cuộc gọi từ Tài xế
        SocketManager.listen('call_status_changed', function(data) {
            handleCallStatusChange(data.action);
        });
    }

    // --- LOGIC HỆ THỐNG GỌI ĐIỆN SIMULATOR ---
    const outgoingCallModal = document.getElementById('outgoing-call-modal');
    const outgoingCallStatus = document.getElementById('outgoing-call-status');
    const btnCancelCall = document.getElementById('btn-cancel-call');
    let callTimer = null;
    let callDuration = 0;

    function formatTime(secs) {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function handleCallStatusChange(action) {
        if (action === 'accept') {
            outgoingCallStatus.textContent = 'Đang trong cuộc gọi: 00:00';
            callDuration = 0;
            if (callTimer) clearInterval(callTimer);
            callTimer = setInterval(() => {
                callDuration++;
                outgoingCallStatus.textContent = `Đang trong cuộc gọi: ${formatTime(callDuration)}`;
            }, 1000);
        } else if (action === 'decline' || action === 'hangup' || action === 'cancel') {
            if (callTimer) clearInterval(callTimer);
            outgoingCallStatus.textContent = action === 'decline' ? 'Cuộc gọi bị từ chối' : 'Cuộc gọi đã kết thúc';
            setTimeout(() => {
                if (outgoingCallModal) outgoingCallModal.style.display = 'none';
            }, 1500);
        }
    }

    // Nút gọi điện tài xế (Mở Simulator và phát tín hiệu socket)
    const btnCallDriver = document.getElementById('btn-call-driver');
    if (btnCallDriver) {
        btnCallDriver.addEventListener('click', () => {
            if (outgoingCallModal) {
                outgoingCallStatus.textContent = 'Đang kết nối...';
                outgoingCallModal.style.display = 'flex';
            }
            if (typeof SocketManager !== 'undefined') {
                SocketManager.sendMessage('customer_call_driver', { trip_id: currentTripId });
            }
        });
    }

    if (btnCancelCall) {
        btnCancelCall.addEventListener('click', () => {
            if (callTimer) clearInterval(callTimer);
            if (outgoingCallModal) outgoingCallModal.style.display = 'none';
            if (typeof SocketManager !== 'undefined') {
                SocketManager.sendMessage('customer_cancel_call', { trip_id: currentTripId });
            }
        });
    }

    // Nút hủy chuyến
    async function cancelTrip() {
        if (!confirm('Bạn có chắc chắn muốn hủy chuyến đi này?')) return;

        try {
            // FIX: endpoint đúng /customer/trip/:id/cancel (đã thêm route vào backend)
            await API.post(`/customer/trip/${currentTripId}/cancel`, {});
            alert('Đã hủy chuyến!');
            sessionStorage.removeItem('current_trip_id');
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Lỗi khi hủy chuyến. Vui lòng thử lại.');
        }
    }

    if (btnCancelTrip) {
        btnCancelTrip.addEventListener('click', cancelTrip);
    }

    if (btnCancelSearching) {
        btnCancelSearching.addEventListener('click', cancelTrip);
    }
});
