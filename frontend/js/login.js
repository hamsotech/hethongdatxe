document.addEventListener('DOMContentLoaded', () => {
    // 1. Nếu đã đăng nhập thì tự chuyển hướng, bỏ qua trang này
    const role = localStorage.getItem('currentUserRole');
    if (role === 'driver') {
        window.location.replace('/driver/dashboard.html');
        return;
    } else if (role === 'admin') {
        window.location.replace('/admin/dashboard.html');
        return;
    }

    // 2. Xử lý sự kiện gửi form đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value; // Mật khẩu mock = 123456

            if(password !== '123456') {
                alert('Mật khẩu không đúng. Vui lòng nhập mật khẩu: 123456');
                return;
            }
            
            // Phân quyền dựa trên tài khoản (mock logic)
            let selectedRole = '';
            if (username === '0123456789' || username === 'driver') {
                selectedRole = 'driver';
            } else if (username === 'admin') {
                selectedRole = 'admin';
            } else {
                alert('Tài khoản không tồn tại! Thử sđt: "0123456789" (Tài xế) hoặc "admin" (Admin)');
                return;
            }

            // Lưu trạng thái đăng nhập
            localStorage.setItem('currentUserRole', selectedRole);

            // Chuyển hướng
            if (selectedRole === 'driver') {
                window.location.replace('/driver/dashboard.html');
            } else if (selectedRole === 'admin') {
                window.location.replace('/admin/dashboard.html');
            }
        });
    }
});
