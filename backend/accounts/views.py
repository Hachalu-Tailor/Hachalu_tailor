from rest_framework import status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.exceptions import NotFound

from rest_framework.decorators import action
from .permissions import IsAdmin

from .serializers import UserSerializer, ChangePasswordSerializer, UpdateUserSerializer
from .services import create_user, delete_user, list_users, update_user, reset_password, change_password
from .serializers import UserSerializer, AuditLogSerializer
from .services import (
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


# Staff Management Endpoints


class StaffManagementView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        GET /admin/staff (Derived from Admin Role needs)
        Lists all staff
        """
        users = list_users(requester=request.user)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

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

    def delete(self, request, id):
        """DELETE admin/staff/{id}: Remove a Receptionist"""
        try:
            delete_user(user_id=id, requester=request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


class UserChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

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
                    old_password=serializer.validated_data['old_password'],
                    new_password=serializer.validated_data['new_password']
                )
                return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateProfileView(views.APIView):
    permission_classes = [IsAuthenticated | IsAdmin]

    def patch(self, request, id):
        """
        PATCH /admin/users/{id}/update-profile
        Updates specific fields of a user's profile (email, name, phone, or role).
        """
        serializer = UpdateUserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                update_user(
                    user_id=id,
                    requester=request.user,
                    **serializer.validated_data
                )
                return Response({"message": "User updated successfully"}, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer

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

    def get_object(self):
        try:
            return get_audit_log(log_id=self.kwargs[self.lookup_field])
        except ValueError as exc:
            raise NotFound(str(exc))
    
class UserResetPasswordView(views.APIView):
    permission_classes = [IsAdmin]

    def post(self, request, id):
        """
        POST /admin/users/{id}/reset-password
        Admin-initiated reset of a user's password to a random temporary string.
        """
        try:
            temp_pwd = reset_password(user_id=id, requester=request.user)
            return Response(
                {"temporary_password": temp_pwd, "message": "Password reset successful"}, 
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
