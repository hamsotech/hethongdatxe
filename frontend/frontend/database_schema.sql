-- =============================================
-- HỆ THỐNG ĐẶT XE - DATABASE SCHEMA (RIDE_CONNECT)
-- Chạy tệp này để cài đặt toàn bộ cơ sở dữ liệu
-- =============================================

CREATE DATABASE IF NOT EXISTS quan_ly_dat_xe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quan_ly_dat_xe;

-- Xóa các bảng cũ nếu tồn tại theo thứ tự ràng buộc khóa ngoại ngược
DROP TABLE IF EXISTS KHIEU_NAI_SU_CO;
DROP TABLE IF EXISTS YEU_CAU_RUT_TIEN;
DROP TABLE IF EXISTS VI_TAI_XE;
DROP TABLE IF EXISTS HO_SO_TAI_XE;
DROP TABLE IF EXISTS QUAN_TRI_THEO_DOI_CHUYEN;
DROP TABLE IF EXISTS DANH_GIA;
DROP TABLE IF EXISTS THANH_TOAN;
DROP TABLE IF EXISTS CHUYEN_DI;
DROP TABLE IF EXISTS PHUONG_TIEN;
DROP TABLE IF EXISTS TAI_XE;
DROP TABLE IF EXISTS NGUOI_DUNG;
DROP TABLE IF EXISTS QUAN_TRI_VIEN;

-- ----------------------------------------
-- 1. BẢNG QUẢN TRỊ VIÊN (Admin)
-- ----------------------------------------
CREATE TABLE QUAN_TRI_VIEN (
    MA_QUAN_TRI INT AUTO_INCREMENT PRIMARY KEY,
    TEN           VARCHAR(100) NOT NULL,
    EMAIL         VARCHAR(100) UNIQUE NOT NULL,
    MAT_KHAU      VARCHAR(255) NOT NULL
);

-- ----------------------------------------
-- 2. BẢNG NGƯỜI DÙNG (Khách hàng)
-- ----------------------------------------
CREATE TABLE NGUOI_DUNG (
    MA_NGUOI_DUNG INT AUTO_INCREMENT PRIMARY KEY,
    TEN           VARCHAR(100) NOT NULL,
    SO_DIEN_THOAI VARCHAR(20),
    EMAIL         VARCHAR(100) UNIQUE NOT NULL,
    MAT_KHAU      VARCHAR(255) NOT NULL,
    MA_QUAN_TRI   INT,
    NGAY_TAO      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_QUAN_TRI) REFERENCES QUAN_TRI_VIEN(MA_QUAN_TRI) ON DELETE SET NULL
);

-- ----------------------------------------
-- 3. BẢNG TÀI XẾ
-- ----------------------------------------
CREATE TABLE TAI_XE (
    MA_TAI_XE     INT AUTO_INCREMENT PRIMARY KEY,
    TEN           VARCHAR(100) NOT NULL,
    SO_DIEN_THOAI VARCHAR(20),
    EMAIL         VARCHAR(100) UNIQUE NOT NULL,
    MAT_KHAU      VARCHAR(255) NOT NULL,
    TRANG_THAI    VARCHAR(50) DEFAULT 'OFFLINE',  -- OFFLINE / ONLINE / BUSY
    NGAY_TAO      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------
-- 4. BẢNG PHƯƠNG TIỆN (Liên kết 1-1 với Tài xế)
-- ----------------------------------------
CREATE TABLE PHUONG_TIEN (
    MA_PHUONG_TIEN INT AUTO_INCREMENT PRIMARY KEY,
    LOAI_XE        VARCHAR(100),
    BIEN_SO        VARCHAR(50),
    MA_TAI_XE      INT UNIQUE,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- ----------------------------------------
-- 5. BẢNG CHUYẾN ĐI
-- ----------------------------------------
CREATE TABLE CHUYEN_DI (
    MA_CHUYEN_DI  INT AUTO_INCREMENT PRIMARY KEY,
    MA_NGUOI_DUNG INT NOT NULL,
    MA_TAI_XE     INT,
    DIEM_DON      VARCHAR(255) NOT NULL,
    DIEM_DEN      VARCHAR(255) NOT NULL,
    GIA_TIEN      DECIMAL(12,2),
    TRANG_THAI    VARCHAR(50) DEFAULT 'CHO_TAI_XE', -- CHO_TAI_XE / DA_NHAN / DANG_DI / HOAN_THANH / DA_HUY
    THOI_GIAN_TAO DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_NGUOI_DUNG) REFERENCES NGUOI_DUNG(MA_NGUOI_DUNG) ON DELETE CASCADE,
    FOREIGN KEY (MA_TAI_XE)     REFERENCES TAI_XE(MA_TAI_XE)         ON DELETE SET NULL
);

-- ----------------------------------------
-- 6. BẢNG THANH TOÁN
-- ----------------------------------------
CREATE TABLE THANH_TOAN (
    MA_THANH_TOAN INT AUTO_INCREMENT PRIMARY KEY,
    MA_CHUYEN_DI  INT NOT NULL,
    SO_TIEN       DECIMAL(12,2) NOT NULL,
    PHUONG_THUC   VARCHAR(50) DEFAULT 'Tiền mặt', -- Tiền mặt / Thẻ tín dụng / Ví điện tử
    TRANG_THAI    VARCHAR(50) DEFAULT 'CHO_THANH_TOAN', -- CHO_THANH_TOAN / DA_THANH_TOAN
    THOI_GIAN     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_CHUYEN_DI) REFERENCES CHUYEN_DI(MA_CHUYEN_DI) ON DELETE CASCADE
);

