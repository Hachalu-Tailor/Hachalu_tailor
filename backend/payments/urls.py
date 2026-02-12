from django.urls import path

from .views import PaymentCreateView, PaymentVerifyView


urlpatterns = [
    path("payments/", PaymentCreateView.as_view(), name="payment-create"),
    path(
        "payments/<uuid:id>/verify/", PaymentVerifyView.as_view(), name="payment-verify"
    ),
]
