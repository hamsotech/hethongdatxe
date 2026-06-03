document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra trạng thái nếu đã đăng nhập thì về trang chủ
    const role = localStorage.getItem('currentUserRole');
    if (role === 'driver') {
        window.location.replace('/driver/dashboard.html');
        return;
    } else if (role === 'admin') {
        window.location.replace('/admin/dashboard.html');
        return;
    }

    // 2. Xử lý form đăng ký
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const name = document.getElementById('reg-name').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if(password !== confirm) {
                alert('Mật khẩu xác nhận không khớp! Vui lòng thử lại.');
                return;
            }

            if(phone.length < 9) {
                alert('Số điện thoại không hợp lệ!');
                return;
            }

            // Gọi logic Đăng ký (mock)
            alert(`Đăng ký thành công cho khách hàng ${name} (SĐT: ${phone}).\nBây giờ bạn có thể đăng nhập vào hệ thống.`);
            
            // Chuyển về trang đăng nhập
            window.location.replace('/login.html');
        });
    }
});
