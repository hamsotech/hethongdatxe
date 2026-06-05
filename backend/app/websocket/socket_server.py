from flask_socketio import SocketIO

# Khởi tạo thực thể socketio toàn cục
socketio = SocketIO(cors_allowed_origins="*", async_mode='gevent')

def init_websocket(app):
    """Hàm này sẽ được Người 1 gọi trong file main.py hoặc __init__.py gốc"""
    socketio.init_app(app)
    
    # Import các file sự kiện để kích hoạt bộ lắng nghe
    from . import customer_events
    from . import driver_events
    
    print("[WEBSOCKET] He thong Realtime da san sang hanh dong!")