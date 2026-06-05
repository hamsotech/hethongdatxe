import random
import datetime
from app.utils.database import get_connection

class OTPService:
    @staticmethod
    def generate_otp(email_or_phone, purpose):
        """
        Sinh mã OTP 6 số, lưu vào DB và in ra console.
        purpose có thể là: 'REGISTER', 'FORGOT_PASSWORD', 'PASSWORDLESS_LOGIN', 'WITHDRAW', 'UPDATE_PROFILE'
        """
        # Sinh mã ngẫu nhiên 6 chữ số
        otp_code = str(random.randint(100000, 999999))
        expired_at = datetime.datetime.now() + datetime.timedelta(minutes=5)
        
        conn = get_connection()
        if not conn:
            print("[OTP-ERROR] Loi ket noi database de luu OTP")
            return None
            
        try:
            cursor = conn.cursor()
            # Đánh dấu các OTP chưa dùng trước đó cùng mục đích của email/sđt này là đã hết hạn (hoặc đã dùng) để dọn dẹp
            cursor.execute(
                "UPDATE OTP_VERIFICATION SET IS_USED = 1 WHERE EMAIL_OR_PHONE = %s AND PURPOSE = %s AND IS_USED = 0",
                (email_or_phone, purpose)
            )
            
            # Lưu mã mới
            sql = """
            INSERT INTO OTP_VERIFICATION (EMAIL_OR_PHONE, OTP_CODE, PURPOSE, EXPIRED_AT, IS_USED)
            VALUES (%s, %s, %s, %s, 0)
            """
            cursor.execute(sql, (email_or_phone, otp_code, purpose, expired_at))
            conn.commit()
            
            # Print simulation banner in terminal console for testing
            print("\n" + "="*50)
            print(f"[OTP SIMULATOR - RIDECONNECT]")
            print(f"Muc dich: {purpose}")
            print(f"Gui toi: {email_or_phone}")
            print(f"Ma xac thuc OTP la: {otp_code}")
            print(f"Het han luc: {expired_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*50 + "\n")
            
            return otp_code
        except Exception as e:
            print("[OTP-ERROR] Loi luu OTP:", e)
            return None
        finally:
            conn.close()

    @staticmethod
    def verify_otp(email_or_phone, otp_code, purpose):
        """
        Kiểm tra mã OTP do người dùng gửi lên.
        Trả về True nếu hợp lệ và chưa hết hạn, ngược lại trả về False.
        """
        if not email_or_phone or not otp_code:
            return False
            
        conn = get_connection()
        if not conn:
            print("[OTP-ERROR] Loi ket noi database de xac thuc OTP")
            return False
            
        try:
            cursor = conn.cursor()
            # Tìm mã OTP gần nhất chưa sử dụng và chưa hết hạn
            sql = """
            SELECT ID, OTP_CODE, EXPIRED_AT 
            FROM OTP_VERIFICATION 
            WHERE EMAIL_OR_PHONE = %s AND PURPOSE = %s AND IS_USED = 0 AND EXPIRED_AT > NOW()
            ORDER BY ID DESC LIMIT 1
            """
            cursor.execute(sql, (email_or_phone, purpose))
            record = cursor.fetchone()
            
            if record and record["OTP_CODE"] == str(otp_code):
                # Đánh dấu đã sử dụng
                cursor.execute(
                    "UPDATE OTP_VERIFICATION SET IS_USED = 1 WHERE ID = %s",
                    (record["ID"],)
                )
                conn.commit()
                return True
                
            return False
        except Exception as e:
            print("[OTP-ERROR] Loi xac thuc OTP:", e)
            return False
        finally:
            conn.close()
