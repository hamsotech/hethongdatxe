/**
 * js/admin/trips.js
 * Quản lý danh sách chuyến xe phía admin.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    const tripListBody = document.getElementById('trip-list');
    const searchInput = document.getElementById('search-trip');
    const statusFilter = document.getElementById('filter-trip-status');
    const dateFilter = document.getElementById('filter-trip-date');
    const btnSearch = document.getElementById('btn-search-trip');

    if (!tripListBody) return;

    let allTrips = [];
    let userMap = {};
    let driverMap = {};

    async function loadData() {
        tripListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Đang tải danh sách chuyến xe...</td></tr>';
        try {
            const [trips, users, activeDrivers, pendingDrivers] = await Promise.all([
                API.get('/admin/trips'),
                API.get('/admin/users'),
                API.get('/admin/active-drivers'),
                API.get('/admin/pending-drivers')
            ]);

            allTrips = trips;
            
            userMap = {};
            users.forEach(u => { userMap[u.MA_NGUOI_DUNG] = u.TEN; });

            driverMap = {};
            activeDrivers.forEach(d => { driverMap[d.MA_TAI_XE] = d.TEN; });
            pendingDrivers.forEach(d => { driverMap[d.MA_TAI_XE] = d.TEN; });

            filterAndRender();
        } catch (error) {
            console.error(error);
            tripListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-red);">Lỗi tải danh sách chuyến xe.</td></tr>';
        }
    }

    function filterAndRender() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value : 'all';
        const dateVal = dateFilter ? dateFilter.value : '';

        const filtered = allTrips.filter(t => {
            // Lọc theo mã chuyến xe
            const matchesQuery = query === '' || `trp-${t.MA_CHUYEN_DI}`.toLowerCase().includes(query) || `${t.MA_CHUYEN_DI}`.includes(query);
            
            // Lọc theo trạng thái
            let matchesStatus = true;
            if (statusVal === 'completed') {
                matchesStatus = t.TRANG_THAI === 'HOAN_THANH';
            } else if (statusVal === 'cancelled') {
                matchesStatus = t.TRANG_THAI === 'DA_HUY';
            } else if (statusVal === 'active') {
                matchesStatus = t.TRANG_THAI === 'DANG_DI' || t.TRANG_THAI === 'DA_NHAN' || t.TRANG_THAI === 'CHO_TAI_XE';
            }

            // Lọc theo ngày
            let matchesDate = true;
            if (dateVal && t.THOI_GIAN_TAO) {
                // Định dạng ngày trả về từ MySQL: 'YYYY-MM-DD HH:MM:SS'
                const tripDate = t.THOI_GIAN_TAO.split(' ')[0];
                matchesDate = tripDate === dateVal;
            }

            return matchesQuery && matchesStatus && matchesDate;
        });

        renderList(filtered);
    }

    function renderList(tripsList) {
        tripListBody.innerHTML = '';
        if (tripsList.length === 0) {
            tripListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không tìm thấy chuyến xe nào phù hợp.</td></tr>';
            return;
        }

        tripsList.forEach(t => {
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

            const priceFormatted = t.GIA_TIEN ? `${parseInt(t.GIA_TIEN).toLocaleString('vi-VN')}đ` : '0đ';

            tr.innerHTML = `
                <td>TRP-${t.MA_CHUYEN_DI}</td>
                <td>${cusName}</td>
                <td>${driverName}</td>
                <td>${t.DIEM_DON}</td>
                <td>${t.DIEM_DEN}</td>
                <td>${priceFormatted}</td>
                <td>${t.PHUONG_THUC || 'Tiền mặt'}</td>
                <td>${statusBadge}</td>
            `;
            tripListBody.appendChild(tr);
        });
    }

    // Đăng ký sự kiện
    if (btnSearch) btnSearch.addEventListener('click', filterAndRender);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterAndRender();
        });
    }
    if (statusFilter) statusFilter.addEventListener('change', filterAndRender);
    if (dateFilter) dateFilter.addEventListener('change', filterAndRender);

    // Tải dữ liệu ban đầu
    loadData();
});
