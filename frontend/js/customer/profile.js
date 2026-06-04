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
            const userId = localStorage.getItem('user_id') || 1;
            // Gọi API bằng file api.js dùng chung (sau này kết nối backend)
            // const response = await API.get(`/customer/${userId}`);
            
            // Dữ liệu giả lập (Mock data) trong lúc chờ Backend
            const mockData = {
                fullName: 'Nguyễn Văn Khách',
                phone: '0901234567',
                email: 'nguyenvankhach@email.com'
            };

            // Đổ dữ liệu vào các ô input
            inputName.value = mockData.fullName;
            inputPhone.value = mockData.phone;
            inputEmail.value = mockData.email;

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
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Đổi trạng thái nút sang Loading
            const originalText = btnSave.textContent;
            btnSave.textContent = 'Đang lưu...';
            btnSave.disabled = true;

            try {
                // Thu thập dữ liệu mới để chuẩn bị gửi API về sau
                const updatedData = {
                    fullName: inputName.value.trim(),
                    phone: inputPhone.value.trim(),
                    email: inputEmail.value.trim()
                };

                // Giả lập thời gian phản hồi mạng 1 giây
                await new Promise(resolve => setTimeout(resolve, 1000));

                alert('Cập nhật thông tin thành công!');

                // Khóa lại các ô input sau khi lưu xong
                inputs.forEach(input => {
                    input.setAttribute('readonly', true);
                    input.style.border = '1px solid var(--color-border)';
                    input.style.backgroundColor = '';
                });

                // Ẩn nút Lưu, Hiện lại nút Chỉnh sửa
                btnSave.style.display = 'none';
                btnEdit.style.display = 'block';

            } catch (error) {
                console.error('Lỗi khi lưu:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại.');
            } finally {
                btnSave.textContent = originalText;
                btnSave.disabled = false;
            }
        });
    }
});