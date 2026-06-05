/**
 * js/admin/reports.js
 * Xử lý sự kiện xuất báo cáo và xử lý khiếu nại phía admin.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    const btnExportExcel = document.getElementById('btn-export-excel');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const fromDateInput = document.getElementById('report-from-date');
    const toDateInput = document.getElementById('report-to-date');
    const complaintList = document.getElementById('complaint-list');
    const revenueListBody = document.getElementById('revenue-list');

    // Hàm tải và hiển thị dữ liệu động từ database
    async function loadReportsData() {
        const fromDate = fromDateInput ? fromDateInput.value : '';
        const toDate = toDateInput ? toDateInput.value : '';

        if (revenueListBody) {
            revenueListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Đang tải dữ liệu doanh thu...</td></tr>';
        }
        if (complaintList) {
            complaintList.innerHTML = '<tr><td colspan="5" style="text-align: center;">Đang tải danh sách khiếu nại...</td></tr>';
        }

        try {
            let url = '/admin/reports';
            const params = [];
            if (fromDate) params.push(`from_date=${fromDate}`);
            if (toDate) params.push(`to_date=${toDate}`);
            if (params.length > 0) {
                url += '?' + params.join('&');
            }

            const data = await API.get(url);
            
            // 1. Hiển thị báo cáo doanh thu thực tế
            if (revenueListBody) {
                revenueListBody.innerHTML = '';
                if (!data.revenue || data.revenue.length === 0) {
                    revenueListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Không có dữ liệu doanh thu thực tế.</td></tr>';
                } else {
                    data.revenue.forEach(item => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${item.month}</td>
                            <td>${parseInt(item.total_amount).toLocaleString('vi-VN')}đ</td>
                            <td style="color: var(--color-blue); font-weight: bold;">${parseInt(item.commission).toLocaleString('vi-VN')}đ</td>
                            <td>${parseInt(item.driver_income).toLocaleString('vi-VN')}đ</td>
                        `;
                        revenueListBody.appendChild(tr);
                    });
                }
            }

            // 2. Hiển thị danh sách khiếu nại thực tế từ database
            if (complaintList) {
                complaintList.innerHTML = '';
                if (!data.complaints || data.complaints.length === 0) {
                    complaintList.innerHTML = '<tr><td colspan="5" style="text-align: center;">Không có khiếu nại nào.</td></tr>';
                } else {
                    data.complaints.forEach(item => {
                        const tr = document.createElement('tr');
                        
                        let statusBadge = '';
                        let actionBtn = '';
                        if (item.TRANG_THAI === 'Đã giải quyết') {
                            statusBadge = '<span class="badge badge--success">Đã giải quyết</span>';
                            actionBtn = `<button class="action-btn action-btn--view btn-view-complaint" data-id="${item.MA_KHIEU_NAI}" data-solution="${item.BIEN_PHAP || ''}">Xem</button>`;
                        } else {
                            statusBadge = '<span class="badge badge--warning">Chờ xử lý</span>';
                            actionBtn = `<button class="btn btn--primary btn-resolve-complaint" data-id="${item.MA_KHIEU_NAI}" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">Xử lý</button>`;
                        }

                        // Lấy mô tả chi tiết nguồn khiếu nại
                        const sourceName = item.LOAI_NGUOI_GUI === 'Khách hàng' ? `Khách (Mã: ${item.MA_NGUOI_GUI})` : `Tài xế (Mã: ${item.MA_NGUOI_GUI})`;

                        tr.innerHTML = `
                            <td>REP-${item.MA_KHIEU_NAI}</td>
                            <td>${sourceName}</td>
                            <td>${item.NOI_DUNG}</td>
                            <td class="complaint-status">${statusBadge}</td>
                            <td class="complaint-action">${actionBtn}</td>
                        `;
                        complaintList.appendChild(tr);
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải báo cáo:', error);
            if (revenueListBody) {
                revenueListBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-red);">Lỗi kết nối máy chủ.</td></tr>';
            }
            if (complaintList) {
                complaintList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-red);">Lỗi kết nối máy chủ.</td></tr>';
            }
        }
    }

    // 1. Logic Xuất báo cáo (Excel/CSV)
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const fromDate = fromDateInput ? fromDateInput.value : '';
            const toDate = toDateInput ? toDateInput.value : '';

            let timeRangeText = 'toàn bộ thời gian';
            if (fromDate && toDate) {
                timeRangeText = `từ ngày ${fromDate} đến ngày ${toDate}`;
            } else if (fromDate) {
                timeRangeText = `từ ngày ${fromDate}`;
            } else if (toDate) {
                timeRangeText = `đến ngày ${toDate}`;
            }

            const confirmExport = confirm(`Bạn có chắc chắn muốn tải báo cáo Excel ${timeRangeText}?`);
            if (!confirmExport) return;

            const originalText = btnExportExcel.textContent;
            btnExportExcel.textContent = 'Đang tạo Excel...';
            btnExportExcel.disabled = true;

            setTimeout(() => {
                try {
                    const table = document.querySelector('.chart-card table');
                    if (!table) {
                        alert('Không tìm thấy bảng dữ liệu báo cáo!');
                        return;
                    }

                    let csvContent = "\ufeff"; // BOM
                    
                    const headers = Array.from(table.querySelectorAll('thead th')).map(th => `"${th.textContent.trim().replace(/"/g, '""')}"`);
                    csvContent += headers.join(',') + '\n';

                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const cells = Array.from(row.querySelectorAll('td')).map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
                        csvContent += cells.join(',') + '\n';
                    });

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    
                    const filterSuffix = fromDate || toDate ? `_${fromDate || ''}_den_${toDate || ''}` : '_toan_bo';
                    link.setAttribute('download', `bao_cao_doanh_thu${filterSuffix}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    alert(`Tải báo cáo Excel thành công!\nBộ lọc: ${timeRangeText}`);
                } catch (error) {
                    console.error('Lỗi khi xuất CSV:', error);
                    alert('Có lỗi xảy ra khi tạo file Excel.');
                } finally {
                    btnExportExcel.textContent = originalText;
                    btnExportExcel.disabled = false;
                }
            }, 800);
        });
    }

    // 2. Logic Xuất báo cáo (PDF in A4)
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            const fromDate = fromDateInput ? fromDateInput.value : '';
            const toDate = toDateInput ? toDateInput.value : '';

            let timeRangeText = 'toàn bộ thời gian';
            if (fromDate && toDate) {
                timeRangeText = `từ ngày ${fromDate} đến ngày ${toDate}`;
            } else if (fromDate) {
                timeRangeText = `từ ngày ${fromDate}`;
            } else if (toDate) {
                timeRangeText = `đến ngày ${toDate}`;
            }

            const confirmExport = confirm(`Bạn có chắc chắn muốn xuất tài liệu PDF ${timeRangeText}?`);
            if (!confirmExport) return;

            const originalText = btnExportPdf.textContent;
            btnExportPdf.textContent = 'Đang tạo PDF...';
            btnExportPdf.disabled = true;

            setTimeout(() => {
                try {
                    const tableHtml = document.querySelector('.chart-card .table-responsive').innerHTML;
                    const complaintsHtml = document.querySelector('.content-area > .table-responsive').innerHTML;

                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                        alert('Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cấp quyền để in báo cáo PDF!');
                        return;
                    }

                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>Báo cáo Hệ thống - RideConnect</title>
                            <style>
                                body {
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    padding: 30px;
                                    color: #333;
                                    line-height: 1.6;
                                }
                                .header {
                                    text-align: center;
                                    border-bottom: 3px solid #00b14f;
                                    padding-bottom: 15px;
                                    margin-bottom: 30px;
                                }
                                .logo-title {
                                    font-size: 1.8rem;
                                    font-weight: bold;
                                    color: #00b14f;
                                    margin: 0;
                                }
                                .doc-subtitle {
                                    font-size: 1rem;
                                    color: #666;
                                    margin-top: 5px;
                                    font-weight: 500;
                                }
                                .meta-info {
                                    margin-bottom: 20px;
                                    font-size: 0.9rem;
                                    color: #555;
                                    display: flex;
                                    justify-content: space-between;
                                }
                                .section-title {
                                    font-size: 1.15rem;
                                    font-weight: bold;
                                    color: #333;
                                    border-left: 4px solid #00b14f;
                                    padding-left: 10px;
                                    margin-top: 25px;
                                    margin-bottom: 15px;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin-bottom: 25px;
                                    font-size: 0.92rem;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 10px 12px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f7f9fa;
                                    font-weight: 600;
                                }
                                .badge {
                                    padding: 3px 6px;
                                    border-radius: 4px;
                                    font-size: 0.75rem;
                                    font-weight: bold;
                                    display: inline-block;
                                }
                                .badge--success { background-color: #e2fbe8; color: #0f812d; }
                                .badge--warning { background-color: #fff7e6; color: #d48806; }
                                .badge--danger { background-color: #fff1f0; color: #cf1322; }
                                .btn, button {
                                    display: none !important;
                                }
                                .footer {
                                    margin-top: 60px;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: flex-start;
                                    page-break-inside: avoid;
                                }
                                .sign-box {
                                    text-align: center;
                                    width: 200px;
                                }
                                .sign-box p { margin: 0; }
                                .sign-title { font-weight: bold; margin-bottom: 60px !important; }
                                @media print {
                                    body { padding: 0; }
                                    @page { size: A4; margin: 15mm; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <p class="logo-title">RIDECONNECT - HỆ THỐNG ĐẶT XE CÔNG NGHỆ</p>
                                <p class="doc-subtitle">BÁO CÁO DOANH THU & TỔNG HỢP SỰ CỐ</p>
                            </div>
                            
                            <div class="meta-info">
                                <span>Bộ lọc thời gian: <strong>${timeRangeText}</strong></span>
                                <span>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</span>
                            </div>
                            
                            <div class="section-title">1. Báo cáo doanh thu chia sẻ</div>
                            ${tableHtml}
                            
                            <div class="section-title">2. Danh sách báo cáo vi phạm & khiếu nại</div>
                            ${complaintsHtml}
                            
                            <div class="footer">
                                <div class="sign-box">
                                    <p class="sign-title">Người lập biểu</p>
                                    <p style="color:#777; font-style:italic;">(Ký và ghi rõ họ tên)</p>
                                </div>
                                <div class="sign-box">
                                    <p class="sign-title">Ban giám đốc duyệt</p>
                                    <p style="color:#777; font-style:italic;">(Ký và đóng dấu)</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 500);

                } catch (error) {
                    console.error('Lỗi khi xuất PDF:', error);
                    alert('Có lỗi xảy ra khi tạo báo cáo PDF.');
                } finally {
                    btnExportPdf.textContent = originalText;
                    btnExportPdf.disabled = false;
                }
            }, 800);
        });
    }

    // 3. Logic Xử lý khiếu nại
    if (complaintList) {
        complaintList.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('btn-resolve-complaint')) {
                const id = target.getAttribute('data-id');
                const solution = prompt(`Xử lý khiếu nại REP-${id}:\nNhập biện pháp giải quyết (hoàn tiền, cảnh cáo tài xế, khóa tài khoản...):`);
                if (solution === null) return;
                if (solution.trim() === '') {
                    alert('Vui lòng nhập biện pháp xử lý để hoàn tất.');
                    return;
                }

                API.put(`/admin/complaint/${id}/resolve`, { solution: solution })
                .then(res => {
                    if (res.success) {
                        alert(`Đã lưu phương án xử lý khiếu nại REP-${id} thành công!\nBiện pháp: ${solution}`);
                        loadReportsData();
                    } else {
                        alert(res.message || 'Lỗi khi cập nhật trạng thái khiếu nại.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Lỗi kết nối máy chủ.');
                });
            }

            if (target.classList.contains('btn-view-complaint')) {
                const id = target.getAttribute('data-id');
                const solution = target.getAttribute('data-solution') || 'Không có ghi chú biện pháp giải quyết.';
                
                API.get('/admin/reports')
                .then(res => {
                    const complaint = res.complaints.find(c => c.MA_KHIEU_NAI.toString() === id.toString());
                    if (complaint) {
                        const source = complaint.LOAI_NGUOI_GUI === 'Khách hàng' ? `Khách (Mã: ${complaint.MA_NGUOI_GUI})` : `Tài xế (Mã: ${complaint.MA_NGUOI_GUI})`;
                        alert(`[Khiếu nại REP-${id}]\nNguồn: ${source}\nNội dung: ${complaint.NOI_DUNG}\n\n[Trạng thái]: Đã giải quyết\n[Biện pháp xử lý]: ${solution}`);
                    }
                });
            }
        });
    }

    // Tự động tải lại báo cáo khi thay đổi ngày bộ lọc
    if (fromDateInput) fromDateInput.addEventListener('change', loadReportsData);
    if (toDateInput) toDateInput.addEventListener('change', loadReportsData);

    // Tải dữ liệu lần đầu
    loadReportsData();
});
