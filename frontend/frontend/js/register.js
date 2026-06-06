/**
 * js/register.js
 * Xử lý đăng ký tài khoản, xác thực OTP trước khi gửi thông tin lên backend.
 */

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('currentUserRole');
    if (role === 'driver') { window.location.replace('/driver/dashboard.html'); return; }
    if (role === 'admin')  { window.location.replace('/admin/dashboard.html');  return; }

    const registerForm = document.getElementById('register-form');
    const otpModal = document.getElementById('otp-modal');
    const otpForm = document.getElementById('otp-form');
    const otpInput = document.getElementById('otp-input');
    const btnCancelOtp = document.getElementById('btn-cancel-otp');
    const otpSubtitle = document.getElementById('otp-subtitle');

    if (!registerForm) return;

    let registrationData = {};

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name     = document.getElementById('reg-name').value.trim();
        const phone    = document.getElementById('reg-phone').value.trim();
        const email    = document.getElementById('reg-email') ? document.getElementById('reg-email').value.trim() : phone + '@rideconnect.vn';
        const password = document.getElementById('reg-password').value;
        const confirm  = document.getElementById('reg-confirm').value;

        if (password !== confirm) { alert('Mật khẩu xác nhận không khớp!'); return; }
        if (phone.length < 9)     { alert('Số điện thoại không hợp lệ!'); return; }

        registrationData = {
            ten: name,
            so_dien_thoai: phone,
            email: email,
            mat_khau: password
        };

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Đang gửi mã...';
        submitBtn.disabled = true;

        try {
            // Yêu cầu gửi OTP
            const response = await fetch(`${window.location.origin}/api/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, purpose: 'REGISTER' })
            });

            const data = await response.json();

            if (data.success) {
                // Hiển thị mã debug ở console để tiện test
                if (data.debug_otp) {
                    console.log(`[TEST MODE] Mã OTP đăng ký của bạn là: ${data.debug_otp}`);
                    alert(`Mã OTP đã được gửi! (Chạy thử nghiệm: mã OTP là ${data.debug_otp}. Bạn cũng có thể xem mã này ở console trình duyệt hoặc console backend).`);
                }
                
                if (otpSubtitle) {
                    otpSubtitle.textContent = `Mã xác thực OTP đã được gửi tới ${email}. Vui lòng nhập để tiếp tục.`;
                }
                otpModal.style.display = 'flex';
                if (otpInput) otpInput.focus();
            } else {
                alert(data.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin.');
                submitBtn.textContent = 'Đăng ký';
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi yêu cầu OTP:', error);
            alert('Không thể kết nối tới server. Hãy chắc backend đang chạy tại port 5000.');
            submitBtn.textContent = 'Đăng ký';
            submitBtn.disabled = false;
        }
    });

    if (btnCancelOtp && otpModal) {
        btnCancelOtp.addEventListener('click', () => {
            otpModal.style.display = 'none';
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Đăng ký';
                submitBtn.disabled = false;
            }
        });
    }

    if (otpForm && otpModal) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const otpVal = otpInput.value.trim();
            if (otpVal.length !== 6) { alert('Mã OTP phải có đúng 6 chữ số!'); return; }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const verifySubmitBtn = otpForm.querySelector('button[type="submit"]');
            if (verifySubmitBtn) {
                verifySubmitBtn.textContent = 'Đang xác thực...';
                verifySubmitBtn.disabled = true;
            }

            try {
                // Gửi thông tin đăng ký kèm OTP
                const response = await fetch(`${window.location.origin}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...registrationData,
                        otp_code: otpVal
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert(`Đăng ký thành công cho ${registrationData.ten}! Bạn có thể đăng nhập ngay.`);
                    otpModal.style.display = 'none';
                    window.location.replace('/login.html');
                } else {
                    alert(data.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại mã.');
                    if (verifySubmitBtn) {
                        verifySubmitBtn.textContent = 'Xác nhận';
                        verifySubmitBtn.disabled = false;
                    }
                }
            } catch (error) {
                console.error('Lỗi xác thực đăng ký:', error);
                alert('Có lỗi xảy ra khi xác thực OTP.');
                if (verifySubmitBtn) {
                    verifySubmitBtn.textContent = 'Xác nhận';
                    verifySubmitBtn.disabled = false;
                }
            }
        });
    }
});
