# RideConnect - Hệ thống Đặt Xe Công Nghệ 🚗🏍️
> **Đồ án Công nghệ Phần mềm**  
> Hệ thống đặt xe trực tuyến đa vai trò (Khách hàng, Tài xế, Quản trị viên) với truyền thông thời gian thực (realtime) và tích hợp bản đồ số.

---

## 📌 Tổng Quan Hệ Thống
**RideConnect** là một ứng dụng web mô phỏng dịch vụ gọi xe công nghệ tương tự Grab/Uber. Hệ thống cho phép khách hàng đặt chuyến đi (xe máy/ô tô), tự động tính toán lộ trình đường bộ và giá vé, phát sóng realtime tới các tài xế khả dụng gần nhất, hỗ trợ tài xế nhận chuyến và chạy mô phỏng hành trình, đồng thời cung cấp bảng điều khiển quản trị (Admin Panel) toàn diện để quản lý doanh thu, khiếu nại, hồ sơ tài xế và kiểm soát tài khoản người dùng.

---

## 🛠️ Công Nghệ Sử Dụng
### Phân Hệ Backend (Server)
* **Ngôn ngữ**: Python 3.x
* **Framework**: Flask (Web API & Serving static files)
* **Realtime**: Flask-SocketIO (WebSocket giao tiếp hai chiều)
* **Database**: MySQL / MariaDB (Kết nối thông qua thư viện `PyMySQL`)
* **Thư viện khác**: `Flask-CORS`, `PyJWT` (bảo mật token), `eventlet` (tăng tốc luồng socket)

### Phân Hệ Frontend (Client)
* **Giao diện**: HTML5, CSS3 (thiết kế Responsive tối ưu Mobile/Desktop, hiệu ứng mượt mà)
* **Logic & API**: Javascript thuần (Vanilla JS, Fetch API)
* **Bản đồ số**: Leaflet.js (Bản đồ mã nguồn mở OpenStreetMap)
* **Lộ trình**: OSRM API (Định tuyến đường bộ thực tế), Nominatim API (Địa chỉ gợi ý - Autocomplete có tích hợp cơ chế lưu đệm geocode cache để giảm lag)
* **Realtime Client**: Socket.IO Client CDN

---

## 💎 Danh Sách Chức Năng Chi Tiết

### 1. Phân Hệ Khách Hàng (Customer App)
* **Đăng ký / Đăng nhập / Quên mật khẩu**: Quản lý tài khoản cá nhân, lấy lại mật khẩu nhanh qua email liên hệ.
* **Định vị & Bản đồ**: Tự động xác định vị trí hiện tại bằng GPS, kéo thả ghim đón/đến trực tiếp trên bản đồ để chọn hành trình.
* **Tìm kiếm & Định tuyến**: Gợi ý địa chỉ tự động khi gõ chữ, tính khoảng cách lộ trình di chuyển thực tế theo mạng lưới đường bộ (OSRM).
* **Đặt chuyến & Khuyến mãi**:
  * Tùy chọn xe máy (GrabBike) hoặc ô tô (GrabCar) kèm thời gian dự kiến và giá tiền tương ứng.
  * Chọn phương thức thanh toán linh hoạt (Tiền mặt, Thẻ tín dụng, Ví điện tử, Ví MoMo).
  * Áp dụng mã khuyến mãi **`RIDEBLUE`** để giảm trực tiếp 20% giá vé trước khi đặt chuyến.
* **Tìm tài xế & Huỷ chuyến**: Phát sóng đặt xe realtime. Khách hàng có thể nhấn **Hủy chuyến** trực tiếp từ màn hình chờ tìm xe.
* **Theo dõi hành trình (Tracking)**: Bản đồ hiển thị realtime vị trí di chuyển của tài xế và lộ trình đi. Hỗ trợ gọi điện/huỷ chuyến khi tài xế đang đến đón.
* **Đánh giá & Khiếu nại**:
  * Đánh giá chất lượng phục vụ của tài xế (1 - 5 sao kèm bình luận) sau chuyến đi.
  * Gửi báo cáo khiếu nại sự cố (sai tiền, sai tuyến đường, thái độ...) trực tiếp từ trang Lịch sử chuyến đi.
