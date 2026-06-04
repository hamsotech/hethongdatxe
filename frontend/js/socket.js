<<<<<<< Updated upstream
/**
 * js/socket.js
 * Quản lý kết nối WebSocket.
 */

const WS_URL = 'ws://localhost:5000/ws';

const SocketManager = {
    socket: null,

    connect: function(userId, role) {
        // Mở kết nối với backend kèm theo ID và Role (customer/driver)
        this.socket = new WebSocket(`${WS_URL}?userId=${userId}&role=${role}`);

        this.socket.onopen = () => {
            console.log('✅ WebSocket đã kết nối');
        };

        this.socket.onerror = (error) => {
            console.error('❌ Lỗi WebSocket:', error);
        };

        this.socket.onclose = () => {
            console.log('⚠️ WebSocket đã ngắt kết nối. Thử kết nối lại sau 5s...');
            setTimeout(() => this.connect(userId, role), 5000);
        };
    },

    // Hàm gửi tọa độ hoặc thông điệp
    sendMessage: function(type, payload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.warn('Không thể gửi tin, WebSocket chưa sẵn sàng.');
        }
    },

    // Lắng nghe sự kiện từ server
    listen: function(callback) {
        if (!this.socket) return;
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };
    }
=======
/**
 * js/socket.js
 * Quản lý kết nối WebSocket.
 */

const WS_URL = 'ws://localhost:5000/ws';

const SocketManager = {
    socket: null,

    connect: function(userId, role) {
        // Mở kết nối với backend kèm theo ID và Role (customer/driver)
        this.socket = new WebSocket(`${WS_URL}?userId=${userId}&role=${role}`);

        this.socket.onopen = () => {
            console.log('✅ WebSocket đã kết nối');
        };

        this.socket.onerror = (error) => {
            console.error('❌ Lỗi WebSocket:', error);
        };

        this.socket.onclose = () => {
            console.log('⚠️ WebSocket đã ngắt kết nối. Thử kết nối lại sau 5s...');
            setTimeout(() => this.connect(userId, role), 5000);
        };
    },

    // Hàm gửi tọa độ hoặc thông điệp
    sendMessage: function(type, payload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.warn('Không thể gửi tin, WebSocket chưa sẵn sàng.');
        }
    },

    // Lắng nghe sự kiện từ server
    listen: function(callback) {
        if (!this.socket) return;
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };
    }
>>>>>>> Stashed changes
};