-- ----------------------------------------
-- 7. BẢNG ĐÁNH GIÁ (Sử dụng DIEM_SO từ 1 đến 5)
-- ----------------------------------------
CREATE TABLE DANH_GIA (
    MA_DANH_GIA   INT AUTO_INCREMENT PRIMARY KEY,
    MA_CHUYEN_DI  INT NOT NULL,
    MA_NGUOI_DUNG INT,
    MA_TAI_XE     INT,
    DIEM_SO       TINYINT NOT NULL CHECK (DIEM_SO BETWEEN 1 AND 5),
    NHAN_XET      TEXT,
    THOI_GIAN     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_CHUYEN_DI)  REFERENCES CHUYEN_DI(MA_CHUYEN_DI)   ON DELETE CASCADE,
    FOREIGN KEY (MA_NGUOI_DUNG) REFERENCES NGUOI_DUNG(MA_NGUOI_DUNG) ON DELETE SET NULL,
    FOREIGN KEY (MA_TAI_XE)     REFERENCES TAI_XE(MA_TAI_XE)         ON DELETE SET NULL
);

-- ----------------------------------------
-- 8. BẢNG QUẢN TRỊ THEO DÕI CHUYẾN ĐI
-- ----------------------------------------
CREATE TABLE QUAN_TRI_THEO_DOI_CHUYEN (
    ID           INT AUTO_INCREMENT PRIMARY KEY,
    MA_QUAN_TRI  INT,
    MA_CHUYEN_DI INT,
    FOREIGN KEY (MA_QUAN_TRI)  REFERENCES QUAN_TRI_VIEN(MA_QUAN_TRI)   ON DELETE CASCADE,
    FOREIGN KEY (MA_CHUYEN_DI) REFERENCES CHUYEN_DI(MA_CHUYEN_DI)       ON DELETE CASCADE
);

