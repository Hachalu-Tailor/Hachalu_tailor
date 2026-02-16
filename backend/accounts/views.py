from rest_framework import status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.exceptions import NotFound

from rest_framework.decorators import action
from .permissions import IsAdmin
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema

from .serializers import (
    UserSerializer,
    AuditLogSerializer,
    ChangePasswordSerializer,
    UpdateUserSerializer,
    NotificationSerializer,
    TokenObtainPairSerializer ,
)
from .services import (
    update_user,
    reset_password,
    change_password,
    create_user,
    delete_user,
    list_users,
    list_audit_logs,
    get_audit_log,
)

# Login Endpoint


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    Returns JWT token and user role.
    """

    permission_classes = [AllowAny]
    serializer_class = TokenObtainPairSerializer 

    @extend_schema(
        tags=["Auth"],
        description="Authenticate a user and return access/refresh JWT tokens along with user metadata.",
        responses={200: dict, 401: dict},
        examples=[
            OpenApiExample(
                "Login response",
                value={
                    "access": "<jwt>", 
                    "refresh": "<jwt>",
                    "user_id": "<UUID>",
                    "role": "admin"
                },
                response_only=True,
            ),
        ],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


# Staff Management Endpoints


class StaffManagementView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Staff"],
        responses={200: UserSerializer(many=True)},
        examples=[
            OpenApiExample(
                "Staff list",
                value=[
                    {
                        "id": "<uuid>",
                        "email": "receptionist@example.com",
                        "full_name": "Receptionist User",
                        "phone_number": "444",
                        "role": "RECEPTIONIST",
                        "is_active": True,
                    }
                ],
                response_only=True,
            )
        ],
        description="List all active staff (admins and receptionists).",
    )
    def get(self, request):
        """
        GET /admin/staff (Derived from Admin Role needs)
        Lists all staff
        """
        users = list_users(requester=request.user)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Staff"],
        request=UserSerializer,
        responses={201: dict, 400: dict},
        examples=[
            OpenApiExample(
                "Create staff",
                value={
                    "email": "staff@example.com",
                    "full_name": "Staff User",
                    "phone_number": "123",
                    "role": "RECEPTIONIST",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Create staff response",
                value={
                    "message": "User created successfully",
                    "temporary_password": "Abc12345",
                    "user_id": "<uuid>",
                },
                response_only=True,
            ),
        ],
        description=(
            "Create a staff user (default role: RECEPTIONIST). Returns a temporary password."
        ),
    )
    def post(self, request):
        """
        POST /admin/staff: Register a new Receptionist
        """
        try:
            user, temp_pw = create_user(
                email=request.data.get("email"),
                full_name=request.data.get("full_name"),
                phone_number=request.data.get("phone_number"),
                role=request.data.get("role", "RECEPTIONIST"),
                requester=request.user,
            )
            return Response(
                {
                    "message": "User created successfully",
                    "temporary_password": temp_pw,
                    "user_id": user.id,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StaffDetailView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Staff"],
        responses={204: None, 404: dict},
        examples=[
            OpenApiExample(
                "Delete staff not found",
                value={"error": "User not found"},
                response_only=True,
            )
        ],
        description="Delete a staff user by id.",
    )
    def delete(self, request, id):
        """DELETE admin/staff/{id}: Remove a Receptionist"""
        try:
            delete_user(user_id=id, requester=request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


class UserChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Users"],
        request=ChangePasswordSerializer,
        responses={200: dict, 400: dict},
        examples=[
            OpenApiExample(
                "Change password",
                value={"old_password": "secret123", "new_password": "newpass123"},
                request_only=True,
            ),
            OpenApiExample(
                "Change password response",
                value={"message": "Password updated successfully"},
                response_only=True,
            ),
        ],
        description="Change the authenticated user's password.",
    )
    def post(self, request):
        """
        POST /user/change-password
        Allows the currently authenticated user to change their own password
        by providing the old password for verification.
        """
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                change_password(
                    user_id=request.user.id,
                    requester=request.user,
                    old_password=serializer.validated_data["old_password"],
                    new_password=serializer.validated_data["new_password"],
                )
                return Response(
                    {"message": "Password updated successfully"},
                    status=status.HTTP_200_OK,
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateProfileView(views.APIView):
    permission_classes = [IsAuthenticated | IsAdmin]

    @extend_schema(
        tags=["Users"],
        request=UpdateUserSerializer,
        responses={200: dict, 400: dict},
        examples=[
            OpenApiExample(
                "Update user",
                value={"full_name": "Updated Name"},
                request_only=True,
            )
        ],
        description="Update a user's profile fields (admin only).",
    )
    def patch(self, request, id):
        """
        PATCH /admin/users/{id}/update-profile
        Updates specific fields of a user's profile (email, name, phone, or role).
        """
        serializer = UpdateUserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                update_user(
                    user_id=id, requester=request.user, **serializer.validated_data
                )
                return Response(
                    {"message": "User updated successfully"}, status=status.HTTP_200_OK
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

<<<<<<< HEAD
=======

>>>>>>> e8c1ac2385d5a68b42db2f529467934626afcc98
class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer

    @extend_schema(
        tags=["Audit"],
        parameters=[
            OpenApiParameter(
                name="search",
                required=False,
                description="Search by identifier, email, or phone.",
                type=str,
            ),
            OpenApiParameter(
                name="actor",
                required=False,
                description="Filter by actor user id.",
                type=str,
            ),
            OpenApiParameter(
                name="action",
                required=False,
                description="Filter by action name.",
                type=str,
            ),
            OpenApiParameter(
                name="start_date",
                required=False,
                description="Filter start date (YYYY-MM-DD).",
                type=str,
            ),
            OpenApiParameter(
                name="end_date",
                required=False,
                description="Filter end date (YYYY-MM-DD).",
                type=str,
            ),
        ],
        responses={200: AuditLogSerializer(many=True)},
        examples=[
            OpenApiExample(
                "Audit log list",
                value=[
                    {
                        "id": 1,
                        "actor": "<uuid>",
                        "action": "USER_CREATED",
                        "target_id": "<uuid>",
                        "identifier_used": "staff@example.com",
                        "created_at": "2026-02-12T10:00:00Z",
                        "payload": {"user_id": "<uuid>"},
                    }
                ],
                response_only=True,
            )
        ],
        description="List audit logs with optional filters.",
    )
    def get(self, request):
        """
        GET /admin/audit-logs: List all audit logs
        """
        search_query = request.query_params.get("search")
        filter_by_actor = request.query_params.get("actor")
        filter_by_action = request.query_params.get("action")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        date_range = [start_date, end_date] if start_date and end_date else None

        logs = list_audit_logs(
            search_query=search_query,
            filter_by_actor=filter_by_actor,
            filter_by_action=filter_by_action,
            filter_by_date_range=date_range,
        )
        return Response(self.serializer_class(logs, many=True).data)


class AuditLogDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer
    lookup_field = "id"

    @extend_schema(
        tags=["Audit"],
        responses={200: AuditLogSerializer, 404: dict},
        examples=[
            OpenApiExample(
                "Audit log detail",
                value={
                    "id": 1,
                    "actor": "<uuid>",
                    "action": "USER_CREATED",
                    "target_id": "<uuid>",
                    "identifier_used": "staff@example.com",
                    "created_at": "2026-02-12T10:00:00Z",
                    "payload": {"user_id": "<uuid>"},
                },
                response_only=True,
            )
        ],
        description="Retrieve a single audit log by id.",
    )
    def get_object(self):
        try:
            return get_audit_log(log_id=self.kwargs[self.lookup_field])
        except ValueError as exc:
            raise NotFound(str(exc))


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    @extend_schema(
        tags=["Notifications"],
        parameters=[
            OpenApiParameter(
                name="unread_only",
                required=False,
                description="Filter unread notifications (true/false).",
                type=bool,
            )
        ],
        responses={200: NotificationSerializer(many=True)},
        examples=[
            OpenApiExample(
                "Notification list",
                value=[
                    {
                        "id": 1,
                        "title": "Payment Submitted",
                        "message": "Customer submitted payment.",
                        "notification_type": "PAYMENT_SUBMITTED",
                        "payload": {"order_code": "HP-00000001"},
                        "is_read": False,
                        "created_at": "2026-02-12T10:00:00Z",
                    }
                ],
                response_only=True,
            )
        ],
        description="List notifications for the authenticated user.",
    )
    def get(self, request):
        """
        GET /user/notifications
        Lists notifications for the authenticated user.
        Optional: ?unread_only=true
        """
        unread_only = request.query_params.get("unread_only")
        notifications = request.user.notifications.all()
        if unread_only is not None and str(unread_only).lower() in {"true", "1", "yes"}:
            notifications = notifications.filter(is_read=False)
        return Response(self.serializer_class(notifications, many=True).data)


class UserResetPasswordView(views.APIView):
    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Users"],
        responses={200: dict, 400: dict},
        examples=[
            OpenApiExample(
                "Reset password response",
                value={
                    "temporary_password": "Abc12345",
                    "message": "Password reset successful",
                },
                response_only=True,
            )
        ],
        description="Admin reset password for a user. Returns a temporary password.",
    )
    def post(self, request, id):
        """
        POST /admin/users/{id}/reset-password
        Admin-initiated reset of a user's password to a random temporary string.
        """
        try:
            temp_pwd = reset_password(user_id=id, requester=request.user)
            return Response(
                {
                    "temporary_password": temp_pwd,
                    "message": "Password reset successful",
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
