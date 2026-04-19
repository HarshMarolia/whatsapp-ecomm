from fastapi import status


class AppException(Exception):
    message: str = "An unexpected error occurred"
    code: str = "INTERNAL_ERROR"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.message
        super().__init__(self.message)


class NotFoundError(AppException):
    message = "Resource not found"
    code = "NOT_FOUND"
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppException):
    message = "Resource already exists"
    code = "CONFLICT"
    status_code = status.HTTP_409_CONFLICT


class ForbiddenError(AppException):
    message = "Access denied"
    code = "FORBIDDEN"
    status_code = status.HTTP_403_FORBIDDEN


class ProductNotFoundError(NotFoundError):
    message = "Product not found"
    code = "PRODUCT_NOT_FOUND"


class ProductInactiveError(AppException):
    message = "Product is not active"
    code = "PRODUCT_INACTIVE"
    status_code = status.HTTP_400_BAD_REQUEST


class QRGenerationError(AppException):
    message = "Failed to generate QR image"
    code = "QR_GENERATION_FAILED"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class CustomerNotFoundError(NotFoundError):
    message = "Customer not found"
    code = "CUSTOMER_NOT_FOUND"
