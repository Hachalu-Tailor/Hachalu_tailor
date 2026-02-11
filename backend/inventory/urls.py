from django.urls import path
from inventory.views import MaterialListCreateView, MaterialDetailView, StockAdjustmentView

urlpatterns = [
    path('materials/', MaterialListCreateView.as_view(), name='material-list-create'),
    path('materials/<int:pk>/', MaterialDetailView.as_view(), name='material-update'),
    path('materials/<int:pk>/stock/', StockAdjustmentView.as_view(), name='stock-adjust'),
]