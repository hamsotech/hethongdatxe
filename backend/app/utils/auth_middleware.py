from functools import wraps
from flask import request, jsonify
import jwt
from app.config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({
                "success": False,
                "message": "Token xác thực không tồn tại"
            }), 401

        try:
            payload = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )
            request.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Token đã hết hạn"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Token không hợp lệ"
            }), 401

        return f(*args, **kwargs)

    return decorated
