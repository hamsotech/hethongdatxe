/**
 * js/api.js
 * Cấu hình gọi API chung cho toàn bộ dự án.
 */

// Đổi thành URL backend thực tế của nhóm khi ghép code
const API_BASE_URL = 'http://localhost:5000/api'; 

const API = {
    // Lấy Token từ LocalStorage (nếu user đã đăng nhập)
    getToken: () => localStorage.getItem('access_token'),

    // Cấu hình Header chuẩn
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Hàm GET
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`[API GET Lỗi] ${endpoint}:`, error);
            throw error;
        }
    },

    // Hàm POST
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`[API POST Lỗi] ${endpoint}:`, error);
            throw error;
        }
    }
};