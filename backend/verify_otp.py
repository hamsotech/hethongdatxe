import requests
import random

BASE_URL = "http://localhost:5000/api"

def run_tests():
    print("=== STARTING OTP FLOWS TEST ===")
    
    # Generate a random email to test registration
    rand_id = random.randint(1000, 9999)
    test_email = f"user_{rand_id}@test.com"
    test_phone = f"091234{rand_id}"
    test_password = "password123"
    
    # ----------------------------------------------------
    # FLOW 1: Dang ky tai khoan (Register with OTP)
    # ----------------------------------------------------
    print("\n--- Test Flow 1: Dang ky tai khoan (Register) ---")
    req_body = {
        "email": test_email,
        "purpose": "REGISTER"
    }
    res = requests.post(f"{BASE_URL}/auth/request-otp", json=req_body)
    data = res.json()
    print("Request OTP success:", data.get("success"))
    assert data["success"] is True
    otp_code = data["debug_otp"]
    print(f"Obtained OTP for testing: {otp_code}")
    
    register_body = {
        "ten": f"User Test {rand_id}",
        "so_dien_thoai": test_phone,
        "email": test_email,
        "mat_khau": test_password,
        "otp_code": otp_code
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=register_body)
    data = res.json()
    print("Confirm Registration success:", data.get("success"))
    assert data["success"] is True
    print("Register successful!")
    
    # ----------------------------------------------------
    # FLOW 2: Dang nhap khong mat khau (Passwordless Login with OTP)
    # ----------------------------------------------------
    print("\n--- Test Flow 2: Dang nhap bang OTP (Passwordless Login) ---")
    req_body = {
        "email": test_email,
        "purpose": "PASSWORDLESS_LOGIN"
    }
    res = requests.post(f"{BASE_URL}/auth/request-otp", json=req_body)
    data = res.json()
    print("Request login OTP success:", data.get("success"))
    assert data["success"] is True
    otp_code = data["debug_otp"]
    
    login_body = {
        "email": test_email,
        "otp_code": otp_code
    }
    res = requests.post(f"{BASE_URL}/auth/login-otp", json=login_body)
    data = res.json()
    print("Login with OTP success:", data.get("success"))
    assert data["success"] is True
    token = data["token"]
    print("Login successful! Got JWT Token.")
    
    # ----------------------------------------------------
    # FLOW 3: Quen mat khau & Khoi phuc (Forgot Password with OTP)
    # ----------------------------------------------------
    print("\n--- Test Flow 3: Quen mat khau & Khoi phuc (Forgot Password) ---")
    req_body = {
        "email": test_email,
        "purpose": "FORGOT_PASSWORD"
    }
    res = requests.post(f"{BASE_URL}/auth/request-otp", json=req_body)
    data = res.json()
    print("Request reset OTP success:", data.get("success"))
    assert data["success"] is True
    otp_code = data["debug_otp"]
    
    new_password = "newpassword456"
    reset_body = {
        "email": test_email,
        "otp_code": otp_code,
        "new_password": new_password
    }
    res = requests.post(f"{BASE_URL}/auth/reset-password-otp", json=reset_body)
    data = res.json()
    print("Reset password success:", data.get("success"))
    assert data["success"] is True
    print("Password reset successful!")
    
    # Verify login with new password
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "mat_khau": new_password
    })
    data = res.json()
    print("Login with new password success:", data.get("success"))
    assert data["success"] is True
    token = data["token"]
    print("Login with new password successful!")
    
    # ----------------------------------------------------
    # FLOW 4: Cap nhat thong tin khach hang (Profile Update with OTP)
    # ----------------------------------------------------
    print("\n--- Test Flow 4: Cap nhat thong tin khach hang (Profile Update) ---")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    res = requests.post(f"{BASE_URL}/customer/request-otp-profile", headers=headers)
    data = res.json()
    print("Request profile update OTP success:", data.get("success"))
    assert data["success"] is True
    otp_code = data["debug_otp"]
    
    new_email = f"updated_{rand_id}@test.com"
    new_phone = f"099999{rand_id}"
    update_body = {
        "fullName": f"User Updated {rand_id}",
        "phone": new_phone,
        "email": new_email,
        "otp_code": otp_code
    }
    res = requests.post(f"{BASE_URL}/customer/update-profile-otp", json=update_body, headers=headers)
    data = res.json()
    print("Update profile success:", data.get("success"))
    assert data["success"] is True
    print("Profile update successful!")
    
    # ----------------------------------------------------
    # FLOW 5: Rut tien tai xe (Driver Wallet Withdrawal with OTP)
    # ----------------------------------------------------
    print("\n--- Test Flow 5: Rut tien tai xe (Driver Withdrawal) ---")
    # Login as default driver taixe@rideconnect.vn / 123456
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "taixe@rideconnect.vn",
        "mat_khau": "123456"
    })
    driver_data = res.json()
    driver_token = driver_data["token"]
    driver_headers = {
        "Authorization": f"Bearer {driver_token}"
    }
    
    # Check current balance
    res = requests.get(f"{BASE_URL}/driver/wallet", headers=driver_headers)
    balance_before = res.json()["balance"]
    print(f"Driver balance before withdrawal: {balance_before} VND")
    
    res = requests.post(f"{BASE_URL}/driver/request-otp-withdraw", headers=driver_headers)
    data = res.json()
    print("Request withdrawal OTP success:", data.get("success"))
    assert data["success"] is True
    otp_code = data["debug_otp"]
    
    withdraw_body = {
        "amount": 10000,
        "otp_code": otp_code
    }
    res = requests.post(f"{BASE_URL}/driver/withdraw-otp", json=withdraw_body, headers=driver_headers)
    data = res.json()
    print("Confirm withdrawal success:", data.get("success"))
    assert data["success"] is True
    print("Withdrawal processed successfully!")
    
    # Re-check balance
    res = requests.get(f"{BASE_URL}/driver/wallet", headers=driver_headers)
    balance_after = res.json()["balance"]
    print(f"Driver balance after withdrawal: {balance_after} VND")
    assert balance_before - balance_after == 10000
    print("Balance match check successful!")
    
    print("\n=== ALL OTP FLOWS SUCCESSFULLY TESTED! ===")

if __name__ == "__main__":
    run_tests()
