/**
 * js/customer/profile.js
 * Xử lý tải dữ liệu hồ sơ, cập nhật thông tin cá nhân và thay đổi ảnh đại diện.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Tìm các phần tử DOM thông tin
    const btnEdit = document.getElementById('btn-edit-profile');
    const btnSave = document.getElementById('btn-save-profile');
    const profileForm = document.getElementById('profile-form');
    
    const inputName = document.getElementById('profile-name');
    const inputPhone = document.getElementById('profile-phone');
    const inputEmail = document.getElementById('profile-email');
    
    // Tìm các phần tử liên quan đến Avatar
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const avatarImg = document.getElementById('profile-avatar-img');
    
    // Mảng chứa các input để dễ lặp
    const inputs = [inputName, inputPhone, inputEmail];

    // Bỏ qua nếu không ở trang profile
    if (!profileForm) return;

    // ==========================================
    // 1. TẢI THÔNG TIN USER VÀ AVATAR
    // ==========================================
    async function loadUserProfile() {
        try {
            // Lấy thông tin thực tế từ localStorage sau khi đăng nhập thành công
            const userName = localStorage.getItem('user_name') || 'Khách hàng';
            const userPhone = localStorage.getItem('user_phone') || '';
            const userEmail = localStorage.getItem('user_email') || '';

            // Đổ dữ liệu vào các ô input
            inputName.value = userName;
            inputPhone.value = userPhone;
            inputEmail.value = userEmail;

            // ĐOẠN MÃ KIỂM TRA VÀ NẠP AVATAR TỪ LOCALSTORAGE
            const savedAvatar = localStorage.getItem('customer_avatar');
            if (savedAvatar && avatarImg) {
                avatarImg.src = savedAvatar;
            }
        } catch (error) {
            console.error('Lỗi khi tải hồ sơ:', error);
            alert('Không thể tải thông tin hồ sơ.');
        }
    }

    // Gọi hàm tải dữ liệu khi vừa vào trang
    loadUserProfile();

    // ==========================================
    // 2. LOGIC THAY ĐỔI ẢNH ĐẠI DIỆN (AVATAR)
    // ==========================================
    if (btnChangeAvatar && avatarImg) {
        // Tạo một thẻ input file ẩn để chọn ảnh từ thiết bị
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*'; // Chỉ chấp nhận định dạng ảnh

        // Khi bấm nút 📷 -> kích hoạt hộp thoại chọn file
        btnChangeAvatar.addEventListener('click', () => {
            fileInput.click();
        });

        // Khi người dùng chọn xong ảnh
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Giới hạn dung lượng ảnh nhỏ hơn 2MB để lưu vào localStorage không bị tràn
                if (file.size > 2 * 1024 * 1024) {
                    alert('Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.');
                    return;
                }

                const reader = new FileReader();
                
                // Đọc file ảnh chuyển thành chuỗi Base64
                reader.onload = function(event) {
                    const base64Image = event.target.result;
                    
                    // Thay đổi hiển thị ảnh trên trang cá nhân ngay lập tức
                    avatarImg.src = base64Image;
                    
                    // Lưu vào localStorage để đồng bộ với trang Dashboard
                    localStorage.setItem('customer_avatar', base64Image);
                    
                    alert('Đã cập nhật ảnh đại diện thành công!');
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // ==========================================
    // 3. XỬ LÝ SỰ KIỆN BẤM NÚT "CHỈNH SỬA"
    // ==========================================
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            // Mở khóa cho phép nhập liệu
            inputs.forEach(input => {
                input.removeAttribute('readonly');
                input.style.border = '1px solid var(--color-blue)'; 
                input.style.backgroundColor = 'var(--color-white)';
            });

            // Focus vào ô Tên đầu tiên
            inputName.focus();

            // Ẩn nút Chỉnh sửa, Hiện nút Lưu
            btnEdit.style.display = 'none';
            btnSave.style.display = 'block';
            btnSave.classList.remove('hidden'); // Đảm bảo nút hiển thị nếu bị class hidden chặn
        });
    }

    // ==========================================
    // 4. XỬ LÝ SỰ KIỆN "LƯU THAY ĐỔI"
    // ==========================================
    // OTP Modal elements for profile update
    const profileOtpModal = document.getElementById('profile-otp-modal');
    const profileOtpForm = document.getElementById('profile-otp-form');
    const profileOtpInput = document.getElementById('profile-otp');
    const btnCloseProfileOtp = document.getElementById('btn-close-profile-otp');
    const btnProfileOtpSubmit = document.getElementById('btn-profile-otp-submit');

    // ==========================================
    // 4. XỬ LÝ SỰ KIỆN "LƯU THAY ĐỔI"
    // ==========================================
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const newName = inputName.value.trim();
            const newPhone = inputPhone.value.trim();
            const newEmail = inputEmail.value.trim();

            const oldPhone = localStorage.getItem('user_phone') || '';
            const oldEmail = localStorage.getItem('user_email') || '';

            const isSensitiveChanged = (newPhone !== oldPhone || newEmail !== oldEmail);

            const originalText = btnSave.textContent;
            btnSave.textContent = 'Đang xử lý...';
            btnSave.disabled = true;

            const token = localStorage.getItem('access_token');

            async function saveProfileData(otpCode = null) {
                try {
                    const response = await fetch(`${window.location.origin}/api/customer/update-profile-otp`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            fullName: newName,
                            phone: newPhone,
                            email: newEmail,
                            otp_code: otpCode
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('Cập nhật thông tin cá nhân thành công!');

                        // Khóa lại các ô input sau khi lưu xong
                        inputs.forEach(input => {
                            input.setAttribute('readonly', true);
                            input.style.border = '1px solid var(--color-border)';
                            input.style.backgroundColor = '';
                        });

                        // Cập nhật lại localStorage
                        localStorage.setItem('user_name', newName);
                        localStorage.setItem('user_phone', newPhone);
                        localStorage.setItem('user_email', newEmail);

                        // Cập nhật tên hiển thị ở header nếu có
                        const userNameEl = document.getElementById('user-name');
                        if (userNameEl) userNameEl.textContent = newName;

                        // Ẩn nút Lưu, Hiện lại nút Chỉnh sửa
                        btnSave.style.display = 'none';
                        btnEdit.style.display = 'block';
                        
                        if (profileOtpModal) profileOtpModal.style.display = 'none';
                    } else {
                        alert(data.message || 'Cập nhật thông tin thất bại.');
                    }
                } catch (error) {
                    console.error('Lỗi khi lưu thông tin:', error);
                    alert('Có lỗi hệ thống xảy ra, vui lòng thử lại.');
                } finally {
                    btnSave.textContent = originalText;
                    btnSave.disabled = false;
                    if (btnProfileOtpSubmit) {
                        btnProfileOtpSubmit.textContent = 'Xác nhận lưu';
                        btnProfileOtpSubmit.disabled = false;
                    }
                }
            }

            if (isSensitiveChanged) {
                // Yêu cầu mã OTP trước
                try {
                    const response = await fetch(`${window.location.origin}/api/customer/request-otp-profile`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        if (data.debug_otp) {
                            console.log(`[TEST MODE] Mã OTP cập nhật hồ sơ là: ${data.debug_otp}`);
                            alert(`Mã OTP xác thực đã được gửi! (Chạy thử nghiệm: mã OTP là ${data.debug_otp}. Bạn cũng có thể xem mã này ở console trình duyệt hoặc console backend).`);
                        } else {
                            alert(data.message || 'Mã OTP xác thực đã được gửi tới email của bạn.');
                        }

                        if (profileOtpModal) {
                            profileOtpModal.style.display = 'flex';
                            if (profileOtpInput) {
                                profileOtpInput.value = '';
                                profileOtpInput.focus();
                            }
                        }
                    } else {
                        alert(data.message || 'Không thể yêu cầu mã OTP.');
                        btnSave.textContent = originalText;
                        btnSave.disabled = false;
                    }
                } catch (error) {
                    console.error('Lỗi yêu cầu OTP cập nhật hồ sơ:', error);
                    alert('Không kết nối được đến máy chủ.');
                    btnSave.textContent = originalText;
                    btnSave.disabled = false;
                }
            } else {
                // Không thay đổi SĐT hay Email nhạy cảm, lưu trực tiếp
                await saveProfileData();
            }

            // Gắn sự kiện submit OTP
            if (profileOtpForm) {
                profileOtpForm.onsubmit = async (evt) => {
                    evt.preventDefault();
                    const otpVal = profileOtpInput.value.trim();
                    if (otpVal.length !== 6) { alert('Mã OTP phải có đúng 6 chữ số!'); return; }
                    
                    if (btnProfileOtpSubmit) {
                        btnProfileOtpSubmit.textContent = 'Đang xác thực...';
                        btnProfileOtpSubmit.disabled = true;
                    }
                    await saveProfileData(otpVal);
                };
            }
        });
    }

    // Sự kiện đóng modal OTP
    if (btnCloseProfileOtp && profileOtpModal) {
        btnCloseProfileOtp.addEventListener('click', () => {
            profileOtpModal.style.display = 'none';
            if (btnSave) {
                btnSave.textContent = 'Lưu thay đổi';
                btnSave.disabled = false;
            }
        });
    }


    // ==========================================
    // 5. ĐĂNG KÝ TRỞ THÀNH TÀI XẾ
    // ==========================================
    const driverRegForm = document.getElementById('driver-reg-form');
    if (driverRegForm) {
        driverRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const carType = document.getElementById('driver-car-type').value;
            const licensePlate = document.getElementById('driver-license-plate').value.trim();
            const submitBtn = document.getElementById('btn-submit-driver-reg');

            submitBtn.textContent = 'Đang đăng ký...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${window.location.origin}/api/customer/register-driver`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                    },
                    body: JSON.stringify({
                        loai_xe: carType,
                        bien_so: licensePlate
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Đăng ký tài xế thành công! Bạn có thể đăng xuất và đăng nhập lại bằng vai trò Tài xế.');
                    document.getElementById('driver-reg-section').style.display = 'none';
                } else {
                    alert(data.message || 'Đăng ký tài xế thất bại. Vui lòng thử lại.');
                    submitBtn.textContent = 'Gửi đăng ký tài xế';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Lỗi khi đăng ký tài xế:', error);
                alert('Không thể kết nối đến server. Vui lòng kiểm tra lại.');
                submitBtn.textContent = 'Gửi đăng ký tài xế';
                submitBtn.disabled = false;
            }
        });
    }
});