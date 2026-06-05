/**
 * js/admin/users.js
 * Quản lý danh sách khách hàng phía admin.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    const userListBody = document.getElementById('user-list');
    const searchInput = document.getElementById('search-user');
    const statusFilter = document.getElementById('filter-user-status');
    const btnSearch = document.getElementById('btn-search');
    
    if (!userListBody) return;

    let allUsers = [];
    let userTripCount = {};

    async function loadData() {
        userListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Đang tải danh sách khách hàng...</td></tr>';
        try {
            const [users, trips] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/trips')
            ]);
            
            allUsers = users;
            userTripCount = {};
            trips.forEach(t => {
                const cusId = t.MA_NGUOI_DUNG;
                userTripCount[cusId] = (userTripCount[cusId] || 0) + 1;
            });

            filterAndRender();
        } catch (error) {
            console.error(error);
            userListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-red);">Lỗi tải danh sách khách hàng.</td></tr>';
        }
    }

    function filterAndRender() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value : 'all';

        const filtered = allUsers.filter(u => {
            const nameMatch = u.TEN && u.TEN.toLowerCase().includes(query);
            const phoneMatch = u.SO_DIEN_THOAI && u.SO_DIEN_THOAI.includes(query);
            const matchesQuery = nameMatch || phoneMatch || query === '';
            
            const isLocked = localStorage.getItem(`user_locked_${u.MA_NGUOI_DUNG}`) === 'true';
            let matchesStatus = true;
            if (statusVal === 'locked') matchesStatus = isLocked;
            else if (statusVal === 'active') matchesStatus = !isLocked;

            return matchesQuery && matchesStatus;
        });

        renderList(filtered);
    }

    function renderList(users) {
        userListBody.innerHTML = '';
        if (users.length === 0) {
            userListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không tìm thấy khách hàng phù hợp.</td></tr>';
            return;
        }

        users.forEach((u, index) => {
            const tr = document.createElement('tr');
            const tripCount = userTripCount[u.MA_NGUOI_DUNG] || 0;
            const isLocked = localStorage.getItem(`user_locked_${u.MA_NGUOI_DUNG}`) === 'true';
            
            const statusText = isLocked ? 'Bị khóa' : 'Đang hoạt động';
            const statusBadge = isLocked ? 'badge--danger' : 'badge--success';
            const actionBtnText = isLocked ? 'Mở khóa' : 'Khóa';
            const actionBtnStyle = isLocked ? 'background-color: var(--color-red); color: white;' : 'background-color: var(--color-blue); color: white;';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>CUS-${u.MA_NGUOI_DUNG}</td>
                <td>${u.TEN}</td>
                <td>${u.SO_DIEN_THOAI || 'N/A'}</td>
                <td>${u.EMAIL}</td>
                <td>${tripCount}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td>
                    <button class="btn btn--outline btn-view-detail" data-id="${u.MA_NGUOI_DUNG}" style="padding: 2px 8px; font-size: 0.8rem; margin-right: 5px;">Xem chi tiết</button>
                    <button class="btn btn-toggle-lock" data-id="${u.MA_NGUOI_DUNG}" style="padding: 2px 8px; font-size: 0.8rem; border: none; ${actionBtnStyle}">${actionBtnText}</button>
                </td>
            `;
            userListBody.appendChild(tr);
        });

        // Gắn sự kiện Xem Chi Tiết
        userListBody.querySelectorAll('.btn-view-detail').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const u = allUsers.find(x => x.MA_NGUOI_DUNG === id);
                if (u) {
                    alert(`Chi tiết khách hàng CUS-${u.MA_NGUOI_DUNG}:\nHọ tên: ${u.TEN}\nSố điện thoại: ${u.SO_DIEN_THOAI || 'N/A'}\nEmail: ${u.EMAIL}\nTổng chuyến đi: ${userTripCount[u.MA_NGUOI_DUNG] || 0}`);
                }
            });
        });

        // Gắn sự kiện Khóa/Mở khóa
        userListBody.querySelectorAll('.btn-toggle-lock').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const u = allUsers.find(x => x.MA_NGUOI_DUNG === id);
                if (u) {
                    const isCurrentlyLocked = localStorage.getItem(`user_locked_${u.MA_NGUOI_DUNG}`) === 'true';
                    if (isCurrentlyLocked) {
                        if (confirm(`Bạn có chắc muốn mở khóa tài khoản khách hàng ${u.TEN}?`)) {
                            localStorage.removeItem(`user_locked_${u.MA_NGUOI_DUNG}`);
                            localStorage.removeItem(`user_lock_reason_${u.MA_NGUOI_DUNG}`);
                            alert(`Đã mở khóa tài khoản ${u.TEN} thành công!`);
                            filterAndRender();
                        }
                    } else {
                        const reason = prompt(`Nhập lý do khóa tài khoản khách hàng ${u.TEN}:`);
                        if (reason === null) return; // Nhấn Hủy
                        const finalReason = reason.trim() || 'Vi phạm chính sách cộng đồng';
                        localStorage.setItem(`user_locked_${u.MA_NGUOI_DUNG}`, 'true');
                        localStorage.setItem(`user_lock_reason_${u.MA_NGUOI_DUNG}`, finalReason);
                        alert(`Đã khóa tài khoản ${u.TEN} thành công!\nLý do: ${finalReason}`);
                        filterAndRender();
                    }
                }
            });
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

    // Tải dữ liệu ban đầu
    loadData();
});
