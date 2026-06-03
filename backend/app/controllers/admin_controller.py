from app.utils.database import get_connection


class AdminController:

    @staticmethod
    def dashboard():

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) AS total_users FROM NGUOI_DUNG"
        )
        users = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) AS total_trips FROM CHUYEN_DI"
        )
        trips = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) AS total_drivers FROM TAI_XE"
        )
        drivers = cursor.fetchone()

        conn.close()

        return {
            "total_users": users["total_users"],
            "total_trips": trips["total_trips"],
            "total_drivers": drivers["total_drivers"]
        }

    @staticmethod
    def get_users():

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM NGUOI_DUNG"
        )

        users = cursor.fetchall()

        conn.close()

        return users

    @staticmethod
    def get_trips():

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM CHUYEN_DI"
        )

        trips = cursor.fetchall()

        conn.close()

        return trips