# Hachalu_tailor


# API DOC
### Authentication
#### 1. Login
#### Note Here that both admin and receptionist can login
##### Endpoint: POST api/accounts/auth/login/
Body
```
{
  "email": "admin@example.com",
  "password": "yourpassword123"
}
```

##### Response: 201
```
{
    "refresh": ......,
    "access": ........
}
```
#### 2. Add new receptionist
##### Endpoint: POST /api/accounts/admin/staff/
##### Make Sure Admin is loged in(save JWT)
Body
```
{
  "email": "recep1@gmail.com",
  "full_name": "Recep Recep1",
  "phone_number": "+251911234567",
  "role": "RECEPTIONIST"
}

```

##### Response: 201
```
{
    "message": "User created successfully",
    "temporary_password": "UxlGT0ov",
    "user_id": "15ac3d04-85d7-4078-9e45-edef9ef24f64"
}
```
#### 3. List All Staff
##### Endpoint: POST /api/accounts/admin/staff/
Body: None

##### Response: 200
```
 [
    {
        "id": "3feb9269-05d9-441b-aa07-0846fadc6f91",
        "email": "admin@gmail.com",
        "full_name": "Mag MC",
        "phone_number": "",
        "role": "ADMIN",
        "is_active": true
    },
    {
        "id": "15ac3d04-85d7-4078-9e45-edef9ef24f64",
        "email": "recep1@gmail.com",
        "full_name": "Recep Recep1",
        "phone_number": "+251911234567",
        "role": "RECEPTIONIST",
        "is_active": true
    }
]
```
#### 4. DELETE RECEPTIONIST
##### Endpoint: POST /api/accounts/admin/staff/{id}/
Body: None

##### Response: 204
```
 [
    {
        "id": "3feb9269-05d9-441b-aa07-0846fadc6f91",
        "email": "admin@gmail.com",
        "full_name": "Mag MC",
        "phone_number": "",
        "role": "ADMIN",
        "is_active": true
    },
    {
        "id": "15ac3d04-85d7-4078-9e45-edef9ef24f64",
        "email": "recep1@gmail.com",
        "full_name": "Recep Recep1",
        "phone_number": "+251911234567",
        "role": "RECEPTIONIST",
        "is_active": true
    }
]
```
#### 5. Change Password
##### Endpoint: POST /api/accounts/user/change-password/
Body:
```
{
  "old_password": "12345678",
  "new_password": "123456789"
}

```

##### Response: 200
```
{
    "message": "Password updated successfully"
}
```
#### 6. Update Profile (Only for admin)
##### Endpoint: PATCH /admin/users/{UUid}/update-profile/
Body:
```
{
  "email": "newemail@example.com",
  "full_name": "John Doe",
}
```

##### Response: 200
```
{
    "message": "User updated successfully"
}
```
#### 7. Reset Password
##### Endpoint: POST /admin/users/{id}/reset-password/
Body: None (password generated automatically)

##### Response: 200
```
{
  "temporary_password": "A9xP2kQm",
  "message": "Password reset successful"
}
```
# ============================================================
### Inventory manangment 
#### 1. Create object
#### Note Here that both admin and receptionist can login
##### Endpoint: POST /api/invetory/materials/
Body
```
{
  "material": {
    "name": "Silk",
    "color": "Blue",
    "texture": "Soft",
  },
  "quantity_meters": 12.5
}
```

##### Response: 201
```
{
    "id": 1,
    "name": "Cotton",
    "color": "White",
    "texture": "Soft",
    "image_url": null,
    "inventory": {
        "id": 1,
        "quantity_meters": "10.50",
        "is_available": true
    }
}
```
#### 2. List objects
#### Note Here that both admin and receptionist can login
##### Endpoint: GET /api/invetory/materials/
Body: NONE

##### Response: 200
```
[
    {
        "id": 1,
        "name": "Cotton",
        "color": "White",
        "texture": "Soft",
        "image_url": null,
        "inventory": {
            "id": 1,
            "quantity_meters": "10.50",
            "is_available": true
        }
    },
    {
        "id": 2,
        "name": "Wool",
        "color": "Black",
        "texture": "Soft",
        "image_url": null,
        "inventory": {
            "id": 2,
            "quantity_meters": "10.50",
            "is_available": true
        }
    }
]
```
#### 3. Update Object Data (only on material)
#### Note Here that both admin and receptionist can login
##### Endpoint: PATCH /api/invetory/materials/{id}/
Body: 
```
{
  "color": "Dark Blue"
}
```

##### Response: 200
```
{
    "id": 1,
    "name": "Cotton",
    "color": "Dark Blue",
    "texture": "Soft",
    "image_url": null,
    "inventory": {
        "id": 1,
        "quantity_meters": "10.50",
        "is_available": true
    }
}
```
#### 2. Update Object Data (only on Stock)
#### Note Here that both admin and receptionist can login
##### Endpoint: POST /api/invetory/materials/{id}/stock/
Body: 
```
{
  "action_type": "add",
  "quantity_meters": 50,
}

```

##### Response: 200
```
{
    "message": "Stock updated successfully",
    "current_quantity": 60.5
}
```
#### Incase You perform a wrong action
```
{
  "action_type": "remove",
  "quantity_meters": 5
}
```

