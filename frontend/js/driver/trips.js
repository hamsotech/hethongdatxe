/**
 * js/driver/trips.js
 * Quản lý danh sách chuyến xe và lịch sử của tài xế.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const driverId = localStorage.getItem('user_id');
    if (!token) { window.location.replace('/login.html'); return; }

    const API_BASE_URL = `${window.location.origin}/api/driver`;

    const contentCurrent = document.getElementById('content-current');
    const contentHistory = document.getElementById('content-history');

    // Tải chuyến xe hiện tại đang hoạt động
    async function loadCurrentTrip() {
        const savedTripId = sessionStorage.getItem('driver_active_trip_id');
        if (!savedTripId) {
            contentCurrent.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                    <p>Bạn không có chuyến xe nào đang diễn ra.</p>
                </div>`;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/trip/${savedTripId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.trip) {
                const trip = data.trip;
                
                // Nếu trạng thái trong DB đã hoàn thành/hủy thì đồng bộ xóa session
                if (trip.TRANG_THAI === 'HOAN_THANH' || trip.TRANG_THAI === 'DA_HUY') {
                    sessionStorage.removeItem('driver_active_trip_id');
                    sessionStorage.removeItem('driver_active_trip_pickup');
                    sessionStorage.removeItem('driver_active_trip_drop');
                    sessionStorage.removeItem('driver_active_trip_price');
                    sessionStorage.removeItem('driver_active_trip_customer');
                    sessionStorage.removeItem('driver_active_trip_status');
                    contentCurrent.innerHTML = `
                        <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                            <p>Bạn không có chuyến xe nào đang diễn ra.</p>
                        </div>`;
                    return;
                }

                const formattedPrice = parseInt(trip.GIA_TIEN || 0).toLocaleString('vi-VN') + ' đ';
                
                const statusMap = {
                    'DA_NHAN': 'Đang đi đón khách',
                    'DANG_DI': 'Đang trong chuyến đi',
                };
                const statusText = statusMap[trip.TRANG_THAI] || 'Đang di chuyển';

                contentCurrent.innerHTML = `
                    <div class="list-item" style="border: 1px solid var(--color-blue); border-radius: 8px; padding: 12px; margin-top: 10px; background-color: rgba(0, 122, 255, 0.05); display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span class="badge badge--primary" style="background-color: var(--color-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">${statusText}</span>
                            <strong style="color: var(--color-blue); font-size: 1.1rem;">${formattedPrice}</strong>
                        </div>
                        <div style="text-align: left; width: 100%;">
                            <p style="margin: 4px 0; font-size: 0.85rem; color: #555;">🟢 <strong>Đón:</strong> ${trip.DIEM_DON}</p>
                            <p style="margin: 4px 0; font-size: 0.85rem; color: #555;">📍 <strong>Đến:</strong> ${trip.DIEM_DEN}</p>
                        </div>
                        <div style="margin-top: 10px; display: flex; justify-content: flex-end; width: 100%;">
                            <a href="/driver/dashboard.html" class="btn btn--primary" style="font-size: 0.8rem; padding: 6px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; background-color: var(--color-blue); color: white;">Xem bản đồ & Tiếp tục</a>
                        </div>
                    </div>`;
            } else {
                contentCurrent.innerHTML = `
                    <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                        <p>Bạn không có chuyến xe nào đang diễn ra.</p>
                    </div>`;
            }
        } catch (error) {
            console.error("Lỗi tải chuyến đi hiện tại:", error);
            contentCurrent.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                    <p>Lỗi kết nối hệ thống.</p>
                </div>`;
        }
    }

    // Tải lịch sử chuyến đi của tài xế
    async function loadDriverHistory() {
        contentHistory.innerHTML = '<p style="text-align:center;padding:20px;color:var(--color-text-muted);">Đang tải lịch sử...</p>';

        try {
            const response = await fetch(`${API_BASE_URL}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.trips) {
                const trips = data.trips;
                if (trips.length === 0) {
                    contentHistory.innerHTML = `
                        <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                            <p>Bạn chưa có chuyến đi nào trong lịch sử.</p>
                        </div>`;
                    return;
                }

                contentHistory.innerHTML = '';
                trips.forEach(trip => {
                    const tripDate = trip.THOI_GIAN_TAO ? new Date(trip.THOI_GIAN_TAO) : new Date();
                    const formattedDate = `${tripDate.getDate()}/${tripDate.getMonth() + 1} ${String(tripDate.getHours()).padStart(2,'0')}:${String(tripDate.getMinutes()).padStart(2,'0')}`;
                    const formattedPrice = parseInt(trip.GIA_TIEN || 0).toLocaleString('vi-VN') + ' đ';

                    const statusMap = {
                        'HOAN_THANH': { text: 'Hoàn thành', class: 'badge--success' },
                        'DA_HUY':     { text: 'Đã hủy',     class: 'badge--danger'  },
                        'DA_NHAN':    { text: 'Đã nhận',    class: 'badge--primary' },
                        'DANG_DI':    { text: 'Đang chạy',  class: 'badge--primary' }
                    };
                    const statusInfo = statusMap[trip.TRANG_THAI] || { text: trip.TRANG_THAI, class: '' };

                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.style.padding = '12px 16px';
                    item.style.borderBottom = '1px solid var(--color-border)';

                    item.innerHTML = `
                        <div style="flex: 2; text-align: left;">
                            <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; color: #333;">${formattedDate}</h4>
                            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 2px 0; word-break: break-all;">🟢 ${trip.DIEM_DON}</p>
                            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 2px 0; word-break: break-all;">📍 ${trip.DIEM_DEN}</p>
                        </div>
                        <div style="flex: 1; text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px;">
                            <div style="font-weight: bold; color: ${trip.TRANG_THAI === 'HOAN_THANH' ? 'var(--color-green)' : '#999'}; font-size: 1rem;">
                                ${trip.TRANG_THAI === 'HOAN_THANH' ? '+' : ''}${formattedPrice}
                            </div>
                            <span class="badge ${statusInfo.class}" style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;">${statusInfo.text}</span>
                        </div>`;
                    contentHistory.appendChild(item);
                });
            } else {
                contentHistory.innerHTML = `
                    <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                        <p>Không thể tải danh sách lịch sử.</p>
                    </div>`;
            }
        } catch (error) {
            console.error("Lỗi tải lịch sử chuyến đi:", error);
            contentHistory.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 2rem 0;">
                    <p>Lỗi kết nối hệ thống.</p>
                </div>`;
        }
    }

    // Đăng ký tab switching
    const tabCurrent = document.getElementById('tab-current');
    const tabHistory = document.getElementById('tab-history');

    tabCurrent.addEventListener('click', () => {
        tabCurrent.classList.add('tabs__btn--active');
        tabHistory.classList.remove('tabs__btn--active');
        contentCurrent.style.display = 'block';
        contentHistory.style.display = 'none';
        loadCurrentTrip();
    });

    tabHistory.addEventListener('click', () => {
        tabHistory.classList.add('tabs__btn--active');
        tabCurrent.classList.remove('tabs__btn--active');
        contentHistory.style.display = 'block';
        contentCurrent.style.display = 'none';
        loadDriverHistory();
    });

    // Khởi chạy mặc định
    loadCurrentTrip();
});
