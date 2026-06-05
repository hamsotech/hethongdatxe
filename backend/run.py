from app import create_app
from app.websocket.socket_server import socketio

flask_app = create_app()

import app.websocket.customer_events
import app.websocket.driver_events
import app.websocket.admin_events

if __name__ == "__main__":
    socketio.run(
        flask_app,
        host="0.0.0.0",
        port=5000,
        debug=True
    )
