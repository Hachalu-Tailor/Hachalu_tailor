from django.urls import path
from .views import LoginView, StaffManagementView, StaffDetailView

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="login"),
    # Admin Staff Management
    path("admin/staff/", StaffManagementView.as_view(), name="staff-list"),
    path("admin/staff/<uuid:id>/", StaffDetailView.as_view(), name="staff-detail"),
]
