from django.urls import path

from .views import (
    PaymentCreateView,
    PaymentDetailByCodeView,
    PaymentDetailByOrderCodeView,
    PaymentDetailView,
    PaymentVerifyView,
)

urlpatterns = [
    path("payments/", PaymentCreateView.as_view(), name="payment-create"),
    path("payments/<uuid:id>/", PaymentDetailView.as_view(), name="payment-detail"),
    path(
        "payments/code/<str:code>/",
        PaymentDetailByCodeView.as_view(),
        name="payment-detail-by-code",
    ),
    path(
        "payments/order/<str:order_code>/",
        PaymentDetailByOrderCodeView.as_view(),
        name="payment-detail-by-order-code",
    ),
    path(
        "payments/<uuid:id>/verify/", PaymentVerifyView.as_view(), name="payment-verify"
    ),
]
