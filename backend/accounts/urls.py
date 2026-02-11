from django.urls import path
from .views import (
    LoginView,
    StaffManagementView,
    StaffDetailView,
    AuditLogListView,
    AuditLogDetailView,
)

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="login"),
    # Admin Staff Management
    path("admin/staff/", StaffManagementView.as_view(), name="staff-list"),
    path("admin/staff/<uuid:id>/", StaffDetailView.as_view(), name="staff-detail"),
    # Admin Audit Logs
    path("admin/audit-logs/", AuditLogListView.as_view(), name="audit-log-list"),
    path(
        "admin/audit-logs/<int:id>/",
        AuditLogDetailView.as_view(),
        name="audit-log-detail",
    ),
]
