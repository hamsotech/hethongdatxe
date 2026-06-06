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

        cursor.execute(
            "SELECT SUM(GIA_TIEN) AS total_revenue FROM CHUYEN_DI WHERE TRANG_THAI = 'HOAN_THANH'"
        )
        revenue_row = cursor.fetchone()
        total_fare = float(revenue_row["total_revenue"]) if revenue_row and revenue_row.get("total_revenue") is not None else 0.0
        system_revenue = round(total_fare * 0.20)

        conn.close()

        return {
            "total_users": users["total_users"],
            "total_trips": trips["total_trips"],
            "total_drivers": drivers["total_drivers"],
            "total_revenue": system_revenue
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
            """
            SELECT 
                cd.MA_CHUYEN_DI,
                cd.MA_NGUOI_DUNG,
                cd.MA_TAI_XE,
                cd.DIEM_DON,
                cd.DIEM_DEN,
                cd.GIA_TIEN,
                cd.TRANG_THAI,
                DATE_FORMAT(COALESCE(cd.THOI_GIAN_TAO, NOW()), '%%Y-%%m-%%d %%H:%%i:%%s') AS THOI_GIAN_TAO,
                tt.PHUONG_THUC
            FROM CHUYEN_DI cd
            LEFT JOIN THANH_TOAN tt ON cd.MA_CHUYEN_DI = tt.MA_CHUYEN_DI
            ORDER BY cd.MA_CHUYEN_DI DESC
            """
        )

        trips = cursor.fetchall()

        conn.close()

        return trips

    @staticmethod
    def get_reports(from_date=None, to_date=None):
        conn = get_connection()
        if not conn:
            return {"revenue": [], "complaints": []}
        
        cursor = conn.cursor()
        
        # 1. Tự động kiểm tra và thêm cột BIEN_PHAP nếu chưa có
        try:
            cursor.execute("ALTER TABLE KHIEU_NAI_SU_CO ADD COLUMN BIEN_PHAP TEXT NULL")
            conn.commit()
        except:
            pass

        # 2. Tự động gieo dữ liệu mẫu khiếu nại (Seed Data) nếu bảng trống
        try:
            cursor.execute("SELECT COUNT(*) AS count FROM KHIEU_NAI_SU_CO")
            cnt = cursor.fetchone()["count"]
            if cnt == 0:
                cursor.execute("SELECT MA_CHUYEN_DI, MA_NGUOI_DUNG, MA_TAI_XE FROM CHUYEN_DI LIMIT 2")
                trips = cursor.fetchall()
                if trips:
                    cursor.execute(
                        """
                        INSERT INTO KHIEU_NAI_SU_CO (MA_CHUYEN_DI, LOAI_NGUOI_GUI, MA_NGUOI_GUI, NOI_DUNG, TRANG_THAI, BIEN_PHAP)
                        VALUES (%s, 'Khách hàng', %s, 'Tài xế đi sai tuyến đường, thu thêm tiền.', 'Chờ xử lý', NULL)
                        """,
                        (trips[0]["MA_CHUYEN_DI"], trips[0]["MA_NGUOI_DUNG"])
                    )
                    if len(trips) > 1 and trips[1]["MA_TAI_XE"]:
                        cursor.execute(
                            """
                            INSERT INTO KHIEU_NAI_SU_CO (MA_CHUYEN_DI, LOAI_NGUOI_GUI, MA_NGUOI_GUI, NOI_DUNG, TRANG_THAI, BIEN_PHAP)
                            VALUES (%s, 'Tài xế', %s, 'Khách đặt xe nhưng không ra, không bắt máy.', 'Đã giải quyết', 'Đã lưu ý lịch sử khách hàng và hoàn phí huỷ chuyến cho tài xế.')
                            """,
                            (trips[1]["MA_CHUYEN_DI"], trips[1]["MA_TAI_XE"])
                        )
                    conn.commit()
        except Exception as e:
            print("Lỗi gieo dữ liệu khiếu nại mẫu:", e)

        # 3. Tính toán doanh thu thực tế từ cơ sở dữ liệu (các chuyến đã hoàn thành)
        try:
            query = """
                SELECT 
                    DATE_FORMAT(COALESCE(THOI_GIAN_TAO, NOW()), '%%Y-%%m') AS month,
                    SUM(GIA_TIEN) AS total_amount
                FROM CHUYEN_DI
                WHERE TRANG_THAI = 'HOAN_THANH'
            """
            params = []
            if from_date:
                query += " AND COALESCE(THOI_GIAN_TAO, NOW()) >= %s"
                params.append(from_date + " 00:00:00")
            if to_date:
                query += " AND COALESCE(THOI_GIAN_TAO, NOW()) <= %s"
                params.append(to_date + " 23:59:59")
                
            query += " GROUP BY DATE_FORMAT(COALESCE(THOI_GIAN_TAO, NOW()), '%%Y-%%m') ORDER BY month DESC"
            
            cursor.execute(query, tuple(params))
            revenue_data = cursor.fetchall()
        except Exception as e:
            print("Lỗi truy vấn doanh thu:", e)
            revenue_data = []

        # 4. Truy vấn danh sách khiếu nại
        try:
            complaints_query = """
                SELECT 
                    kn.MA_KHIEU_NAI,
                    kn.MA_CHUYEN_DI,
                    kn.LOAI_NGUOI_GUI,
                    kn.MA_NGUOI_GUI,
                    kn.NOI_DUNG,
                    kn.TRANG_THAI,
                    kn.BIEN_PHAP,
                    DATE_FORMAT(kn.NGAY_TAO, '%%Y-%%m-%%d %%H:%%i:%%s') AS NGAY_TAO,
                    cd.DIEM_DON,
                    cd.DIEM_DEN
                FROM KHIEU_NAI_SU_CO kn
                LEFT JOIN CHUYEN_DI cd ON kn.MA_CHUYEN_DI = cd.MA_CHUYEN_DI
                ORDER BY kn.MA_KHIEU_NAI DESC
            """
            cursor.execute(complaints_query)
            complaints_data = cursor.fetchall()
        except Exception as e:
            print("Lỗi truy vấn khiếu nại:", e)
            complaints_data = []

        conn.close()

        # Định dạng dữ liệu doanh thu
        formatted_revenue = []
        for item in revenue_data:
            month_str = item["month"]
            try:
                parts = month_str.split('-')
                month_display = f"Tháng {parts[1]}/{parts[0]}"
            except:
                month_display = month_str

            total_val = float(item["total_amount"] or 0)
            # Hệ thống chiết khấu nhận về 20%
            commission_val = round(total_val * 0.20)
            # Thu nhập của tài xế nhận về 80%
            driver_val = round(total_val * 0.80)

            formatted_revenue.append({
                "month": month_display,
                "total_amount": total_val,
                "commission": commission_val,
                "driver_income": driver_val
            })

        return {
            "revenue": formatted_revenue,
            "complaints": complaints_data
        }

    @staticmethod
    def resolve_complaint(complaint_id, solution):
        conn = get_connection()
        if not conn:
            return {"success": False, "message": "Lỗi kết nối database"}
        
        try:
            cursor = conn.cursor()
            # Cập nhật cột BIEN_PHAP và TRANG_THAI
            cursor.execute(
                """
                UPDATE KHIEU_NAI_SU_CO 
                SET TRANG_THAI = 'Đã giải quyết', BIEN_PHAP = %s
                WHERE MA_KHIEU_NAI = %s
                """,
                (solution, complaint_id)
            )
            conn.commit()
            conn.close()
            return {"success": True, "message": "Đã giải quyết khiếu nại thành công"}
        except Exception as e:
            if conn: conn.close()
            print("Lỗi giải quyết khiếu nại:", e)
            return {"success": False, "message": "Lỗi hệ thống khi giải quyết khiếu nại"}