#### Response: 400

```
{
  "error": "Invalid action_type. Use 'add' or 'set'."
}
```
#### On this one the options are add, Set are the only ones

# =============================================================
# =============================================================
### Orders
#### 1. Create Suit(For Recieptionist/Admin)
#### Note Here that both admin and receptionist can login
##### Endpoint: POST /api/orders/suit-types/create/

Body:
```
{
  "name": "Single Lapel Suit",
  "lapel_count": 1
}
```
##### Response: 201
```
{
    "id": 1,
    "name": "Single Lapel Suit",
    "lapel_count": 1
}
```
#### 2. List Suit
#### (For Recieptionist/Admin/User Needs to see this too)
#### Note Here that both admin and receptionist Shall see
##### Endpoint: GET /api/orders/suit-types/

Body:None
##### Response: 200
```
[
    {
        "id": 1,
        "name": "Single Lapel Suit",
        "lapel_count": 1
    }
]
```
#### 3. Create Order
##### Endpoint: POST /api/orders/

Body:
```
{
  "customer_name": "John Doe",
  "customer_phone": "+251900000000",
  "suit_type": 1,
  "material": 1,
  "quantity": 1,
  "measurements":{
    "height":178,
  "chest": 100,
  "shoulder": 45,
  "waist": 80,
  "hips": 95,
  "arm_length": 60
  }
}
```

##### Response: 201
```
{
    "order_id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "INITIATED"
}
```
# MAKE SURE THE ORDER ID IS DISPLAYED TO THE CUSTOMER ON THE FRONT END
#### 3. List Orders
#### Note Here that both admin and receptionist can view this
##### Endpoint: GET /api/orders/list/

Body:None

## Here It need query params
- active_only:Bool
-processed_only:Bool
-customer:String
##### Response: 200
```
[
    {
        "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
        "status": "INITIATED",
        "quantity": 1,
        "total_price": "0.00",
        "due_date": "2000-01-01",
        "payment_reference": "",
        "payment_amount": null,
        "payment_received_at": null,
        "payment_notes": "",
        "payment_allowed": false,
        "created_at": "2026-02-12T20:41:43.944985Z",
        "updated_at": "2026-02-12T20:41:43.944985Z",
        "customer_name": "John Doe",
        "customer_phone": "+251900000000",
        "suit_type": 1,
        "suit_type_name": "Single Lapel Suit",
        "material": 1,
        "material_name": "Cotton",
        "measurements": {
            "chest": 100.0,
            "shoulder": 45.0,
            "waist": 80.0,
            "hips": 95.0,
            "arm_length": 60.0,
            "height": 178.0
        }
    }
]
```

#### 3. List Order
##### Endpoint: POST /api/orders/{uuid}/process
##### For admin and receptionist

Here there may be different options
a. Recieve Order
Body
```
{
"action": "receive",
"total_price": 2500,
"due_date": "2026-03-01"
}
```

##### Response: 200
```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "AWAITING_PAYMENT",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```
b. Record Payment
Body
```
{
"action": "record_payment",
"payment_reference": "TX123",
"payment_amount": 2500,
"payment_received_at": "2026-02-12T10:00:00Z",
"payment_notes": "Paid via bank"
}
```

##### Response: 200
```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "PENDING_APRROVAL",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```
c. Approve Order
Body
```
{
"action": "approve"
}
```

##### Response: 200
```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "IN_PROGRESS",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```
c. Reject Order
### NOTE that this process of can only be done after the AWAITING_PAYMENT stage
Body
```
{
"action": "reject",
"reason": "Invalid payment"
}
```

##### Response: 200
```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "REJECTED",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

## ????

#### 3. Update Order
##### Endpoint: PATCH /api/orders/{uuid}/process
##### For admin and receptionist
Body
```
{
"quantity": 2,
"due_date": "2026-03-05"
}
```

##### Response: 200
```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "AWAITING_PAYMENT",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

#### 4. Expired Orders
##### Endpoint: POST /api/orders/expire/
##### For admin and receptionist
Body
```
{
"quantity": 2,
"due_date": "2026-03-05"
}
```

##### Response: 200
```
{
"expired_count": 3
}
```

#### But here we need more things
# ============================================================
### Payment Management 
#### 1. Create Payment
##### Endpoint: POST /api/payments/
Body
```
{
  "order_code": "HP-2026-XYZ",
  "amount": "2500.00",
  "bank_ref_number": "TXN_998877",
  "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf"
}
```
##### Response: 201
```
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "order_code": "HP-2026-XYZ",
  "payment_amount": "2500.00",
  "bank_ref_number": "TXN_998877",
  "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf",
  "is_verified": false,
  "created_at": "2026-02-14T19:33:00Z"
}
```
#### 2. Verify Payment
##### Endpoint: POST /payments/<uuid:id>/verify/
Body
```
{
  "is_verified": true
}
```
##### Response: 201
```
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "order_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "order_code": "HP-2026-XYZ",
  "payment_amount": "250.00",
  "bank_ref_number": "TXN_998877",
  "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf",
  "is_verified": true,
  "created_at": "2026-02-14T19:33:00Z"
}
```