from django.urls import path
from .views import (
    OrderProcessingView,
    ShippedOrdersListView,
    ShippdOrdersDetailView,
    ListOrdersInProgressView,
    InProgressDetailView,

)


URLPATTERNS = [
    path("orders/in-progress/", ListOrdersInProgressView.as_view(), name="orders-in-progress"),
    path("orders/in-progres/<uuid: id>/detail", InProgressDetailView.as_view(), name="in-progress-order-detail"),
    path("orders/shipped/<uuid: id>/detail/", ShippdOrdersDetailView.as_view(), name="shipped-order-detail"),
    path("orders/<uuid:id>/process/", OrderProcessingView.as_view(), name="order-process"),
    path("orders/shipped/", ShippedOrdersListView.as_view(), name="shipped-orders-list"),
]