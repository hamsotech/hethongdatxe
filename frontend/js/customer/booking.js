/**
 * js/customer/booking.js
 * Xử lý logic tìm điểm đến, tính giá, đặt chuyến xe và hệ thống thông báo.
 */

document.addEventListener('DOMContentLoaded', () => {
    window.activeDiscount = 0.0;

    // Kiểm tra xem khách hàng có bị khóa ứng dụng hay không
    const customerId = localStorage.getItem('user_id');
    const isCustomerLocked = localStorage.getItem(`user_locked_${customerId}`) === 'true';
    if (isCustomerLocked) {
        const reason = localStorage.getItem(`user_lock_reason_${customerId}`) || 'Vi phạm điều khoản sử dụng';
        alert(`Tài khoản của bạn hiện đã bị khóa bởi quản trị viên.\nLý do: ${reason}\n\nVui lòng liên hệ với hỗ trợ (admin@rideconnect.vn) để được giải quyết.`);
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/login.html');
        return;
    }

    // ==========================================
    // HIỂN THỊ TÊN THẬT LÊN TRANG CHỦ & ĐỒNG BỘ AVATAR
    // ==========================================
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = localStorage.getItem('user_name') || 'Khách hàng';
    }
    const savedAvatar = localStorage.getItem('customer_avatar');
    const dashboardAvatar = document.getElementById('user-avatar');
    if (savedAvatar && dashboardAvatar) {
        dashboardAvatar.src = savedAvatar;
    }

    // ==========================================
    // LOGIC CHUYỂN ĐỔI VAI TRÒ NHANH (DUAL-ROLE)
    // ==========================================
    const btnSwitchRole = document.getElementById('btn-switch-role');
    if (btnSwitchRole) {
        const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
        if (roles.includes('driver')) {
            btnSwitchRole.style.display = 'block';
            btnSwitchRole.addEventListener('click', () => {
                const allUsers = JSON.parse(localStorage.getItem('all_users_info') || '{}');
                const driverInfo = allUsers['driver'];
                if (driverInfo) {
                    localStorage.setItem('currentUserRole', 'driver');
                    localStorage.setItem('user_id', driverInfo.ma_tai_xe);
                    localStorage.setItem('user_name', driverInfo.ten);
                    localStorage.setItem('user_email', driverInfo.email);
                    localStorage.setItem('user_phone', driverInfo.so_dien_thoai);
                    window.location.href = '/driver/dashboard.html';
                }
            });
        }
    }

    // ==========================================
    // LOGIC HỆ THỐNG THÔNG BÁO
    // ==========================================
    const btnNotifications = document.getElementById('btn-notifications');
    const notificationBadge = document.getElementById('nav-notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');

    let notifications = [
        { id: 1, text: "🎉 Khuyến mãi: Nhập RIDEBLUE giảm ngay 20% cho chuyến đi đầu tiên.", unread: true },
        { id: 2, text: "🚗 Chuyến đi TRP-9812 của bạn đã hoàn thành xuất sắc.", unread: true },
        { id: 3, text: "⚠️ Tài khoản của bạn đã được xác minh thành công.", unread: false }
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
            <div class="notification-item ${n.unread ? 'notification-item--unread' : ''}" data-id="${n.id}">
                ${n.text}
            </div>
        `).join('');
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const noti = notifications.find(n => n.id === id);
                if (noti && noti.unread) { noti.unread = false; renderNotifications(); }
            });
        });
    }

    renderNotifications();

    if (btnNotifications && notificationDropdown) {
        btnNotifications.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('notification-dropdown--active');
        });
    }
    document.addEventListener('click', () => {
        if (notificationDropdown) notificationDropdown.classList.remove('notification-dropdown--active');
    });

    // ==========================================
    // ĐIỀU HƯỚNG TRANG DASHBOARD
    // ==========================================
    const searchDestBtn = document.getElementById('search-destination-btn');
    const btnBookRide = document.getElementById('btn-book-ride');
    const btnViewHistory = document.getElementById('btn-view-history');

    if (searchDestBtn) searchDestBtn.addEventListener('click', () => { window.location.href = 'book_ride.html'; });
    if (btnBookRide) btnBookRide.addEventListener('click', () => { window.location.href = 'book_ride.html'; });
    if (btnViewHistory) btnViewHistory.addEventListener('click', () => { window.location.href = 'history.html'; });

    // ==========================================
    // LOGIC CHO TRANG BOOK RIDE (ĐẶT XE)
    // ==========================================
    const btnBack = document.getElementById('btn-back');
    const btnConfirmBooking = document.getElementById('btn-confirm-booking');
    const btnShowMapVehicles = document.getElementById('btn-show-map-vehicles');
    const bookingMapSection = document.getElementById('booking-map-section');
    const vehicleSelectionSection = document.getElementById('vehicle-selection-section');
    
    const inputPickup = document.getElementById('pickup-location');
    const inputDropoff = document.getElementById('dropoff-location');
    const pickupSuggestions = document.getElementById('pickup-suggestions');
    const dropoffSuggestions = document.getElementById('dropoff-suggestions');

    if (btnBack) btnBack.addEventListener('click', () => { window.location.href = 'dashboard.html'; });

    // Tự động điền GPS vị trí hiện tại khi vào trang
    if (inputPickup && !inputPickup.value) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                inputPickup.dataset.lat = lat;
                inputPickup.dataset.lng = lng;
                inputPickup.value = "Đang xác định vị trí...";
                
                const safeFetch = window.cachedFetch || fetch;
                safeFetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`, {
                    headers: { 'User-Agent': 'RideConnect-App' }
                })
                .then(res => res.json())
                .then(data => {
                    inputPickup.value = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    updatePriceEstimation();
                })
                .catch(() => {
                    inputPickup.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    updatePriceEstimation();
                });
            }, (err) => {
                console.warn("Lỗi định vị tự động Điểm đón:", err);
            });
        }
    }

    // Cơ chế Debounce để tối ưu tìm kiếm địa chỉ gợi ý
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Tính khoảng cách Haversine giữa 2 toạ độ (km)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Bán kính Trái Đất (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Cập nhật giá vé xe theo quãng đường thực tế di chuyển
    window.updatePricesWithDistance = function(distance) {
        // Tính giá GrabBike: 10.000đ/km, tối thiểu 12.000đ
        let priceBike = Math.max(12000, Math.round(distance * 10000 / 1000) * 1000);
        // Tính giá GrabCar: 22.000đ/km, tối thiểu 28.000đ
        let priceCar = Math.max(28000, Math.round(distance * 22000 / 1000) * 1000);

        if (window.activeDiscount && window.activeDiscount > 0) {
            priceBike = Math.round(priceBike * (1 - window.activeDiscount));
            priceCar = Math.round(priceCar * (1 - window.activeDiscount));
        }

        const priceBikeEl = document.getElementById('price-bike');
        const priceCarEl = document.getElementById('price-car');

        if (priceBikeEl) {
            priceBikeEl.textContent = `${priceBike.toLocaleString('vi-VN')} đ`;
            priceBikeEl.dataset.value = priceBike;
        }
        if (priceCarEl) {
            priceCarEl.textContent = `${priceCar.toLocaleString('vi-VN')} đ`;
            priceCarEl.dataset.value = priceCar;
        }
        
        // Cập nhật nhãn thời gian dự kiến (khoảng 2.5 phút/km đối với xe máy, 3.5 phút đối với ô tô)
        const timeBike = Math.max(2, Math.round(distance * 2.5));
        const timeCar = Math.max(3, Math.round(distance * 3.5));
        
        const bikeTimeEl = document.querySelector('#vehicle-bike + .vehicle-card__content .vehicle-card__time');
        const carTimeEl = document.querySelector('#vehicle-car + .vehicle-card__content .vehicle-card__time');
        if (bikeTimeEl) bikeTimeEl.textContent = `${timeBike} phút`;
        if (carTimeEl) carTimeEl.textContent = `${timeCar} phút`;
    };

    // Cập nhật giá vé xe dynamically
    window.updatePriceEstimation = function() {
        if (!inputPickup || !inputDropoff) return;
        
        const lat1 = parseFloat(inputPickup.dataset.lat);
        const lon1 = parseFloat(inputPickup.dataset.lng);
        const lat2 = parseFloat(inputDropoff.dataset.lat);
        const lon2 = parseFloat(inputDropoff.dataset.lng);

        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            return;
        }

        if (typeof window.updateBookingRoutePolyline === 'function') {
            window.updateBookingRoutePolyline();
        } else {
            const distance = getDistance(lat1, lon1, lat2, lon2);
            window.updatePricesWithDistance(distance);
        }
    };

    // Hàm gọi API Autocomplete Nominatim
    async function handleAutocomplete(query, suggestionsContainer, inputEl, markerName) {
        if (!query || query.length < 3) {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
            return;
        }

        try {
            const safeFetch = window.cachedFetch || fetch;
            const response = await safeFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn&accept-language=vi`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                suggestionsContainer.innerHTML = data.map(item => `
                    <div class="autocomplete-suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" title="${item.display_name}">
                        ${item.display_name}
                    </div>
                `).join('');
                suggestionsContainer.style.display = 'block';

                suggestionsContainer.querySelectorAll('.autocomplete-suggestion-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const lat = parseFloat(this.getAttribute('data-lat'));
                        const lng = parseFloat(this.getAttribute('data-lon'));
                        const address = this.textContent.trim();

                        inputEl.value = address;
                        inputEl.dataset.lat = lat;
                        inputEl.dataset.lng = lng;

                        suggestionsContainer.style.display = 'none';
                        suggestionsContainer.innerHTML = '';

                        // Cập nhật vị trí marker trên bản đồ Leaflet
                        if (markerName === 'pickup') {
                            if (window.markerPickup && window.bookingMapObj) {
                                window.markerPickup.setLatLng([lat, lng]);
                                window.bookingMapObj.panTo([lat, lng]);
                                if (typeof window.updateBookingRoutePolyline === 'function') {
                                    window.updateBookingRoutePolyline();
                                }
                            }
                        } else if (markerName === 'dropoff') {
                            if (window.markerDropoff && window.bookingMapObj) {
                                window.markerDropoff.setLatLng([lat, lng]);
                                window.bookingMapObj.panTo([lat, lng]);
                                if (typeof window.updateBookingRoutePolyline === 'function') {
                                    window.updateBookingRoutePolyline();
                                }
                            }
                        }
                        
                        updatePriceEstimation();
                    });
                });
            } else {
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = '';
            }
        } catch (error) {
            console.error('Lỗi lấy gợi ý địa chỉ:', error);
        }
    }

    if (inputPickup && pickupSuggestions) {
        inputPickup.addEventListener('input', debounce((e) => {
            handleAutocomplete(e.target.value.trim(), pickupSuggestions, inputPickup, 'pickup');
        }, 500));
    }

    if (inputDropoff && dropoffSuggestions) {
        inputDropoff.addEventListener('input', debounce((e) => {
            handleAutocomplete(e.target.value.trim(), dropoffSuggestions, inputDropoff, 'dropoff');
        }, 500));
    }

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (pickupSuggestions && !pickupSuggestions.contains(e.target) && e.target !== inputPickup) {
            pickupSuggestions.style.display = 'none';
        }
        if (dropoffSuggestions && !dropoffSuggestions.contains(e.target) && e.target !== inputDropoff) {
            dropoffSuggestions.style.display = 'none';
        }
    });

    if (btnShowMapVehicles) {
        btnShowMapVehicles.addEventListener('click', () => {
            const pickup = inputPickup ? inputPickup.value.trim() : '';
            const dropoff = inputDropoff ? inputDropoff.value.trim() : '';

            if (!pickup || !dropoff) {
                alert('Vui lòng nhập đầy đủ điểm đón và điểm đến!');
                return;
            }

            // Hiển thị phần bản đồ, chọn loại xe và nút Xác nhận đặt xe
            if (bookingMapSection) bookingMapSection.style.display = 'block';
            if (vehicleSelectionSection) vehicleSelectionSection.style.display = 'block';
            if (btnConfirmBooking) btnConfirmBooking.style.display = 'block';
            btnShowMapVehicles.style.display = 'none';

            // Khởi chạy vẽ bản đồ và đặt marker
            if (typeof window.initLeafletMap === 'function') {
                window.initLeafletMap();
            }
        });
    }
    
    // Xử lý sự kiện đổi phương thức thanh toán
    const paymentSelect = document.getElementById('payment-method-select');
    const paymentIcon = document.getElementById('payment-icon');
    if (paymentSelect && paymentIcon) {
        paymentSelect.addEventListener('change', function() {
            const val = this.value;
            if (val === 'Thẻ tín dụng') {
                paymentIcon.textContent = '💳';
            } else if (val === 'Ví điện tử') {
                paymentIcon.textContent = '📱';
            } else if (val === 'Ví MoMo') {
                paymentIcon.textContent = '🌸';
            } else {
                paymentIcon.textContent = '💵';
            }
        });
    }

    // Xử lý sự kiện áp dụng mã khuyến mãi
    const btnApplyPromo = document.getElementById('btn-apply-promo');
    const promoCodeInput = document.getElementById('promo-code-input');
    const promoMessage = document.getElementById('promo-message');

    if (btnApplyPromo && promoCodeInput && promoMessage) {
        btnApplyPromo.addEventListener('click', () => {
            const promoCode = promoCodeInput.value.trim().toUpperCase();
            if (!promoCode) {
                promoMessage.style.display = 'block';
                promoMessage.style.color = '#dc3545';
                promoMessage.textContent = 'Vui lòng nhập mã khuyến mãi!';
                return;
            }

            if (promoCode === 'RIDEBLUE') {
                window.activeDiscount = 0.20; // Giảm 20%
                promoMessage.style.display = 'block';
                promoMessage.style.color = '#28a745';
                promoMessage.textContent = 'Áp dụng mã RIDEBLUE thành công! Giảm 20%.';
            } else {
                window.activeDiscount = 0.0;
                promoMessage.style.display = 'block';
                promoMessage.style.color = '#dc3545';
                promoMessage.textContent = 'Mã khuyến mãi không hợp lệ!';
            }
            // Cập nhật lại giá hiển thị trên giao diện
            updatePriceEstimation();
        });
    }

    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener('click', async () => {
            const pickup = inputPickup ? inputPickup.value.trim() : '';
            const dropoff = inputDropoff ? inputDropoff.value.trim() : '';

            if (!pickup || !dropoff) {
                alert('Vui lòng nhập đầy đủ điểm đón và điểm đến!');
                return;
            }

            btnConfirmBooking.textContent = 'Đang xử lý...';
            btnConfirmBooking.disabled = true;

            try {
                const paymentMethod = paymentSelect ? paymentSelect.value : 'Tiền mặt';
                const payload = {
                    ma_nguoi_dung: parseInt(localStorage.getItem('user_id')) || 1,
                    diem_don: pickup,
                    diem_den: dropoff,
                    gia_tien: estimatePrice(pickup, dropoff),
                    phuong_thuc: paymentMethod
                };

                const response = await API.post('/customer/trip', payload);

                if (response.success) {
                    sessionStorage.setItem('current_trip_id', response.trip_id);
                    window.location.href = 'tracking.html';
                } else {
                    alert(response.message || 'Đặt xe thất bại. Vui lòng thử lại.');
                    btnConfirmBooking.textContent = 'Xác nhận đặt xe';
                    btnConfirmBooking.disabled = false;
                }
            } catch (error) {
                alert('Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.');
                btnConfirmBooking.textContent = 'Xác nhận đặt xe';
                btnConfirmBooking.disabled = false;
            }
        });
    }

    function estimatePrice(pickup, dropoff) {
        const selectedVehicle = document.querySelector('input[name="vehicle_type"]:checked');
        const vehicleVal = selectedVehicle ? selectedVehicle.value : 'bike';
        const priceEl = document.getElementById(`price-${vehicleVal}`);
        if (priceEl && priceEl.dataset.value) {
            return parseInt(priceEl.dataset.value);
        }
        return 50000; // Giá mặc định phòng hờ
    }
});
