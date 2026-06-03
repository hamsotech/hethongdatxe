from flask_socketio import emit
from .socket_server import socketio


@socketio.on("gui_thong_bao")
def gui_thong_bao(data):

    emit(
        "thong_bao_he_thong",
        data,
        broadcast=True
    )