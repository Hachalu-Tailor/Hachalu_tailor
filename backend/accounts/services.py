from django.db import transaction
from django.utils.crypto import get_random_string
from .models import User
from .models import AuditLog
from django.db.models import Q


@transaction.atomic
def create_user(email, full_name, phone_number, role, requester):
    """
    Creates a user.
    """

    # Generate temporary password
    temp_password = get_random_string(8)

    # Create user in DB
    user = User.objects.create_user(
        email=email,
        full_name=full_name,
        phone_number=phone_number,
        role=role,
        password=temp_password,
    )

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="USER_CREATED",
        target_id=user.id,
        identifier_used=email,
        payload={
            "user_id": str(user.id),
            "full_name": full_name,
            "phone_number": phone_number,
            "role": role,
        },
    )

    return user, temp_password


@transaction.atomic
def update_user(
    user_id, requester, email=None, full_name=None, phone_number=None, role=None
):
    """
    Updates a user.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValueError("User not found")

    # Update user in DB
    if email is not None:
        user.email = email
    if full_name is not None:
        user.full_name = full_name
    if phone_number is not None:
        user.phone_number = phone_number
    if role is not None:
        user.role = role
    user.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="USER_UPDATED",
        target_id=user.id,
        identifier_used=email,
        payload={
            "user_id": str(user.id),
            "full_name": full_name,
            "phone_number": phone_number,
            "role": role,
        },
    )

    return user


@transaction.atomic
def delete_user(user_id, requester):
    """
    Deletes a user.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValueError("User not found")

    # Audit logging before deletion
    AuditLog.objects.create(
        actor=requester,
        action="USER_DELETED",
        target_id=user.id,
        identifier_used=user.email,
        payload={
            "user_id": str(user.id),
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "role": user.role,
        },
    )

    # Delete user from DB
    user.delete()


@transaction.atomic
def reset_password(user_id, requester):
    """
    Resets a user's password.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValueError("User not found")

    # Generate temporary password
    temp_password = get_random_string(8)

    # Update user password in DB
    user.set_password(temp_password)
    user.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="PASSWORD_RESET",
        target_id=user.id,
        identifier_used=user.email,
        payload={
            "user_id": str(user.id),
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "role": user.role,
        },
    )

    return temp_password


@transaction.atomic
def change_password(user_id, requester, old_password, new_password):
    """
    Changes a user's password.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValueError("User not found")

    if not user.check_password(old_password):
        raise ValueError("Old password is incorrect")

    # Update user password in DB
    user.set_password(new_password)
    user.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="PASSWORD_CHANGED",
        target_id=user.id,
        identifier_used=user.email,
        payload={
            "user_id": str(user.id),
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "role": user.role,
        },
    )


@transaction.atomic
def get_user(user_id):
    """
    Retrieves a user by ID.
    """
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        raise ValueError("User not found")


@transaction.atomic
def list_users(active_only=True, search_query=None):
    """
    Lists all users.
    """

    filtered_users = (
        User.objects.filter(is_active=True) if active_only else User.objects.all()
    )
    if search_query:
        filtered_users = filtered_users.filter(
            Q(email__icontains=search_query)
            | Q(full_name__icontains=search_query)
            | Q(phone_number__icontains=search_query)
        )
    return filtered_users
