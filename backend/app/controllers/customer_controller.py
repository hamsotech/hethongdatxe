from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService


class CustomerController:

    @staticmethod
    def create_trip(data):
        return BookingService.create_trip(data)

    @staticmethod
    def create_payment(data):
        return PaymentService.create_payment(data)

    @staticmethod
    def confirm_payment(ma_thanh_toan):
        return PaymentService.confirm_payment(
            ma_thanh_toan
        )

    @staticmethod
    def payment_history(ma_nguoi_dung):
        return PaymentService.get_payment_history(ma_nguoi_dung)