-- ----------------------------------------
-- 9. BẢNG HỒ SƠ TÀI XẾ (Bổ sung từ database_additional)
-- ----------------------------------------
CREATE TABLE HO_SO_TAI_XE (
    MA_HO_SO      INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE     INT NOT NULL,
    LOAI_GIAY_TO  VARCHAR(100) NOT NULL,
    HINH_ANH_URL  VARCHAR(255),
    TRANG_THAI    VARCHAR(50) DEFAULT 'Chờ duyệt', -- Chờ duyệt / Đã xác minh / Từ chối
    NGAY_TAO      DATETIME DEFAULT CURRENT_TIMESTAMP,
    NGAY_CAP_NHAT DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- ----------------------------------------
-- 10. BẢNG VÍ TÀI XẾ (Bổ sung từ database_additional)
-- ----------------------------------------
CREATE TABLE VI_TAI_XE (
    MA_VI         INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE     INT NOT NULL UNIQUE,
    SO_DU         DECIMAL(12,2) DEFAULT 0.00,
    TONG_RUT      DECIMAL(12,2) DEFAULT 0.00,
    NGAY_CAP_NHAT DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- ----------------------------------------
-- 11. BẢNG YÊU CẦU RÚT TIỀN (Bổ sung từ database_additional)
-- ----------------------------------------
CREATE TABLE YEU_CAU_RUT_TIEN (
    MA_YEU_CAU        INT AUTO_INCREMENT PRIMARY KEY,
    MA_TAI_XE         INT NOT NULL,
    SO_TIEN           DECIMAL(12,2) NOT NULL,
    TRANG_THAI        VARCHAR(50) DEFAULT 'Chờ xử lý', -- Chờ xử lý / Thành công / Từ chối
    THOI_GIAN_YEU_CAU DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_TAI_XE) REFERENCES TAI_XE(MA_TAI_XE) ON DELETE CASCADE
);

-- ----------------------------------------
-- 12. BẢNG KHIẾU NẠI / SỰ CỐ (Bổ sung từ database_additional)
-- ----------------------------------------
CREATE TABLE KHIEU_NAI_SU_CO (
    MA_KHIEU_NAI  INT AUTO_INCREMENT PRIMARY KEY,
    MA_CHUYEN_DI  INT NOT NULL,
    LOAI_NGUOI_GUI VARCHAR(50) NOT NULL, -- 'Khách hàng' hoặc 'Tài xế'
    MA_NGUOI_GUI  INT NOT NULL,
    NOI_DUNG      TEXT NOT NULL,
    TRANG_THAI    VARCHAR(50) DEFAULT 'Chờ xử lý', -- Chờ xử lý / Đang giải quyết / Đã giải quyết
    NGAY_TAO      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MA_CHUYEN_DI) REFERENCES CHUYEN_DI(MA_CHUYEN_DI) ON DELETE CASCADE
);

-- =============================================
-- DỮ LIỆU MẪU KIỂM THỬ (Mật khẩu mặc định: 123456)
-- =============================================

-- 1. Thêm Admin mẫu
INSERT INTO QUAN_TRI_VIEN (TEN, EMAIL, MAT_KHAU) VALUES
('Admin RideConnect', 'admin@rideconnect.vn', '$2b$12$b0pZEuNbptJqwCtgxH6u8.7bDoFh0Ft8JV/0DPKFBtDCiU5jPTkxi');

-- 2. Thêm Khách hàng mẫu
INSERT INTO NGUOI_DUNG (TEN, SO_DIEN_THOAI, EMAIL, MAT_KHAU, MA_QUAN_TRI) VALUES
('Nguyễn Văn Khách', '0901234567', 'khachhang@rideconnect.vn', '$2b$12$b0pZEuNbptJqwCtgxH6u8.7bDoFh0Ft8JV/0DPKFBtDCiU5jPTkxi', 1);

-- 3. Thêm Tài xế mẫu
INSERT INTO TAI_XE (TEN, SO_DIEN_THOAI, EMAIL, MAT_KHAU, TRANG_THAI) VALUES
('Nguyễn Tài Xế', '0987654321', 'taixe@rideconnect.vn', '$2b$12$b0pZEuNbptJqwCtgxH6u8.7bDoFh0Ft8JV/0DPKFBtDCiU5jPTkxi', 'ONLINE');

-- 4. Thêm Phương tiện cho tài xế mẫu
INSERT INTO PHUONG_TIEN (LOAI_XE, BIEN_SO, MA_TAI_XE) VALUES
('Xe máy', '59-P1 123.45', 1);

-- 5. Thêm Ví tài xế cho tài xế mẫu
INSERT INTO VI_TAI_XE (MA_TAI_XE, SO_DU) VALUES
(1, 100000.00);

-- 6. Thêm Hồ sơ tài xế đã xác minh cho tài xế mẫu
INSERT INTO HO_SO_TAI_XE (MA_TAI_XE, LOAI_GIAY_TO, TRANG_THAI) VALUES
(1, 'Bằng lái xe', 'Đã xác minh');
