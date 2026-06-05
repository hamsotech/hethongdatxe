/**
 * js/admin/dashboard.js
 * Tải dữ liệu thống kê tổng quan từ backend và vẽ biểu đồ.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    // Vẽ biểu đồ xu hướng (Trend Chart)
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6'],
                datasets: [{
                    label: 'Số lượng chuyến xe',
                    data: [120, 190, 300, 500, 250, 420],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { grid: { color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Vẽ biểu đồ tròn phân bố dịch vụ (Service Distribution)
    const serviceCtx = document.getElementById('serviceChart');
    if (serviceCtx) {
        new Chart(serviceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Xe máy', 'Ô tô 4 chỗ', 'Ô tô 7 chỗ', 'Giao hàng'],
                datasets: [{
                    data: [55, 25, 15, 5],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    }
                }
            }
        });
    }

    // Tải dữ liệu KPI từ backend
    try {
        const data = await API.get('/admin/dashboard');

        // Cập nhật các KPI card
        if (data.total_users !== undefined) {
            const elUsers = document.getElementById('kpi-users');
            if (elUsers) elUsers.textContent = data.total_users.toLocaleString('vi-VN');
        }
        if (data.total_trips !== undefined) {
            const elTrips = document.getElementById('kpi-trips');
            if (elTrips) elTrips.textContent = data.total_trips.toLocaleString('vi-VN');
        }
        if (data.total_drivers !== undefined) {
            const elDrivers = document.getElementById('kpi-drivers');
            if (elDrivers) elDrivers.textContent = data.total_drivers.toLocaleString('vi-VN');
        }
    } catch (error) {
        console.warn('[Admin Dashboard] Không tải được dữ liệu từ backend:', error);
    }

    // ==========================================
    // LOGIC HỆ THỐNG THÔNG BÁO ADMIN
    // ==========================================
    const btnNotifications = document.getElementById('btn-notifications');
    const notificationBadge = document.getElementById('nav-notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');

    let notifications = [
        { id: 1, text: "🔔 Hồ sơ đăng ký tài xế mới đang chờ duyệt.", unread: true },
        { id: 2, text: "⚠️ Nhận được khiếu nại mới từ khách hàng.", unread: true }
    ];

    function renderNotifications() {
        if (!notificationDropdown) return;
        const unreadCount = notifications.filter(n => n.unread).length;
        if (unreadCount > 0 && notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'flex';
        } else if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }
        notificationDropdown.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.unread ? 'notification-item--unread' : ''}" data-id="${n.id}" style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 0.85rem; cursor: pointer; color: #333; ${n.unread ? 'background-color: var(--color-blue-light); font-weight: 500;' : ''}">
                ${n.text}
            </div>
        `).join('');
        
        notificationDropdown.querySelectorAll('.notification-item').forEach(item => {
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

    if (btnNotifications && notificationDropdown) {
        btnNotifications.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.style.display = notificationDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    document.addEventListener('click', () => {
        if (notificationDropdown) notificationDropdown.style.display = 'none';
    });

    // Tải danh sách chuyến đi mới nhất
    const latestTripsBody = document.getElementById('latest-trips');
    if (latestTripsBody) {
        latestTripsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>';
        try {
            const [trips, users, activeDrivers, pendingDrivers] = await Promise.all([
                API.get('/admin/trips'),
                API.get('/admin/users'),
                API.get('/admin/active-drivers'),
                API.get('/admin/pending-drivers')
            ]);

            const userMap = {};
            users.forEach(u => { userMap[u.MA_NGUOI_DUNG] = u.TEN; });

            const driverMap = {};
            activeDrivers.forEach(d => { driverMap[d.MA_TAI_XE] = d.TEN; });
            pendingDrivers.forEach(d => { driverMap[d.MA_TAI_XE] = d.TEN; });

            latestTripsBody.innerHTML = '';
            
            const sortedTrips = trips.sort((a, b) => b.MA_CHUYEN_DI - a.MA_CHUYEN_DI).slice(0, 5);

            if (sortedTrips.length === 0) {
                latestTripsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có chuyến xe nào gần đây.</td></tr>';
            } else {
                sortedTrips.forEach(t => {
                    const tr = document.createElement('tr');
                    const cusName = userMap[t.MA_NGUOI_DUNG] || `CUS-${t.MA_NGUOI_DUNG}`;
                    const driverName = t.MA_TAI_XE ? (driverMap[t.MA_TAI_XE] || `DRV-${t.MA_TAI_XE}`) : 'Chưa nhận chuyến';
                    
                    let statusBadge = '';
                    if (t.TRANG_THAI === 'HOAN_THANH') {
                        statusBadge = '<span class="badge badge--success">Hoàn thành</span>';
                    } else if (t.TRANG_THAI === 'DANG_DI') {
                        statusBadge = '<span class="badge badge--warning">Đang chạy</span>';
                    } else if (t.TRANG_THAI === 'DA_NHAN') {
                        statusBadge = '<span class="badge badge--success">Đã nhận</span>';
                    } else if (t.TRANG_THAI === 'DA_HUY') {
                        statusBadge = '<span class="badge badge--danger">Đã hủy</span>';
                    } else {
                        statusBadge = '<span class="badge badge--warning">Đang tìm tài xế</span>';
                    }

                    const createdTime = t.THOI_GIAN_TAO ? new Date(t.THOI_GIAN_TAO).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'N/A';

                    tr.innerHTML = `
                        <td>TRP-${t.MA_CHUYEN_DI}</td>
                        <td>${cusName}</td>
                        <td>${driverName}</td>
                        <td>${statusBadge}</td>
                        <td>${createdTime}</td>
                    `;
                    latestTripsBody.appendChild(tr);
                });
            }
        } catch (e) {
            console.error("Lỗi tải chuyến đi mới nhất:", e);
            latestTripsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-red);">Lỗi tải danh sách.</td></tr>';
        }
    }
});
