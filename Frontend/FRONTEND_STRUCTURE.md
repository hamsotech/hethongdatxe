# Tài Liệu Cấu Trúc Frontend - Dự án Ride-Hailing Connect 🚗

Tài liệu này cung cấp cái nhìn tổng quan về cấu trúc thư mục, công nghệ sử dụng, và các điểm neo (DOM IDs, Classes) của Frontend. Từ đó, Backend Developer có thể nắm bắt cách tích hợp API và thay thế dữ liệu giả lập (mock data) bằng dữ liệu thực.

---

## 1. Công nghệ sử dụng
- **Tech Stack:** Pure HTML5, CSS3, Vanilla JavaScript (ES6+). KHÔNG dùng các framework/thư viện nhúng ngoài (React, Vue, Tailwind, v.v.).
- **CSS Architecture:** Tiêu chuẩn BEM (Block__Element--Modifier), quản lý biến màu sắc chung qua CSS Variables.
- **Responsive:**
  - **Tài xế (`/driver`):** Thiết kế theo tư duy Mobile-first.
  - **Admin (`/admin`):** Thiết kế tối ưu cho màn hình Desktop (Dashboard).

---

## 2. Cấu trúc thư mục

```text
/
├── index.html           # Entry point: Tự động kiểm tra Auth (localStorage) để chuyển hướng về đúng giao diện.
├── login.html           # Trang Đăng nhập chung.
├── register.html        # Trang Đăng ký Khách hàng.
├── admin/               # PHÂN HỆ QUẢN TRỊ VIÊN
│   ├── dashboard.html   # Thống kê tổng quan (KPIs, biểu đồ).
│   ├── drivers.html     # Quản lý tài xế & phê duyệt hồ sơ.
│   ├── reports.html     # Báo cáo doanh thu & xử lý sự cố.
│   ├── trips.html       # Quản lý toàn bộ chuyến đi trên hệ thống.
│   └── users.html       # Quản lý danh sách khách hàng.
├── driver/              # PHÂN HỆ TÀI XẾ
│   ├── dashboard.html   # Bản đồ nội bộ, nhận chuyến, báo online/offline.
│   ├── earnings.html    # Thống kê ví tiền, biểu đồ doanh thu.
│   ├── profile.html     # Hồ sơ cá nhân, giấy tờ pháp lý.
│   └── trips.html       # Lịch sử và trạng thái chuyến xe.
├── css/
│   ├── common.css       # File CSS Core: Khai báo màu sắc, class button, input, base rules.
│   ├── admin.css        # CSS đặc thù cho layout Desktop Admin (Sidebar, Table).
│   ├── driver.css       # CSS đặc thù cho layout Mobile Tài xế (Bottom nav, Bottom sheet).
│   └── login.css        # CSS cho form xác thực.
└── js/
    ├── login.js         # Xử lý sự kiện đăng nhập (thay thế mock logic tại đây).
    ├── register.js      # Xử lý sự kiện đăng ký (thay thế mock logic tại đây).
    ├── logout.js        # Xử lý đăng xuất chung (xóa localStorage).
    ├── api.js           # Gợi ý: file cấu hình chung Axios/Fetch wrapper cho việc gọi API sau này.
    ├── admin/
    │   └── dashboard.js # Chứa logic gọi API đổ dữ liệu về biểu đồ, danh sách admin...
    └── driver/
        └── dashboard.js # Chứa logic xử lý quét radar, Bottom sheet nhận chuyến...
```

---

## 3. Cơ chế xác thực & Phân quyền (Auth & Roles)

Hiện tại, quá trình đăng nhập đang dùng bộ nhớ tạm của Browser (`localStorage`) để xử lý luồng đi một cách giả lập tại `js/login.js`. 
- **Cách Frontend dang hoạt động:** Lưu key `currentUserRole` với giá trị `driver` hoặc `admin`.
- **Yêu cầu đối với Backend:**
  - Viết API `POST /api/v1/auth/login` (nhận `username`, `password`) -> Trả về `accessToken`, `refreshToken` và `role`.
  - Dev Backend/Frontend sửa tại `js/login.js`: Gửi fetch request, lấy Token lưu vào `localStorage/Cookie` thay vì lưu thô chuỗi `role`.
  - Các trang Dashboard cần có một logic kiểm tra `Token` hoặc gọi API `/api/v1/user/me` để xác thực khi khởi tạo trang.

---

## 4. Các Endpoints API Dự Kiến (Expected RESTful APIs)

