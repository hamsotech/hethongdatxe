from app.utils.database import get_connection

def run_migration():
    conn = get_connection()
    if not conn:
        print("Could not connect to database")
        return
    try:
        cursor = conn.cursor()
        sql = """
        CREATE TABLE IF NOT EXISTS OTP_VERIFICATION (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            EMAIL_OR_PHONE VARCHAR(100) NOT NULL,
            OTP_CODE VARCHAR(10) NOT NULL,
            PURPOSE VARCHAR(50) NOT NULL,
            EXPIRED_AT DATETIME NOT NULL,
            IS_USED TINYINT DEFAULT 0,
            CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(sql)
        conn.commit()
        print("Successfully created OTP_VERIFICATION table!")
    except Exception as e:
        print("Error running migration:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
