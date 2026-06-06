/**
 * js/logout.js
 * Xử lý đăng xuất cho tất cả các role.
 */

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('.btn-logout, #btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentUserRole');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('user_id');
            sessionStorage.removeItem('user_name');
            window.location.replace('/login.html');
        });
    });
});
