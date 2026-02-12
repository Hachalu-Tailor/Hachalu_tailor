from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema

from accounts.permissions import IsAdminOrReceptionist
from .serializers import (
    PaymentCreateSerializer,
    PaymentVerifySerializer,
    TransactionSerializer,
)
from .services import create_payment, verify_payment


class PaymentCreateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Payments"],
        request=PaymentCreateSerializer,
        responses={201: TransactionSerializer, 400: dict},
        description=(
            "Create a payment for an order after staff enables payment. "
            "Links the payment to the order and sets order status to PENDING_APPROVAL."
        ),
    )
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            transaction_obj = create_payment(
                order_code=serializer.validated_data["order_code"],
                amount=serializer.validated_data["amount"],
                full_name=serializer.validated_data["full_name"],
                phone_number=serializer.validated_data["phone_number"],
                bank_ref_number=serializer.validated_data["bank_ref_number"],
                receipt_pdf_url=serializer.validated_data["receipt_pdf_url"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(str(exc))
        return Response(
            TransactionSerializer(transaction_obj).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

    @extend_schema(
        tags=["Payments"],
        request=PaymentVerifySerializer,
        responses={200: TransactionSerializer, 400: dict, 401: dict, 403: dict},
        description=(
            "Verify a payment (admin/receptionist only). "
            "Marks payment as verified and confirms the order."
        ),
    )
    def post(self, request, id):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not serializer.validated_data.get("is_verified"):
            raise ValidationError("is_verified must be true to verify.")
        try:
            transaction_obj = verify_payment(
                transaction_id=id,
                reviewer=request.user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(str(exc))
        return Response(TransactionSerializer(transaction_obj).data)
