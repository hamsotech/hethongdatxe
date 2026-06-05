/**
 * js/driver/dashboard.js
 * Xử lý giao diện tài xế: nhận/từ chối chuyến, cập nhật trạng thái, Socket.IO realtime, 
 * thông báo, chuyển đổi vai trò, và báo cáo sự cố (Tìm đồng nghiệp).
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const driverId = localStorage.getItem('user_id');
    if (!token) { window.location.replace('/login.html'); return; }

    // Kiểm tra xem tài xế có bị khóa ứng dụng hay không
    const isLocked = localStorage.getItem(`driver_locked_${driverId}`) === 'true';
    if (isLocked) {
        const reason = localStorage.getItem(`driver_lock_reason_${driverId}`) || 'Vi phạm điều khoản sử dụng';
        alert(`Tài khoản tài xế của bạn hiện đã bị khóa bởi quản trị viên.\nLý do: ${reason}\n\nVui lòng liên hệ với hỗ trợ (admin@rideconnect.vn) để được mở khóa.`);
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/login.html');
        return;
    }

    // Hiển thị tên tài xế thực tế
    const driverGreeting = document.getElementById('driver-greeting');
    if (driverGreeting) {
        driverGreeting.textContent = localStorage.getItem('user_name') || 'Tài xế';
    }

    const sheetRequested = document.getElementById('sheet-requested');
    const sheetOntrip    = document.getElementById('sheet-ontrip');
    const sheetPayment   = document.getElementById('sheet-payment');
    const btnAccept      = document.getElementById('btn-accept-trip');
    const btnFinish      = document.getElementById('btn-finish-trip');
    const btnConfirmPay  = document.getElementById('btn-confirm-payment');
    const toggleOnline   = document.getElementById('toggle-online');

    // Nút chuyển vai trò và thông báo
    const btnSwitchRole  = document.getElementById('btn-switch-role');
    const btnNotifications = document.getElementById('btn-notifications');
    const notificationBadge = document.getElementById('nav-notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');

    // Báo cáo sự cố & Tìm đồng nghiệp
    const btnEmergencyHelp = document.getElementById('btn-emergency-help');
    const colleagueModal   = document.getElementById('colleague-modal');
    const colleagueList    = document.getElementById('colleague-list');
    const btnCloseColleague = document.getElementById('btn-close-colleague');

    let currentTripId = null;
    let activeRequests = [];

    function showSheet(sheetEl) {
        [sheetRequested, sheetOntrip, sheetPayment].forEach(s => {
            if (s) s.classList.remove('bottom-sheet--active');
        });
        if (sheetEl) sheetEl.classList.add('bottom-sheet--active');
    }

    // Giao diện danh sách các thẻ chuyến đi của tài xế (nhiều khách đặt cùng lúc)
    function renderActiveRequests() {
        const activeStatus = sessionStorage.getItem('driver_active_trip_status');
        if (activeStatus === 'accepted' || activeStatus === 'picked_up' || activeStatus === 'payment') {
            return;
        }

        const infoEl = document.getElementById('trip-info');
        if (!infoEl) return;

        // Cho phép cuộn khi danh sách có nhiều chuyến đi cùng lúc
        infoEl.style.maxHeight = '320px';
        infoEl.style.overflowY = 'auto';
        infoEl.style.padding = '4px';

        if (activeRequests.length === 0) {
            showSheet(null);
            return;
        }

        // Tạo giao diện danh sách thẻ scrollable tuyệt đẹp
        infoEl.innerHTML = activeRequests.map(req => {
            const timeLeft = Math.max(0, Math.round((req.expireAt - Date.now()) / 1000));
            return `
                <div class="trip-request-card" data-id="${req.trip_id}" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #ffffff; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; font-family: inherit;">
                    <div style="font-weight: 700; font-size: 1rem; display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--color-text-main);">Đơn hàng #${req.trip_id}</span>
                        <span style="color: var(--color-blue); font-weight: 800;">${parseInt(req.price || 50000).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 6px; line-height: 1.45;">
                        🟢 <strong style="color: var(--color-green);">Đón:</strong> ${req.pickup_location}
                    </div>
                    <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 10px; line-height: 1.45;">
                        📍 <strong style="color: var(--color-red);">Đến:</strong> ${req.drop_location}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 4px;">
                        <span class="trip-countdown" data-id="${req.trip_id}" style="font-size: 0.82rem; color: var(--color-red); font-weight: 700; background: rgba(239, 68, 68, 0.08); padding: 4px 8px; border-radius: 6px;">
                            ⏱️ Còn ${timeLeft}s
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn--outline btn-decline-request" data-id="${req.trip_id}" style="padding: 6px 12px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; cursor: pointer; color: #64748b; border: 1px solid #cbd5e1; background: transparent;">
                                Từ chối
                            </button>
                            <button class="btn btn--success btn-accept-request" data-id="${req.trip_id}" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; cursor: pointer; border: none;">
                                Nhận chuyến
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
 
        // Ẩn bớt các text tĩnh không dùng của bottom-sheet khi hiển thị danh sách động
        const priceInfoText = sheetRequested.querySelector('.bottom-sheet__info');
        if (priceInfoText) priceInfoText.style.display = 'none';
        
        const mainAcceptBtn = document.getElementById('btn-accept-trip');
        if (mainAcceptBtn) mainAcceptBtn.style.display = 'none';
 
        // Gắn sự kiện click cho các nút "Từ chối" trong danh sách (chỉ ẩn ở máy tài xế này)
        infoEl.querySelectorAll('.btn-decline-request').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const tripId = this.getAttribute('data-id');
                activeRequests = activeRequests.filter(r => String(r.trip_id) !== String(tripId));
                renderActiveRequests();
            });
        });

        // Gắn sự kiện click cho các nút "Nhận chuyến" trong danh sách
        infoEl.querySelectorAll('.btn-accept-request').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const tripId = this.getAttribute('data-id');
                await acceptTripById(tripId);
            });
        });

        showSheet(sheetRequested);
    }

    // Hàm gọi API nhận chuyến chi tiết
    async function acceptTripById(tripId) {
        try {
            const response = await fetch(`${window.location.origin}/api/driver/accept`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ ma_chuyen_di: tripId, ma_tai_xe: driverId })
            });
            
            const resData = await response.json();
            if (!response.ok || !resData.success) {
                alert(resData.message || 'Lỗi khi nhận chuyến đi. Có thể chuyến đi đã được nhận bởi tài xế khác hoặc token bị hết hạn.');
                // Xoá khỏi danh sách chờ của màn hình này
                activeRequests = activeRequests.filter(r => String(r.trip_id) !== String(tripId));
                renderActiveRequests();
                return;
            }
            
            currentTripId = tripId;
            sessionStorage.setItem('driver_active_trip_id', tripId);
            
            // Tìm thông tin của chuyến được nhận để lưu vào session
            const acceptedReq = activeRequests.find(r => String(r.trip_id) === String(tripId));
            if (acceptedReq) {
                sessionStorage.setItem('driver_active_trip_pickup', acceptedReq.pickup_location);
                sessionStorage.setItem('driver_active_trip_drop', acceptedReq.drop_location);
                sessionStorage.setItem('driver_active_trip_price', acceptedReq.price);
                sessionStorage.setItem('driver_active_trip_customer', acceptedReq.customer_id);
            }
            
            if (typeof DriverSocket !== 'undefined') {
                DriverSocket.acceptRide(tripId, driverId);
            }
            
            // Xóa tất cả các chuyến đi chờ khác vì đã nhận một chuyến
            activeRequests = [];
            
            sessionStorage.setItem('driver_active_trip_status', 'accepted');
            updateOntripSheetDetails();
            showSheet(sheetOntrip);
            startDriverLocationSimulation();
        } catch (e) { 
            console.error(e);
            alert('Lỗi hệ thống khi nhận chuyến.');
        }
    }

    // Tải danh sách chuyến xe khả dụng ban đầu từ Database
    async function loadAvailableTrips() {
        try {
            const res = await fetch(`${window.location.origin}/api/driver/trips`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const trips = await res.json();
            
            activeRequests = trips.map(t => ({
                trip_id: t.MA_CHUYEN_DI,
                customer_id: t.MA_NGUOI_DUNG,
                pickup_location: t.DIEM_DON,
                drop_location: t.DIEM_DEN,
                price: t.GIA_TIEN,
                expireAt: Date.now() + 300 * 1000 // Hạn nhận 5 phút (300 giây)
            }));
            
            renderActiveRequests();
        } catch (e) {
            console.error('Lỗi tải danh sách chuyến đi khả dụng:', e);
        }
    }

    // Tải thống kê doanh thu, chuyến đi và đánh giá tài xế thực tế từ database
    async function loadDriverStats() {
        try {
            const res = await fetch(`${window.location.origin}/api/driver/stats`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                const todayRevenueEl = document.getElementById('today-revenue');
                const todayTripsEl = document.getElementById('today-trips');
                const driverRatingEl = document.getElementById('driver-rating');

                if (todayRevenueEl) {
                    todayRevenueEl.textContent = `${parseInt(data.today_revenue || 0).toLocaleString('vi-VN')}đ`;
                }
                if (todayTripsEl) {
                    todayTripsEl.textContent = data.today_trips || '0';
                }
                if (driverRatingEl) {
                    driverRatingEl.textContent = data.avg_rating ? parseFloat(data.avg_rating).toFixed(1) : '--';
                }
            }
        } catch (error) {
            console.error('Lỗi tải thống kê tài xế:', error);
        }
    }

    // Tải thống kê và danh sách chuyến đi khả dụng ngay khi mở màn hình chính
    loadDriverStats();
    loadAvailableTrips();

    // ==========================================
    // LOGIC CHUYỂN ĐỔI VAI TRÒ NHANH (DUAL-ROLE)
    // ==========================================
    if (btnSwitchRole) {
        const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
        if (roles.includes('customer')) {
            btnSwitchRole.style.display = 'block';
            btnSwitchRole.addEventListener('click', () => {
                const allUsers = JSON.parse(localStorage.getItem('all_users_info') || '{}');
                const customerInfo = allUsers['customer'];
                if (customerInfo) {
                    localStorage.setItem('currentUserRole', 'customer');
                    localStorage.setItem('user_id', customerInfo.ma_nguoi_dung);
                    localStorage.setItem('user_name', customerInfo.ten);
                    localStorage.setItem('user_email', customerInfo.email);
                    localStorage.setItem('user_phone', customerInfo.so_dien_thoai);
                    window.location.href = '/customer/dashboard.html';
                }
            });
        }
    }

    // ==========================================
    // LOGIC HỆ THỐNG THÔNG BÁO MOCK
    // ==========================================
    let notifications = [
        { id: 1, text: "📢 Chào mừng bạn gia nhập đội ngũ tài xế của RideConnect!", unread: true },
        { id: 2, text: "💰 Số dư ví của bạn vừa được cập nhật thêm 100k.", unread: false }
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
            <div class="notification-item ${n.unread ? 'notification-item--unread' : ''}" data-id="${n.id}" style="padding: 10px; border-bottom: 1px solid #eee; font-size: 0.85rem; cursor: pointer; color: #333; ${n.unread ? 'background-color: var(--color-blue-light); font-weight: 500;' : ''}">
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

    // Cập nhật thông tin điểm đón, điểm đến trên panel của tài xế
    function updateOntripSheetDetails() {
        const pickup = sessionStorage.getItem('driver_active_trip_pickup') || 'Đang cập nhật...';
        const drop = sessionStorage.getItem('driver_active_trip_drop') || 'Đang cập nhật...';
        const price = sessionStorage.getItem('driver_active_trip_price') || '50000';
        const status = sessionStorage.getItem('driver_active_trip_status') || 'accepted';

        const titleEl = document.getElementById('ontrip-sheet-title');
        const pickupBtn = document.getElementById('btn-pickup-passenger');
        const finishBtn = document.getElementById('btn-finish-trip');
        const ontripDestEl = document.getElementById('ontrip-destination');

        if (status === 'picked_up') {
            if (titleEl) titleEl.textContent = 'Đang di chuyển';
            if (pickupBtn) pickupBtn.style.display = 'none';
            if (finishBtn) finishBtn.style.display = 'block';
            if (ontripDestEl) {
                ontripDestEl.innerHTML = `
                    <div style="margin-bottom: 6px; text-align: left; color:#888;">🟢 <strong>Đón:</strong> ${pickup}</div>
                    <div style="margin-bottom: 6px; text-align: left;">📍 <strong>Đến:</strong> ${drop}</div>
                `;
            }
        } else {
            if (titleEl) titleEl.textContent = 'Đang đi đón khách';
            if (pickupBtn) pickupBtn.style.display = 'block';
            if (finishBtn) finishBtn.style.display = 'none';
            if (ontripDestEl) {
                ontripDestEl.innerHTML = `
                    <div style="margin-bottom: 6px; text-align: left;">🟢 <strong>Đón:</strong> ${pickup}</div>
                    <div style="margin-bottom: 6px; text-align: left; color:#888;">📍 <strong>Đến:</strong> ${drop}</div>
                `;
            }
        }

        // Cập nhật số tiền hiển thị trên màn hình hoàn tất thanh toán
        const amountEl = document.getElementById('payment-amount');
        if (amountEl) {
            amountEl.textContent = `${parseInt(price).toLocaleString('vi-VN')} đ`;
        }

        // Vẽ điểm đón và điểm đến của chuyến đi lên bản đồ tài xế
        if (typeof window.drawActiveTripOnDriverMap === 'function') {
            window.drawActiveTripOnDriverMap();
        }
    }

    // ==========================================
    // KẾT NỐI SOCKET & THEO DÕI REALTIME
    // ==========================================
    if (typeof DriverSocket !== 'undefined' && driverId) {
        DriverSocket.goOnline(driverId);

        // Nhận thông báo chuyến mới từ khách
        DriverSocket.onNewTrip(function(data) {
            // Kiểm tra xem chuyến đi này đã có trong danh sách chưa
            if (!activeRequests.some(r => String(r.trip_id) === String(data.trip_id))) {
                activeRequests.push({
                    trip_id: data.trip_id,
                    customer_id: data.customer_id,
                    pickup_location: data.pickup_location,
                    drop_location: data.drop_location,
                    price: data.price,
                    expireAt: Date.now() + 300 * 1000 // Hạn nhận 5 phút (300 giây)
                });
                renderActiveRequests();
            }
        });

        // Lắng nghe các sự kiện toàn cục về nhận/huỷ chuyến từ các tài xế hoặc khách hàng khác
        if (typeof SocketManager !== 'undefined') {
            SocketManager.listen('global_trip_accepted', function(data) {
                const acceptedTripId = data.trip_id;
                // Xoá chuyến đi này khỏi danh sách vì đã có tài xế khác nhận
                activeRequests = activeRequests.filter(r => String(r.trip_id) !== String(acceptedTripId));
                renderActiveRequests();
            });

            SocketManager.listen('global_trip_cancelled', function(data) {
                const cancelledTripId = data.trip_id;
                // Xoá chuyến đi này khỏi danh sách vì khách hàng đã huỷ
                activeRequests = activeRequests.filter(r => String(r.trip_id) !== String(cancelledTripId));
                renderActiveRequests();
            });
        }

        // Tự động gia nhập lại phòng nếu có chuyến xe đang hoạt động
        const savedTripId = sessionStorage.getItem('driver_active_trip_id');
        if (savedTripId) {
            currentTripId = savedTripId;
            // Join lại room socket
            if (typeof SocketManager !== 'undefined') {
                const joinRoom = () => {
                    if (currentTripId) {
                        SocketManager.sendMessage('join_trip_room', { trip_id: currentTripId, user_id: driverId, role: 'driver' });
                    }
                };
                joinRoom();
                SocketManager.listen('connect', joinRoom);
            }
            // Gọi API kiểm tra trạng thái thực tế của chuyến xe để khôi phục giao diện
            fetch(`${window.location.origin}/api/driver/trip/${currentTripId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.trip) {
                    const dbStatus = data.trip.TRANG_THAI;
                    if (dbStatus === 'DANG_DI') {
                        sessionStorage.setItem('driver_active_trip_status', 'picked_up');
                        updateOntripSheetDetails();
                        showSheet(sheetOntrip);
                        startDriverLocationSimulation();
                    } else if (dbStatus === 'DA_NHAN') {
                        sessionStorage.setItem('driver_active_trip_status', 'accepted');
                        updateOntripSheetDetails();
                        showSheet(sheetOntrip);
                        startDriverLocationSimulation();
                    } else {
                        // HOAN_THANH or DA_HUY or any other state
                        sessionStorage.removeItem('driver_active_trip_id');
                        sessionStorage.removeItem('driver_active_trip_status');
                        showSheet(null);
                        if (typeof window.clearActiveTripFromDriverMap === 'function') {
                            window.clearActiveTripFromDriverMap();
                        }
                    }
                } else {
                    // Nếu không thành công (ví dụ: bị xoá hoặc sai token/chuyến đi), reset để tránh treo giao diện
                    sessionStorage.removeItem('driver_active_trip_id');
                    sessionStorage.removeItem('driver_active_trip_status');
                    showSheet(null);
                    if (typeof window.clearActiveTripFromDriverMap === 'function') {
                        window.clearActiveTripFromDriverMap();
                    }
                }
            })
            .catch(err => {
                console.error("Lỗi đồng bộ chuyến xe:", err);
                sessionStorage.removeItem('driver_active_trip_id');
                sessionStorage.removeItem('driver_active_trip_status');
                showSheet(null);
                if (typeof window.clearActiveTripFromDriverMap === 'function') {
                    window.clearActiveTripFromDriverMap();
                }
            });
        }

        // Lắng nghe cuộc gọi đến từ Khách hàng
        if (typeof SocketManager !== 'undefined') {
            SocketManager.listen('incoming_call_alert', function(data) {
                showIncomingCallModal();
            });

            SocketManager.listen('call_status_changed', function(data) {
                if (data.action === 'cancel' || data.action === 'hangup') {
                    closeIncomingCallModal('Cuộc gọi đã kết thúc');
                }
            });
        }
    }

    // --- LOGIC GỌI ĐIỆN SIMULATOR PHÍA TÀI XẾ ---
    const incomingCallModal = document.getElementById('incoming-call-modal');
    const callStatusText = document.getElementById('call-status-text');
    const callActionsRinging = document.getElementById('call-actions-ringing');
    const callActionsConnected = document.getElementById('call-actions-connected');
    const btnAcceptCall = document.getElementById('btn-accept-call');
    const btnDeclineCall = document.getElementById('btn-decline-call');
    const btnHangupCall = document.getElementById('btn-hangup-call');
    let driverCallTimer = null;
    let driverCallDuration = 0;

    function formatTime(secs) {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function showIncomingCallModal() {
        if (!incomingCallModal) return;
        callStatusText.textContent = 'Đang đổ chuông...';
        if (callActionsRinging) callActionsRinging.style.display = 'flex';
        if (callActionsConnected) callActionsConnected.style.display = 'none';
        incomingCallModal.style.display = 'flex';
    }

    function closeIncomingCallModal(message) {
        if (driverCallTimer) clearInterval(driverCallTimer);
        if (callStatusText) callStatusText.textContent = message || 'Cuộc gọi đã kết thúc';
        setTimeout(() => {
            if (incomingCallModal) incomingCallModal.style.display = 'none';
        }, 1500);
    }

    if (btnAcceptCall) {
        btnAcceptCall.addEventListener('click', () => {
            if (callActionsRinging) callActionsRinging.style.display = 'none';
            if (callActionsConnected) callActionsConnected.style.display = 'block';
            callStatusText.textContent = 'Kết nối: 00:00';
            
            if (typeof SocketManager !== 'undefined' && currentTripId) {
                SocketManager.sendMessage('driver_respond_call', { trip_id: currentTripId, action: 'accept' });
            }

            driverCallDuration = 0;
            if (driverCallTimer) clearInterval(driverCallTimer);
            driverCallTimer = setInterval(() => {
                driverCallDuration++;
                callStatusText.textContent = `Kết nối: ${formatTime(driverCallDuration)}`;
            }, 1000);
        });
    }

    if (btnDeclineCall) {
        btnDeclineCall.addEventListener('click', () => {
            closeIncomingCallModal('Đã từ chối cuộc gọi');
            if (typeof SocketManager !== 'undefined' && currentTripId) {
                SocketManager.sendMessage('driver_respond_call', { trip_id: currentTripId, action: 'decline' });
            }
        });
    }

    if (btnHangupCall) {
        btnHangupCall.addEventListener('click', () => {
            closeIncomingCallModal('Cuộc gọi đã kết thúc');
            if (typeof SocketManager !== 'undefined' && currentTripId) {
                SocketManager.sendMessage('driver_respond_call', { trip_id: currentTripId, action: 'hangup' });
            }
        });
    }

    // Chạy bộ đếm ngược thời gian cho tất cả chuyến xe đang chờ
    setInterval(() => {
        let hasChanges = false;
        const now = Date.now();
        
        activeRequests = activeRequests.filter(req => {
            if (now >= req.expireAt) {
                hasChanges = true;
                return false;
            }
            return true;
        });

        if (hasChanges) {
            renderActiveRequests();
        } else {
            // Cập nhật số giây đếm ngược trực tiếp lên DOM để tránh vẽ lại toàn bộ giao diện gây nhấp nháy
            const countdowns = document.querySelectorAll('.trip-countdown');
            countdowns.forEach(el => {
                const tripId = el.getAttribute('data-id');
                const req = activeRequests.find(r => String(r.trip_id) === String(tripId));
                if (req) {
                    const timeLeft = Math.max(0, Math.round((req.expireAt - now) / 1000));
                    el.textContent = `⏱️ Còn ${timeLeft}s`;
                }
            });
        }
    }, 1000);

    // Logic Đã đón khách
    const btnPickup = document.getElementById('btn-pickup-passenger');
    if (btnPickup) {
        btnPickup.addEventListener('click', async () => {
            if (!currentTripId) return;
            const originalText = btnPickup.textContent;
            btnPickup.textContent = 'Đang xử lý...';
            btnPickup.disabled = true;

            try {
                const response = await fetch(`${window.location.origin}/api/driver/trip/${currentTripId}/pickup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const resData = await response.json();

                if (resData.success) {
                    sessionStorage.setItem('driver_active_trip_status', 'picked_up');
                    if (typeof SocketManager !== 'undefined') {
                        SocketManager.sendMessage('driver_pickup_customer', { trip_id: currentTripId, driver_id: driverId });
                    }
                    updateOntripSheetDetails();
                    startDriverLocationSimulation();
                } else {
                    alert(resData.message || 'Lỗi khi xác nhận đón khách.');
                }
            } catch (error) {
                console.error("Lỗi xác nhận đón khách:", error);
                alert('Có lỗi hệ thống xảy ra khi đón khách.');
            } finally {
                btnPickup.textContent = originalText;
                btnPickup.disabled = false;
            }
        });
    }

    // Hoàn thành chuyến (Cập nhật DB và gửi Socket báo cho Khách hàng ngay lập tức)
    if (btnFinish) {
        btnFinish.addEventListener('click', async () => {
            if (!currentTripId) return;
            const originalText = btnFinish.textContent;
            btnFinish.textContent = 'Đang xử lý...';
            btnFinish.disabled = true;

            try {
                // 1. Cập nhật DB backend
                const response = await fetch(`${window.location.origin}/api/driver/trip/${currentTripId}/complete`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${token}` 
                    }
                });
                const resData = await response.json();

                if (resData.success) {
                    // 2. Phát sự kiện socket báo hoàn thành cho khách hàng
                    if (typeof DriverSocket !== 'undefined') {
                        DriverSocket.completeRide(currentTripId, driverId);
                    }

                    // 3. Hiển thị màn hình xác nhận thanh toán phía tài xế
                    showSheet(sheetPayment); 
                    const price = sessionStorage.getItem('driver_active_trip_price') || '50000';
                    const amountEl = document.getElementById('payment-amount');
                    if (amountEl) {
                        amountEl.textContent = `${parseInt(price).toLocaleString('vi-VN')} đ`;
                    }
                } else {
                    alert(resData.message || 'Lỗi khi xác nhận hoàn thành chuyến đi.');
                }
            } catch (e) {
                console.error("Lỗi hoàn thành chuyến đi:", e);
                alert('Có lỗi hệ thống xảy ra khi hoàn thành chuyến đi.');
            } finally {
                btnFinish.textContent = originalText;
                btnFinish.disabled = false;
            }
        });
    }

    // Xác nhận đã thu tiền & Reset giao diện tài xế
    if (btnConfirmPay) {
        btnConfirmPay.addEventListener('click', () => {
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }
            // Xoá các marker chuyến đi cũ và reset view bản đồ tài xế
            if (typeof window.clearActiveTripFromDriverMap === 'function') {
                window.clearActiveTripFromDriverMap();
            }
            showSheet(null);
            currentTripId = null;
            sessionStorage.removeItem('driver_active_trip_id');
            sessionStorage.removeItem('driver_active_trip_pickup');
            sessionStorage.removeItem('driver_active_trip_drop');
            sessionStorage.removeItem('driver_active_trip_price');
            sessionStorage.removeItem('driver_active_trip_customer');
            sessionStorage.removeItem('driver_active_trip_status');

            // Cập nhật lại thống kê doanh thu, chuyến đi mới trên dashboard
            loadDriverStats();
            alert('Chuyến đi đã kết thúc hoàn tất!');
        });
    }

    // Bật/tắt trạng thái online
    if (toggleOnline) {
        toggleOnline.addEventListener('change', () => {
            const statusText = document.getElementById('map-status-text');
            if (toggleOnline.checked) {
                if (statusText) statusText.textContent = 'Đang quét tìm khách...';
                if (typeof DriverSocket !== 'undefined') DriverSocket.goOnline(driverId);
            } else {
                if (statusText) statusText.textContent = 'Bạn đang offline';
            }
        });
    }

    // ==========================================
    // SỰ CỐ KHẨN CẤP & TÌM ĐỒNG NGHIỆP TRỢ GIÚP
    // ==========================================
    if (btnEmergencyHelp) {
        btnEmergencyHelp.addEventListener('click', async () => {
            if (!currentTripId) {
                alert('Không có chuyến đi đang hoạt động!');
                return;
            }

            if (!confirm('Bạn có chắc chắn muốn phát báo động sự cố và tìm đồng nghiệp hỗ trợ?')) return;

            btnEmergencyHelp.textContent = 'Đang gửi yêu cầu...';
            btnEmergencyHelp.disabled = true;

            try {
                const response = await fetch(`${window.location.origin}/api/driver/emergency`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ma_chuyen_di: currentTripId, ma_tai_xe: driverId })
                });

                const data = await response.json();

                if (data.success) {
                    // Hiển thị danh sách đồng nghiệp
                    if (colleagueList) {
                        colleagueList.innerHTML = '';
                        if (data.colleagues.length === 0) {
                            colleagueList.innerHTML = '<p style="font-size:0.9rem; text-align:center; color:var(--color-text-muted); padding:10px;">Không tìm thấy đồng nghiệp nào đang trực tuyến gần đây.</p>';
                        } else {
                            data.colleagues.forEach(c => {
                                const item = document.createElement('div');
                                item.style.padding = '8px';
                                item.style.border = '1px solid #eee';
                                item.style.borderRadius = '6px';
                                item.style.backgroundColor = '#f9f9f9';
                                item.style.display = 'flex';
                                item.style.flexDirection = 'column';
                                item.style.gap = '4px';

                                item.innerHTML = `
                                    <div style="display:flex; justify-content:space-between; font-weight:600; font-size:0.9rem;">
                                        <span>${c.TEN}</span>
                                        <span style="color:var(--color-blue);">${c.LOAI_XE}</span>
                                    </div>
                                    <div style="font-size:0.8rem; color:#666; display:flex; justify-content:space-between;">
                                        <span>Biển số: ${c.BIEN_SO || 'N/A'}</span>
                                        <span>SĐT: <a href="tel:${c.SO_DIEN_THOAI}" style="color:var(--color-green); font-weight:bold;">${c.SO_DIEN_THOAI}</a></span>
                                    </div>
                                    <button class="btn btn--primary" style="padding:4px 8px; font-size:0.8rem; margin-top:5px;" onclick="alert('Đã gửi yêu cầu trợ giúp và toạ độ sự cố tới ${c.TEN}!')">
                                        📞 Yêu cầu hỗ trợ
                                    </button>
                                `;
                                colleagueList.appendChild(item);
                            });
                        }
                    }
                    if (colleagueModal) colleagueModal.style.display = 'flex';
                } else {
                    alert(data.message || 'Lỗi gửi yêu cầu.');
                }
            } catch (error) {
                console.error(error);
                alert('Không thể kết nối với server.');
            } finally {
                btnEmergencyHelp.textContent = '⚠️ Cần đồng nghiệp trợ giúp (Sự cố)';
                btnEmergencyHelp.disabled = false;
            }
        });
    }

    if (btnCloseColleague && colleagueModal) {
        btnCloseColleague.addEventListener('click', () => {
            colleagueModal.style.display = 'none';
        });
    }

    // ==========================================
    // MÔ PHỎNG DI CHUYỂN TÀI XẾ REALTIME (SYNC VỚI KHÁCH HÀNG)
    // ==========================================
    let simulationInterval = null;
    let simulationCoordinates = [];
    let simulationIndex = 0;

    // Helper: Gọi Nominatim có lưu cache vào localStorage để giảm lag & chống rate-limit
    async function cachedFetch(url, options = {}) {
        if (url.includes('nominatim.openstreetmap.org')) {
            const cacheKey = 'geo_cache_' + url;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return {
                    json: async () => JSON.parse(cached),
                    ok: true,
                    text: async () => cached
                };
            }
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    const text = await response.text();
                    localStorage.setItem(cacheKey, text);
                    return {
                        json: async () => JSON.parse(text),
                        ok: true,
                        text: async () => text
                    };
                }
                return response;
            } catch (e) {
                console.warn('Nominatim fetch failed, using fallback dictionary:', e);
                const lowerUrl = decodeURIComponent(url).toLowerCase();
                let mockData = [];
                if (lowerUrl.includes('nguyễn trãi') || lowerUrl.includes('quận 5')) {
                    mockData = [{ lat: '10.754026', lon: '106.663375', display_name: 'Nguyễn Trãi, Quận 5, TP.HCM' }];
                } else if (lowerUrl.includes('đức bà') || lowerUrl.includes('quận 1') || lowerUrl.includes('trung tâm')) {
                    mockData = [{ lat: '10.779786', lon: '106.699018', display_name: 'Nhà thờ Đức Bà, Quận 1, TP.HCM' }];
                } else if (lowerUrl.includes('cnc') || lowerUrl.includes('quận 9') || lowerUrl.includes('công nghệ cao')) {
                    mockData = [{ lat: '10.844199', lon: '106.792557', display_name: 'Khu Công nghệ cao, Quận 9, TP.HCM' }];
                } else if (lowerUrl.includes('bình thạnh')) {
                    mockData = [{ lat: '10.801646', lon: '106.698711', display_name: 'Bình Thạnh, TP.HCM' }];
                } else if (lowerUrl.includes('phú nhuận')) {
                    mockData = [{ lat: '10.799201', lon: '106.680287', display_name: 'Phú Nhuận, TP.HCM' }];
                } else {
                    mockData = [{ lat: '10.776889', lon: '106.700806', display_name: 'TP. Hồ Chí Minh' }];
                }
                return {
                    json: async () => mockData,
                    ok: true,
                    text: async () => JSON.stringify(mockData)
                };
            }
        }
        return fetch(url, options);
    }

    async function startDriverLocationSimulation() {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }

        const status = sessionStorage.getItem('driver_active_trip_status') || 'accepted';
        const tripId = sessionStorage.getItem('driver_active_trip_id') || currentTripId;
        if (!tripId) return;

        let driverLat = 10.762622;
        let driverLng = 106.660172;
        if (window.driverLocationMarker) {
            const latlng = window.driverLocationMarker.getLatLng();
            driverLat = latlng.lat;
            driverLng = latlng.lng;
        }

        const pickupAddr = sessionStorage.getItem('driver_active_trip_pickup');
        const dropAddr = sessionStorage.getItem('driver_active_trip_drop');

        if (!pickupAddr || !dropAddr) return;

        try {
            const resPickup = await cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddr)}&limit=1`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const dataPickup = await resPickup.json();
            if (!dataPickup || dataPickup.length === 0) return;
            const pLat = parseFloat(dataPickup[0].lat);
            const pLng = parseFloat(dataPickup[0].lon);

            const resDrop = await cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropAddr)}&limit=1`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const dataDrop = await resDrop.json();
            if (!dataDrop || dataDrop.length === 0) return;
            const dLat = parseFloat(dataDrop[0].lat);
            const dLng = parseFloat(dataDrop[0].lon);

            let startLat, startLng, endLat, endLng;
            if (status === 'accepted') {
                startLat = driverLat;
                startLng = driverLng;
                endLat = pLat;
                endLng = pLng;
            } else if (status === 'picked_up') {
                startLat = pLat;
                startLng = pLng;
                endLat = dLat;
                endLng = dLng;
            } else {
                return;
            }

            if (typeof window.getRoutingOSRM === 'function') {
                const route = await window.getRoutingOSRM(startLat, startLng, endLat, endLng);
                if (route && route.coordinates && route.coordinates.length > 0) {
                    simulationCoordinates = route.coordinates;
                } else {
                    simulationCoordinates = [];
                    for (let i = 0; i <= 15; i++) {
                        const t = i / 15;
                        simulationCoordinates.push([
                            startLat + (endLat - startLat) * t,
                            startLng + (endLng - startLng) * t
                        ]);
                    }
                }
            } else {
                return;
            }

            simulationIndex = 0;
            simulationInterval = setInterval(() => {
                if (simulationIndex >= simulationCoordinates.length) {
                    clearInterval(simulationInterval);
                    simulationInterval = null;
                    const finalCoords = simulationCoordinates[simulationCoordinates.length - 1];
                    if (window.driverLocationMarker) {
                        window.driverLocationMarker.setLatLng(finalCoords);
                    }
                    if (typeof DriverSocket !== 'undefined') {
                        DriverSocket.sendLocation(tripId, { lat: finalCoords[0], lng: finalCoords[1] });
                    }
                    return;
                }

                const currentCoords = simulationCoordinates[simulationIndex];
                if (window.driverLocationMarker) {
                    window.driverLocationMarker.setLatLng(currentCoords);
                    if (window.driverMapObj) {
                        window.driverMapObj.panTo(currentCoords);
                    }
                }

                if (typeof DriverSocket !== 'undefined') {
                    DriverSocket.sendLocation(tripId, { lat: currentCoords[0], lng: currentCoords[1] });
                }

                simulationIndex++;
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi chạy mô phỏng di chuyển tài xế:", err);
        }
    }
});