Front-end đã bố trí sẵn các HTML ID (như `id="user-list"`, `id="today-revenue"`) để Backend có thể query tới DOM và gán `innerHTML`. Dưới đây là các API dự kiến cần thiết để dự án hoạt động thật.

### 4.1. Auth Module
| Method | Endpoint | Mục đích | Nơi gọi trong JS |
|---|---|---|---|
| POST | `/auth/login` | Đăng nhập hệ thống (cho mọi đối tượng) | `login.js` |
| POST | `/auth/register` | Đăng ký tài khoản Khách hàng (User) | `register.js` |
| POST | `/auth/logout` | Xóa token/session | `logout.js` |

### 4.2. Phân hệ Admin (`/admin/*`)
| Method | Endpoint | Nơi thay đổi DOM (UI ID) | Chức năng (Gợi ý) |
|---|---|---|---|
| GET | `/admin/stats/overview` | KPI Cards tại `admin/dashboard.html` | Tổng doanh thu, Số chuyến, Số khách, Số tài xế. |
| GET | `/admin/users?search=x` | `#user-list` | Render bảng danh sách Khách hàng. |
| PUT | `/admin/users/{id}/status` | Nút `Khóa/Mở khóa` | Thay đổi trạng thái khách hàng. |
| GET | `/admin/drivers?status=pending` | `#content-pending-drivers` | Danh sách hồ sơ tài xế chờ phê duyệt (Trang Tài Xế). |
| PUT | `/admin/drivers/{id}/approve` | Nút `Phê duyệt` & `Từ chối` | Xử lý trạng thái pháp lý tài xế. |
| GET | `/admin/trips` | `#trip-list` | API cho bảng danh sách chuyến xe toàn hệ thống. |
| GET | `/admin/reports/revenue` | Bảng ở `admin/reports.html` | Lấy dữ liệu báo cáo chiết khấu, tải hóa đơn (PDF/Excel). |

### 4.3. Phân hệ Tài xế (`/driver/*`)
| Method | Endpoint | Nơi thay đổi DOM (UI ID) | Chức năng (Gợi ý) |
|---|---|---|---|
| PUT | `/driver/status` | `#status-switch` (Toggle online/offline) | Báo cho hệ thống biết TX sẵn sàng nhận khách hay không. |
| GET | `/driver/stats/today` | `#today-revenue`, `#today-trips` | Render thẻ thống kê danh thu ngày trên cùng của `dashboard.html`. |
| WebSocket | `/ws/driver/trips/new` | `#sheet-requested` (Bottom Sheet) | Nhận thông báo chuyến đi tới theo thời gian thực (Server Push). |
| POST | `/driver/trips/{id}/accept` | `#btn-accept-trip` | Tài xế bấm nhận chuyến đi (Xóa countdown radar). |
| PUT | `/driver/trips/{id}/complete`| `#btn-finish-trip` | Hoàn thành chuyến. Kích hoạt sheet thanh toán (`#sheet-payment`). |
| GET | `/driver/trips/history` | `#content-history` | Render danh sách chuyến đi tại `trips.html`. |
| GET | `/driver/earnings/chart` | `#earnings-chart` | Lấy data điểm biểu đồ theo ngày trong tuần trang `earnings.html`. |

---

## 5. Hướng dẫn tích hợp cho Backend (How-to-Integrate)

Trong mô hình kiến trúc Vanilla JS:
1. Bạn hãy vào các file logic trong `/js/` (vd: `js/admin/dashboard.js`).
2. Viết hàm `fetch()` để chọc vào Backend.
3. Khi có Data Response (JSON), bạn DOM đến các phần tử thông qua `document.getElementById('ID_CỦA_PHẦN_TỬ')`.
4. Gọi hàm map/forEach array và sử dụng Template Literals (``) để chèn chuỗi HTML vào `innerHTML` của ID đích.

**Ví dụ lấy danh sách Khách hàng (Admin):**
```javascript
// file: js/admin/users.js (Bạn tự tạo thêm)
async function fetchUsers() {
    try {
        const response = await fetch('http://api.domain.com/v1/admin/users');
        const data = await response.json();
        const tbody = document.getElementById('user-list');
        
        tbody.innerHTML = data.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.phone}</td>
                <td>${user.email}</td>
                <td>${user.totalTrips}</td>
                <td><span class="badge ${user.isActive ? 'badge--success' : 'badge--danger'}">
                    ${user.isActive ? 'Hoạt động' : 'Bị Khóa'}
                </span></td>
                <td>
                    <!-- Add action buttons here -->
                </td>
            </tr>
        `).join('');
    } catch(e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', fetchUsers);
```
