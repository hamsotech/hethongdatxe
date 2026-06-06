/**
 * js/map.js
 * Xử lý bản đồ Leaflet cho toàn bộ luồng Khách hàng.
 */

document.addEventListener('DOMContentLoaded', () => {
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
        script.onload = () => {
            if (document.getElementById('tracking-map') || document.getElementById('main-map') || document.getElementById('booking-map') || document.getElementById('map-container')) {
                window.initLeafletMap();
            }
        };
        document.head.appendChild(script);
    } else {
        if (document.getElementById('tracking-map') || document.getElementById('main-map') || document.getElementById('booking-map') || document.getElementById('map-container')) {
            window.initLeafletMap();
        }
    }

    // Helper: Gọi Nominatim có lưu cache vào sessionStorage để giảm lag & chống rate-limit
    window.cachedFetch = async function(url, options = {}) {
        if (url.includes('nominatim.openstreetmap.org')) {
            const cacheKey = 'geo_cache_' + url;
            const cached = sessionStorage.getItem(cacheKey);
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
                    sessionStorage.setItem(cacheKey, text);
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
                
                // Trường hợp reverse geocode
                if (lowerUrl.includes('/reverse')) {
                    let lat = 10.776889, lng = 106.700806;
                    try {
                        const urlObj = new URL(url);
                        lat = parseFloat(urlObj.searchParams.get('lat')) || lat;
                        lng = parseFloat(urlObj.searchParams.get('lon')) || lng;
                    } catch (err) {}
                    
                    let mockName = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    if (Math.abs(lat - 10.754026) < 0.005 && Math.abs(lng - 106.663375) < 0.005) {
                        mockName = 'Nguyễn Trãi, Quận 5, TP.HCM';
                    } else if (Math.abs(lat - 10.779786) < 0.005 && Math.abs(lng - 106.699018) < 0.005) {
                        mockName = 'Nhà thờ Đức Bà, Quận 1, TP.HCM';
                    } else if (Math.abs(lat - 10.844199) < 0.005 && Math.abs(lng - 106.792557) < 0.005) {
                        mockName = 'Khu Công nghệ cao, Quận 9, TP.HCM';
                    } else if (Math.abs(lat - 10.801646) < 0.005 && Math.abs(lng - 106.698711) < 0.005) {
                        mockName = 'Bình Thạnh, TP.HCM';
                    } else if (Math.abs(lat - 10.799201) < 0.005 && Math.abs(lng - 106.680287) < 0.005) {
                        mockName = 'Phú Nhuận, TP.HCM';
                    }
                    
                    const mockData = { display_name: mockName, lat: lat.toString(), lon: lng.toString() };
                    return {
                        json: async () => mockData,
                        ok: true,
                        text: async () => JSON.stringify(mockData)
                    };
                }

                // Trường hợp forward geocode (search)
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
    };

    // Helper: Dịch toạ độ sang địa chỉ chữ dùng Nominatim API (miễn phí)
    async function getAddressFromCoords(lat, lng) {
        try {
            const response = await window.cachedFetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const data = await response.json();
            return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch (error) {
            console.error("Lỗi geocode ngược:", error);
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    }

    // Helper: Lấy lộ trình đường đi thực tế từ OSRM API (miễn phí, bám theo đường bộ)
    window.getRoutingOSRM = async function(lat1, lng1, lat2, lng2) {
        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return {
                    coordinates: data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]), // Chuyển [lng, lat] thành [lat, lng]
                    distance: data.routes[0].distance, // mét
                    duration: data.routes[0].duration  // giây
                };
            }
        } catch (error) {
            console.error("Lỗi lấy lộ trình OSRM:", error);
        }
        return null;
    };

    window.initLeafletMap = function() {
        const defaultLat = 10.762622;
        const defaultLng = 106.660172;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setupMaps(lat, lng);
                },
                (error) => {
                    console.warn("Lỗi định vị, sử dụng mặc định:", error);
                    setupMaps(defaultLat, defaultLng);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setupMaps(defaultLat, defaultLng);
        }
    };

    function setupMaps(lat, lng) {
        // Trang chủ khách hàng (dashboard.html)
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = '';
            // Giải phóng bản đồ cũ để tránh lỗi container already initialized
            if (window.homeMapObj) {
                try { window.homeMapObj.remove(); } catch(e) { console.error(e); }
                window.homeMapObj = null;
            }
            const map = L.map('map-container').setView([lat, lng], 15);
            window.homeMapObj = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            L.marker([lat, lng]).addTo(map)
                .bindPopup('Vị trí của bạn').openPopup();
        }

        // Trang đặt xe (book_ride.html)
        const bookingMap = document.getElementById('booking-map');
        if (bookingMap) {
            bookingMap.innerHTML = '';
            // Giải phóng bản đồ đặt xe cũ
            if (window.bookingMapObj) {
                try { window.bookingMapObj.remove(); } catch(e) { console.error(e); }
                window.bookingMapObj = null;
                window.bookingRoutePolyline = null;
            }
            
            const inputPickup = document.getElementById('pickup-location');
            const inputDropoff = document.getElementById('dropoff-location');
            
            let pickupLat = lat;
            let pickupLng = lng;
            if (inputPickup && inputPickup.dataset.lat && inputPickup.dataset.lng) {
                pickupLat = parseFloat(inputPickup.dataset.lat);
                pickupLng = parseFloat(inputPickup.dataset.lng);
            }
            
            let dropoffLat = lat + 0.008;
            let dropoffLng = lng + 0.008;
            if (inputDropoff && inputDropoff.dataset.lat && inputDropoff.dataset.lng) {
                dropoffLat = parseFloat(inputDropoff.dataset.lat);
                dropoffLng = parseFloat(inputDropoff.dataset.lng);
            }

            const greenIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            const map = L.map('booking-map').setView([pickupLat, pickupLng], 14);
            window.bookingMapObj = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            const markerPickup = L.marker([pickupLat, pickupLng], { draggable: true, icon: greenIcon })
                .addTo(map).bindPopup('Điểm đón (Kéo để chọn)').openPopup();
            const markerDropoff = L.marker([dropoffLat, dropoffLng], { draggable: true, icon: redIcon })
                .addTo(map).bindPopup('Điểm đến (Kéo để chọn)');

            window.markerPickup = markerPickup;
            window.markerDropoff = markerDropoff;

            // Hàm vẽ/cập nhật đường tuyến đường thực tế uốn lượn OSRM
            window.updateBookingRoutePolyline = function() {
                if (!map || !markerPickup || !markerDropoff) return;
                const pPos = markerPickup.getLatLng();
                const dPos = markerDropoff.getLatLng();
                
                if (!window.bookingRoutePolyline) {
                    window.bookingRoutePolyline = L.polyline([pPos, dPos], {
                        color: '#00b14f', // Màu xanh Grab
                        weight: 5,
                        opacity: 0.8,
                        dashArray: '10, 10'
                    }).addTo(map);
                }

                // Gọi OSRM API để lấy đường thực tế uốn lượn
                window.getRoutingOSRM(pPos.lat, pPos.lng, dPos.lat, dPos.lng).then(route => {
                    let distanceKm = 0;
                    if (route && route.coordinates.length > 0) {
                        window.bookingRoutePolyline.setLatLngs(route.coordinates);
                        distanceKm = route.distance / 1000;
                        map.fitBounds(route.coordinates, { padding: [50, 50] });
                    } else {
                        // Fallback straight line
                        const straightLine = [pPos, dPos];
                        window.bookingRoutePolyline.setLatLngs(straightLine);
                        
                        // Tính khoảng cách Haversine
                        const R = 6371;
                        const dLat = (dPos.lat - pPos.lat) * Math.PI / 180;
                        const dLon = (dPos.lng - pPos.lng) * Math.PI / 180;
                        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                  Math.cos(pPos.lat * Math.PI / 180) * Math.cos(dPos.lat * Math.PI / 180) * 
                                  Math.sin(dLon/2) * Math.sin(dLon/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        distanceKm = R * c;
                        
                        map.fitBounds(straightLine, { padding: [50, 50] });
                    }

                    // Cập nhật text hiển thị khoảng cách lên màn hình đặt xe
                    const distEl = document.getElementById('route-distance-text');
                    if (distEl) {
                        distEl.textContent = `Khoảng cách: ${distanceKm.toFixed(1)} km`;
                    }

                    // Cập nhật giá xe dựa trên quãng đường thực tế
                    if (typeof window.updatePricesWithDistance === 'function') {
                        window.updatePricesWithDistance(distanceKm);
                    }
                });
            };

            window.updateBookingRoutePolyline();

            // Thiết lập giá trị toạ độ dataset
            if (inputPickup) {
                inputPickup.dataset.lat = pickupLat;
                inputPickup.dataset.lng = pickupLng;
                if (!inputPickup.value || inputPickup.value.includes(",")) {
                    inputPickup.value = "Đang tải địa chỉ...";
                    getAddressFromCoords(pickupLat, pickupLng).then(addr => {
                        inputPickup.value = addr;
                    });
                }
            }
            if (inputDropoff) {
                inputDropoff.dataset.lat = dropoffLat;
                inputDropoff.dataset.lng = dropoffLng;
                if (!inputDropoff.value || inputDropoff.value.includes(",")) {
                    inputDropoff.value = "Đang tải địa chỉ...";
                    getAddressFromCoords(dropoffLat, dropoffLng).then(addr => {
                        inputDropoff.value = addr;
                    });
                }
            }
            
            // Tính toán lại giá xe ban đầu
            setTimeout(() => {
                if (typeof window.updatePriceEstimation === 'function') {
                    window.updatePriceEstimation();
                }
            }, 500);

            // Cập nhật đường nối và thông tin địa chỉ trong thời gian thực khi kéo
            markerPickup.on('drag', window.updateBookingRoutePolyline);
            markerDropoff.on('drag', window.updateBookingRoutePolyline);

            markerPickup.on('dragend', function(e) {
                window.updateBookingRoutePolyline();
                const pos = e.target.getLatLng();
                if (inputPickup) {
                    inputPickup.dataset.lat = pos.lat;
                    inputPickup.dataset.lng = pos.lng;
                    inputPickup.value = "Đang tải địa chỉ...";
                    getAddressFromCoords(pos.lat, pos.lng).then(addr => {
                        inputPickup.value = addr;
                        if (typeof window.updatePriceEstimation === 'function') {
                            window.updatePriceEstimation();
                        }
                    });
                }
            });
            markerDropoff.on('dragend', function(e) {
                window.updateBookingRoutePolyline();
                const pos = e.target.getLatLng();
                if (inputDropoff) {
                    inputDropoff.dataset.lat = pos.lat;
                    inputDropoff.dataset.lng = pos.lng;
                    inputDropoff.value = "Đang tải địa chỉ...";
                    getAddressFromCoords(pos.lat, pos.lng).then(addr => {
                        inputDropoff.value = addr;
                        if (typeof window.updatePriceEstimation === 'function') {
                            window.updatePriceEstimation();
                        }
                    });
                }
            });
        }

        // Trang tracking (tracking.html)
        const trackingMap = document.getElementById('tracking-map');
        if (trackingMap) {
            trackingMap.innerHTML = '';
            // Giải phóng bản đồ tracking cũ
            if (window.trackingMapObj) {
                try { window.trackingMapObj.remove(); } catch(e) { console.error(e); }
                window.trackingMapObj = null;
                window.trackingPickupMarker = null;
                window.trackingDropoffMarker = null;
                window.trackingRoutePolyline = null;
            }
            
            const map = L.map('tracking-map').setView([lat, lng], 14);
            window.trackingMapObj = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const greenIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            const customerMarker = L.marker([lat, lng]).addTo(map).bindPopup('Bạn đang ở đây');
            const driverMarker = L.marker([lat - 0.003, lng - 0.003]).addTo(map).bindPopup('Tài xế đang di chuyển đến');

            window.trackingDriverMarker = driverMarker;

            // Vẽ lộ trình đứt xanh lá và marker điểm đón/đến của chuyến đi hiện tại
            async function drawActiveTripOnTrackingMap() {
                const pickupAddr = sessionStorage.getItem('customer_active_trip_pickup');
                const dropAddr = sessionStorage.getItem('customer_active_trip_drop');

                if (!pickupAddr || !dropAddr) return;

                try {
                    // Phân giải điểm đón sang tọa độ
                    const resPickup = await window.cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddr)}&limit=1`, {
                        headers: { 'User-Agent': 'RideConnect-App' }
                    });
                    const dataPickup = await resPickup.json();

                    // Phân giải điểm đến sang tọa độ
                    const resDrop = await window.cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropAddr)}&limit=1`, {
                        headers: { 'User-Agent': 'RideConnect-App' }
                    });
                    const dataDrop = await resDrop.json();

                    const markers = [[lat, lng]];
                    let pLat = lat, pLng = lng;
                    let dLat = lat + 0.008, dLng = lng + 0.008;
                    let hasPickup = false, hasDrop = false;

                    if (dataPickup && dataPickup.length > 0) {
                        pLat = parseFloat(dataPickup[0].lat);
                        pLng = parseFloat(dataPickup[0].lon);
                        
                        if (window.trackingPickupMarker) map.removeLayer(window.trackingPickupMarker);
                        
                        window.trackingPickupMarker = L.marker([pLat, pLng], { icon: greenIcon })
                            .addTo(map).bindPopup('Điểm đón').openPopup();
                        markers.push([pLat, pLng]);
                        customerMarker.setLatLng([pLat, pLng]);
                        hasPickup = true;
                    }

                    if (dataDrop && dataDrop.length > 0) {
                        dLat = parseFloat(dataDrop[0].lat);
                        dLng = parseFloat(dataDrop[0].lon);
                        
                        if (window.trackingDropoffMarker) map.removeLayer(window.trackingDropoffMarker);
                        
                        window.trackingDropoffMarker = L.marker([dLat, dLng], { icon: redIcon })
                            .addTo(map).bindPopup('Điểm đến');
                        markers.push([dLat, dLng]);
                        hasDrop = true;
                    }

                    // Gọi OSRM vẽ đường bám theo mạng lưới đường bộ uốn lượn thực tế
                    if (hasPickup && hasDrop) {
                        if (window.trackingRoutePolyline) map.removeLayer(window.trackingRoutePolyline);

                        window.getRoutingOSRM(pLat, pLng, dLat, dLng).then(route => {
                            if (route && route.coordinates.length > 0) {
                                window.trackingRoutePolyline = L.polyline(route.coordinates, {
                                    color: '#00b14f', // Màu xanh Grab
                                    weight: 5,
                                    opacity: 0.8,
                                    dashArray: '10, 10'
                                }).addTo(map);
                                map.fitBounds(route.coordinates, { padding: [50, 50] });
                            } else {
                                // Fallback
                                window.trackingRoutePolyline = L.polyline([[pLat, pLng], [dLat, dLng]], {
                                    color: '#00b14f',
                                    weight: 5,
                                    opacity: 0.8,
                                    dashArray: '10, 10'
                                }).addTo(map);
                                map.fitBounds([[pLat, pLng], [dLat, dLng]], { padding: [50, 50] });
                            }
                        });
                    } else {
                        if (markers.length > 1) {
                            map.fitBounds(markers, { padding: [50, 50] });
                        }
                    }
                } catch (e) {
                    console.error("Lỗi vẽ lộ trình tracking khách hàng:", e);
                }
            }

            drawActiveTripOnTrackingMap();

            // Lắng nghe cập nhật vị trí tài xế qua Socket.IO (dùng SocketManager)
            if (typeof SocketManager !== 'undefined') {
                SocketManager.listen('driver_location_updated', function(data) {
                    if (data.location) {
                        driverMarker.setLatLng([data.location.lat, data.location.lng]);
                        // Zoom tự động hiển thị cả khách hàng và tài xế
                        const curBounds = L.latLngBounds([
                            customerMarker.getLatLng(),
                            driverMarker.getLatLng()
                        ]);
                        map.fitBounds(curBounds, { padding: [50, 50] });
                    }
                });
            }
        }

        // Trang chủ tài xế (driver/dashboard.html)
        const mainMap = document.getElementById('main-map');
        if (mainMap) {
            let driverMapContainer = document.getElementById('driver-map-leaflet');
            if (!driverMapContainer) {
                const radarWave = document.getElementById('radar-wave');
                if (radarWave) radarWave.style.display = 'none';
                const mapStatusText = document.getElementById('map-status-text');
                if (mapStatusText) mapStatusText.style.display = 'none';

                driverMapContainer = document.createElement('div');
                driverMapContainer.id = 'driver-map-leaflet';
                driverMapContainer.style.width = '100%';
                driverMapContainer.style.height = '100%';
                driverMapContainer.style.zIndex = '1';
                mainMap.appendChild(driverMapContainer);
            }

            driverMapContainer.innerHTML = '';
            // Giải phóng bản đồ cũ của tài xế
            if (window.driverMapObj) {
                try { window.driverMapObj.remove(); } catch(e) { console.error(e); }
                window.driverMapObj = null;
                window.pickupMapMarker = null;
                window.dropoffMapMarker = null;
                window.driverRoutePolyline = null;
            }

            const map = L.map('driver-map-leaflet').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const driverMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup('Bạn đang ở đây (Tài xế)').openPopup();

            window.driverMapObj = map;
            window.driverLocationMarker = driverMarker;

            // Nếu có chuyến đi, vẽ ngay điểm đón và điểm đến của chuyến đi
            setTimeout(() => {
                if (typeof window.drawActiveTripOnDriverMap === 'function') {
                    window.drawActiveTripOnDriverMap();
                }
            }, 500);
        }
    }

    // Vẽ điểm đón & điểm đến của chuyến đi hiện tại trên bản đồ tài xế
    window.drawActiveTripOnDriverMap = async function() {
        if (!window.driverMapObj) return;

        const pickupAddr = sessionStorage.getItem('driver_active_trip_pickup');
        const dropAddr = sessionStorage.getItem('driver_active_trip_drop');

        if (!pickupAddr || !dropAddr) return;

        try {
            // Xoá các marker cũ nếu có
            if (window.pickupMapMarker) window.driverMapObj.removeLayer(window.pickupMapMarker);
            if (window.dropoffMapMarker) window.driverMapObj.removeLayer(window.dropoffMapMarker);

            // Phân giải điểm đón sang tọa độ qua Nominatim
            const resPickup = await window.cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddr)}&limit=1`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const dataPickup = await resPickup.json();

            // Phân giải điểm đến sang tọa độ qua Nominatim
            const resDrop = await window.cachedFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropAddr)}&limit=1`, {
                headers: { 'User-Agent': 'RideConnect-App' }
            });
            const dataDrop = await resDrop.json();

            const markers = [];
            let pLat = 0, pLng = 0, dLat = 0, dLng = 0;
            let hasPickup = false, hasDrop = false;

            if (window.driverLocationMarker) {
                markers.push(window.driverLocationMarker.getLatLng());
            }

            if (dataPickup && dataPickup.length > 0) {
                pLat = parseFloat(dataPickup[0].lat);
                pLng = parseFloat(dataPickup[0].lon);
                window.pickupMapMarker = L.marker([pLat, pLng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(window.driverMapObj).bindPopup('Khách hàng (Điểm đón)').openPopup();
                markers.push([pLat, pLng]);
                hasPickup = true;
            }

            if (dataDrop && dataDrop.length > 0) {
                dLat = parseFloat(dataDrop[0].lat);
                dLng = parseFloat(dataDrop[0].lon);
                window.dropoffMapMarker = L.marker([dLat, dLng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(window.driverMapObj).bindPopup('Điểm đến');
                markers.push([dLat, dLng]);
                hasDrop = true;
            }

            // Gọi OSRM vẽ đường uốn lượn đường bộ thực tế trên map tài xế
            if (hasPickup && hasDrop) {
                if (window.driverRoutePolyline) window.driverMapObj.removeLayer(window.driverRoutePolyline);

                window.getRoutingOSRM(pLat, pLng, dLat, dLng).then(route => {
                    if (route && route.coordinates.length > 0) {
                        window.driverRoutePolyline = L.polyline(route.coordinates, {
                            color: '#00b14f', // Màu xanh Grab
                            weight: 5,
                            opacity: 0.8,
                            dashArray: '10, 10'
                        }).addTo(window.driverMapObj);
                        
                        // Căn chỉnh bounds bao quát cả tài xế và lộ trình đi
                        const pathLatLngs = [...route.coordinates];
                        if (window.driverLocationMarker) pathLatLngs.push(window.driverLocationMarker.getLatLng());
                        window.driverMapObj.fitBounds(pathLatLngs, { padding: [40, 40] });
                    } else {
                        // Fallback straight line
                        window.driverRoutePolyline = L.polyline([[pLat, pLng], [dLat, dLng]], {
                            color: '#00b14f',
                            weight: 5,
                            opacity: 0.8,
                            dashArray: '10, 10'
                        }).addTo(window.driverMapObj);
                        window.driverMapObj.fitBounds(markers, { padding: [40, 40] });
                    }
                });
            } else {
                if (markers.length > 1) {
                    window.driverMapObj.fitBounds(markers, { padding: [40, 40] });
                }
            }
        } catch (error) {
            console.error("Lỗi khi vẽ toạ độ chuyến đi lên map tài xế:", error);
        }
    };

    // Xóa chuyến đi hiện tại khỏi bản đồ tài xế
    window.clearActiveTripFromDriverMap = function() {
        if (!window.driverMapObj) return;
        if (window.pickupMapMarker) { window.driverMapObj.removeLayer(window.pickupMapMarker); window.pickupMapMarker = null; }
        if (window.dropoffMapMarker) { window.driverMapObj.removeLayer(window.dropoffMapMarker); window.dropoffMapMarker = null; }
        if (window.driverRoutePolyline) { window.driverMapObj.removeLayer(window.driverRoutePolyline); window.driverRoutePolyline = null; }

        if (window.driverLocationMarker) {
            const pos = window.driverLocationMarker.getLatLng();
            window.driverMapObj.setView(pos, 15);
            window.driverLocationMarker.openPopup();
        }
    };
});