* **Nâng cấp tài xế**: Khách hàng có thể nộp đơn đăng ký phương tiện trực tuyến để trở thành tài xế.

### 2. Phân Hệ Tài Xế (Driver App)
* **Trạng thái hoạt động**: Bật/Tắt chế độ nhận chuyến (Online/Offline).
* **Danh sách cuốc xe chờ scrollable**: Tài xế có thể xem danh sách cuộn toàn bộ các chuyến xe hiện đang chờ trong khu vực.
* **Đếm ngược thời gian nhận chuyến**: Mỗi thẻ cuốc xe có bộ đếm ngược 5 phút (300s) tự động hoạt động song song.
* **Chấp nhận / Từ chối**: Tài xế có quyền từ chối bỏ qua đơn hoặc bấm nhận cuốc xe mong muốn. Hệ thống tự động đồng bộ realtime để ẩn chuyến xe đó trên các máy tài xế khác ngay lập tức.
* **Mô phỏng hành trình**: Chạy mô phỏng di chuyển thực tế của tài xế trên bản đồ qua các chặng: Đang đến đón -> Đã đón khách -> Đang trong chuyến đi -> Hoàn thành.
* **Ví tài xế & Quản lý thu nhập**: Theo dõi số dư ví, yêu cầu rút tiền về tài khoản ngân hàng, xem lịch sử các cuốc xe đã chạy.

### 3. Phân Hệ Quản Trị Viên (Admin Panel)
* **Bảng điều khiển (Dashboard)**: Biểu đồ thống kê số lượng tài khoản đăng ký, số lượng chuyến xe và số tài xế đang online thời gian thực.
* **Quản lý Khách hàng**: Tra cứu thông tin khách hàng, số chuyến đã đi, xem lịch sử chuyến đi và **Khóa / Mở khóa tài khoản có nhập lý do chi tiết**.
* **Quản lý Tài xế**: Phê duyệt hoặc từ chối hồ sơ đăng ký tài xế trực tuyến; kiểm soát trạng thái hoạt động; **Khóa / Mở khóa ứng dụng tài xế kèm lý do vi phạm**.
* **Quản lý Chuyến xe**: Lưu trữ nhật ký chuyến đi, hiển thị chi tiết điểm đón/đến, giá vé và phương thức thanh toán tương ứng từ database, bộ lọc theo trạng thái và thời gian.
* **Báo cáo doanh thu**: 
  * Thống kê chi tiết doanh thu hệ thống (20% phí chiết khấu) và thu nhập của tài xế (80%) theo từng tháng từ dữ liệu thực tế trong DB.
  * Hỗ trợ tải báo cáo Excel thực tế dạng tệp `.csv` (đã mã hoá tiếng Việt UTF-8 BOM).
  * Hỗ trợ xuất và in báo cáo định dạng PDF biểu mẫu A4 chuyên nghiệp.
* **Giải quyết khiếu nại**: Tiếp nhận và nhập phương án xử lý (hoàn tiền, phạt tài xế...) cho các khiếu nại từ khách hàng gửi lên.

---

