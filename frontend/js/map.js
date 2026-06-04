<<<<<<< Updated upstream
/**
 * js/map.js
 * Xử lý bản đồ hiển thị cho toàn bộ luồng Khách hàng sử dụng thư viện Leaflet (Miễn phí, không cần API Key)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tự động kiểm tra và chèn CDN thư viện Leaflet vào HTML nếu trang chưa có sẵn
    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }
    
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = false;
        script.onload = initMap; // Đợi thư viện tải xong thì khởi tạo bản đồ
        document.head.appendChild(script);
    } else {
        initMap();
    }

    function initMap() {
        // Tọa độ mặc định khi khởi tạo (Ví dụ trung tâm TP.HCM: 10.762622, 106.660172)
        const defaultLat = 10.762622;
        const defaultLng = 10.660172;
        
        // ==========================================
        // 1. CẤU HÌNH CHO TRANG CHỦ (dashboard.html)
        // ==========================================
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = ''; // Xóa dòng chữ placeholder cũ đi
            
            const map = L.map('map-container').setView([defaultLat, defaultLng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            
            // Ghim một marker định vị vị trí hiện tại của khách
            L.marker([defaultLat, defaultLng]).addTo(map)
                .bindPopup('Vị trí hiện tại của bạn')
                .openPopup();
        }

        // ==========================================
        // 2. CẤU HÌNH CHO TRANG ĐẶT XE (book_ride.html)
        // ==========================================
        const bookingMap = document.getElementById('booking-map');
        if (bookingMap) {
            bookingMap.innerHTML = '';
            
            const map = L.map('booking-map').setView([defaultLat, defaultLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Tạo 2 marker có thể cầm chuột kéo đi được (draggable) để chọn vị trí trực quan
            const markerPickup = L.marker([defaultLat, defaultLng], {draggable: true}).addTo(map).bindPopup('Điểm đón (Kéo để chọn)');
            const markerDropoff = L.marker([defaultLat + 0.008, defaultLng + 0.008], {draggable: true}).addTo(map).bindPopup('Điểm đến (Kéo để chọn)');
            
            // Lắng nghe sự kiện kéo thả để tự động điền tọa độ vào ô nhập liệu ô input của bạn
            markerPickup.on('dragend', function() {
                const position = markerPickup.getLatLng();
                const inputPickup = document.getElementById('pickup-location');
                if (inputPickup) inputPickup.value = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
            });

            markerDropoff.on('dragend', function() {
                const position = markerDropoff.getLatLng();
                const inputDropoff = document.getElementById('dropoff-location');
                if (inputDropoff) inputDropoff.value = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
            });
        }

        // ==========================================
        // 3. CẤU HÌNH CHO TRANG THEO DÕI (tracking.html)
        // ==========================================
        const trackingMap = document.getElementById('tracking-map');
        if (trackingMap) {
            trackingMap.innerHTML = '';
            
            const map = L.map('tracking-map').setView([defaultLat, defaultLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Marker đại diện cho Khách và Tài xế
            const customerMarker = L.marker([defaultLat, defaultLng]).addTo(map).bindPopup('Bạn đang ở đây');
            const driverMarker = L.marker([defaultLat - 0.004, defaultLng - 0.004]).addTo(map).bindPopup('Tài xế đang di chuyển đến');
            
            // Tạo một hàm toàn cục để file tracking.js gọi cập nhật vị trí khi nhận tín hiệu từ Realtime Server
            window.updateDriverLocationOnMap = function(lat, lng) {
                if (driverMarker) {
                    driverMarker.setLatLng([lat, lng]); // Di chuyển marker tài xế
                    
                    // Tự động căn góc để bản đồ bao quát nhìn thấy cả khách lẫn tài xế
                    const group = new L.featureGroup([customerMarker, driverMarker]);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            };
        }
    }
=======
/**
 * js/map.js
 * Xử lý bản đồ hiển thị cho toàn bộ luồng Khách hàng sử dụng thư viện Leaflet (Miễn phí, không cần API Key)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tự động kiểm tra và chèn CDN thư viện Leaflet vào HTML nếu trang chưa có sẵn
    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }
    
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = false;
        script.onload = initMap; // Đợi thư viện tải xong thì khởi tạo bản đồ
        document.head.appendChild(script);
    } else {
        initMap();
    }

    function initMap() {
        // Tọa độ mặc định khi khởi tạo (Ví dụ trung tâm TP.HCM: 10.762622, 106.660172)
        const defaultLat = 10.762622;
        const defaultLng = 10.660172;
        
        // ==========================================
        // 1. CẤU HÌNH CHO TRANG CHỦ (dashboard.html)
        // ==========================================
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = ''; // Xóa dòng chữ placeholder cũ đi
            
            const map = L.map('map-container').setView([defaultLat, defaultLng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            
            // Ghim một marker định vị vị trí hiện tại của khách
            L.marker([defaultLat, defaultLng]).addTo(map)
                .bindPopup('Vị trí hiện tại của bạn')
                .openPopup();
        }

        // ==========================================
        // 2. CẤU HÌNH CHO TRANG ĐẶT XE (book_ride.html)
        // ==========================================
        const bookingMap = document.getElementById('booking-map');
        if (bookingMap) {
            bookingMap.innerHTML = '';
            
            const map = L.map('booking-map').setView([defaultLat, defaultLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Tạo 2 marker có thể cầm chuột kéo đi được (draggable) để chọn vị trí trực quan
            const markerPickup = L.marker([defaultLat, defaultLng], {draggable: true}).addTo(map).bindPopup('Điểm đón (Kéo để chọn)');
            const markerDropoff = L.marker([defaultLat + 0.008, defaultLng + 0.008], {draggable: true}).addTo(map).bindPopup('Điểm đến (Kéo để chọn)');
            
            // Lắng nghe sự kiện kéo thả để tự động điền tọa độ vào ô nhập liệu ô input của bạn
            markerPickup.on('dragend', function() {
                const position = markerPickup.getLatLng();
                const inputPickup = document.getElementById('pickup-location');
                if (inputPickup) inputPickup.value = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
            });

            markerDropoff.on('dragend', function() {
                const position = markerDropoff.getLatLng();
                const inputDropoff = document.getElementById('dropoff-location');
                if (inputDropoff) inputDropoff.value = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
            });
        }

        // ==========================================
        // 3. CẤU HÌNH CHO TRANG THEO DÕI (tracking.html)
        // ==========================================
        const trackingMap = document.getElementById('tracking-map');
        if (trackingMap) {
            trackingMap.innerHTML = '';
            
            const map = L.map('tracking-map').setView([defaultLat, defaultLng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Marker đại diện cho Khách và Tài xế
            const customerMarker = L.marker([defaultLat, defaultLng]).addTo(map).bindPopup('Bạn đang ở đây');
            const driverMarker = L.marker([defaultLat - 0.004, defaultLng - 0.004]).addTo(map).bindPopup('Tài xế đang di chuyển đến');
            
            // Tạo một hàm toàn cục để file tracking.js gọi cập nhật vị trí khi nhận tín hiệu từ Realtime Server
            window.updateDriverLocationOnMap = function(lat, lng) {
                if (driverMarker) {
                    driverMarker.setLatLng([lat, lng]); // Di chuyển marker tài xế
                    
                    // Tự động căn góc để bản đồ bao quát nhìn thấy cả khách lẫn tài xế
                    const group = new L.featureGroup([customerMarker, driverMarker]);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            };
        }
    }
>>>>>>> Stashed changes
});