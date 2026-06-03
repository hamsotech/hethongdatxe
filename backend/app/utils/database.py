import pymysql
from app.config import Config


def get_connection():
    try:
        conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor
        )

        return conn

    except Exception as e:
        print("Lỗi kết nối:", e)
        return None