from app.services.matching_service import MatchingService


class DriverController:

    @staticmethod
    def get_available_trips():
        return MatchingService.get_available_trips()

    @staticmethod
    def accept_trip(data):

        return MatchingService.accept_trip(
            data["ma_chuyen_di"],
            data["ma_tai_xe"]
        )