/**
 * js/admin/drivers.js
 * Quản trị viên: Tải danh sách tài xế đang hoạt động và hồ sơ chờ duyệt, thực hiện phê duyệt/từ chối.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    const activeTableBody = document.querySelector('#content-active-drivers tbody');
    const pendingTableBody = document.querySelector('#content-pending-drivers tbody');

    // Nạp danh sách tài xế đang hoạt động
    async function loadActiveDrivers() {
        if (!activeTableBody) return;
        activeTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
        
        try {
            const data = await API.get('/admin/active-drivers');
            activeTableBody.innerHTML = '';
            
            if (data.length === 0) {
                activeTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có tài xế nào đang hoạt động.</td></tr>';
                return;
            }

            data.forEach(d => {
                const tr = document.createElement('tr');
                const isLocked = localStorage.getItem(`driver_locked_${d.MA_TAI_XE}`) === 'true';
                
                const statusText = isLocked ? 'Bị khóa' : (d.TRANG_THAI || 'Offline');
                const statusBadge = isLocked ? 'badge--danger' : (d.TRANG_THAI === 'ONLINE' || d.TRANG_THAI === 'ONLINE_BUSY' ? 'badge--success' : 'badge--warning');
                
                const actionBtnText = isLocked ? 'Mở khóa' : 'Khóa';
                const actionBtnStyle = isLocked ? 'background-color: var(--color-red, #dc3545); color: white;' : 'background-color: var(--color-blue, #3b82f6); color: white;';

                tr.innerHTML = `
                    <td>DRV-${d.MA_TAI_XE}</td>
                    <td>${d.TEN}</td>
                    <td>${d.SO_DIEN_THOAI || 'N/A'}</td>
                    <td>${d.LOAI_XE || 'N/A'}</td>
                    <td>${d.BIEN_SO || 'N/A'}</td>
                    <td><span class="badge ${statusBadge}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-toggle-driver-lock" data-id="${d.MA_TAI_XE}" style="padding: 2px 8px; font-size: 0.8rem; border: none; cursor: pointer; border-radius: var(--radius-sm); font-weight: bold; ${actionBtnStyle}">${actionBtnText}</button>
                    </td>
                `;
                activeTableBody.appendChild(tr);
            });

            // Gắn sự kiện Khóa/Mở khóa cho tài xế đang hoạt động
            activeTableBody.querySelectorAll('.btn-toggle-driver-lock').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    const d = data.find(x => x.MA_TAI_XE === id);
                    if (d) {
                        const isCurrentlyLocked = localStorage.getItem(`driver_locked_${d.MA_TAI_XE}`) === 'true';
                        if (isCurrentlyLocked) {
                            if (confirm(`Bạn có chắc muốn mở khóa tài khoản tài xế ${d.TEN}?`)) {
                                localStorage.removeItem(`driver_locked_${d.MA_TAI_XE}`);
                                localStorage.removeItem(`driver_lock_reason_${d.MA_TAI_XE}`);
                                alert(`Đã mở khóa tài khoản tài xế ${d.TEN} thành công!`);
                                loadActiveDrivers();
                            }
                        } else {
                            const reason = prompt(`Nhập lý do khóa tài khoản tài xế ${d.TEN}:`);
                            if (reason === null) return; // Nhấn Hủy
                            const finalReason = reason.trim() || 'Vi phạm quy chế tài xế';
                            localStorage.setItem(`driver_locked_${d.MA_TAI_XE}`, 'true');
                            localStorage.setItem(`driver_lock_reason_${d.MA_TAI_XE}`, finalReason);
                            alert(`Đã khóa tài khoản tài xế ${d.TEN} thành công!\nLý do: ${finalReason}`);
                            loadActiveDrivers();
                        }
                    }
                });
            });

        } catch (error) {
            console.error(error);
            activeTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-red);">Lỗi tải dữ liệu.</td></tr>';
        }
    }

    // Nạp danh sách hồ sơ tài xế chờ duyệt
    async function loadPendingDrivers() {
        if (!pendingTableBody) return;
        pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';

        try {
            const data = await API.get('/admin/pending-drivers');
            pendingTableBody.innerHTML = '';

            if (data.length === 0) {
                pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có hồ sơ nào chờ phê duyệt.</td></tr>';
                return;
            }

            data.forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${d.TEN}</td>
                    <td>${d.SO_DIEN_THOAI || 'N/A'}</td>
                    <td>${d.LOAI_XE || 'N/A'}</td>
                    <td>${d.BIEN_SO || 'N/A'}</td>
                    <td>
                        <span style="font-size:0.85rem;color:var(--color-text-muted);">${d.TRANG_THAI}</span>
                    </td>
                    <td>
                        <button class="btn btn--success btn-approve" data-id="${d.MA_TAI_XE}" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-right: 5px;">Phê duyệt</button>
                        <button class="btn btn--danger btn-reject" data-id="${d.MA_TAI_XE}" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">Từ chối</button>
                    </td>
                `;
                pendingTableBody.appendChild(tr);
            });

            // Gắn sự kiện cho các nút phê duyệt
            document.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    if (!confirm('Bạn có chắc chắn muốn phê duyệt tài xế này?')) return;
                    try {
                        const res = await API.put(`/admin/approve-driver/${id}`, {});
                        if (res.success) {
                            alert('Đã phê duyệt tài xế thành công!');
                            loadPendingDrivers();
                            loadActiveDrivers();
                        }
                    } catch (e) {
                        alert('Lỗi phê duyệt tài xế.');
                    }
                });
            });

            // Gắn sự kiện cho các nút từ chối
            document.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    if (!confirm('Bạn có chắc chắn muốn từ chối hồ sơ này?')) return;
                    try {
                        const res = await API.put(`/admin/reject-driver/${id}`, {});
                        if (res.success) {
                            alert('Đã từ chối hồ sơ tài xế.');
                            loadPendingDrivers();
                            loadActiveDrivers();
                        }
                    } catch (e) {
                        alert('Lỗi từ chối hồ sơ.');
                    }
                });
            });

        } catch (error) {
            console.error(error);
            pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-red);">Lỗi tải dữ liệu.</td></tr>';
        }
    }

    // Tải dữ liệu ban đầu
    loadActiveDrivers();
    loadPendingDrivers();

    // Đồng bộ lại sự kiện click Tab
    const tabActive = document.getElementById('tab-active-drivers');
    const tabPending = document.getElementById('tab-pending-drivers');

    if (tabActive && tabPending) {
        tabActive.addEventListener('click', () => {
            loadActiveDrivers();
        });
        tabPending.addEventListener('click', () => {
            loadPendingDrivers();
        });
    }
});