## 📂 Cấu Trúc Thư Mục Dự Án
```text
hethongdatxe/
├── backend/
│   ├── app/
│   │   ├── controllers/      # Bộ điều khiển điều hướng logic (Auth, Customer, Admin)
│   │   ├── routes/           # Khai báo các endpoint REST API (Auth, Customer, Driver, Admin)
│   │   ├── services/         # Xử lý truy vấn cơ sở dữ liệu (Booking, Payment)
│   │   ├── utils/            # Tiện ích dùng chung (Auth Middleware, Database Connection)
│   │   └── websocket/        # Xử lý kết nối Realtime Socket.IO (Customer, Driver events)
│   ├── run.py                # Điểm khởi chạy Flask server (Cổng 5000)
│   └── app/config.py         # Cấu hình kết nối MySQL và tham số hệ thống
└── frontend/
    └── frontend/
        ├── admin/            # Giao diện HTML của trang quản trị Admin
        ├── assets/           # Tài nguyên hình ảnh, avatar, marker
        ├── css/              # Tệp tin định kiểu CSS (common.css, customer.css, admin.css)
        ├── customer/         # Giao diện HTML của Khách hàng (book_ride, tracking, history)
        ├── driver/           # Giao diện HTML của Tài xế (dashboard, history)
        ├── js/               # Mã nguồn logic JS điều phối API và giao diện
        │   ├── admin/        # Xử lý JS trang quản trị (users, drivers, trips, reports)
        │   ├── customer/     # Xử lý JS trang khách hàng (booking, tracking, rating)
        │   └── driver/       # Xử lý JS trang tài xế (dashboard)
        ├── database_schema.sql # Bản thiết kế và dữ liệu mẫu cơ sở dữ liệu MySQL
        ├── index.html        # Trang chọn vai trò ban đầu
        ├── login.html        # Trang đăng nhập tài khoản
        └── register.html     # Trang đăng ký khách hàng
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 1. Yêu cầu hệ thống
* Máy tính đã cài đặt sẵn **Python 3.8+**
* Hệ quản trị cơ sở dữ liệu **MySQL** hoặc **MariaDB**
* Trình duyệt web hiện đại (Google Chrome, Microsoft Edge, Firefox,...)

### 2. Thiết lập Cơ sở dữ liệu (Database)
1. Mở phần mềm quản lý MySQL (ví dụ: phpMyAdmin, DBeaver, MySQL Workbench hoặc Command Line).
2. Tạo cơ sở dữ liệu mới và import tệp tin `database_schema.sql` nằm trong thư mục `frontend/frontend/database_schema.sql`.
   * *Lưu ý*: Tệp schema này đã tích hợp sẵn cơ sở dữ liệu `quan_ly_dat_xe` cùng các bảng ràng buộc và các tài khoản thử nghiệm ban đầu.

### 3. Cài đặt Backend
1. Mở terminal/command prompt tại thư mục `backend/`.
2. Cài đặt các thư viện cần thiết bằng lệnh:
   ```bash
   pip install flask flask-cors flask-socketio pymysql eventlet
   ```
3. Mở tệp `backend/app/config.py` và chỉnh sửa các thông tin kết nối MySQL (username, password, port) cho phù hợp với máy của bạn.
4. Chạy server bằng lệnh:
   ```bash
   python run.py
   ```
   * *Kết quả thành công*: Console sẽ thông báo server đang chạy tại cổng `http://0.0.0.0:5000` và kết nối Realtime đã sẵn sàng.

### 4. Truy cập giao diện
* Do Flask server đã cấu hình trỏ thư mục static về `frontend/frontend`, bạn chỉ cần mở trình duyệt và truy cập địa chỉ:
  ```text
  http://localhost:5000
  ```

---

## 💡 Hướng Dẫn Kiểm Thử Đồng Thời (Tránh Xung Đột)
Vì cả 2 vai trò **Khách hàng** và **Tài xế** đều chạy chung trên địa chỉ `http://localhost:5000`, trình duyệt sẽ dùng chung bộ nhớ đệm `localStorage`. Để tránh việc tài khoản này ghi đè Token của tài khoản kia gây ngắt kết nối Socket, bạn nên kiểm thử theo các cách sau:
1. **Sử dụng Cửa sổ ẩn danh (Incognito Mode)**: 
   * Mở 1 cửa sổ trình duyệt bình thường đăng nhập **Khách hàng**.
   * Mở 1 cửa sổ ẩn danh (`Ctrl + Shift + N`) đăng nhập **Tài xế**.
2. **Sử dụng 2 trình duyệt khác nhau**: 
   * Đăng nhập Khách hàng trên Google Chrome và Tài xế trên Microsoft Edge.

### Tài khoản thử nghiệm mặc định (Mật khẩu chung: `123456`)
* **Quản trị viên (Admin)**: `admin@rideconnect.vn`
* **Khách hàng**: `khachhang@rideconnect.vn`
* **Tài xế**: `taixe@rideconnect.vn`