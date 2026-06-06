/**
 * js/login.js
 * Xử lý đăng nhập thông thường (Mật khẩu), Đăng nhập bằng OTP (Passwordless), 
 * Quên mật khẩu xác thực OTP và điều hướng đa vai trò (Dual-role).
 */

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('currentUserRole');
    if (role === 'driver') { window.location.replace('/driver/dashboard.html'); return; }
    if (role === 'admin')  { window.location.replace('/admin/dashboard.html');  return; }

    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    let loginMode = 'password'; // 'password' hoặc 'otp'

    // TABS DOM
    const tabPassword = document.getElementById('tab-login-password');
    const tabOtp = document.getElementById('tab-login-otp');
    const passwordGroup = document.getElementById('login-password-group');
    const otpGroup = document.getElementById('login-otp-group');
    const optionsGroup = document.getElementById('login-options-group');
    const btnSendOtp = document.getElementById('btn-send-login-otp');
    const btnLoginSubmit = document.getElementById('btn-login-submit');

    const inputUsername = document.getElementById('login-username');
    const inputPassword = document.getElementById('login-password');
    const inputOtp = document.getElementById('login-otp');

    // Chuyển Tab Đăng nhập bằng Mật khẩu
    if (tabPassword) {
        tabPassword.addEventListener('click', () => {
            loginMode = 'password';
            tabPassword.style.fontWeight = '700';
            tabPassword.style.color = 'var(--color-blue)';
            tabPassword.style.borderBottom = '2px solid var(--color-blue)';

            tabOtp.style.fontWeight = '500';
            tabOtp.style.color = 'var(--color-text-muted)';
            tabOtp.style.borderBottom = 'none';

            if (passwordGroup) passwordGroup.style.display = 'block';
            if (optionsGroup) optionsGroup.style.display = 'flex';
            if (otpGroup) otpGroup.style.display = 'none';
            if (btnSendOtp) btnSendOtp.style.display = 'none';
            if (btnLoginSubmit) btnLoginSubmit.textContent = 'Đăng nhập';

            if (inputPassword) inputPassword.required = true;
            if (inputOtp) inputOtp.required = false;
        });
    }

    // Chuyển Tab Đăng nhập bằng OTP
    if (tabOtp) {
        tabOtp.addEventListener('click', () => {
            loginMode = 'otp';
            tabOtp.style.fontWeight = '700';
            tabOtp.style.color = 'var(--color-blue)';
            tabOtp.style.borderBottom = '2px solid var(--color-blue)';

            tabPassword.style.fontWeight = '500';
            tabPassword.style.color = 'var(--color-text-muted)';
            tabPassword.style.borderBottom = 'none';

            if (passwordGroup) passwordGroup.style.display = 'none';
            if (optionsGroup) optionsGroup.style.display = 'none';
            if (otpGroup) otpGroup.style.display = 'none'; // Chỉ hiện sau khi đã gửi OTP
            if (btnSendOtp) btnSendOtp.style.display = 'block';
            if (btnLoginSubmit) btnLoginSubmit.textContent = 'Đăng nhập bằng OTP';

            if (inputPassword) inputPassword.required = false;
            if (inputOtp) inputOtp.required = false;
        });
    }

    // Gửi mã OTP đăng nhập không mật khẩu
    if (btnSendOtp) {
        btnSendOtp.addEventListener('click', async () => {
            const username = inputUsername.value.trim();
            if (!username) { alert('Vui lòng nhập Email / Số điện thoại trước!'); return; }

            const originalText = btnSendOtp.textContent;
            btnSendOtp.textContent = 'Đang gửi mã...';
            btnSendOtp.disabled = true;

            try {
                const response = await fetch(`${window.location.origin}/api/auth/request-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: username, purpose: 'PASSWORDLESS_LOGIN' })
                });

                const data = await response.json();

                if (data.success) {
                    if (data.debug_otp) {
                        console.log(`[TEST MODE] Mã OTP đăng nhập là: ${data.debug_otp}`);
                        alert(`Mã OTP đã được gửi! (Chạy thử nghiệm: mã OTP là ${data.debug_otp}. Bạn cũng có thể xem mã này ở console trình duyệt hoặc console backend).`);
                    } else {
                        alert(data.message || 'Mã OTP đăng nhập đã được gửi tới email của bạn.');
                    }
                    if (otpGroup) otpGroup.style.display = 'block';
                    if (inputOtp) {
                        inputOtp.required = true;
                        inputOtp.focus();
                    }
                    btnSendOtp.textContent = 'Gửi lại mã';
                } else {
                    alert(data.message || 'Không thể gửi OTP đăng nhập.');
                }
            } catch (error) {
                console.error('Lỗi gửi OTP đăng nhập:', error);
                alert('Có lỗi xảy ra khi kết nối tới máy chủ.');
            } finally {
                btnSendOtp.disabled = false;
                if (btnSendOtp.textContent !== 'Gửi lại mã') {
                    btnSendOtp.textContent = originalText;
                }
            }
        });
    }

    // Submit form đăng nhập chính
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = inputUsername.value.trim();
        const submitBtn = btnLoginSubmit;

        submitBtn.textContent = 'Đang đăng nhập...';
        submitBtn.disabled = true;

        try {
            let url = '/api/auth/login';
            let payload = {};

            if (loginMode === 'password') {
                const password = inputPassword.value;
                payload = { email: username, mat_khau: password };
            } else {
                const otpVal = inputOtp.value.trim();
                if (otpVal.length !== 6) {
                    alert('Mã OTP đăng nhập phải có đúng 6 chữ số!');
                    submitBtn.textContent = 'Đăng nhập bằng OTP';
                    submitBtn.disabled = false;
                    return;
                }
                url = '/api/auth/login-otp';
                payload = { email: username, otp_code: otpVal };
            }

            const response = await fetch(`${window.location.origin}${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('access_token', data.token);
                sessionStorage.setItem('user_roles', JSON.stringify(data.roles));
                sessionStorage.setItem('all_users_info', JSON.stringify(data.all_users));

                function proceedWithRole(selectedRole) {
                    sessionStorage.setItem('currentUserRole', selectedRole);
                    const userInfo = data.all_users[selectedRole];
                    sessionStorage.setItem('user_name', userInfo.ten);
                    sessionStorage.setItem('user_email', userInfo.email);
                    if (userInfo.so_dien_thoai) {
                        sessionStorage.setItem('user_phone', userInfo.so_dien_thoai);
                    } else {
                        sessionStorage.removeItem('user_phone');
                    }

                    if (selectedRole === 'admin') {
                        sessionStorage.setItem('user_id', userInfo.ma_quan_tri);
                        window.location.replace('/admin/dashboard.html');
                    } else if (selectedRole === 'driver') {
                        sessionStorage.setItem('user_id', userInfo.ma_tai_xe);
                        window.location.replace('/driver/dashboard.html');
                    } else {
                        sessionStorage.setItem('user_id', userInfo.ma_nguoi_dung);
                        window.location.replace('/customer/dashboard.html');
                    }
                }

                if (data.roles.length > 1) {
                    const modal = document.getElementById('role-select-modal');
                    const optionsList = document.getElementById('role-options-list');
                    if (modal && optionsList) {
                        optionsList.innerHTML = '';
                        data.roles.forEach(r => {
                            const btn = document.createElement('button');
                            btn.className = 'btn btn--primary';
                            btn.style.width = '100%';
                            btn.style.padding = '0.75rem';
                            btn.style.fontSize = '1rem';
                            btn.style.margin = '5px 0';
                            
                            let roleText = 'Khách hàng';
                            if (r === 'driver') roleText = 'Tài xế';
                            if (r === 'admin') roleText = 'Quản trị viên';
                            
                            btn.textContent = roleText;
                            btn.addEventListener('click', () => {
                                proceedWithRole(r);
                            });
                            optionsList.appendChild(btn);
                        });
                        modal.style.display = 'flex';
                    } else {
                        proceedWithRole(data.role);
                    }
                } else {
                    proceedWithRole(data.role);
                }
            } else {
                alert(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
                submitBtn.textContent = loginMode === 'password' ? 'Đăng nhập' : 'Đăng nhập bằng OTP';
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            alert('Không thể kết nối tới server. Hãy chắc backend đang chạy tại port 5000.');
            submitBtn.textContent = loginMode === 'password' ? 'Đăng nhập' : 'Đăng nhập bằng OTP';
            submitBtn.disabled = false;
        }
    });

    // ==========================================
    // XỬ LÝ QUÊN MẬT KHẨU (XÁC THỰC OTP)
    // ==========================================
    const forgotLink = document.querySelector('.forgot-password');
    const forgotModal = document.getElementById('forgot-password-modal');
    const forgotForm = document.getElementById('forgot-password-form');
    const btnCloseForgot = document.getElementById('btn-close-forgot');
    const forgotSubtitle = document.getElementById('forgot-subtitle');
    const forgotEmailInput = document.getElementById('forgot-email');
    const forgotOtpFields = document.getElementById('forgot-otp-fields');
    const forgotOtpInput = document.getElementById('forgot-otp');
    const forgotNewPasswordInput = document.getElementById('forgot-new-password');
    const btnForgotSubmit = document.getElementById('btn-forgot-submit');

    let forgotState = 'email'; // 'email' hoặc 'otp'

    function resetForgotModal() {
        forgotState = 'email';
        if (forgotForm) forgotForm.reset();
        if (forgotEmailInput) {
            forgotEmailInput.style.display = 'block';
            forgotEmailInput.readOnly = false;
        }
        if (forgotOtpFields) forgotOtpFields.style.display = 'none';
        if (forgotOtpInput) forgotOtpInput.required = false;
        if (forgotNewPasswordInput) forgotNewPasswordInput.required = false;
        if (btnForgotSubmit) btnForgotSubmit.textContent = 'Gửi yêu cầu OTP';
        if (forgotSubtitle) forgotSubtitle.textContent = 'Vui lòng nhập Email / SĐT để nhận mã OTP khôi phục:';
    }

    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetForgotModal();
            forgotModal.style.display = 'flex';
            if (forgotEmailInput) forgotEmailInput.focus();
        });
    }

    if (btnCloseForgot && forgotModal) {
        btnCloseForgot.addEventListener('click', () => {
            forgotModal.style.display = 'none';
            resetForgotModal();
        });
    }

    if (forgotForm && forgotModal) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailVal = forgotEmailInput.value.trim();

            if (forgotState === 'email') {
                const originalBtnText = btnForgotSubmit.textContent;
                btnForgotSubmit.textContent = 'Đang yêu cầu OTP...';
                btnForgotSubmit.disabled = true;

                try {
                    const response = await fetch(`${window.location.origin}/api/auth/request-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailVal, purpose: 'FORGOT_PASSWORD' })
                    });

                    const data = await response.json();

                    if (data.success) {
                        if (data.debug_otp) {
                            console.log(`[TEST MODE] Mã OTP khôi phục mật khẩu là: ${data.debug_otp}`);
                            alert(`Mã OTP khôi phục đã được gửi! (Chạy thử nghiệm: mã OTP là ${data.debug_otp}. Bạn cũng có thể xem mã này ở console trình duyệt hoặc console backend).`);
                        } else {
                            alert(data.message || 'Mã OTP khôi phục mật khẩu đã được gửi tới email của bạn.');
                        }
                        
                        forgotState = 'otp';
                        forgotEmailInput.readOnly = true;
                        if (forgotOtpFields) forgotOtpFields.style.display = 'flex';
                        if (forgotOtpInput) {
                            forgotOtpInput.required = true;
                            forgotOtpInput.focus();
                        }
                        if (forgotNewPasswordInput) forgotNewPasswordInput.required = true;
                        if (btnForgotSubmit) btnForgotSubmit.textContent = 'Xác nhận & Đặt lại';
                        if (forgotSubtitle) forgotSubtitle.textContent = 'Vui lòng nhập mã OTP và mật khẩu mới:';
                    } else {
                        alert(data.message || 'Email hoặc số điện thoại không tồn tại trong hệ thống.');
                    }
                } catch (error) {
                    console.error('Lỗi gửi OTP quên mật khẩu:', error);
                    alert('Không thể kết nối đến máy chủ.');
                } finally {
                    btnForgotSubmit.disabled = false;
                    if (btnForgotSubmit.textContent !== 'Xác nhận & Đặt lại') {
                        btnForgotSubmit.textContent = originalBtnText;
                    }
                }
            } else {
                // Đang ở trạng thái xác thực OTP và đổi mật khẩu
                const otpVal = forgotOtpInput.value.trim();
                const newPass = forgotNewPasswordInput.value;

                if (otpVal.length !== 6) { alert('Mã OTP phải có đúng 6 chữ số!'); return; }
                if (newPass.length < 6) { alert('Mật khẩu mới phải có tối thiểu 6 ký tự!'); return; }

                const originalBtnText = btnForgotSubmit.textContent;
                btnForgotSubmit.textContent = 'Đang xử lý đặt lại...';
                btnForgotSubmit.disabled = true;

                try {
                    const response = await fetch(`${window.location.origin}/api/auth/reset-password-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: emailVal,
                            otp_code: otpVal,
                            new_password: newPass
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
                        forgotModal.style.display = 'none';
                        resetForgotModal();
                    } else {
                        alert(data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
                    }
                } catch (error) {
                    console.error('Lỗi đặt lại mật khẩu bằng OTP:', error);
                    alert('Có lỗi xảy ra khi xác thực OTP đặt lại mật khẩu.');
                } finally {
                    btnForgotSubmit.disabled = false;
                    btnForgotSubmit.textContent = originalBtnText;
                }
            }
        });
    }
});
