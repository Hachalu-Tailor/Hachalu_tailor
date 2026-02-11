from django.urls import path

from .views import (
    OrderCreateView,
    OrderExpirationView,
    OrderListView,
    OrderProcessingView,
    OrderUpdateView,
)

urlpatterns = [
    path("orders/", OrderCreateView.as_view(), name="order-create"),
    path("orders/list/", OrderListView.as_view(), name="order-list"),
    path(
        "orders/<uuid:id>/process/", OrderProcessingView.as_view(), name="order-process"
    ),
    path("orders/<uuid:id>/", OrderUpdateView.as_view(), name="order-update"),
    path("orders/expire/", OrderExpirationView.as_view(), name="order-expire"),
]
