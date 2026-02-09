from django.db import transaction
from django.utils.crypto import get_random_string
from .models import User
from .models import AuditLog
from django.db.models import Q


@transaction.atomic
def create_user(email, full_name, phone_number, role, requester):
    """
    Create a new user and emit an audit log.

    Args:
        email (str): Email address for the new user.
        full_name (str): Full name of the new user.
        phone_number (str): Phone number for the new user.
        role (str): Role identifier to assign to the user.
        requester (User): Acting user creating the account (audit actor).

    Returns:
        tuple[User, str]: The created user instance and the generated temporary
        password.
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
    Update a user's details and emit an audit log.

    Args:
        user_id (int | str): Primary key of the user to update.
        requester (User): Acting user performing the update (audit actor).
        email (str | None): New email address if provided.
        full_name (str | None): New full name if provided.
        phone_number (str | None): New phone number if provided.
        role (str | None): New role identifier if provided.

    Returns:
        User: The updated user instance.

    Raises:
        ValueError: If the user does not exist.
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
    Delete a user and emit an audit log.

    Args:
        user_id (int | str): Primary key of the user to delete.
        requester (User): Acting user performing the deletion (audit actor).

    Returns:
        None

    Raises:
        ValueError: If the user does not exist.
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
    Reset a user's password to a new temporary value and emit an audit log.

    Args:
        user_id (int | str): Primary key of the user whose password is reset.
        requester (User): Acting user performing the reset (audit actor).

    Returns:
        str: The generated temporary password.

    Raises:
        ValueError: If the user does not exist.
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
    Change a user's password after validating the old password and emit an
    audit log.

    Args:
        user_id (int | str): Primary key of the user changing password.
        requester (User): Acting user performing the change (audit actor).
        old_password (str): Current password to validate.
        new_password (str): New password to set.

    Returns:
        None

    Raises:
        ValueError: If the user does not exist or the old password is invalid.
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
    Retrieve a user by primary key.

    Args:
        user_id (int | str): Primary key of the user to fetch.

    Returns:
        User: The requested user instance.

    Raises:
        ValueError: If the user does not exist.
    """
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        raise ValueError("User not found")


@transaction.atomic
def list_users(active_only=True, search_query=None):
    """
    List users with optional activity and search filtering.

    Args:
        active_only (bool): When True, only include active users.
        search_query (str | None): Optional search term matched against email,
            full name, or phone number (case-insensitive).

    Returns:
        django.db.models.QuerySet[User]: QuerySet of users that match the
        filters.
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
