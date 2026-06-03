from datetime import datetime


def current_time():
    return datetime.now()


def success_response(data=None, message="Success"):
    return {
        "success": True,
        "message": message,
        "data": data
    }


def error_response(message="Error"):
    return {
        "success": False,
        "message": message
    }