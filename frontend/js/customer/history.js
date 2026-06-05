/**
 * js/customer/history.js
 * Fetch và hiển thị lịch sử chuyến đi của khách hàng kèm chức năng báo cáo vi phạm.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('trip-history-list');
    if (!historyList) return;

    historyList.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">Đang tải lịch sử chuyến đi...</p>';

    // Hàm tải dữ liệu lịch sử chuyến đi
    async function loadHistory() {
        try {
            const response = await API.get('/customer/history');
            const trips = Array.isArray(response) ? response : (response.data || []);

            if (!trips || trips.length === 0) {
                historyList.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <div style="font-size:3rem;margin-bottom:10px;">📭</div>
                        <p style="color:var(--text-muted);">Bạn chưa có chuyến đi nào.</p>
                    </div>`;
                return;
            }

            historyList.innerHTML = '';

            trips.forEach(trip => {
                const tripDate = trip.THOI_GIAN_TAO ? new Date(trip.THOI_GIAN_TAO) : new Date();
                const formattedDate = `${tripDate.getDate()} Tháng ${tripDate.getMonth() + 1}, ${String(tripDate.getHours()).padStart(2,'0')}:${String(tripDate.getMinutes()).padStart(2,'0')}`;
                const formattedPrice = new Intl.NumberFormat('vi-VN').format(trip.GIA_TIEN || 0) + 'đ';

                const statusMap = {
                    'HOAN_THANH': { text: 'Hoàn thành', color: 'var(--success-color)' },
                    'DA_HUY':     { text: 'Đã hủy',     color: 'var(--danger-color)'  },
                    'DA_NHAN':    { text: 'Đang chạy',  color: 'var(--color-blue)'   },
                    'CHO_TAI_XE': { text: 'Chờ tài xế', color: 'var(--warning-color)'}
                };
                const statusInfo = statusMap[trip.TRANG_THAI] || { text: trip.TRANG_THAI || 'Đang xử lý', color: 'var(--text-muted)' };

                // Chỉ hiển thị nút khiếu nại đối với chuyến đi đã Hoàn thành hoặc đã Hủy
                let reportBtn = '';
                if (trip.TRANG_THAI === 'HOAN_THANH' || trip.TRANG_THAI === 'DA_HUY') {
                    reportBtn = `<button class="btn btn--outline btn-report-trip" data-id="${trip.MA_CHUYEN_DI}" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--color-red, #dc3545); color: var(--color-red, #dc3545); border-radius: var(--radius-sm); cursor: pointer; background: transparent; font-weight: bold; transition: all 0.2s;">Khiếu nại</button>`;
                }

                const li = document.createElement('li');
                li.className = 'trip-item';
                li.innerHTML = `
                    <div class="trip-item__header">
                        <span class="trip-item__date">${formattedDate}</span>
                        <span class="trip-item__status" style="color:${statusInfo.color};font-weight:600;">${statusInfo.text}</span>
                    </div>
                    <div class="trip-item__route">
                        <p class="route-point">📍 ${trip.DIEM_DON || 'Điểm đón'}</p>
                        <p class="route-point">🏁 ${trip.DIEM_DEN || 'Điểm đến'}</p>
                    </div>
                    <div class="trip-item__footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #eee;">
                        <span class="trip-item__price" style="font-weight: bold; font-size: 1.05rem;">${formattedPrice}</span>
                        ${reportBtn}
                    </div>
                `;
                historyList.appendChild(li);
            });

        } catch (error) {
            console.error('Lỗi khi tải lịch sử:', error);
            historyList.innerHTML = '<p style="text-align:center;padding:20px;color:var(--danger-color);">Không thể tải lịch sử. Vui lòng thử lại sau.</p>';
        }
    }

    // Đăng ký sự kiện click khiếu nại (ủy quyền sự kiện qua list)
    historyList.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('btn-report-trip')) {
            const tripId = target.getAttribute('data-id');
            const complaintText = prompt(`Gửi khiếu nại/báo cáo sự cố cho chuyến đi TRP-${tripId}:\nNhập chi tiết sự cố bạn gặp phải (Ví dụ: Tài xế đi sai tuyến đường, thu sai tiền, thái độ không tốt...):`);
            
            if (complaintText === null) return; // Nhấn Hủy
            if (complaintText.trim() === '') {
                alert('Vui lòng nhập nội dung sự cố để báo cáo.');
                return;
            }

            target.textContent = 'Đang gửi...';
            target.disabled = true;

            try {
                const res = await API.post('/customer/complaint', {
                    ma_chuyen_di: parseInt(tripId),
                    noi_dung: complaintText.trim()
                });

                if (res.success) {
                    alert('Gửi báo cáo sự cố thành công! Ban quản trị hệ thống sẽ sớm giải quyết.');
                } else {
                    alert(res.message || 'Gặp lỗi khi gửi báo cáo.');
                }
            } catch (err) {
                console.error('Lỗi gửi khiếu nại:', err);
                alert('Lỗi kết nối khi gửi báo cáo.');
            } finally {
                target.textContent = 'Khiếu nại';
                target.disabled = false;
            }
        }
    });

    // Tải dữ liệu ban đầu
    loadHistory();
});
