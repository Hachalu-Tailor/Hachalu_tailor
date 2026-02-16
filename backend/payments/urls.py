from django.urls import path

from .views import PaymentCreateView, PaymentVerifyView, PaymentListView


urlpatterns = [
    path("payments/list/", PaymentListView.as_view(), name="all-payment-list"),
    path("payments/", PaymentCreateView.as_view(), name="payment-create"),
    path(
        "payments/<uuid:id>/verify/", PaymentVerifyView.as_view(), name="payment-verify"
    ),

]
