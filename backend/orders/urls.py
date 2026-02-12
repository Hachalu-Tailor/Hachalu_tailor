from django.urls import path

from .views import (
    OrderCreateView,
    OrderCustomerPaymentView,
    OrderExpirationView,
    OrderListView,
    OrderProcessingView,
    OrderUpdateView,
    SuitTypeCreateView, 
    SuitTypeListView
)

urlpatterns = [
    path("orders/", OrderCreateView.as_view(), name="order-create"),
    path("orders/list/", OrderListView.as_view(), name="order-list"),
    path(
        "orders/<uuid:id>/process/", OrderProcessingView.as_view(), name="order-process"
    ),
    path(
        "orders/<uuid:id>/payment/",
        OrderCustomerPaymentView.as_view(),
        name="order-payment",
    ),
    path("orders/<uuid:id>/", OrderUpdateView.as_view(), name="order-update"),
    path("orders/expire/", OrderExpirationView.as_view(), name="order-expire"),
    path("suit-types/", SuitTypeListView.as_view(), name="suit-type-list"),
    path("suit-types/create/", SuitTypeCreateView.as_view(), name="suit-type-create"),
]
