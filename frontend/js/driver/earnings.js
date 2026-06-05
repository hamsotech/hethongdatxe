/**
 * js/driver/earnings.js
 * Quản lý thông tin thu nhập, hiển thị số dư ví và yêu cầu rút tiền bằng xác thực OTP.
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const driverId = localStorage.getItem('user_id');
    if (!token) { window.location.replace('/login.html'); return; }

    const API_BASE_URL = `${window.location.origin}/api/driver`;
    const balanceEl = document.querySelector('#driver-earnings h2');

    // DOM ELEMENTS CHO RÚT TIỀN
    const btnWithdraw = document.getElementById('btn-withdraw');
    const withdrawModal = document.getElementById('withdraw-modal');
    const withdrawForm = document.getElementById('withdraw-form');
    const withdrawAmountInput = document.getElementById('withdraw-amount');
    const withdrawOtpGroup = document.getElementById('withdraw-otp-group');
    const withdrawOtpInput = document.getElementById('withdraw-otp');
    const btnWithdrawSubmit = document.getElementById('btn-withdraw-submit');
    const btnCloseWithdraw = document.getElementById('btn-close-withdraw');
    const withdrawSubtitle = document.getElementById('withdraw-subtitle');

    let withdrawState = 'amount'; // 'amount' hoặc 'otp'
    let currentBalance = 0;

    // Tải số dư ví tài xế từ cơ sở dữ liệu
    async function loadWalletBalance() {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && balanceEl) {
                currentBalance = parseFloat(data.balance || 0);
                balanceEl.textContent = `${parseInt(currentBalance).toLocaleString('vi-VN')} ₫`;
            }
        } catch (error) {
            console.error("Lỗi tải số dư ví tài xế:", error);
        }
    }

    loadWalletBalance();

    function resetWithdrawModal() {
        withdrawState = 'amount';
        if (withdrawForm) withdrawForm.reset();
        if (withdrawAmountInput) {
            withdrawAmountInput.readOnly = false;
        }
        if (withdrawOtpGroup) withdrawOtpGroup.style.display = 'none';
        if (withdrawOtpInput) withdrawOtpInput.required = false;
        if (btnWithdrawSubmit) btnWithdrawSubmit.textContent = 'Yêu cầu mã OTP';
        if (withdrawSubtitle) withdrawSubtitle.textContent = 'Nhập số tiền và mã OTP được gửi tới email của bạn:';
    }

    // Mở modal rút tiền
    if (btnWithdraw && withdrawModal) {
        btnWithdraw.addEventListener('click', () => {
            resetWithdrawModal();
            withdrawModal.style.display = 'flex';
            if (withdrawAmountInput) withdrawAmountInput.focus();
        });
    }

    // Đóng modal rút tiền
    if (btnCloseWithdraw && withdrawModal) {
        btnCloseWithdraw.addEventListener('click', () => {
            withdrawModal.style.display = 'none';
            resetWithdrawModal();
        });
    }

    // Xử lý gửi form rút tiền
    if (withdrawForm && withdrawModal) {
        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amountVal = parseFloat(withdrawAmountInput.value.trim() || 0);

            if (withdrawState === 'amount') {
                if (amountVal <= 0) { alert('Số tiền rút phải lớn hơn 0 ₫!'); return; }
                if (amountVal > currentBalance) { alert('Số dư ví của bạn không đủ để rút số tiền này!'); return; }

                const originalBtnText = btnWithdrawSubmit.textContent;
                btnWithdrawSubmit.textContent = 'Đang gửi mã...';
                btnWithdrawSubmit.disabled = true;

                try {
                    const response = await fetch(`${API_BASE_URL}/request-otp-withdraw`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        if (data.debug_otp) {
                            console.log(`[TEST MODE] Mã OTP rút tiền là: ${data.debug_otp}`);
                            alert(`Mã OTP đã được gửi! (Chạy thử nghiệm: mã OTP là ${data.debug_otp}. Bạn cũng có thể xem mã này ở console trình duyệt hoặc console backend).`);
                        } else {
                            alert(data.message || 'Mã OTP rút tiền đã được gửi tới email của bạn.');
                        }

                        withdrawState = 'otp';
                        withdrawAmountInput.readOnly = true;
                        if (withdrawOtpGroup) withdrawOtpGroup.style.display = 'block';
                        if (withdrawOtpInput) {
                            withdrawOtpInput.required = true;
                            withdrawOtpInput.focus();
                        }
                        if (btnWithdrawSubmit) btnWithdrawSubmit.textContent = 'Xác nhận rút tiền';
                        if (withdrawSubtitle) withdrawSubtitle.textContent = `Vui lòng nhập OTP để hoàn tất rút ${amountVal.toLocaleString('vi-VN')} ₫:`;
                    } else {
                        alert(data.message || 'Không thể gửi mã OTP rút tiền.');
                    }
                } catch (error) {
                    console.error("Lỗi yêu cầu OTP rút tiền:", error);
                    alert("Không thể kết nối đến máy chủ.");
                } finally {
                    btnWithdrawSubmit.disabled = false;
                    if (btnWithdrawSubmit.textContent !== 'Xác nhận rút tiền') {
                        btnWithdrawSubmit.textContent = originalBtnText;
                    }
                }
            } else {
                // Trạng thái nhập mã OTP xác nhận
                const otpVal = withdrawOtpInput.value.trim();
                if (otpVal.length !== 6) { alert('Mã OTP phải có đúng 6 chữ số!'); return; }

                const originalBtnText = btnWithdrawSubmit.textContent;
                btnWithdrawSubmit.textContent = 'Đang xử lý rút tiền...';
                btnWithdrawSubmit.disabled = true;

                try {
                    const response = await fetch(`${API_BASE_URL}/withdraw-otp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            amount: amountVal,
                            otp_code: otpVal
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert(`Yêu cầu rút tiền thành công!\nBạn đã rút ${amountVal.toLocaleString('vi-VN')} ₫.`);
                        withdrawModal.style.display = 'none';
                        resetWithdrawModal();
                        loadWalletBalance(); // Cập nhật lại số dư trên giao diện
                    } else {
                        alert(data.message || 'Xác thực OTP rút tiền thất bại.');
                    }
                } catch (error) {
                    console.error("Lỗi xác nhận rút tiền:", error);
                    alert("Có lỗi xảy ra khi xác nhận giao dịch.");
                } finally {
                    btnWithdrawSubmit.disabled = false;
                    btnWithdrawSubmit.textContent = originalBtnText;
                }
            }
        });
    }
});
