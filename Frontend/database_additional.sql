USE quan_ly_dat_xe;

-- --------------------------------------------------------
-- 1. BẢNG HỒ SƠ TÀI XẾ (Dùng cho Admin xét duyệt & Tài xế xem)
-- Phục vụ: admin/drivers.html (Hồ sơ chờ phê duyệt) và driver/profile.html (Giấy tờ pháp lý)
-- --------------------------------------------------------
CREATE TABLE HO_SO_TAI_XE (
    MA_HO_SO INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE INT NOT NULL,
    LOAI_GIAY_TO VARCHAR(100) NOT NULL, -- Ví dụ: 'Bằng lái xe', 'Giấy đăng ký xe', 'Lý lịch tư pháp'
    HINH_ANH_URL VARCHAR(255),
    TRANG_THAI VARCHAR(50) DEFAULT 'Chờ duyệt', -- Enum: 'Chờ duyệt', 'Đã xác minh', 'Từ chối'
    NGAY_TAO DATETIME DEFAULT CURRENT_TIMESTAMP,
    NGAY_CAP_NHAT DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 2. BẢNG VÍ TÀI XẾ (Dùng cho màn hình Thu nhập)
-- Phục vụ: driver/earnings.html (Số dư hiện tại)
-- --------------------------------------------------------
CREATE TABLE VI_TAI_XE (
    MA_VI INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE INT NOT NULL UNIQUE,
    SO_DU DECIMAL(12,2) DEFAULT 0.00,
    TONG_RUT DECIMAL(12,2) DEFAULT 0.00,
    NGAY_CAP_NHAT DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 3. BẢNG YÊU CẦU RÚT TIỀN 
-- Phục vụ: Nút "Yêu cầu rút tiền" tại driver/earnings.html
-- --------------------------------------------------------
CREATE TABLE YEU_CAU_RUT_TIEN (
    MA_YEU_CAU INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE INT NOT NULL,
    SO_TIEN DECIMAL(12,2) NOT NULL,
    TRANG_THAI VARCHAR(50) DEFAULT 'Chờ xử lý', -- Enum: 'Chờ xử lý', 'Thành công', 'Từ chối'
    THOI_GIAN_YEU_CAU DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 4. BẢNG KHIẾU NẠI / SỰ CỐ
-- Phục vụ: admin/reports.html (Bảng Báo cáo vi phạm / Khiếu nại)
-- --------------------------------------------------------
CREATE TABLE KHIEU_NAI_SU_CO (
    MA_KHIEU_NAI INT AUTO_INCREMENT PRIMARY KEY,
    MA_CHUYEN_DI INT NOT NULL,
    LOAI_NGUOI_GUI VARCHAR(50) NOT NULL, -- 'Khách hàng' hoặc 'Tài xế'
    MA_NGUOI_GUI INT NOT NULL, -- Sẽ map với MA_NGUOI_DUNG hoặc MA_TAI_XE tùy vào LOAI_NGUOI_GUI
    NOI_DUNG TEXT NOT NULL,
    TRANG_THAI VARCHAR(50) DEFAULT 'Chờ xử lý', -- Enum: 'Chờ xử lý', 'Đang giải quyết', 'Đã giải quyết'
    NGAY_TAO DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_CHUYEN_DI) REFERENCES CHUYEN_DI(MA_CHUYEN_DI) ON DELETE CASCADE
);
