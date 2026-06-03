document.addEventListener('DOMContentLoaded', () => {
    // Gắn sự kiện đăng xuất cho tất cả các nút có class .btn-logout
    const logoutBtns = document.querySelectorAll('.btn-logout, #btn-logout');
    
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUserRole');
            window.location.replace('/login.html');
        });
    });
});
