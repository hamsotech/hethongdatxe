/**
 * js/driver/profile.js
 * Quản lý thông tin cá nhân và phương tiện của tài xế đang đăng nhập.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.replace('/login.html'); return; }

    const allUsers = JSON.parse(localStorage.getItem('all_users_info') || '{}');
    const driverInfo = allUsers['driver'];

    if (driverInfo) {
        const profileName = document.getElementById('profile-name');
        const profilePhone = document.getElementById('profile-phone');
        
        // Cập nhật Tên và SĐT tài xế
        if (profileName) profileName.textContent = driverInfo.ten || 'Tài xế';
        if (profilePhone) profilePhone.textContent = driverInfo.so_dien_thoai || 'Chưa cập nhật';

        // Cập nhật thông tin phương tiện thực tế
        const vehicleSection = document.querySelector('.content-section');
        if (vehicleSection) {
            const listItems = vehicleSection.querySelectorAll('.list-item');
            if (listItems.length >= 2) {
                const vehicleTypeEl = listItems[0].querySelector('strong');
                const vehiclePlateEl = listItems[1].querySelector('strong');
                if (vehicleTypeEl) vehicleTypeEl.textContent = driverInfo.loai_xe || 'Xe máy';
                if (vehiclePlateEl) vehiclePlateEl.textContent = driverInfo.bien_so || 'N/A';
            }
        }
    }
});
