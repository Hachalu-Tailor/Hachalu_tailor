from django.urls import path
from inventory.views import MaterialListView, MaterialCreateView, MaterialDetailView, StockAdjustmentView

urlpatterns = [
    path('materials/create/', MaterialCreateView.as_view(), name='material-create'),
    path('materials/list/', MaterialListView.as_view(), name='material-list'),
    path('materials/<int:pk>/', MaterialDetailView.as_view(), name='material-update'),
    path('materials/<int:pk>/stock/', StockAdjustmentView.as_view(), name='stock-adjust'),
]