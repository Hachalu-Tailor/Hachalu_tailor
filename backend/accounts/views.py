from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdmin
from .serializers import UserSerializer
from .services import create_user, delete_user, list_users

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
        GET /api/admin/staff (Derived from Admin Role needs)
        Lists all staff
        """
        users = list_users(requester=request.user)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        POST /api/admin/staff: Register a new Receptionist
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
        """DELETE /api/admin/staff/{id}: Remove a Receptionist[cite: 32, 33]."""
        try:
            delete_user(user_id=id, requester=request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
