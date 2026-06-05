/**
 * js/logout.js
 * Xử lý đăng xuất cho tất cả các role.
 */

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('.btn-logout, #btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUserRole');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_name');
            window.location.replace('/login.html');
        });
    });
});
