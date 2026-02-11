from django.urls import path
from .views import(LoginView, 
    StaffManagementView,
    StaffDetailView, 
    UserChangePasswordView, 
    UserUpdateProfileView)

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="login"),
    path("admin/staff/", StaffManagementView.as_view(), name="staff-list"),
    path("admin/staff/<uuid:id>/", StaffDetailView.as_view(), name="staff-detail"),

    path('admin/users/<uuid:id>/update-profile/', UserUpdateProfileView.as_view(), name='admin-update-profile'),
    path('user/change-password/', UserChangePasswordView.as_view(), name='user-change-password'),
]
